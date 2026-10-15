"use client";

import { Component, Suspense, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { pointerState, motionPrefs } from "@/lib/sceneState";
import { damp } from "@/lib/utils";

const ENV_INTENSITY = 0.35;

/** Local stand-in for the "city" HDRI when the CDN can't be reached. */
function StudioEnvironment() {
  return (
    <Environment resolution={128} environmentIntensity={ENV_INTENSITY}>
      <Lightformer intensity={2} position={[0, 5, -6]} scale={[10, 3, 1]} color="#ffffff" />
      <Lightformer intensity={1.2} position={[-6, 2, 2]} scale={[4, 6, 1]} color="#9fb2d6" />
      <Lightformer intensity={1.5} position={[6, 1, 3]} scale={[3, 4, 1]} color="#ffb070" />
    </Environment>
  );
}

class EnvironmentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <StudioEnvironment /> : this.props.children;
  }
}

export default function Lighting() {
  const amberLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (motionPrefs.reduced) return;
    if (amberLight.current) {
      amberLight.current.position.x = damp(
        amberLight.current.position.x,
        2.4 + pointerState.targetX * 0.8,
        3,
        delta
      );
      amberLight.current.position.y = damp(
        amberLight.current.position.y,
        1.6 - pointerState.targetY * 0.5,
        3,
        delta
      );
    }
    if (rimLight.current) {
      rimLight.current.position.x = damp(
        rimLight.current.position.x,
        -3 - pointerState.targetX * 0.4,
        3,
        delta
      );
    }
  });

  return (
    <>
      <EnvironmentBoundary>
        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={ENV_INTENSITY} />
        </Suspense>
      </EnvironmentBoundary>
      <ambientLight intensity={0.25} color="#3d3a42" />
      <directionalLight position={[3, 6, 5]} intensity={0.8} color="#e8e6ff" />
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
    </>
  );
}
