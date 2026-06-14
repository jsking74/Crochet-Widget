import { describe, it, expect } from 'vitest';
import { buildInstructions, gridFromInstructions } from '../src/core/output/instructions';
import { makeGrid } from './helpers';

describe('written instructions', () => {
  const grid = makeGrid(
    [
      [0, 0, 1, 1],
      [0, 1, 1, 0],
      [2, 2, 0, 0],
    ],
    [
      [0, 0, 0],
      [255, 255, 255],
      [255, 0, 0],
    ],
  );

  it('numbers rows from the bottom and alternates RS/WS', () => {
    const ins = buildInstructions(grid, 'sc');
    expect(ins.rows.map((r) => r.rowNumber)).toEqual([1, 2, 3]);
    expect(ins.rows.map((r) => r.side)).toEqual(['RS', 'WS', 'RS']);
  });

  it('each row run-counts to the full width', () => {
    const ins = buildInstructions(grid, 'sc');
    for (const row of ins.rows) {
      const sum = row.runs.reduce((a, r) => a + r.count, 0);
      expect(sum).toBe(grid.width);
      expect(row.totalStitches).toBe(grid.width);
    }
  });

  it('round-trips: reconstructing the grid from instructions equals the source', () => {
    const ins = buildInstructions(grid, 'sc');
    const rebuilt = gridFromInstructions(ins, grid.width, grid.height);
    expect(Array.from(rebuilt)).toEqual(Array.from(grid.cells));
  });

  it('round-trips on a non-trivial random grid', () => {
    const rows: number[][] = [];
    let seed = 12345;
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 5);
    for (let y = 0; y < 17; y++) rows.push(Array.from({ length: 23 }, () => rand()));
    const g = makeGrid(
      rows,
      Array.from({ length: 5 }, (_, i) => [i * 40, i * 30, i * 20] as [number, number, number]),
    );
    const ins = buildInstructions(g, 'sc');
    const rebuilt = gridFromInstructions(ins, g.width, g.height);
    expect(Array.from(rebuilt)).toEqual(Array.from(g.cells));
  });
});
