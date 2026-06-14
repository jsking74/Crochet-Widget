import type { Gauge, GridDimensions, SizeSpec, StitchType, YarnWeight } from '../types';

/**
 * Gauge is the single source of truth for turning an image's aspect ratio into a
 * stitch grid whose *finished* proportions match the photo.
 *
 * The trap cheap tools fall into: treating one pixel as one square cell. Crochet
 * stitches are not square, so a square-pixel grid yields a vertically squashed or
 * stretched blanket. We instead resample vertical resolution from the gauge ratio
 * (rows/inch ÷ stitches/inch), which is always correct for the maker's own yarn,
 * hook, and tension.
 */

/**
 * Typical single-crochet gauges by yarn weight, as a sane starting point.
 * Users should swatch and override these — they are defaults, not gospel.
 * Values are (stitchesPerInch, rowsPerInch) for single crochet.
 */
const DEFAULT_SC_GAUGE: Record<YarnWeight, Gauge> = {
  lace: { stitchesPerInch: 8, rowsPerInch: 9 },
  fingering: { stitchesPerInch: 6, rowsPerInch: 7 },
  sport: { stitchesPerInch: 5.5, rowsPerInch: 6 },
  dk: { stitchesPerInch: 5, rowsPerInch: 5.5 },
  worsted: { stitchesPerInch: 4, rowsPerInch: 4.5 },
  aran: { stitchesPerInch: 3.5, rowsPerInch: 4 },
  bulky: { stitchesPerInch: 3, rowsPerInch: 3.25 },
};

/**
 * Stitch-type multipliers applied to the row gauge. Taller stitches mean fewer
 * rows per inch relative to single crochet. (Stitch width is roughly constant.)
 */
const ROW_HEIGHT_FACTOR: Record<StitchType, number> = {
  sc: 1, // baseline
  hdc: 1.4, // half-double is ~40% taller than single
  dc: 2, // double is ~2x the height of single
};

export function defaultGaugeForYarn(weight: YarnWeight, stitchType: StitchType = 'sc'): Gauge {
  const base = DEFAULT_SC_GAUGE[weight];
  return {
    stitchesPerInch: base.stitchesPerInch,
    rowsPerInch: base.rowsPerInch / ROW_HEIGHT_FACTOR[stitchType],
  };
}

/**
 * Given the source image's pixel dimensions and a target width in stitches,
 * compute the full grid dimensions. Height in rows is derived so the finished
 * piece keeps the image's real-world aspect ratio.
 *
 * Derivation:
 *   widthInches  = widthStitches / stitchesPerInch
 *   heightInches = widthInches * (imageHeight / imageWidth)   // same shape as photo
 *   heightRows   = round(heightInches * rowsPerInch)
 *             = round(widthStitches * (imageHeight/imageWidth) * (rowsPerInch/stitchesPerInch))
 */
export function computeGridDimensions(
  imageWidth: number,
  imageHeight: number,
  gauge: Gauge,
  size: SizeSpec,
): GridDimensions {
  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error('Image dimensions must be positive');
  }
  const widthStitches = Math.max(1, Math.round(size.widthStitches));
  const imageAspect = imageHeight / imageWidth;
  const gaugeRatio = gauge.rowsPerInch / gauge.stitchesPerInch;
  const heightRows = Math.max(1, Math.round(widthStitches * imageAspect * gaugeRatio));

  const widthInches = widthStitches / gauge.stitchesPerInch;
  const heightInches = heightRows / gauge.rowsPerInch;

  return { widthStitches, heightRows, widthInches, heightInches };
}

/** Convenience: physical finished size for an existing grid. */
export function finishedSizeInches(
  widthStitches: number,
  heightRows: number,
  gauge: Gauge,
): { widthInches: number; heightInches: number } {
  return {
    widthInches: widthStitches / gauge.stitchesPerInch,
    heightInches: heightRows / gauge.rowsPerInch,
  };
}
