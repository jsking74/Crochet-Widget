import type { PatternOptions, PatternResult, RgbaImage, StitchGrid, Yarn } from './types';
import { computeGridDimensions } from './grid/gauge';
import { downscaleArea } from './image/downscale';
import { quantize } from './color/quantize';
import { reduceConfetti } from './color/confetti';
import { finalizeGrid } from './output/chart';
import { matchPalette } from './yarn/match';
import { buildInstructions } from './output/instructions';
import { buildEstimate } from './output/estimate';

/**
 * The full image → crochet pattern pipeline, composed from the pure stages.
 * Order matters and mirrors docs/plan:
 *   gauge sizing → area downscale → quantize (CIEDE2000) → dither (optional)
 *   → confetti cleanup → finalize palette → yarn match → instructions + estimate.
 *
 * `image` should already be preprocessed (see image/preprocess.ts) and alpha-
 * flattened. Pass `yarns` to match the palette to a real yarn line; omit for a
 * generic-color pattern.
 */
export function generatePattern(
  image: RgbaImage,
  options: PatternOptions,
  yarns?: Yarn[],
): PatternResult {
  const dimensions = computeGridDimensions(image.width, image.height, options.gauge, options.size);

  const small = downscaleArea(image, dimensions.widthStitches, dimensions.heightRows);

  const quantized = quantize(small, {
    colorCount: options.colorCount,
    dither: options.dither,
    quality: options.quality,
  });

  const cleaned = reduceConfetti(
    quantized.cells,
    quantized.width,
    quantized.height,
    options.confettiLevel,
  );

  const finalized = finalizeGrid(cleaned, quantized.palette);
  const palette = yarns && yarns.length > 0 ? matchPalette(finalized.palette, yarns) : finalized.palette;

  const grid: StitchGrid = {
    width: dimensions.widthStitches,
    height: dimensions.heightRows,
    cells: finalized.cells,
    palette,
  };

  const instructions = buildInstructions(grid, options.stitchType);
  const estimate = buildEstimate(grid, options.stitchType);

  return { grid, dimensions, instructions, estimate, options };
}
