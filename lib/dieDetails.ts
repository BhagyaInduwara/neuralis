import { mulberry32 } from "./utils";

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

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "core" | "cache" | "io";
}

/**
 * Paints the die surface onto two canvases: `color` holds the etched metal
 * structure (functional blocks, cache arrays, grid), `emissive` holds a
 * grayscale mask of the routing that glows (the material's amber emissive
 * colour is multiplied by it). The centre is left clear for the 3D emblem.
 */
export function paintDieCanvases(seed: number, size = 1024) {
  const rand = mulberry32(seed);
  const color = document.createElement("canvas");
  const emissive = document.createElement("canvas");
  color.width = color.height = emissive.width = emissive.height = size;
  const c = color.getContext("2d")!;
  const e = emissive.getContext("2d")!;
  const unit = size / 64;
  const centre = size / 2;
  const clearRadius = size * 0.15;

  c.fillStyle = "#0b0b0e";
  c.fillRect(0, 0, size, size);
  e.fillStyle = "#000";
  e.fillRect(0, 0, size, size);

  // Fine placement grid.
  c.strokeStyle = "rgba(255,255,255,0.035)";
  c.lineWidth = 1;
  for (let i = 0; i <= 64; i++) {
    const p = Math.round(i * unit) + 0.5;
    c.beginPath();
    c.moveTo(p, 0);
    c.lineTo(p, size);
    c.moveTo(0, p);
    c.lineTo(size, p);
    c.stroke();
  }

  // Floorplan: four core quadrants, cache strips between them, IO ring.
  const blocks: Block[] = [];
  const margin = 4;
  const q = 64 / 2;
  for (const [qx, qy] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]) {
    blocks.push({ x: margin + qx * q, y: margin + qy * q, w: q - margin * 2 - 6, h: q - margin * 2 - 8, kind: "core" });
    blocks.push({ x: margin + qx * q, y: qy * q + q - margin - 6, w: q - margin * 2 - 6, h: 4, kind: "cache" });
    blocks.push({ x: qx * q + q - margin - 4, y: margin + qy * q, w: 3, h: q - margin * 2, kind: "cache" });
  }
  for (let i = 0; i < 14; i++) {
    const along = 4 + i * 4.1;
    blocks.push({ x: along, y: 0.8, w: 2.4, h: 1.6, kind: "io" });
    blocks.push({ x: along, y: 61.6, w: 2.4, h: 1.6, kind: "io" });
    blocks.push({ x: 0.8, y: along, w: 1.6, h: 2.4, kind: "io" });
    blocks.push({ x: 61.6, y: along, w: 1.6, h: 2.4, kind: "io" });
  }

  const px = (v: number) => v * unit;

  blocks.forEach((b) => {
    const x = px(b.x);
    const y = px(b.y);
    const w = px(b.w);
    const h = px(b.h);

    if (b.kind === "core") {
      c.fillStyle = "#121318";
      c.fillRect(x, y, w, h);
      // Standard-cell rows.
      c.fillStyle = "rgba(255,255,255,0.05)";
      for (let row = y + 3; row < y + h - 2; row += 5) {
        let col = x + 2;
        while (col < x + w - 4) {
          const len = 4 + rand() * 22;
          c.fillRect(col, row, Math.min(len, x + w - 2 - col), 2);
          col += len + 2 + rand() * 4;
        }
      }
      // Sub-blocks (register files, ALUs).
      for (let s = 0; s < 4; s++) {
        const sw = w * (0.18 + rand() * 0.2);
        const sh = h * (0.14 + rand() * 0.18);
        const sx = x + rand() * (w - sw);
        const sy = y + rand() * (h - sh);
        c.fillStyle = "#17181e";
        c.fillRect(sx, sy, sw, sh);
        c.strokeStyle = "rgba(255,255,255,0.08)";
        c.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
        e.strokeStyle = "rgba(255,255,255,0.22)";
        e.lineWidth = 1;
        e.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      }
      c.strokeStyle = "rgba(255,255,255,0.12)";
      c.lineWidth = 1.5;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      e.strokeStyle = "rgba(255,255,255,0.35)";
      e.lineWidth = 1.5;
      e.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    } else if (b.kind === "cache") {
      c.fillStyle = "#15161b";
      c.fillRect(x, y, w, h);
      c.fillStyle = "rgba(255,255,255,0.07)";
      const horizontal = w > h;
      const step = 3;
      if (horizontal) {
        for (let yy = y + 1; yy < y + h; yy += step) c.fillRect(x, yy, w, 1);
      } else {
        for (let xx = x + 1; xx < x + w; xx += step) c.fillRect(xx, y, 1, h);
      }
    } else {
      c.fillStyle = "#3a2a14";
      c.fillRect(x, y, w, h);
      e.fillStyle = "rgba(255,255,255,0.55)";
      e.fillRect(x + 2, y + 2, w - 4, h - 4);
    }
  });

  // Global routing: orthogonal polylines between random points, most dim,
  // a few bright so the die reads as alive rather than uniformly lit.
  const routes = 90;
  for (let r = 0; r < routes; r++) {
    let x = Math.round(rand() * 60 + 2) * unit;
    let y = Math.round(rand() * 60 + 2) * unit;
    const bright = rand() < 0.22;
    e.strokeStyle = bright ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.28)";
    e.lineWidth = bright ? 2 : 1.25;
    e.beginPath();
    e.moveTo(x, y);
    const turns = 2 + Math.floor(rand() * 4);
    let horizontal = rand() < 0.5;
    for (let t = 0; t < turns; t++) {
      const len = (4 + rand() * 16) * unit * (rand() < 0.5 ? -1 : 1);
      if (horizontal) x = Math.min(size - 4, Math.max(4, x + len));
      else y = Math.min(size - 4, Math.max(4, y + len));
      e.lineTo(x, y);
      horizontal = !horizontal;
    }
    e.stroke();
    if (bright) {
      e.fillStyle = "#fff";
      e.fillRect(x - 2.5, y - 2.5, 5, 5);
    }
  }

  // Clear the emblem area on both maps and ring it with a fine guard band.
  for (const ctx of [c, e]) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centre, centre, clearRadius, 0, Math.PI * 2);
    ctx.fillStyle = ctx === c ? "#0a0a0d" : "#000";
    ctx.fill();
    ctx.restore();
  }
  e.strokeStyle = "rgba(255,255,255,0.4)";
  e.lineWidth = 1.5;
  e.beginPath();
  e.arc(centre, centre, clearRadius + 6, 0, Math.PI * 2);
  e.stroke();

  return { color, emissive };
}
