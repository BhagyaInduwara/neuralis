"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Chip from "./Chip";
import CircuitBoard from "./CircuitBoard";
import EnergyPulses from "./EnergyPulses";
import Particles from "./Particles";
import Lighting from "./Lighting";
import CameraController from "./CameraController";
import PostFX from "./PostFX";
import { useIsTouch } from "@/hooks/useIsTouch";

interface ReadySignalProps {
  onConfirmed: () => void;
  onSuspectBlank: () => void;
}

/**
 * Occasionally the postprocessing render-target chain fails to produce a
 * painted frame on first mount (an upstream GPU/driver race, not app
 * state) — the canvas exists and reports no error, it just never draws
 * anything but the clear color. Rather than trust canvas creation alone,
 * wait a few real frames, then sample the actual pixels: if the frame
 * looks meaningfully brighter than the near-black clear color, the scene
 * is confirmed live and the loading screen can drop. If not, ask the
 * parent for a clean remount instead of hiding the loader on a blank scene.
 */
function ReadySignal({ onConfirmed, onSuspectBlank }: ReadySignalProps) {
  const { gl } = useThree();
  const frames = useRef(0);
  const settled = useRef(false);

  useFrame(() => {
    if (settled.current) return;
    frames.current += 1;
    if (frames.current < 8) return;
    settled.current = true;

    try {
      const canvasEl = gl.domElement;
      const probe = document.createElement("canvas");
      probe.width = 24;
      probe.height = 24;
      const ctx = probe.getContext("2d");
      if (!ctx) {
        onConfirmed();
        return;
      }
      ctx.drawImage(canvasEl, 0, 0, 24, 24);
      const { data } = ctx.getImageData(0, 0, 24, 24);
      let maxChannel = 0;
      for (let i = 0; i < data.length; i += 4) {
        maxChannel = Math.max(maxChannel, data[i], data[i + 1], data[i + 2]);
      }
      if (maxChannel < 20) {
        onSuspectBlank();
      } else {
        onConfirmed();
      }
    } catch {
      // Pixel readback unavailable — assume fine, nothing actionable.
      onConfirmed();
    }
  });

  return null;
}

const MAX_REMOUNT_ATTEMPTS = 3;

interface SceneProps {
  onReady?: () => void;
}

export default function Scene({ onReady }: SceneProps) {
  const isTouch = useIsTouch();
  const [canvasKey, setCanvasKey] = useState(0);
  const attempts = useRef(0);
  const reportedReady = useRef(false);

  const quality: "high" | "low" = useMemo(() => {
    if (typeof window === "undefined") return "high";
    return isTouch || window.innerWidth < 820 ? "low" : "high";
  }, [isTouch]);

  const traceCount = quality === "high" ? 42 : 24;
  const dpr: [number, number] = quality === "high" ? [1, 2] : [1, 1.3];
  const isMobile = quality === "low";

  const reportReady = useCallback(() => {
    if (reportedReady.current) return;
    reportedReady.current = true;
    onReady?.();
  }, [onReady]);

  const handleSuspectBlank = () => {
    if (attempts.current >= MAX_REMOUNT_ATTEMPTS) {
      // Out of retries — show whatever we have rather than hang forever.
      reportReady();
      return;
    }
    attempts.current += 1;
    setCanvasKey((k) => k + 1);
  };

  // Absolute fallback: never let the loading screen hang indefinitely, even
  // if pixel probing itself is unreliable in some environment.
  useEffect(() => {
    const timer = window.setTimeout(reportReady, 8000);
    return () => window.clearTimeout(timer);
  }, [reportReady]);

  return (
    <Canvas
      key={canvasKey}
      dpr={dpr}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        preserveDrawingBuffer: true,
      }}
      camera={{ position: [0, 2.05, 7.2], fov: 27, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050506", 1);
      }}
    >
      <ReadySignal onConfirmed={reportReady} onSuspectBlank={handleSuspectBlank} />
      <CameraController isMobile={isMobile} />
      <Lighting />
      <Suspense fallback={null}>
        <Chip />
        <CircuitBoard count={traceCount} />
        <EnergyPulses count={traceCount} maxPulses={quality === "high" ? 16 : 8} />
        <Particles quality={quality} />
      </Suspense>
      <fog attach="fog" args={["#050506", 8, 22]} />
      <PostFX quality={quality} />
    </Canvas>
  );
}
