"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import SceneErrorBoundary from "./SceneErrorBoundary";
import StaticFallback from "@/components/ui/StaticFallback";
import { isWebGLAvailable } from "@/lib/webgl";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

interface SceneRootProps {
  onReady?: () => void;
}

export default function SceneRoot({ onReady }: SceneRootProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = isWebGLAvailable();
    setWebglOk(ok);
    // Lets CSS surface DOM fallbacks for content that otherwise lives in 3D.
    document.documentElement.dataset.webgl = ok ? "on" : "off";
  }, []);

  useEffect(() => {
    if (webglOk === false) onReady?.();
  }, [webglOk, onReady]);

  if (webglOk === null) return null;
  if (!webglOk) return <StaticFallback />;

  return (
    <div className="fixed inset-0 z-0">
      <SceneErrorBoundary fallback={<StaticFallback />}>
        <Scene onReady={onReady} />
      </SceneErrorBoundary>
    </div>
  );
}
