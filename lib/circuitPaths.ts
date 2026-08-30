import { mulberry32 } from "./utils";

export interface CircuitTrace {
  points: [number, number, number][];
  glow: boolean;
  speed: number;
  length: number;
}

const AXES: Array<"x" | "z"> = ["x", "z"];
/** Shared step so independent traces snap to the same lines, like a real PCB grid. */
const GRID = 0.52;
const snap = (v: number) => Math.round(v / GRID) * GRID;

/**
 * Procedurally generates right-angle circuit traces radiating outward from the
 * chip toward the edges of the scene, on a fixed plane. Every turn snaps to a
 * shared grid so independently-generated traces align with each other the way
 * real PCB routing does, instead of reading as scattered random fragments.
 * Deterministic given a seed so the pattern is stable across re-renders.
 */
export function generateCircuitPaths(
  seed: number,
  count: number,
  options?: { minRadius?: number; maxRadius?: number; y?: number }
): CircuitTrace[] {
  const rand = mulberry32(seed);
  const minRadius = options?.minRadius ?? 1.35;
  const maxRadius = options?.maxRadius ?? 9;
  const y = options?.y ?? -0.42;

  const traces: CircuitTrace[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.12;
    const startX = snap(Math.cos(angle) * minRadius);
    const startZ = snap(Math.sin(angle) * minRadius);

    // Snap the initial heading to whichever cardinal axis the start point favors.
    let axisIndex = Math.abs(startX) > Math.abs(startZ) ? 0 : 1;
    let x = startX;
    let z = startZ;
    const points: [number, number, number][] = [[x, y, z]];

    const segmentCount = 2 + Math.floor(rand() * 3);
    let radius = Math.hypot(x, z);

    for (let s = 0; s < segmentCount && radius < maxRadius; s++) {
      const axis = AXES[axisIndex];
      const dirSign = Math.sign(axis === "x" ? x || 1 : z || 1) || 1;
      const steps = 2 + Math.floor(rand() * 4);
      const segLength = steps * GRID;

      if (axis === "x") {
        x = snap(x + dirSign * segLength);
      } else {
        z = snap(z + dirSign * segLength);
      }

      points.push([x, y, z]);
      radius = Math.hypot(x, z);
      axisIndex = 1 - axisIndex;
    }

    const glow = i % 3 === 0;

    traces.push({
      points,
      glow,
      speed: 0.25 + rand() * 0.55,
      length: points.length,
    });
  }

  return traces;
}

/** Total euclidean length of a polyline defined by [x,y,z] points. */
export function polylineLength(points: [number, number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay, az] = points[i - 1];
    const [bx, by, bz] = points[i];
    total += Math.hypot(bx - ax, by - ay, bz - az);
  }
  return total;
}

/** Interpolates a point at arc-length parameter t (0 -> 1) along a polyline. */
export function pointAtT(
  points: [number, number, number][],
  t: number,
  out: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  if (points.length < 2) {
    out[0] = points[0]?.[0] ?? 0;
    out[1] = points[0]?.[1] ?? 0;
    out[2] = points[0]?.[2] ?? 0;
    return out;
  }

  const total = polylineLength(points);
  const target = Math.min(Math.max(t, 0), 1) * total;

  let covered = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay, az] = points[i - 1];
    const [bx, by, bz] = points[i];
    const segLength = Math.hypot(bx - ax, by - ay, bz - az);
    if (covered + segLength >= target || i === points.length - 1) {
      const segT = segLength === 0 ? 0 : (target - covered) / segLength;
      out[0] = ax + (bx - ax) * segT;
      out[1] = ay + (by - ay) * segT;
      out[2] = az + (bz - az) * segT;
      return out;
    }
    covered += segLength;
  }

  const last = points[points.length - 1];
  out[0] = last[0];
  out[1] = last[1];
  out[2] = last[2];
  return out;
}
