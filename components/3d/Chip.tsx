"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ProceduralChip from "./ProceduralChip";
import { pointerState, motionPrefs } from "@/lib/sceneState";
import { liveScene } from "@/lib/sceneFrame";
import { damp, lerpFactor } from "@/lib/utils";

const MAX_TILT = THREE.MathUtils.degToRad(4);
const FLOAT_AMPLITUDE = 0.05;
const FLOAT_PERIOD = 6;

/**
 * Chip is the stable public surface for the hero object: it owns idle motion,
 * pointer reactivity, and scroll choreography. The actual geometry is
 * delegated to a swappable inner renderer (ProceduralChip today; a future
 * GLTFChip could drop in without touching this file's animation logic).
 */
export default function Chip() {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const outerGroup = outer.current;
    const innerGroup = inner.current;
    if (!outerGroup || !innerGroup) return;

    outerGroup.scale.setScalar(damp(outerGroup.scale.x, liveScene.chipScale, 4, delta));

    const reduced = motionPrefs.reduced;
    const t = state.clock.elapsedTime;
    innerGroup.position.y = reduced
      ? 0
      : Math.sin((t / FLOAT_PERIOD) * Math.PI * 2) * FLOAT_AMPLITUDE;

    // Tilt so the die face turns toward the cursor, lerped 0.05/frame.
    const k = lerpFactor(0.05, delta);
    const tiltX = reduced ? 0 : pointerState.targetY * MAX_TILT;
    const tiltZ = reduced ? 0 : -pointerState.targetX * MAX_TILT;
    innerGroup.rotation.x += (tiltX - innerGroup.rotation.x) * k;
    innerGroup.rotation.z += (tiltZ - innerGroup.rotation.z) * k;
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <ProceduralChip />
      </group>
    </group>
  );
}
