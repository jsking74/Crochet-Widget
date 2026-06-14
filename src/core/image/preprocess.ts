import type { RgbaImage } from '../types';

export interface PreprocessOptions {
  /** -1 … 1, 0 = no change. */
  brightness?: number;
  /** -1 … 1, 0 = no change. */
  contrast?: number;
  /** 0 … 2, 1 = no change. 0 = grayscale, 2 = very saturated. */
  saturation?: number;
}

/**
 * Light tone adjustments applied *before* downscaling/quantization. Boosting
 * contrast and saturation often helps the quantizer pick cleaner, more
 * separable yarn colors out of a flat photo.
 *
 * Returns a new image; the input is not mutated.
 */
export function preprocess(src: RgbaImage, opts: PreprocessOptions): RgbaImage {
  const brightness = opts.brightness ?? 0;
  const contrast = opts.contrast ?? 0;
  const saturation = opts.saturation ?? 1;

  if (brightness === 0 && contrast === 0 && saturation === 1) {
    return { width: src.width, height: src.height, data: new Uint8ClampedArray(src.data) };
  }

  const out = new Uint8ClampedArray(src.data.length);
  // Standard contrast factor mapping (-1..1 -> steepness around mid-gray).
  const c = Math.tan(((contrast + 1) * Math.PI) / 4); // contrast=-1 -> 0, 0 -> 1, 1 -> inf-ish
  const bAdd = brightness * 255;

  for (let i = 0; i < src.data.length; i += 4) {
    let r = src.data[i];
    let g = src.data[i + 1];
    let b = src.data[i + 2];

    // Brightness.
    r += bAdd;
    g += bAdd;
    b += bAdd;

    // Contrast around mid-gray (128).
    r = (r - 128) * c + 128;
    g = (g - 128) * c + 128;
    b = (b - 128) * c + 128;

    // Saturation via luminance interpolation.
    if (saturation !== 1) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = lum + (r - lum) * saturation;
      g = lum + (g - lum) * saturation;
      b = lum + (b - lum) * saturation;
    }

    out[i] = clamp8(r);
    out[i + 1] = clamp8(g);
    out[i + 2] = clamp8(b);
    out[i + 3] = src.data[i + 3];
  }

  return { width: src.width, height: src.height, data: out };
}

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
