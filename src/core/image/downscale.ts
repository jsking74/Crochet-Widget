import type { RgbaImage } from '../types';

/**
 * Area-averaging (box) downscale to an exact target size.
 *
 * Why area averaging instead of nearest-neighbor: each stitch should represent
 * the *average* of the region it covers, so fine detail melts into a sensible
 * blended color rather than snapping to whichever single pixel happened to land
 * on the sample point. This is what makes the quantized result look like the
 * photo rather than like noise.
 *
 * Pixels straddling target-cell boundaries contribute fractional area weight, so
 * the result is stable as the grid size changes.
 */
export function downscaleArea(src: RgbaImage, dstWidth: number, dstHeight: number): RgbaImage {
  const dw = Math.max(1, Math.floor(dstWidth));
  const dh = Math.max(1, Math.floor(dstHeight));
  const { width: sw, height: sh, data: sd } = src;
  const out = new Uint8ClampedArray(dw * dh * 4);

  const scaleX = sw / dw;
  const scaleY = sh / dh;

  for (let dy = 0; dy < dh; dy++) {
    const sy0 = dy * scaleY;
    const sy1 = (dy + 1) * scaleY;
    const iy0 = Math.floor(sy0);
    const iy1 = Math.min(sh, Math.ceil(sy1));

    for (let dx = 0; dx < dw; dx++) {
      const sx0 = dx * scaleX;
      const sx1 = (dx + 1) * scaleX;
      const ix0 = Math.floor(sx0);
      const ix1 = Math.min(sw, Math.ceil(sx1));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let wsum = 0;

      for (let sy = iy0; sy < iy1; sy++) {
        const wy = Math.min(sy1, sy + 1) - Math.max(sy0, sy);
        if (wy <= 0) continue;
        for (let sx = ix0; sx < ix1; sx++) {
          const wx = Math.min(sx1, sx + 1) - Math.max(sx0, sx);
          if (wx <= 0) continue;
          const w = wx * wy;
          const si = (sy * sw + sx) * 4;
          r += sd[si] * w;
          g += sd[si + 1] * w;
          b += sd[si + 2] * w;
          a += sd[si + 3] * w;
          wsum += w;
        }
      }

      const di = (dy * dw + dx) * 4;
      if (wsum > 0) {
        out[di] = Math.round(r / wsum);
        out[di + 1] = Math.round(g / wsum);
        out[di + 2] = Math.round(b / wsum);
        out[di + 3] = Math.round(a / wsum);
      } else {
        out[di + 3] = 255;
      }
    }
  }

  return { width: dw, height: dh, data: out };
}
