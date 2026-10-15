"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pointerState, scrollState, motionPrefs } from "@/lib/sceneState";
import {
  DESKTOP_KEYFRAMES,
  MOBILE_KEYFRAMES,
  REDUCED_POSE,
  evaluateSceneKeyframes,
} from "@/lib/sceneKeyframes";
import { liveScene } from "@/lib/sceneFrame";
import { damp, lerpFactor } from "@/lib/utils";

const MAX_PARALLAX = 4;
const target = new THREE.Vector3();

interface CameraControllerProps {
  isMobile?: boolean;
}

/**
 * Evaluates the scroll keyframe track once per frame into `liveScene` (it runs
 * at priority -1, before every other useFrame) and flies the camera there.
 */
export default function CameraController({ isMobile = false }: CameraControllerProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const smooth = useMemo(() => ({
    initialised: false,
    target: new THREE.Vector3(),
    azimuth: 0,
    elevation: 0,
    distance: 0,
    fov: 30,
    shiftX: 0,
    shiftY: 0,
    parallaxX: 0,
    parallaxY: 0,
  }), []);

  useFrame((_, delta) => {
    const reduced = motionPrefs.reduced;
    // Same breakpoint as the CSS `stacked` variant: copy above, scene below.
    const stacked = isMobile || size.width < 768 || size.width < size.height;
    const frames = stacked ? MOBILE_KEYFRAMES : DESKTOP_KEYFRAMES;
    evaluateSceneKeyframes(frames, scrollState.section, liveScene);

    if (reduced) {
      // Static pose; only the module crossfade still follows scroll.
      const rise = liveScene.moduleRise;
      const targetArray = liveScene.target;
      Object.assign(liveScene, REDUCED_POSE, {
        target: targetArray,
        shiftX: stacked ? 0 : REDUCED_POSE.shiftX,
        shiftY: stacked ? -0.2 : REDUCED_POSE.shiftY,
        moduleRise: rise,
      });
      targetArray[0] = REDUCED_POSE.target[0];
      targetArray[1] = REDUCED_POSE.target[1];
      targetArray[2] = REDUCED_POSE.target[2];
    }

    const aspect = size.width / Math.max(size.height, 1);
    const halfTan = Math.tan(THREE.MathUtils.degToRad(liveScene.fov / 2));
    // Push out until `fit` world units around the target clear the nearest
    // viewport edge, accounting for the target being shifted off-centre.
    const room = Math.min(
      (1 - 2 * Math.abs(liveScene.shiftX)) * aspect,
      1 - 2 * Math.abs(liveScene.shiftY)
    );
    const distance = Math.max(liveScene.distance, liveScene.fit / (halfTan * Math.max(room, 0.2)));

    const k = lerpFactor(0.05, delta);
    smooth.parallaxX += ((reduced ? 0 : pointerState.targetX) - smooth.parallaxX) * k;
    smooth.parallaxY += ((reduced ? 0 : pointerState.targetY) - smooth.parallaxY) * k;

    target.set(...liveScene.target);
    if (!smooth.initialised) {
      smooth.initialised = true;
      smooth.target.copy(target);
      smooth.azimuth = liveScene.azimuth;
      smooth.elevation = liveScene.elevation;
      smooth.distance = distance;
      smooth.fov = liveScene.fov;
      smooth.shiftX = liveScene.shiftX;
      smooth.shiftY = liveScene.shiftY;
    }

    // Light damping on top of Lenis keeps anchor jumps and resizes smooth
    // in both scroll directions.
    const lambda = 7;
    smooth.target.x = damp(smooth.target.x, target.x, lambda, delta);
    smooth.target.y = damp(smooth.target.y, target.y, lambda, delta);
    smooth.target.z = damp(smooth.target.z, target.z, lambda, delta);
    smooth.azimuth = damp(smooth.azimuth, liveScene.azimuth, lambda, delta);
    smooth.elevation = damp(smooth.elevation, liveScene.elevation, lambda, delta);
    smooth.distance = damp(smooth.distance, distance, lambda, delta);
    smooth.fov = damp(smooth.fov, liveScene.fov, lambda, delta);
    smooth.shiftX = damp(smooth.shiftX, liveScene.shiftX, lambda, delta);
    smooth.shiftY = damp(smooth.shiftY, liveScene.shiftY, lambda, delta);

    const az = THREE.MathUtils.degToRad(smooth.azimuth + smooth.parallaxX * MAX_PARALLAX);
    const el = THREE.MathUtils.degToRad(
      Math.min(smooth.elevation - smooth.parallaxY * MAX_PARALLAX, 89.5)
    );
    camera.position.set(
      smooth.target.x + smooth.distance * Math.cos(el) * Math.sin(az),
      smooth.target.y + smooth.distance * Math.sin(el),
      smooth.target.z + smooth.distance * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(smooth.target);

    camera.fov = smooth.fov;
    camera.setViewOffset(
      size.width,
      size.height,
      -smooth.shiftX * size.width,
      smooth.shiftY * size.height,
      size.width,
      size.height
    );
    camera.updateProjectionMatrix();
  }, -1);

  return null;
}
