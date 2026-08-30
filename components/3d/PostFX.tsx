"use client";

import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

interface PostFXProps {
  quality?: "high" | "low";
}

const CA_OFFSET_HIGH = new Vector2(0.0006, 0.0006);
const CA_OFFSET_LOW = new Vector2(0.00015, 0.00015);

export default function PostFX({ quality = "high" }: PostFXProps) {
  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 0}>
      <Bloom
        luminanceThreshold={0.18}
        luminanceSmoothing={0.3}
        intensity={quality === "high" ? 0.75 : 0.5}
        mipmapBlur
        radius={0.55}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.55} />
      <ChromaticAberration
        offset={quality === "high" ? CA_OFFSET_HIGH : CA_OFFSET_LOW}
        blendFunction={BlendFunction.NORMAL}
        radialModulation
        modulationOffset={0.4}
      />
      <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
