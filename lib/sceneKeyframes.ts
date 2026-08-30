import { smoothstep } from "./utils";

export interface SceneKeyframe {
  /** Position along the total document scroll, 0 -> 1. */
  progress: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  chipPos: [number, number, number];
  chipScale: number;
  circuitIntensity: number;
}

export const SCENE_KEYFRAMES: SceneKeyframe[] = [
  {
    progress: 0,
    camPos: [0, 2.05, 7.2],
    lookAt: [-1.05, -0.2, 0],
    fov: 27,
    chipPos: [0, 0, 0],
    chipScale: 1,
    circuitIntensity: 0.55,
  },
  {
    progress: 0.2,
    camPos: [1.3, 1.7, 5.3],
    lookAt: [0, -0.15, 0],
    fov: 25,
    chipPos: [0, -0.05, 0],
    chipScale: 1.05,
    circuitIntensity: 0.75,
  },
  {
    progress: 0.42,
    camPos: [-2.1, 1.4, 5.9],
    lookAt: [0.25, -0.1, 0],
    fov: 29,
    chipPos: [0, 0, 0],
    chipScale: 1,
    circuitIntensity: 0.6,
  },
  {
    progress: 0.62,
    camPos: [0, 3.6, 10.5],
    lookAt: [0, -0.3, 0],
    fov: 38,
    chipPos: [0, 0, -1.1],
    chipScale: 0.82,
    circuitIntensity: 1,
  },
  {
    progress: 0.82,
    camPos: [2.6, 1.9, 9],
    lookAt: [-0.5, -0.15, 0],
    fov: 33,
    chipPos: [-0.5, 0, -2.1],
    chipScale: 0.68,
    circuitIntensity: 0.45,
  },
  {
    progress: 1,
    camPos: [0, 2.1, 11.6],
    lookAt: [0, -0.2, -1.4],
    fov: 35,
    chipPos: [0, 0, -3.2],
    chipScale: 0.5,
    circuitIntensity: 0.28,
  },
];

function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export interface SceneState {
  camPos: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  chipPos: [number, number, number];
  chipScale: number;
  circuitIntensity: number;
}

/** Evaluate the scene keyframe track at a given scroll progress (0 -> 1). */
export function evaluateSceneKeyframes(progress: number): SceneState {
  const frames = SCENE_KEYFRAMES;
  let i = 0;
  while (i < frames.length - 2 && progress > frames[i + 1].progress) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const span = b.progress - a.progress || 1;
  const t = smoothstep(0, 1, (progress - a.progress) / span);

  return {
    camPos: lerp3(a.camPos, b.camPos, t),
    lookAt: lerp3(a.lookAt, b.lookAt, t),
    fov: a.fov + (b.fov - a.fov) * t,
    chipPos: lerp3(a.chipPos, b.chipPos, t),
    chipScale: a.chipScale + (b.chipScale - a.chipScale) * t,
    circuitIntensity:
      a.circuitIntensity + (b.circuitIntensity - a.circuitIntensity) * t,
  };
}
