"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pointerState, scrollState, motionPrefs } from "@/lib/sceneState";
import { evaluateSceneKeyframes } from "@/lib/sceneKeyframes";
import { damp } from "@/lib/utils";

const lookTarget = new THREE.Vector3();
const desiredPos = new THREE.Vector3();

interface CameraControllerProps {
  /** On narrow viewports the DOM stacks vertically, so the chip is reframed
   * toward the top-center of the screen instead of the right side. */
  isMobile?: boolean;
}

export default function CameraController({ isMobile = false }: CameraControllerProps) {
  const { camera } = useThree();
  const perspective = camera as THREE.PerspectiveCamera;

  useFrame((_, delta) => {
    const scene = evaluateSceneKeyframes(scrollState.progress);

    const parallaxX = motionPrefs.reduced ? 0 : pointerState.targetX * 0.35;
    const parallaxY = motionPrefs.reduced ? 0 : -pointerState.targetY * 0.22;

    desiredPos.set(
      scene.camPos[0] + parallaxX,
      scene.camPos[1] + parallaxY,
      scene.camPos[2]
    );

    camera.position.x = damp(camera.position.x, desiredPos.x, 2.6, delta);
    camera.position.y = damp(camera.position.y, desiredPos.y, 2.6, delta);
    camera.position.z = damp(camera.position.z, desiredPos.z, 2.6, delta);

    const lookX = isMobile ? scene.lookAt[0] * 0.25 : scene.lookAt[0];
    const lookY = isMobile ? scene.lookAt[1] - 1.5 : scene.lookAt[1];
    lookTarget.set(lookX, lookY, scene.lookAt[2]);
    camera.lookAt(lookTarget);

    const targetFov = isMobile ? scene.fov + 12 : scene.fov;
    if (perspective.isPerspectiveCamera) {
      perspective.fov = damp(perspective.fov, targetFov, 2.6, delta);
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}
