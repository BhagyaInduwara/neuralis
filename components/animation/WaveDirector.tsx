"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { introState, scrollState } from "@/lib/sceneState";
import { sweepWave } from "@/lib/wave";
import { prefersReducedMotion } from "@/lib/utils";

const CTA_INDEX = 5;
const ENTER_AT = CTA_INDEX - 0.45;
const LEAVE_AT = CTA_INDEX - 0.55;
const IDLE_INTERVAL = 6.5;

/**
 * Headless: when the CTA section arrives, light every trace in a wave from
 * the chip outward, then keep sending softer waves on a loop while it stays
 * on screen so the final view never sits frozen.
 */
export default function WaveDirector() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let inCta = false;
    let idle: gsap.core.Tween | null = null;

    const scheduleIdle = () => {
      idle = gsap.delayedCall(IDLE_INTERVAL, () => {
        sweepWave({ duration: 2.8, strength: 0.45, afterglow: 0, settle: 0.8 });
        scheduleIdle();
      });
    };

    const tick = () => {
      if (introState.power < 0.99) return;
      const s = scrollState.section;
      if (!inCta && s >= ENTER_AT) {
        inCta = true;
        sweepWave({ duration: 2.4, strength: 1.2, afterglow: 1, settle: 2 });
        scheduleIdle();
      } else if (inCta && s < LEAVE_AT) {
        inCta = false;
        idle?.kill();
        idle = null;
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      idle?.kill();
    };
  }, []);

  return null;
}
