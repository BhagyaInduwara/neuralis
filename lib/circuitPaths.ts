import { mulberry32 } from "./utils";

export type Vec3 = [number, number, number];

/** Board surface height; everything routed on the PCB sits just above it. */
export const BOARD_Y = -0.45;
export const TRACE_Y = BOARD_Y + 0.004;
/** Half-size of the socket footprint the traces break out from. */
export const SOCKET_HALF = 1.2;

export interface CircuitTrace {
  /** Octilinear corner points (0°/45°/90° segments only). */
  points: Vec3[];
  /** Cumulative arc length at each point; last entry is the total. */
  lengths: number[];
  total: number;
  /** Distance of the first point from the chip centre, so the network-wide
   * "distance from chip" of any point is `startRadius + arc length`. */
  startRadius: number;
  /** Part of the always-lit subset. */
  active: boolean;
}

function withLengths(points: Vec3[], active: boolean): CircuitTrace {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, , az] = points[i - 1];
    const [bx, , bz] = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(bx - ax, bz - az));
  }
  return {
    points,
    lengths,
    total: lengths[lengths.length - 1],
    startRadius: Math.hypot(points[0][0], points[0][2]),
    active,
  };
}

/**
 * BGA-style breakout: each side of the socket emits a bus of parallel traces
 * that run straight out, fan apart with a 45° jog, run straight again, then
 * fan a second time before heading for the horizon. Every trace on a side
 * jogs at the same outward distance, by an amount monotonic in its lateral
 * position, so the bus spreads like real routing without any crossings.
 * The outermost few bend a further 90° (as two 45° turns) to run along the
 * board. Deterministic for a given seed.
 */
export function generateCircuitPaths(seed: number, count: number): CircuitTrace[] {
  const rand = mulberry32(seed);
  const perSide = Math.max(2, Math.round(count / 4));
  const traces: CircuitTrace[] = [];

  // Outward direction and its lateral axis for E, S, W, N.
  const sides: Array<{ dir: [number, number]; perp: [number, number] }> = [
    { dir: [1, 0], perp: [0, 1] },
    { dir: [0, 1], perp: [-1, 0] },
    { dir: [-1, 0], perp: [0, -1] },
    { dir: [0, -1], perp: [1, 0] },
  ];

  sides.forEach(({ dir, perp }) => {
    for (let k = 0; k < perSide; k++) {
      const u = ((k + 0.5) / perSide) * 2 - 1;
      const sign = Math.sign(u) || 1;
      const mag = Math.abs(u);

      // Position in the side's local frame: `a` outward, `b` lateral.
      let a = SOCKET_HALF + 0.04;
      let b = u * (SOCKET_HALF - 0.22);
      const local: Array<[number, number]> = [[a, b]];

      a += 0.32;
      local.push([a, b]);

      const fan1 = mag * 1.15;
      a += fan1;
      b += sign * fan1;
      local.push([a, b]);

      // Common outward distance for the second jog, past the widest first fan.
      a = SOCKET_HALF + 0.36 + 1.15 + 1.1;
      local.push([a, b]);

      const fan2 = mag * 1.6;
      a += fan2;
      b += sign * fan2;
      local.push([a, b]);

      const turnAway = mag > 0.82 && rand() < 0.7;
      if (turnAway) {
        a += 0.9 + rand() * 1.4;
        local.push([a, b]);
        const chamfer = 0.35;
        a += chamfer;
        b += sign * chamfer;
        local.push([a, b]);
        b += sign * (3 + rand() * 6);
        local.push([a, b]);
      } else {
        a += 1.2 + rand() * 9;
        local.push([a, b]);
      }

      const points: Vec3[] = local.map(([la, lb]) => [
        dir[0] * la + perp[0] * lb,
        TRACE_Y,
        dir[1] * la + perp[1] * lb,
      ]);

      traces.push(withLengths(points, rand() < 0.28));
    }
  });

  return traces;
}

/** Writes the point at arc length `distance` along the trace into `out`. */
export function sampleTrace(trace: CircuitTrace, distance: number, out: Vec3): Vec3 {
  const { points, lengths } = trace;
  const d = Math.min(Math.max(distance, 0), trace.total);
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < d) i++;
  const segLen = lengths[i] - lengths[i - 1] || 1;
  const t = (d - lengths[i - 1]) / segLen;
  const a = points[i - 1];
  const b = points[i];
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}

export interface TraceSegment {
  start: Vec3;
  end: Vec3;
  /** Network distance from the chip at each end (for the light wave). */
  startDist: number;
  endDist: number;
  traceIndex: number;
}

/** Splits every trace into short pieces so per-vertex lighting (the wave,
 * glow falloff) resolves smoothly along long straight runs. */
export function subdivideTraces(traces: CircuitTrace[], maxLength = 0.3): TraceSegment[] {
  const segments: TraceSegment[] = [];
  const tmpA: Vec3 = [0, 0, 0];
  const tmpB: Vec3 = [0, 0, 0];

  traces.forEach((trace, traceIndex) => {
    const pieces = Math.max(1, Math.ceil(trace.total / maxLength));
    for (let p = 0; p < pieces; p++) {
      const d0 = (p / pieces) * trace.total;
      const d1 = ((p + 1) / pieces) * trace.total;
      sampleTrace(trace, d0, tmpA);
      sampleTrace(trace, d1, tmpB);
      segments.push({
        start: [tmpA[0], tmpA[1], tmpA[2]],
        end: [tmpB[0], tmpB[1], tmpB[2]],
        startDist: trace.startRadius + d0,
        endDist: trace.startRadius + d1,
        traceIndex,
      });
    }
  });

  return segments;
}

export interface Via {
  position: Vec3;
  traceIndex: number;
  /** Arc length along its trace, used to detect a pulse passing through. */
  distance: number;
}

/** A via pad at every corner (and the far end) of every trace. */
export function collectVias(traces: CircuitTrace[]): Via[] {
  const vias: Via[] = [];
  traces.forEach((trace, traceIndex) => {
    for (let i = 1; i < trace.points.length; i++) {
      vias.push({
        position: trace.points[i],
        traceIndex,
        distance: trace.lengths[i],
      });
    }
  });
  return vias;
}
