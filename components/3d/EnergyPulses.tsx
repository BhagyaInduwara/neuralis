"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateCircuitPaths, pointAtT } from "@/lib/circuitPaths";
import { motionPrefs, scrollState } from "@/lib/sceneState";

interface EnergyPulsesProps {
  count?: number;
  maxPulses?: number;
}

const PULSE_COLOR = new THREE.Color("#ffb066").multiplyScalar(3.2);
const scratch: [number, number, number] = [0, 0, 0];

export default function EnergyPulses({
  count = 42,
  maxPulses = 16,
}: EnergyPulsesProps) {
  const traces = useMemo(() => {
    const all = generateCircuitPaths(9137, count).filter((t) => t.glow);
    return all.slice(0, maxPulses);
  }, [count, maxPulses]);

  const progressRef = useRef<number[] | null>(null);
  if (progressRef.current === null) {
    progressRef.current = traces.map(() => Math.random());
  }
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const progress = progressRef.current;
    if (!mesh || !progress) return;

    const speedScale = motionPrefs.reduced ? 0.15 : 1;
    // Circuits animate a little more energetically while scrolling.
    const activity = 0.7 + Math.min(Math.abs(scrollState.velocity), 1) * 0.6;

    traces.forEach((trace, i) => {
      progress[i] = (progress[i] + delta * trace.speed * 0.35 * speedScale * activity) % 1;

      const p = pointAtT(trace.points, progress[i], scratch);
      dummy.position.set(p[0], p[1], p[2]);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, traces.length]}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color={PULSE_COLOR} toneMapped={false} />
    </instancedMesh>
  );
}
