import { clamp } from "./utils";

type Vec3 = [number, number, number];

/**
 * One camera/scene pose on the scroll track. `at` is measured in section
 * units (see scrollState.section): 2 means "section index 2 is centred".
 * The camera is described as an orbit around `target` so interpolating
 * between poses sweeps around the chip instead of cutting through it.
 */
export interface SceneKeyframe {
  at: number;
  target: Vec3;
  /** Degrees around Y; 0 = camera on +Z looking toward -Z. */
  azimuth: number;
  /** Degrees above the board plane. */
  elevation: number;
  distance: number;
  fov: number;
  /** World-space radius around the target that must stay in frame; on
   * narrow aspects the distance is pushed out until it fits. */
  fit: number;
  /** Fraction of the viewport the target is pushed right / up, so the
   * subject sits beside the copy instead of behind it. */
  shiftX: number;
  shiftY: number;
  chipScale: number;
  /** Fraction of the data-pulse pool that is alive. */
  pulseDensity: number;
  pulseSpeed: number;
  /** How strongly the "active" subset of traces glows. */
  traceGlow: number;
  /** 0 -> 1: architecture subsystem modules rising out of the board. */
  moduleRise: number;
}

const HERO: Omit<SceneKeyframe, "at"> = {
  target: [0, 0.05, 0],
  azimuth: 32,
  elevation: 34,
  distance: 8.6,
  fov: 30,
  fit: 1.9,
  shiftX: 0.17,
  shiftY: 0.04,
  chipScale: 1,
  pulseDensity: 0.5,
  pulseSpeed: 1,
  traceGlow: 0.35,
  moduleRise: 0,
};

// The camera trails the target by ~4 units along -x; keep it clear of the chip.
const TECH_IN: Omit<SceneKeyframe, "at"> = {
  target: [6.2, -0.45, 0.35],
  azimuth: -90,
  elevation: 15,
  distance: 4.2,
  fov: 38,
  fit: 0,
  shiftX: 0,
  shiftY: 0.04,
  chipScale: 1,
  pulseDensity: 0.65,
  pulseSpeed: 1.2,
  traceGlow: 0.5,
  moduleRise: 0,
};

const TECH_OUT: Omit<SceneKeyframe, "at"> = {
  ...TECH_IN,
  target: [8.8, -0.45, 0.6],
  azimuth: -96,
  elevation: 12,
  distance: 3.9,
};

const PERF: Omit<SceneKeyframe, "at"> = {
  target: [0, -0.2, 0],
  azimuth: 18,
  elevation: 30,
  distance: 12.5,
  fov: 34,
  fit: 3,
  shiftX: 0.2,
  shiftY: 0.1,
  chipScale: 0.95,
  pulseDensity: 1,
  pulseSpeed: 2,
  traceGlow: 0.7,
  moduleRise: 0,
};

const ARCH: Omit<SceneKeyframe, "at"> = {
  target: [0, -0.45, 0],
  azimuth: 0,
  elevation: 88,
  distance: 14.5,
  fov: 30,
  fit: 4.7,
  shiftX: 0.18,
  shiftY: -0.04,
  chipScale: 0.85,
  pulseDensity: 0.55,
  pulseSpeed: 1,
  traceGlow: 0.4,
  moduleRise: 1,
};

const ABOUT_IN: Omit<SceneKeyframe, "at"> = {
  target: [0, -0.1, 0],
  azimuth: 52,
  elevation: 26,
  distance: 10.5,
  fov: 32,
  fit: 2.2,
  shiftX: 0.18,
  shiftY: 0,
  chipScale: 1,
  pulseDensity: 0.5,
  pulseSpeed: 1,
  traceGlow: 0.4,
  moduleRise: 0,
};

/** ~30° orbit across the About section. */
const ABOUT_OUT: Omit<SceneKeyframe, "at"> = { ...ABOUT_IN, azimuth: 22 };

const CTA: Omit<SceneKeyframe, "at"> = {
  target: [0, -0.45, 0],
  azimuth: 20,
  elevation: 64,
  distance: 17,
  fov: 40,
  fit: 1.6,
  shiftX: 0,
  shiftY: -0.36,
  chipScale: 1,
  pulseDensity: 0.7,
  pulseSpeed: 1.1,
  traceGlow: 0.45,
  moduleRise: 0,
};

/** Duplicated keyframes either side of a section centre make the camera
 * rest while that section's copy is being read. */
export const DESKTOP_KEYFRAMES: SceneKeyframe[] = [
  { at: 0, ...HERO },
  { at: 0.15, ...HERO },
  { at: 0.85, ...TECH_IN },
  { at: 1.15, ...TECH_OUT },
  { at: 1.88, ...PERF },
  { at: 2.12, ...PERF },
  { at: 2.88, ...ARCH },
  { at: 3.12, ...ARCH },
  { at: 3.8, ...ABOUT_IN },
  { at: 4.2, ...ABOUT_OUT },
  { at: 4.9, ...CTA },
  { at: 5, ...CTA },
];

/** Narrow screens stack copy above the scene, so the subject is framed low
 * and centred, the board glide collapses to one pose and the orbit halves. */
const mobile = (
  frame: Omit<SceneKeyframe, "at">,
  shiftY: number
): Omit<SceneKeyframe, "at"> => ({ ...frame, shiftX: 0, shiftY });

export const MOBILE_KEYFRAMES: SceneKeyframe[] = [
  { at: 0, ...mobile(HERO, -0.2) },
  { at: 0.15, ...mobile(HERO, -0.2) },
  { at: 1, ...mobile({ ...TECH_IN, target: [7, -0.45, 0.4] }, 0.1) },
  { at: 1.88, ...mobile(PERF, -0.34) },
  { at: 2.12, ...mobile(PERF, -0.34) },
  { at: 2.88, ...mobile({ ...ARCH, fit: 4.4 }, -0.3) },
  { at: 3.12, ...mobile({ ...ARCH, fit: 4.4 }, -0.3) },
  { at: 3.85, ...mobile({ ...ABOUT_IN, azimuth: 44 }, -0.2) },
  { at: 4.15, ...mobile({ ...ABOUT_OUT, azimuth: 30 }, -0.2) },
  { at: 4.9, ...mobile(CTA, -0.4) },
  { at: 5, ...mobile(CTA, -0.4) },
];

/** prefers-reduced-motion: one static, high pose for the whole page, steep
 * enough that the architecture labels lay out as they do top-down. */
export const REDUCED_POSE: Omit<SceneKeyframe, "at" | "moduleRise"> = {
  target: [0, -0.45, 0],
  azimuth: 20,
  elevation: 62,
  distance: 14,
  fov: 34,
  fit: 4.9,
  shiftX: 0.08,
  shiftY: 0,
  chipScale: 1,
  pulseDensity: 0.35,
  pulseSpeed: 0.35,
  traceGlow: 0.45,
};

/** GSAP's power2.inOut. */
export function power2InOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export type SceneState = Omit<SceneKeyframe, "at">;

export function createSceneState(): SceneState {
  return { ...HERO, target: [...HERO.target] };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Evaluate a keyframe track at a continuous section position, writing into
 * `out` so the per-frame callers allocate nothing.
 */
export function evaluateSceneKeyframes(
  frames: SceneKeyframe[],
  section: number,
  out: SceneState
): SceneState {
  const s = clamp(section, frames[0].at, frames[frames.length - 1].at);
  let i = 0;
  while (i < frames.length - 2 && s > frames[i + 1].at) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const span = b.at - a.at || 1;
  const t = power2InOut(clamp((s - a.at) / span, 0, 1));

  out.target[0] = lerp(a.target[0], b.target[0], t);
  out.target[1] = lerp(a.target[1], b.target[1], t);
  out.target[2] = lerp(a.target[2], b.target[2], t);
  out.azimuth = lerp(a.azimuth, b.azimuth, t);
  out.elevation = lerp(a.elevation, b.elevation, t);
  out.distance = lerp(a.distance, b.distance, t);
  out.fov = lerp(a.fov, b.fov, t);
  out.fit = lerp(a.fit, b.fit, t);
  out.shiftX = lerp(a.shiftX, b.shiftX, t);
  out.shiftY = lerp(a.shiftY, b.shiftY, t);
  out.chipScale = lerp(a.chipScale, b.chipScale, t);
  out.pulseDensity = lerp(a.pulseDensity, b.pulseDensity, t);
  out.pulseSpeed = lerp(a.pulseSpeed, b.pulseSpeed, t);
  out.traceGlow = lerp(a.traceGlow, b.traceGlow, t);
  out.moduleRise = lerp(a.moduleRise, b.moduleRise, t);
  return out;
}
