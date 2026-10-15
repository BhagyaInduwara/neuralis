"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { setConsoleFunction } from "three";
import Chip from "./Chip";
import CircuitBoard from "./CircuitBoard";
import DataPulses from "./DataPulses";
import Dust from "./Dust";
import ArchitectureModules from "./ArchitectureModules";
import Lighting from "./Lighting";
import CameraController from "./CameraController";
import PostFX from "./PostFX";
import { generateCircuitPaths } from "@/lib/circuitPaths";
import { useIsTouch } from "@/hooks/useIsTouch";

/**
 * Drops two known-benign upstream notices and forwards everything else:
 * R3F 9 still constructs a THREE.Clock (deprecated in three r183), and on
 * Windows ANGLE's D3D compiler reports X4122 float-folding notes for three's
 * own shader chunks via the program info log. Real shader errors (or info
 * logs containing anything else) still come through.
 */
function isBenignThreeNotice(message: unknown, params: unknown[]): boolean {
  if (typeof message !== "string") return false;
  if (message.startsWith("THREE.Clock: This module has been deprecated")) return true;
  if (message === "THREE.WebGLProgram: Program Info Log:" && typeof params[0] === "string") {
    const lines = params[0].trim().split("\n");
    return lines.every((line) => line.includes("warning X4122"));
  }
  return false;
}

setConsoleFunction((method: string, message: string, ...params: unknown[]) => {
  if (isBenignThreeNotice(message, params)) return;
  (console[method as "log" | "warn" | "error"] ?? console.log)(message, ...params);
});

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
  const [tabVisible, setTabVisible] = useState(true);
  const attempts = useRef(0);
  const reportedReady = useRef(false);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isTouch || window.innerWidth < 768;
  }, [isTouch]);

  const traceCount = isMobile ? 30 : 60;
  const pulseCount = isMobile ? 60 : 120;
  const dustCount = isMobile ? 200 : 400;
  const dpr: [number, number] = isMobile ? [1, 1] : [1, 1.75];
  const traces = useMemo(() => generateCircuitPaths(9137, traceCount), [traceCount]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
      frameloop={tabVisible ? "always" : "never"}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        preserveDrawingBuffer: true,
      }}
      camera={{ position: [0, 3, 9], fov: 30, near: 0.1, far: 120 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050505", 1);
      }}
    >
      <ReadySignal onConfirmed={reportReady} onSuspectBlank={handleSuspectBlank} />
      <CameraController isMobile={isMobile} />
      <Lighting />
      <Suspense fallback={null}>
        <Chip />
        <CircuitBoard traces={traces} />
        <DataPulses traces={traces} count={pulseCount} />
        <ArchitectureModules />
        <Dust count={dustCount} />
      </Suspense>
      <fogExp2 attach="fog" args={["#050505", 0.035]} />
      <PostFX isMobile={isMobile} />
    </Canvas>
  );
}
