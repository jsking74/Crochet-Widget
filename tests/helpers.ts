import type { PaletteColor, RgbaImage, StitchGrid } from '../src/core/types';
import { toHex, symbolForIndex } from '../src/core/color/quantize';

/** Build an RgbaImage from a width/height and a per-pixel color function. */
export function makeImage(
  width: number,
  height: number,
  color: (x: number, y: number) => [number, number, number],
): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b] = color(x, y);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

/** A solid block image split into N vertical color bands. */
export function makeBands(width: number, height: number, bands: [number, number, number][]): RgbaImage {
  return makeImage(width, height, (x) => bands[Math.floor((x / width) * bands.length)]);
}

/** Build a StitchGrid from a 2D array of palette indices (row 0 = top). */
export function makeGrid(rows: number[][], colors: [number, number, number][]): StitchGrid {
  const height = rows.length;
  const width = rows[0].length;
  const cells = new Int16Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) cells[y * width + x] = rows[y][x];
  const palette: PaletteColor[] = colors.map(([r, g, b], index) => ({
    index,
    r,
    g,
    b,
    hex: toHex(r, g, b),
    count: 0,
    symbol: symbolForIndex(index),
  }));
  return { width, height, cells, palette };
}
