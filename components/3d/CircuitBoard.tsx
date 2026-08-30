"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { generateCircuitPaths } from "@/lib/circuitPaths";
import { scrollState, interactionState } from "@/lib/sceneState";
import { evaluateSceneKeyframes } from "@/lib/sceneKeyframes";
import { damp, mapRange } from "@/lib/utils";

interface CircuitBoardProps {
  count?: number;
}

type LineMesh = THREE.Object3D & {
  material: THREE.LineBasicMaterial | THREE.Material;
};

export default function CircuitBoard({ count = 42 }: CircuitBoardProps) {
  const traces = useMemo(() => generateCircuitPaths(9137, count), [count]);
  const glowRefs = useRef<(LineMesh | null)[]>([]);
  const intensityRef = useRef(0.55);

  const dimTraces = traces.filter((t) => !t.glow);
  const glowTraces = traces.filter((t) => t.glow);

  useFrame((_, delta) => {
    const scene = evaluateSceneKeyframes(scrollState.progress);
    interactionState.pulse = damp(
      interactionState.pulse,
      interactionState.pulseTarget,
      3,
      delta
    );
    intensityRef.current = damp(
      intensityRef.current,
      scene.circuitIntensity + interactionState.pulse * 0.35,
      2,
      delta
    );
    const opacity = mapRange(intensityRef.current, 0, 1, 0.35, 1);

    glowRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const material = mesh.material as THREE.LineBasicMaterial;
      material.opacity = opacity;
    });
  });

  return (
    <group>
      {dimTraces.map((trace, i) => (
        <Line
          key={`dim-${i}`}
          points={trace.points}
          color="#3c3f48"
          lineWidth={1}
          transparent
          opacity={0.28}
          toneMapped
        />
      ))}
      {glowTraces.map((trace, i) => (
        <Line
          key={`glow-${i}`}
          ref={(el) => {
            glowRefs.current[i] = el as unknown as LineMesh;
          }}
          points={trace.points}
          color="#ff8a3d"
          lineWidth={1.5}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      ))}
    </group>
  );
}
