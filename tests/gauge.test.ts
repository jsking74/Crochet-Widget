import { describe, it, expect } from 'vitest';
import { computeGridDimensions, defaultGaugeForYarn, finishedSizeInches } from '../src/core/grid/gauge';

describe('gauge', () => {
  it('derives row count from image aspect AND gauge ratio (not square pixels)', () => {
    // Square image, worsted SC gauge (4 sts/in, 4.5 rows/in).
    const gauge = { stitchesPerInch: 4, rowsPerInch: 4.5 };
    const dims = computeGridDimensions(100, 100, gauge, { widthStitches: 40 });
    expect(dims.widthStitches).toBe(40);
    // Square image -> finished square -> rows = widthStitches * 1 * (4.5/4) = 45.
    expect(dims.heightRows).toBe(45);
  });

  it('keeps the finished piece the same shape as the photo', () => {
    const gauge = { stitchesPerInch: 5, rowsPerInch: 6 };
    // 2:1 landscape image.
    const dims = computeGridDimensions(200, 100, gauge, { widthStitches: 60 });
    const { widthInches, heightInches } = finishedSizeInches(dims.widthStitches, dims.heightRows, gauge);
    // Finished aspect should match the image aspect (0.5) within rounding.
    expect(heightInches / widthInches).toBeCloseTo(0.5, 1);
  });

  it('size <-> dimensions round-trips within rounding', () => {
    const gauge = defaultGaugeForYarn('worsted', 'sc');
    const dims = computeGridDimensions(150, 100, gauge, { widthStitches: 75 });
    expect(dims.widthInches).toBeCloseTo(75 / gauge.stitchesPerInch, 5);
    expect(dims.heightInches).toBeCloseTo(dims.heightRows / gauge.rowsPerInch, 5);
  });

  it('taller stitch types reduce rows per inch', () => {
    const sc = defaultGaugeForYarn('worsted', 'sc');
    const dc = defaultGaugeForYarn('worsted', 'dc');
    expect(dc.rowsPerInch).toBeLessThan(sc.rowsPerInch);
  });
});
