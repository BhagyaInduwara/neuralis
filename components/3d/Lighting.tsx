"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointerState, motionPrefs } from "@/lib/sceneState";
import { damp } from "@/lib/utils";

export default function Lighting() {
  const amberLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (motionPrefs.reduced) return;
    if (amberLight.current) {
      const targetX = 2.4 + pointerState.targetX * 0.8;
      const targetY = 1.6 - pointerState.targetY * 0.5;
      amberLight.current.position.x = damp(
        amberLight.current.position.x,
        targetX,
        3,
        delta
      );
      amberLight.current.position.y = damp(
        amberLight.current.position.y,
        targetY,
        3,
        delta
      );
    }
    if (rimLight.current) {
      const targetX = -3 - pointerState.targetX * 0.4;
      rimLight.current.position.x = damp(
        rimLight.current.position.x,
        targetX,
        3,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#3d3a42" />
      <directionalLight
        position={[3, 4, 5]}
        intensity={0.7}
        color="#e8e6ff"
      />
      <pointLight
        ref={amberLight}
        position={[2.4, 1.6, 2.2]}
        intensity={3.2}
        distance={9}
        decay={2}
        color="#ff8a3d"
      />
      <pointLight
        ref={rimLight}
        position={[-3, 0.6, -2.4]}
        intensity={1.6}
        distance={10}
        decay={2}
        color="#5b6b8c"
      />
      <pointLight
        position={[0, -1.5, 3]}
        intensity={0.6}
        distance={8}
        decay={2}
        color="#ff6b1a"
      />
    </>
  );
}
