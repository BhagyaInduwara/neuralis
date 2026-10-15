"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/utils";
import { motionPrefs } from "@/lib/sceneState";

const vertexShader = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uFocus;
  uniform float uSize;
  uniform float uFogDensity;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831;
    p.x += sin(uTime * 0.045 + s) * 0.5;
    p.y += sin(uTime * 0.06 + s * 1.7) * 0.22;
    p.z += cos(uTime * 0.04 + s * 2.3) * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    // Out-of-focus motes grow and dim, faking depth-of-field blur.
    float blur = clamp(abs(depth - uFocus) / max(uFocus, 0.001), 0.0, 1.6);
    gl_PointSize = uSize * uPixelRatio * (1.0 + blur * 3.0) * (8.0 / max(depth, 0.1));
    float fog = exp(-pow(uFogDensity * depth, 2.0));
    vAlpha = (0.5 / (1.0 + blur * blur * 7.0)) * fog * (0.6 + 0.4 * fract(aSeed * 13.7));
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface DustProps {
  count: number;
}

export default function Dust({ count }: DustProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(77);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 30;
      positions[i * 3 + 1] = -0.3 + rand() * 6;
      positions[i * 3 + 2] = (rand() - 0.5) * 30;
      seeds[i] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uFocus: { value: 9 },
        uSize: { value: 2.2 },
        uFogDensity: { value: 0.035 },
        uColor: { value: new THREE.Color("#d9c7b0") },
      },
    });
    return { geometry: geo, material: mat };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(({ camera }, delta) => {
    material.uniforms.uTime.value += delta * (motionPrefs.reduced ? 0.3 : 1);
    material.uniforms.uPixelRatio.value = dpr;
    material.uniforms.uFocus.value = camera.position.length();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
