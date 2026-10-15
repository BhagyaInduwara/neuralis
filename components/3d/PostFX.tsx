"use client";

import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";

interface PostFXProps {
  isMobile?: boolean;
}

const CA_OFFSET = new Vector2(0.0009, 0.0009);

/**
 * The composer renders into its own HDR buffer and forces NoToneMapping on
 * the renderer, so ACES is applied here as an effect rather than via
 * gl.toneMapping; the final pass outputs sRGB.
 */
export default function PostFX({ isMobile = false }: PostFXProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.2}
        intensity={1.2}
        mipmapBlur
        radius={0.62}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {isMobile ? (
        <></>
      ) : (
        <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.55} />
      )}
      <Vignette eskil={false} offset={0.22} darkness={0.55} />
      <Noise opacity={0.03} />
    </EffectComposer>
  );
}
