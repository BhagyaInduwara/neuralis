"use client";

import { useEffect } from "react";
import { pointerState, motionPrefs } from "@/lib/sceneState";

/**
 * Headless global pointer tracker. Writes normalized (-1..1) coordinates into
 * the shared pointerState object so the R3F scene can read them in useFrame
 * without triggering React re-renders on every mouse move.
 */
export default function MouseInteraction() {
  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (motionPrefs.reduced) return;
      pointerState.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerState.targetY = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return null;
}
