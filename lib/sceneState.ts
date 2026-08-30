/**
 * Module-level mutable state shared between the DOM (GSAP/ScrollTrigger, pointer
 * listeners) and the R3F render loop. Deliberately not React state: the 3D scene
 * reads these every frame via useFrame, so writing to plain objects avoids
 * triggering React re-renders on every scroll/mouse event.
 */

export const scrollState = {
  /** Overall scroll progress across the full document, 0 -> 1. */
  progress: 0,
  /** Signed scroll velocity, roughly -1 -> 1, decays toward 0 when idle. */
  velocity: 0,
};

export const pointerState = {
  /** Raw normalized pointer position, -1 -> 1, updated on pointermove. */
  targetX: 0,
  targetY: 0,
};

export const architectureState = {
  /** id of the currently hovered architecture node, or null. */
  hoveredNode: null as string | null,
};

/** DOM hover interactions (tech cards, architecture nodes) nudge this toward 1
 * to give the persistent background scene a subtle reactive pulse. */
export const interactionState = {
  pulseTarget: 0,
  pulse: 0,
};

export const motionPrefs = {
  reduced: false,
};
