import {
  buildPaletteSync,
  applyPaletteSync,
  utils,
  type PaletteQuantization,
  type ImageQuantization,
} from 'image-q';
import type { PaletteColor, RgbaImage } from '../types';

export interface QuantizeOptions {
  colorCount: number;
  dither: boolean;
  quality: 'fast' | 'high';
}

export interface QuantizeResult {
  width: number;
  height: number;
  /** width*height palette indices, row-major. */
  cells: Int16Array;
  palette: PaletteColor[];
}

/**
 * Reduce an image to a small palette and return a grid of palette indices.
 *
 * Perceptual color is the whole game here: we run quantization *and* nearest-color
 * mapping in CIEDE2000 (Lab) distance, not RGB. RGB distance picks visibly wrong
 * yarns — two colors that are mathematically close in RGB can look nothing alike.
 *
 * - quality 'fast'  -> Wu's algorithm (variance-minimizing, median-cut family).
 * - quality 'high'  -> NeuQuant (neural, smoother gradients, slower).
 * - dither          -> Floyd–Steinberg error diffusion (off by default; dithering
 *                      creates confetti that is miserable to crochet).
 */
export function quantize(image: RgbaImage, opts: QuantizeOptions): QuantizeResult {
  const { width, height } = image;
  const pointContainer = utils.PointContainer.fromUint8Array(image.data, width, height);

  const paletteQuantization: PaletteQuantization = opts.quality === 'high' ? 'neuquant' : 'wuquant';
  const palette = buildPaletteSync([pointContainer], {
    colorDistanceFormula: 'ciede2000',
    paletteQuantization,
    colors: Math.max(2, Math.min(256, Math.round(opts.colorCount))),
  });

  const imageQuantization: ImageQuantization = opts.dither ? 'floyd-steinberg' : 'nearest';
  const applied = applyPaletteSync(pointContainer, palette, {
    colorDistanceFormula: 'ciede2000',
    imageQuantization,
  });

  // Build the palette array and a packed-RGB -> index lookup.
  const points = palette.getPointContainer().getPointArray();
  const paletteColors: PaletteColor[] = points.map((p, index) => ({
    index,
    r: p.r,
    g: p.g,
    b: p.b,
    hex: toHex(p.r, p.g, p.b),
    count: 0,
    symbol: symbolForIndex(index),
  }));

  const lookup = new Map<number, number>();
  for (const c of paletteColors) lookup.set(packRgb(c.r, c.g, c.b), c.index);

  // Map every output pixel back to its palette index.
  const out = applied.getPointArray();
  const cells = new Int16Array(width * height);
  for (let i = 0; i < cells.length; i++) {
    const p = out[i];
    const key = packRgb(p.r, p.g, p.b);
    let idx = lookup.get(key);
    if (idx === undefined) idx = nearestIndex(paletteColors, p.r, p.g, p.b);
    cells[i] = idx;
  }

  return { width, height, cells, palette: paletteColors };
}

function nearestIndex(palette: PaletteColor[], r: number, g: number, b: number): number {
  let best = 0;
  let bestD = Infinity;
  for (const c of palette) {
    const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c.index;
    }
  }
  return best;
}

function packRgb(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => (v & 0xff).toString(16).padStart(2, '0')).join('');
}

/** A, B, … Z, AA, AB, … for symbol-mode charts. */
export function symbolForIndex(index: number): string {
  let n = index;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}
