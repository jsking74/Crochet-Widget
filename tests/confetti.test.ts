import { describe, it, expect } from 'vitest';
import { reduceConfetti } from '../src/core/color/confetti';

function grid(rows: number[][]): { cells: Int16Array; w: number; h: number } {
  const h = rows.length;
  const w = rows[0].length;
  const cells = new Int16Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells[y * w + x] = rows[y][x];
  return { cells, w, h };
}

describe('reduceConfetti', () => {
  it('is a no-op at level 0', () => {
    const { cells, w, h } = grid([
      [0, 0, 1],
      [0, 1, 0],
    ]);
    const out = reduceConfetti(cells, w, h, 0);
    expect(Array.from(out)).toEqual(Array.from(cells));
  });

  it('dissolves an isolated single stitch into its surrounding color', () => {
    // A lone "1" in a sea of "0".
    const { cells, w, h } = grid([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
    ]);
    const out = reduceConfetti(cells, w, h, 1);
    expect(Array.from(out).every((v) => v === 0)).toBe(true);
  });

  it('conserves the total number of cells (only recolors)', () => {
    const { cells, w, h } = grid([
      [0, 1, 0, 2, 0],
      [1, 0, 1, 0, 2],
      [0, 1, 0, 1, 0],
    ]);
    const out = reduceConfetti(cells, w, h, 3);
    expect(out.length).toBe(cells.length);
  });

  it('keeps a large block intact', () => {
    const { cells, w, h } = grid([
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]);
    const out = reduceConfetti(cells, w, h, 4);
    expect(Array.from(out).every((v) => v === 1)).toBe(true);
  });

  it('does not mutate the input array', () => {
    const { cells, w, h } = grid([
      [0, 1, 0],
      [0, 0, 0],
    ]);
    const before = Array.from(cells);
    reduceConfetti(cells, w, h, 2);
    expect(Array.from(cells)).toEqual(before);
  });
});
