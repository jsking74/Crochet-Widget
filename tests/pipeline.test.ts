import { describe, it, expect } from 'vitest';
import { generatePattern } from '../src/core/pipeline';
import { gridFromInstructions } from '../src/core/output/instructions';
import { getYarns } from '../src/core/yarn/database';
import { defaultGaugeForYarn } from '../src/core/grid/gauge';
import { makeBands } from './helpers';
import type { PatternOptions } from '../src/core/types';

describe('generatePattern (end-to-end)', () => {
  const image = makeBands(120, 90, [
    [220, 30, 30],
    [30, 180, 60],
    [40, 60, 200],
  ]);

  const options: PatternOptions = {
    gauge: defaultGaugeForYarn('worsted', 'sc'),
    size: { widthStitches: 48 },
    colorCount: 6,
    dither: false,
    confettiLevel: 2,
    stitchType: 'sc',
    quality: 'fast',
  };

  it('produces a grid sized to the gauge + image aspect', () => {
    const result = generatePattern(image, options);
    expect(result.grid.width).toBe(48);
    expect(result.dimensions.heightRows).toBe(result.grid.height);
    expect(result.grid.cells.length).toBe(result.grid.width * result.grid.height);
  });

  it('reduces to at most the requested colors and only keeps used ones', () => {
    const result = generatePattern(image, options);
    expect(result.grid.palette.length).toBeLessThanOrEqual(6);
    for (const c of result.grid.palette) expect(c.count).toBeGreaterThan(0);
  });

  it('instructions round-trip back to the grid', () => {
    const result = generatePattern(image, options);
    const rebuilt = gridFromInstructions(result.instructions, result.grid.width, result.grid.height);
    expect(Array.from(rebuilt)).toEqual(Array.from(result.grid.cells));
  });

  it('estimate totals are consistent with the grid', () => {
    const result = generatePattern(image, options);
    expect(result.estimate.totalStitches).toBe(result.grid.width * result.grid.height);
    const perColorSum = result.estimate.colors.reduce((a, c) => a + c.stitchCount, 0);
    expect(perColorSum).toBe(result.estimate.totalStitches);
  });

  it('with a yarn line, every color gets a yarn + skein count', () => {
    const result = generatePattern(image, options, getYarns('Red Heart', 'Super Saver'));
    expect(result.estimate.hasYarnData).toBe(true);
    expect(result.grid.palette.every((c) => c.yarn)).toBe(true);
    expect(result.estimate.colors.every((c) => (c.skeins ?? 0) >= 1)).toBe(true);
  });
});
