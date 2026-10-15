"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import {
  BOARD_Y,
  SOCKET_HALF,
  subdivideTraces,
  type CircuitTrace,
} from "@/lib/circuitPaths";
import { generatePinGrid } from "@/lib/dieDetails";
import { introState, interactionState, waveState, motionPrefs } from "@/lib/sceneState";
import { liveScene } from "@/lib/sceneFrame";
import { damp, heartbeat } from "@/lib/utils";

const DIM = new THREE.Color("#5a2a08");
const BRIGHT = new THREE.Color("#ffb35c");
const BRIGHT_GAIN = 2.6;
const WAVE_WIDTH = 1.1;

function paintBoardTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0b0c0f";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const p = (i * size) / 4 + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      ctx.fillRect(x * 64 + 31, y * 64 + 31, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function Board() {
  const texture = useMemo(() => {
    const tex = paintBoardTexture();
    // One tile spans 4 routing-grid cells.
    tex.repeat.set(160 / 2.08, 160 / 2.08);
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOARD_Y, 0]}>
      <planeGeometry args={[160, 160]} />
      <meshStandardMaterial map={texture} color="#ffffff" roughness={0.78} metalness={0.25} />
    </mesh>
  );
}

function Socket() {
  const pads = useMemo(() => generatePinGrid(11, 0.16, 2), []);
  const padRef = useRef<THREE.InstancedMesh>(null);
  const outlineMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ff8a1f", toneMapped: false }),
    []
  );
  useEffect(() => () => outlineMaterial.dispose(), [outlineMaterial]);

  useLayoutEffect(() => {
    const mesh = padRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    pads.forEach((pad, i) => {
      dummy.position.set(pad.x, 0, pad.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [pads]);

  useFrame(({ clock }) => {
    const beat = heartbeat(clock.elapsedTime);
    outlineMaterial.color
      .set("#ff8a1f")
      .multiplyScalar(0.12 + introState.power * (0.45 + beat * 0.9));
  });

  const y = BOARD_Y + 0.003;
  const edge = SOCKET_HALF;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOARD_Y + 0.001, 0]}>
        <planeGeometry args={[edge * 2, edge * 2]} />
        <meshStandardMaterial color="#060607" roughness={0.6} metalness={0.4} />
      </mesh>
      <instancedMesh ref={padRef} args={[undefined, undefined, pads.length]} position={[0, y, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.006, 12]} />
        <meshStandardMaterial color="#c79a48" metalness={1} roughness={0.32} />
      </instancedMesh>
      {[0, 1, 2, 3].map((side) => {
        const angle = (side * Math.PI) / 2;
        return (
          <mesh
            key={side}
            material={outlineMaterial}
            position={[Math.cos(angle) * edge, y, Math.sin(angle) * edge]}
            rotation={[0, -angle + Math.PI / 2, 0]}
          >
            <boxGeometry args={[edge * 2 + 0.02, 0.004, 0.018]} />
          </mesh>
        );
      })}
    </group>
  );
}

interface TracesProps {
  traces: CircuitTrace[];
}

function Traces({ traces }: TracesProps) {
  const size = useThree((s) => s.size);
  const segments = useMemo(() => subdivideTraces(traces, 0.3), [traces]);

  const { line, colors, distances, activeFlags } = useMemo(() => {
    const positions = new Float32Array(segments.length * 6);
    const colorArray = new Float32Array(segments.length * 6);
    const dist = new Float32Array(segments.length * 2);
    const active = new Uint8Array(segments.length);
    segments.forEach((seg, i) => {
      positions.set(seg.start, i * 6);
      positions.set(seg.end, i * 6 + 3);
      dist[i * 2] = seg.startDist;
      dist[i * 2 + 1] = seg.endDist;
      active[i] = traces[seg.traceIndex].active ? 1 : 0;
    });

    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colorArray);
    const material = new LineMaterial({
      vertexColors: true,
      linewidth: 1.75,
      worldUnits: false,
    });
    material.fog = true;
    material.toneMapped = false;
    const lineObject = new LineSegments2(geometry, material);
    lineObject.frustumCulled = false;

    const colorAttr = geometry.getAttribute(
      "instanceColorStart"
    ) as THREE.InterleavedBufferAttribute;
    return {
      line: lineObject,
      colors: colorAttr.data as THREE.InstancedInterleavedBuffer,
      distances: dist,
      activeFlags: active,
    };
  }, [segments, traces]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as LineMaterial).dispose();
    },
    [line]
  );

  useEffect(() => {
    (line.material as LineMaterial).resolution.set(size.width, size.height);
  }, [line, size]);

  const glow = useRef(0.35);

  useFrame(({ clock }, delta) => {
    interactionState.pulse = damp(interactionState.pulse, interactionState.pulseTarget, 3, delta);
    glow.current = damp(glow.current, liveScene.traceGlow + interactionState.pulse * 0.35, 2.5, delta);

    const power = introState.power;
    const beat = motionPrefs.reduced ? 0 : heartbeat(clock.elapsedTime);
    const { radius, strength, afterglow } = waveState;
    const base = 0.35 + 0.65 * power;
    const array = colors.array as Float32Array;

    for (let i = 0; i < activeFlags.length; i++) {
      const activeGlow = activeFlags[i] ? glow.current : glow.current * 0.08;
      for (let end = 0; end < 2; end++) {
        const d = distances[i * 2 + end];
        const front = (d - radius) / WAVE_WIDTH;
        const wave =
          strength * Math.exp(-front * front) +
          afterglow * (d < radius ? 1 : Math.exp(-front * front * 4));
        const nearChip = beat * 0.55 * Math.exp(-(d - SOCKET_HALF) / 1.4);
        const k = power * (activeGlow + nearChip) + wave;
        const o = i * 6 + end * 3;
        array[o] = DIM.r * base + BRIGHT.r * BRIGHT_GAIN * k;
        array[o + 1] = DIM.g * base + BRIGHT.g * BRIGHT_GAIN * k;
        array[o + 2] = DIM.b * base + BRIGHT.b * BRIGHT_GAIN * k;
      }
    }
    colors.needsUpdate = true;
  });

  return <primitive object={line} />;
}

interface CircuitBoardProps {
  traces: CircuitTrace[];
}

export default function CircuitBoard({ traces }: CircuitBoardProps) {
  return (
    <group>
      <Board />
      <Socket />
      <Traces traces={traces} />
    </group>
  );
}
