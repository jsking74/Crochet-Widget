import { describe, it, expect } from 'vitest';
import { downscaleArea } from '../src/core/image/downscale';
import { makeImage } from './helpers';

describe('downscaleArea', () => {
  it('produces exactly the requested dimensions', () => {
    const src = makeImage(100, 80, () => [10, 20, 30]);
    const out = downscaleArea(src, 25, 20);
    expect(out.width).toBe(25);
    expect(out.height).toBe(20);
    expect(out.data.length).toBe(25 * 20 * 4);
  });

  it('averages a half-black/half-white split toward gray when collapsed to 1px', () => {
    const src = makeImage(2, 1, (x) => (x === 0 ? [0, 0, 0] : [255, 255, 255]));
    const out = downscaleArea(src, 1, 1);
    // Equal area of black and white -> ~128.
    expect(out.data[0]).toBeGreaterThanOrEqual(126);
    expect(out.data[0]).toBeLessThanOrEqual(129);
  });

  it('preserves a solid color exactly', () => {
    const src = makeImage(40, 40, () => [12, 34, 56]);
    const out = downscaleArea(src, 8, 8);
    expect(Array.from(out.data.slice(0, 4))).toEqual([12, 34, 56, 255]);
  });
});
