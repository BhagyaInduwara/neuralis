"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

interface PostFXProps {
  quality?: "high" | "low";
}

export default function PostFX({ quality = "high" }: PostFXProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.42}
        luminanceSmoothing={0.2}
        intensity={quality === "high" ? 0.42 : 0.3}
        mipmapBlur
        radius={0.32}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.5} />
    </EffectComposer>
  );
}
