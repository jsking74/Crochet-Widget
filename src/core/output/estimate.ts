import type { ColorEstimate, StitchGrid, StitchType, YarnEstimate, YarnWeight } from '../types';

/**
 * Yarn-usage estimate.
 *
 * This is genuinely an *estimate*: actual yardage depends on tension, color-change
 * tails, weave-in, and frogging. We compute it as
 *   yards = stitches × yardsPerStitch(weight, stitchType)
 * with a calibratable per-weight base table and a stitch-height multiplier. The UI
 * should present it as a buy-this-much guide, not a guarantee.
 */

/** Base yards per single-crochet stitch by yarn weight. Rough, calibratable. */
const SC_YARDS_PER_STITCH: Record<YarnWeight, number> = {
  lace: 0.03,
  fingering: 0.05,
  sport: 0.07,
  dk: 0.09,
  worsted: 0.13,
  aran: 0.16,
  bulky: 0.22,
};

/** Taller stitches consume more yarn per stitch. */
const STITCH_HEIGHT_FACTOR: Record<StitchType, number> = {
  sc: 1,
  hdc: 1.5,
  dc: 2,
};

export interface EstimateOptions {
  /** Override the per-stitch yardage entirely (e.g. from a real swatch). */
  yardsPerStitch?: number;
  /** Fudge factor for tails/weave-in/waste. Default 1.1 (+10%). */
  waste?: number;
}

export function yardsPerStitch(weight: YarnWeight, stitchType: StitchType): number {
  return SC_YARDS_PER_STITCH[weight] * STITCH_HEIGHT_FACTOR[stitchType];
}

export function buildEstimate(
  grid: StitchGrid,
  stitchType: StitchType,
  opts: EstimateOptions = {},
): YarnEstimate {
  const waste = opts.waste ?? 1.1;

  // Per-color stitch counts straight from the grid.
  const counts = new Map<number, number>();
  for (let i = 0; i < grid.cells.length; i++) {
    const idx = grid.cells[i];
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }

  const hasYarnData = grid.palette.some((c) => c.yarn);
  // Pick a representative weight for the per-stitch base (first matched yarn, else worsted).
  const weight: YarnWeight = grid.palette.find((c) => c.yarn)?.yarn?.yarn.weight ?? 'worsted';

  const colors: ColorEstimate[] = [];
  let totalStitches = 0;
  let totalYards = 0;

  for (const color of grid.palette) {
    const stitchCount = counts.get(color.index) ?? 0;
    if (stitchCount === 0) continue;
    const perStitch =
      opts.yardsPerStitch ?? yardsPerStitch(color.yarn?.yarn.weight ?? weight, stitchType);
    const yards = stitchCount * perStitch * waste;
    const estimate: ColorEstimate = {
      colorIndex: color.index,
      stitchCount,
      yards: round1(yards),
    };
    if (color.yarn) {
      estimate.skeins = Math.max(1, Math.ceil(yards / color.yarn.yarn.yardsPerSkein));
    }
    colors.push(estimate);
    totalStitches += stitchCount;
    totalYards += yards;
  }

  return {
    stitchType,
    totalStitches,
    totalYards: round1(totalYards),
    colors,
    hasYarnData,
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
