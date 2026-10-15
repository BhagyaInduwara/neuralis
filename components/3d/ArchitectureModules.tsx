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
  placement: Placement;
  labelAnchor: [number, number, number];
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
        // World-axis half extents of the rotated footprint.
        const [depth, width] = size;
        const extentX = (Math.abs(dir.x) * depth + Math.abs(dir.y) * width) / 2;
        const extentZ = (Math.abs(dir.y) * depth + Math.abs(dir.x) * width) / 2;
        const anchor: [number, number, number] = [position.x, BOARD_Y + size[2], position.z];
        if (placement === "right") anchor[0] += extentX;
        if (placement === "left") anchor[0] -= extentX;
        if (placement === "above") anchor[2] -= extentZ;
        if (placement === "below") anchor[2] += extentZ;

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
          placement,
          labelAnchor: anchor,
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

  useFrame((_, delta) => {
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

    if (label.current) {
      const visible = opacity > 0.6;
      label.current.style.opacity = String(clamp((opacity - 0.6) / 0.4, 0, 1));
      label.current.style.visibility = visible ? "visible" : "hidden";
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
        position={layout.labelAnchor}
        portal={portal}
        zIndexRange={[30, 20]}
        pointerEvents="none"
      >
        <div
          ref={label}
          style={{ transform: LABEL_TRANSFORM[layout.placement], opacity: 0, visibility: "hidden" }}
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
              layout.placement === "left" ? "right-0" : "left-0"
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
