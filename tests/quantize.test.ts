import { describe, it, expect } from 'vitest';
import { quantize, symbolForIndex } from '../src/core/color/quantize';
import { makeBands } from './helpers';

describe('quantize', () => {
  const bands = makeBands(40, 10, [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
  ]);

  it('respects the requested color count', () => {
    const r = quantize(bands, { colorCount: 4, dither: false, quality: 'fast' });
    expect(r.palette.length).toBeLessThanOrEqual(4);
    expect(r.palette.length).toBeGreaterThan(0);
    expect(r.cells.length).toBe(40 * 10);
  });

  it('is deterministic across runs', () => {
    const opts = { colorCount: 4, dither: false, quality: 'fast' as const };
    const a = quantize(bands, opts);
    const b = quantize(bands, opts);
    expect(Array.from(a.cells)).toEqual(Array.from(b.cells));
    expect(a.palette.map((c) => c.hex)).toEqual(b.palette.map((c) => c.hex));
  });

  it('every cell references a valid palette index', () => {
    const r = quantize(bands, { colorCount: 4, dither: false, quality: 'fast' });
    for (let i = 0; i < r.cells.length; i++) {
      expect(r.cells[i]).toBeGreaterThanOrEqual(0);
      expect(r.cells[i]).toBeLessThan(r.palette.length);
    }
  });

  it('assigns spreadsheet-style symbols', () => {
    expect(symbolForIndex(0)).toBe('A');
    expect(symbolForIndex(25)).toBe('Z');
    expect(symbolForIndex(26)).toBe('AA');
  });
});
