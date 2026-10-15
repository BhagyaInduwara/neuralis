"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { ARCHITECTURE_NODES, type ArchitectureNode } from "@/lib/constants";
import { BOARD_Y, SOCKET_HALF } from "@/lib/circuitPaths";
import { architectureState, interactionState, introState, motionPrefs } from "@/lib/sceneState";
import { liveScene } from "@/lib/sceneFrame";
import { paintDieCanvases } from "@/lib/dieDetails";
import { clamp, damp } from "@/lib/utils";

const RING_RADIUS = 3;
const AMBER = new THREE.Color("#ff8a1f");

/** Radial depth, tangential width and height per subsystem, so each reads
 * as its own part. Modules are turned to face the chip. */
const SHAPES: Record<string, [number, number, number]> = {
  processing: [0.75, 1.05, 0.3],
  memory: [0.6, 1.0, 0.46],
  network: [0.8, 0.8, 0.24],
  aicore: [0.9, 0.9, 0.36],
  datafabric: [0.6, 1.15, 0.22],
};

type Placement = "right" | "left" | "above" | "below";

interface ModuleLayout {
  node: ArchitectureNode;
  index: number;
  position: THREE.Vector3;
  dir: THREE.Vector2;
  angle: number;
  size: [number, number, number];
  /** Preferred label side first, then fallbacks if it would hit the copy. */
  placements: Placement[];
  /** World-space anchor on the module's edge for each side. */
  anchors: Record<Placement, THREE.Vector3>;
  /** Html is pinned here; per-frame pixel offsets move it to the chosen anchor. */
  labelOrigin: [number, number, number];
  linkLength: number;
  linkStart: THREE.Vector3;
}

const LABEL_TRANSFORM: Record<Placement, string> = {
  right: "translate(16px, -50%)",
  left: "translate(calc(-100% - 16px), -50%)",
  above: "translate(-50%, calc(-100% - 16px))",
  below: "translate(-50%, 16px)",
};

/**
 * Wide layouts put labels left/right of each module; stacked (portrait)
 * layouts put them above/below so they stay inside the narrow viewport.
 */
function useLayouts(stacked: boolean): ModuleLayout[] {
  return useMemo(
    () =>
      ARCHITECTURE_NODES.map((node, index) => {
        const rad = THREE.MathUtils.degToRad(node.angle);
        const dir = new THREE.Vector2(Math.cos(rad), Math.sin(rad));
        const size = SHAPES[node.id] ?? [0.8, 0.8, 0.3];
        const position = new THREE.Vector3(dir.x * RING_RADIUS, 0, dir.y * RING_RADIUS);

        // Labels go on the side facing away from the chip, anchored on the
        // module's outer edge, so they can never sit over the module or its link.
        const placement: Placement = stacked
          ? dir.y < 0
            ? "above"
            : "below"
          : Math.abs(dir.x) >= 0.5
            ? dir.x > 0
              ? "right"
              : "left"
            : dir.y < 0
              ? "above"
              : "below";
        const vertical: Placement[] = dir.y < 0 ? ["above", "below"] : ["below", "above"];
        const horizontal: Placement[] = dir.x >= 0 ? ["right", "left"] : ["left", "right"];
        const placements: Placement[] =
          placement === "above" || placement === "below"
            ? [placement, ...horizontal, ...vertical.filter((v) => v !== placement)]
            : [placement, ...vertical];

        // World-axis half extents of the rotated footprint.
        const [depth, width] = size;
        const extentX = (Math.abs(dir.x) * depth + Math.abs(dir.y) * width) / 2;
        const extentZ = (Math.abs(dir.y) * depth + Math.abs(dir.x) * width) / 2;
        const top = BOARD_Y + size[2];
        const anchors: Record<Placement, THREE.Vector3> = {
          right: new THREE.Vector3(position.x + extentX, top, position.z),
          left: new THREE.Vector3(position.x - extentX, top, position.z),
          above: new THREE.Vector3(position.x, top, position.z - extentZ),
          below: new THREE.Vector3(position.x, top, position.z + extentZ),
        };

        // Link from the socket edge to the module's chip-facing side.
        const startRadius = SOCKET_HALF / Math.max(Math.abs(dir.x), Math.abs(dir.y));
        const linkLength = RING_RADIUS - depth / 2 - startRadius;
        const linkStart = new THREE.Vector3(dir.x * startRadius, BOARD_Y + 0.006, dir.y * startRadius);

        return {
          node,
          index,
          position,
          dir,
          angle: rad,
          size,
          placements,
          anchors,
          labelOrigin: [position.x, top, position.z] as [number, number, number],
          linkLength,
          linkStart,
        };
      }),
    [stacked]
  );
}

interface DieTextures {
  map: THREE.Texture;
  emissiveMap: THREE.Texture;
}

const COPY_MARGIN = 12;
const LABEL_GAP = 16;
const HEADER_HEIGHT = 72;
const projected = new THREE.Vector3();

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function toScreen(point: THREE.Vector3, camera: THREE.Camera, width: number, height: number) {
  projected.copy(point).project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * width,
    y: (-projected.y * 0.5 + 0.5) * height,
    inFront: projected.z < 1,
  };
}

function labelRect(placement: Placement, x: number, y: number, w: number, h: number): Rect {
  switch (placement) {
    case "right":
      return { left: x + LABEL_GAP, top: y - h / 2, right: x + LABEL_GAP + w, bottom: y + h / 2 };
    case "left":
      return { left: x - LABEL_GAP - w, top: y - h / 2, right: x - LABEL_GAP, bottom: y + h / 2 };
    case "above":
      return { left: x - w / 2, top: y - LABEL_GAP - h, right: x + w / 2, bottom: y - LABEL_GAP };
    case "below":
      return { left: x - w / 2, top: y + LABEL_GAP, right: x + w / 2, bottom: y + LABEL_GAP + h };
  }
}

function intersects(a: Rect, b: Rect, pad: number): boolean {
  return a.right > b.left - pad && a.left < b.right + pad && a.bottom > b.top - pad && a.top < b.bottom + pad;
}

function SubsystemModule({ layout, die }: { layout: ModuleLayout; die: DieTextures }) {
  const group = useRef<THREE.Group>(null);
  const link = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const { size, index, node } = layout;

  const materials = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({
        color: "#24262c",
        metalness: 0.9,
        roughness: 0.35,
        clearcoat: 0.3,
        transparent: true,
      }),
      accent: new THREE.MeshBasicMaterial({ color: AMBER, toneMapped: false, transparent: true }),
      die: new THREE.MeshPhysicalMaterial({
        map: die.map,
        emissiveMap: die.emissiveMap,
        emissive: AMBER,
        metalness: 0.6,
        roughness: 0.4,
        clearcoat: 0.6,
        transparent: true,
      }),
      link: new THREE.MeshBasicMaterial({ color: AMBER, toneMapped: false, transparent: true }),
    }),
    [die]
  );
  // Unit-length bar starting at x=0 so scaling x grows it away from the socket.
  const linkGeometry = useMemo(() => new THREE.BoxGeometry(1, 0.01, 0.04).translate(0.5, 0, 0), []);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
      linkGeometry.dispose();
    },
    [materials, linkGeometry]
  );

  const glow = useRef(0);
  const labelFade = useRef(0);
  const originPoint = useMemo(() => new THREE.Vector3(...layout.labelOrigin), [layout]);

  useFrame(({ camera, size: viewport }, delta) => {
    const reduced = motionPrefs.reduced;
    // Staggered rise: each module starts a little after the previous one.
    const rise = clamp(liveScene.moduleRise * 1.5 - index * 0.1, 0, 1);
    const eased = 1 - Math.pow(1 - rise, 3);
    const isHovered = architectureState.hoveredNode === node.id;
    glow.current = damp(glow.current, isHovered ? 1 : 0, 6, delta);

    if (group.current) {
      const sunk = BOARD_Y - size[2] - 0.05;
      const rest = BOARD_Y;
      group.current.position.y = reduced ? rest : sunk + (rest - sunk) * eased;
      group.current.visible = rise > 0.001;
    }

    const opacity = reduced ? rise : Math.min(1, eased * 1.4);
    materials.body.opacity = opacity;
    materials.accent.opacity = opacity;
    materials.die.opacity = opacity;
    const power = 0.3 + introState.power * 0.7;
    materials.accent.color.copy(AMBER).multiplyScalar(power * (1.4 + glow.current * 1.8));
    materials.die.emissiveIntensity = power * (0.7 + glow.current * 1.6);

    if (link.current) {
      const grow = reduced ? (rise > 0 ? 1 : 0) : clamp(rise * 1.3 - 0.15, 0, 1);
      link.current.visible = grow > 0.001;
      link.current.scale.x = Math.max(grow * layout.linkLength, 0.0001);
      materials.link.opacity = reduced ? rise : 1;
      materials.link.color
        .set("#ffb35c")
        .multiplyScalar(power * (1.6 + glow.current * 1.8 + interactionState.pulse * 0.4));
    }

    const labelEl = label.current;
    const tag = labelEl?.firstElementChild as HTMLElement | null | undefined;
    if (labelEl && tag) {
      // The copy scrolls over a fixed scene, so at some scroll positions (and
      // on narrower screens) a label's preferred side lands on the heading.
      // Predict each candidate side's on-screen box from the current camera
      // and take the first one clear of the copy and the header; hide the
      // label only if no side fits.
      const settled = clamp((liveScene.moduleRise - 0.9) / 0.08, 0, 1);
      const copy = document.getElementById("arch-copy")?.getBoundingClientRect();
      const origin = toScreen(originPoint, camera, viewport.width, viewport.height);
      const w = tag.offsetWidth;
      const h = tag.offsetHeight;
      let chosen: Placement | null = null;
      let ax = 0;
      let ay = 0;
      if (settled > 0 && origin.inFront) {
        for (const placement of layout.placements) {
          const a = toScreen(layout.anchors[placement], camera, viewport.width, viewport.height);
          const r = labelRect(placement, a.x, a.y, w, h);
          const onScreen =
            r.left >= 0 && r.right <= viewport.width && r.top >= HEADER_HEIGHT && r.bottom <= viewport.height;
          if (onScreen && !(copy && intersects(r, copy, COPY_MARGIN))) {
            chosen = placement;
            ax = a.x;
            ay = a.y;
            break;
          }
        }
      }
      if (chosen) {
        labelEl.style.transform = `translate(${ax - origin.x}px, ${ay - origin.y}px) ${LABEL_TRANSFORM[chosen]}`;
      }
      const target = chosen ? settled : 0;
      // Snap out on contact, ease back in once clear.
      labelFade.current =
        target < labelFade.current ? target : damp(labelFade.current, target, 10, delta);
      const visible = labelFade.current > 0.02;
      labelEl.style.opacity = String(visible ? labelFade.current : 0);
      labelEl.style.visibility = visible ? "visible" : "hidden";
    }
  });

  const setHover = (on: boolean) => {
    setHovered(on);
    architectureState.hoveredNode = on ? node.id : null;
    interactionState.pulseTarget = on ? 1 : 0;
  };

  const linkAngle = Math.atan2(layout.dir.y, layout.dir.x);
  const portal = useMemo(
    () => ({ current: document.getElementById("scene-overlay") }) as React.RefObject<HTMLElement>,
    []
  );

  return (
    <group>
      {/* Local +x points away from the chip. */}
      <group
        ref={group}
        position={[layout.position.x, BOARD_Y, layout.position.z]}
        rotation={[0, -layout.angle, 0]}
      >
        <RoundedBox
          args={[size[0], size[2], size[1]]}
          radius={0.03}
          smoothness={3}
          position={[0, size[2] / 2, 0]}
          material={materials.body}
        />
        <mesh
          material={materials.die}
          position={[0.04, size[2] + 0.003, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[size[0] * 0.6, size[1] * 0.66]} />
        </mesh>
        {/* Contact strip on the chip-facing edge, where the link lands. */}
        <mesh
          material={materials.accent}
          position={[-size[0] / 2 + 0.07, size[2] + 0.004, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.035, size[1] * 0.8]} />
        </mesh>
      </group>

      <group position={layout.linkStart} rotation={[0, -linkAngle, 0]}>
        <mesh ref={link} geometry={linkGeometry} material={materials.link} />
      </group>

      <Html
        position={layout.labelOrigin}
        portal={portal}
        zIndexRange={[30, 20]}
        pointerEvents="none"
      >
        <div
          ref={label}
          style={{ opacity: 0, visibility: "hidden" }}
          className="relative w-max"
        >
          <button
            type="button"
            data-cursor-hover
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
            aria-describedby={`${node.id}-tooltip`}
            className="pointer-events-auto flex items-center gap-2 border border-white/10 bg-[#050506]/80 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.18em] text-[#c9c9cf] backdrop-blur-sm transition-colors duration-300 hover:border-[#ff8a3d]/60 hover:text-[#f5f5f2] focus-visible:text-[#f5f5f2] md:text-[11px]"
          >
            <span className="text-[#ff8a3d]">{String(index + 1).padStart(2, "0")}</span>
            {node.label}
          </button>
          <span
            id={`${node.id}-tooltip`}
            role="tooltip"
            className={`pointer-events-none absolute top-full mt-2 w-48 ${
              layout.placements[0] === "left" ? "right-0" : "left-0"
            } border border-white/10 bg-[#08080a]/95 p-3 text-[11px] leading-relaxed text-[#a3a3aa] shadow-xl transition-opacity duration-300 ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {node.description}
          </span>
        </div>
      </Html>
    </group>
  );
}

export default function ArchitectureModules() {
  const stacked = useThree((s) => s.size.width < 768 || s.size.width < s.size.height);
  const layouts = useLayouts(stacked);
  const die = useMemo<DieTextures>(() => {
    const { color, emissive } = paintDieCanvases(2024, 256);
    const map = new THREE.CanvasTexture(color);
    const emissiveMap = new THREE.CanvasTexture(emissive);
    map.colorSpace = emissiveMap.colorSpace = THREE.SRGBColorSpace;
    return { map, emissiveMap };
  }, []);
  useEffect(
    () => () => {
      die.map.dispose();
      die.emissiveMap.dispose();
    },
    [die]
  );

  return (
    <group>
      {layouts.map((layout) => (
        <SubsystemModule key={layout.node.id} layout={layout} die={die} />
      ))}
    </group>
  );
}
