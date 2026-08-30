"use client";

import { Sparkles } from "@react-three/drei";

interface ParticlesProps {
  quality?: "high" | "low";
}

export default function Particles({ quality = "high" }: ParticlesProps) {
  const dustCount = quality === "high" ? 220 : 90;
  const amberCount = quality === "high" ? 14 : 6;

  return (
    <group>
      <Sparkles
        count={dustCount}
        size={1.1}
        scale={[11, 6, 11]}
        speed={0.15}
        opacity={0.22}
        color="#c9cad2"
        noise={1}
      />
      <Sparkles
        count={amberCount}
        size={2.2}
        scale={[7, 3.5, 7]}
        speed={0.2}
        opacity={0.45}
        color="#ff9c4d"
        noise={0.6}
      />
    </group>
  );
}
