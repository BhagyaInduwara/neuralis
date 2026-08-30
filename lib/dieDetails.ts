import { mulberry32 } from "./utils";

export interface DieBar {
  x: number;
  z: number;
  horizontal: boolean;
  length: number;
  active: boolean;
}

/**
 * Deterministic etched micro-trace pattern for the processor die surface.
 * Rather than scattering independent random cells (which reads as confetti),
 * this walks each row/column and merges runs of filled cells into single
 * continuous strokes — the way real die metal layers run in dense parallel
 * lanes — then marks whole runs active together so glow reads as one trace,
 * not isolated dots.
 */
export function generateDiePattern(
  seed: number,
  gridSize: number,
  cellSize: number,
  activeChance = 0.14
): DieBar[] {
  const rand = mulberry32(seed);
  const bars: DieBar[] = [];
  const half = (gridSize * cellSize) / 2;
  const cellCenter = (i: number) => -half + i * cellSize + cellSize / 2;

  const layRuns = (horizontal: boolean, laneChance: number) => {
    for (let lane = 0; lane < gridSize; lane++) {
      if (rand() > laneChance) continue;

      let pos = 0;
      while (pos < gridSize) {
        // Gaps between runs keep the lane from reading as one solid bar.
        if (rand() < 0.3) {
          pos += 1 + Math.floor(rand() * 2);
          continue;
        }

        const runLength = 1 + Math.floor(rand() * 4);
        const span = Math.min(runLength, gridSize - pos);
        if (span < 1) break;

        const start = cellCenter(pos);
        const end = cellCenter(pos + span - 1);
        const center = (start + end) / 2;
        const length = end - start + cellSize * 0.62;
        const active = rand() < activeChance;

        bars.push({
          x: horizontal ? center : cellCenter(lane),
          z: horizontal ? cellCenter(lane) : center,
          horizontal,
          length,
          active,
        });

        pos += span;
      }
    }
  };

  layRuns(true, 0.85);
  layRuns(false, 0.6);

  return bars;
}

export interface PinPosition {
  x: number;
  z: number;
}

/** Deterministic BGA-style contact grid for the chip's underside. */
export function generatePinGrid(
  gridSize: number,
  spacing: number,
  cornerSkip = 2
): PinPosition[] {
  const pins: PinPosition[] = [];
  const half = (gridSize * spacing) / 2;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isCorner =
        (row < cornerSkip || row >= gridSize - cornerSkip) &&
        (col < cornerSkip || col >= gridSize - cornerSkip);
      if (isCorner) continue;

      const x = -half + col * spacing + spacing / 2;
      const z = -half + row * spacing + spacing / 2;
      pins.push({ x, z });
    }
  }

  return pins;
}
