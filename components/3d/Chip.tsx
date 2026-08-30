"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ProceduralChip from "./ProceduralChip";
import { pointerState, scrollState, motionPrefs } from "@/lib/sceneState";
import { evaluateSceneKeyframes } from "@/lib/sceneKeyframes";
import { damp } from "@/lib/utils";

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

    const scene = evaluateSceneKeyframes(scrollState.progress);

    outerGroup.position.set(...scene.chipPos);
    const targetScale = scene.chipScale;
    outerGroup.scale.setScalar(
      damp(outerGroup.scale.x, targetScale, 4, delta)
    );

    const reduced = motionPrefs.reduced;
    const t = state.clock.elapsedTime;

    // Idle living-machine motion: slow rotation, gentle float, subtle breathing.
    const idleRotSpeed = reduced ? 0.015 : 0.08;
    innerGroup.rotation.y += delta * idleRotSpeed;

    const floatY = reduced ? 0 : Math.sin(t * 0.55) * 0.035;
    const breathe = reduced ? 0 : Math.sin(t * 0.35) * 0.012;

    // Pointer-driven tilt, heavily damped so it feels fluid rather than direct.
    const tiltX = reduced ? 0 : pointerState.targetY * 0.14;
    const tiltZ = reduced ? 0 : -pointerState.targetX * 0.16;

    innerGroup.rotation.x = damp(innerGroup.rotation.x, tiltX + breathe, 2.4, delta);
    innerGroup.rotation.z = damp(innerGroup.rotation.z, tiltZ, 2.4, delta);
    innerGroup.position.y = damp(innerGroup.position.y, floatY, 2.4, delta);
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <ProceduralChip />
      </group>
    </group>
  );
}
