import { describe, it, expect } from 'vitest';
import { matchYarn, matchPalette } from '../src/core/yarn/match';
import { getYarns, ALL_YARNS, YARN_LINES } from '../src/core/yarn/database';
import { makeGrid } from './helpers';

describe('yarn matching (CIEDE2000)', () => {
  it('loaded the seed yarn database', () => {
    expect(YARN_LINES.length).toBeGreaterThanOrEqual(3);
    expect(ALL_YARNS.length).toBeGreaterThan(50);
  });

  it('matches near-black to a black/charcoal yarn', () => {
    const m = matchYarn('#020202', getYarns('Red Heart', 'Super Saver'));
    expect(m).toBeDefined();
    expect(m!.yarn.colorName.toLowerCase()).toMatch(/black|charcoal/);
    expect(m!.deltaE).toBeLessThan(10);
  });

  it('matches a vivid red to a red-family yarn', () => {
    const m = matchYarn('#e01020', ALL_YARNS);
    expect(m).toBeDefined();
    expect(m!.yarn.colorName.toLowerCase()).toMatch(/red|scarlet|cherry|strawberry|hot/);
  });

  it('attaches a yarn to every palette color', () => {
    const grid = makeGrid([[0, 1]], [
      [10, 10, 10],
      [240, 240, 240],
    ]);
    const matched = matchPalette(grid.palette, getYarns('Caron', 'Simply Soft'));
    expect(matched.every((c) => c.yarn)).toBe(true);
  });
});
