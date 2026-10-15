import gsap from "gsap";
import { introState, waveState } from "./sceneState";

interface SweepOptions {
  /** Seconds for the front to travel from the chip to the horizon. */
  duration?: number;
  /** Brightness of the travelling crest. */
  strength?: number;
  /** How lit everything behind the front stays (0 = crest only). */
  afterglow?: number;
  /** Seconds to fade the crest and afterglow back to idle. */
  settle?: number;
}

const HORIZON = 24;

/** Sends a light wave outward along every trace from the chip. */
export function sweepWave({
  duration = 2.2,
  strength = 1,
  afterglow = 1,
  settle = 1.6,
}: SweepOptions = {}): gsap.core.Timeline {
  gsap.killTweensOf(waveState);
  waveState.radius = 0.8;
  waveState.strength = strength;
  waveState.afterglow = afterglow;

  return gsap
    .timeline()
    .to(waveState, { radius: HORIZON, duration, ease: "power1.in" })
    .to(
      waveState,
      { strength: 0, afterglow: 0, duration: settle, ease: "power2.inOut" },
      duration * 0.75
    )
    .set(waveState, { radius: -10 });
}

/** Chip power-on after the preloader: traces light up from the centre. */
export function powerOn(reduced: boolean) {
  gsap.killTweensOf(introState);
  if (reduced) {
    introState.power = 1;
    return;
  }
  gsap.to(introState, { power: 1, duration: 1.3, ease: "power2.out" });
  sweepWave({ duration: 1.7, strength: 1.1, afterglow: 0.9, settle: 1.3 });
}
