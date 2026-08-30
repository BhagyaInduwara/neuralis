import { mulberry32 } from "./utils";

export interface DieBar {
  x: number;
  z: number;
  horizontal: boolean;
  length: number;
  active: boolean;
}

/** Deterministic maze-like grid of etched bars for the processor die surface. */
export function generateDiePattern(
  seed: number,
  gridSize: number,
  cellSize: number,
  activeChance = 0.16
): DieBar[] {
  const rand = mulberry32(seed);
  const bars: DieBar[] = [];
  const half = (gridSize * cellSize) / 2;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (rand() > 0.58) continue;

      const x = -half + col * cellSize + cellSize / 2;
      const z = -half + row * cellSize + cellSize / 2;
      const horizontal = rand() > 0.5;
      const length = cellSize * (0.55 + rand() * 0.4);
      const active = rand() < activeChance;

      bars.push({ x, z, horizontal, length, active });
    }
  }

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
