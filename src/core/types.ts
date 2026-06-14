/**
 * Shared types for the crochet pattern pipeline.
 *
 * Everything in `core/` is framework-agnostic pure TS so it can be unit-tested
 * with plain data and (later) reused server-side. The browser-only bits (canvas,
 * File) live at the edges (image/loadImage.ts) and produce these plain shapes.
 */

/** A raw RGBA bitmap — the same shape as the DOM `ImageData`, but dependency-free. */
export interface RgbaImage {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row-major. length === width * height * 4. */
  data: Uint8ClampedArray;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** One color in the reduced palette, plus how many stitches use it. */
export interface PaletteColor extends Rgb {
  /** Index into the palette array (stable identity used by the grid). */
  index: number;
  /** Hex string like "#1a2b3c". */
  hex: string;
  /** Number of grid cells assigned to this color (filled after confetti cleanup). */
  count: number;
  /** A short symbol (A, B, C…) for symbol-mode charts. */
  symbol: string;
  /** Matched real-world yarn, if a yarn database was applied. */
  yarn?: MatchedYarn;
}

/**
 * The stitch grid. Cells store palette indices, row-major, with row 0 = TOP of
 * the source image. Crochet row numbering (bottom-up) is derived in
 * output/instructions.ts; the grid itself stays in image orientation.
 */
export interface StitchGrid {
  width: number; // stitches across
  height: number; // rows
  /** width*height palette indices, row-major, row 0 = top. */
  cells: Int16Array;
  palette: PaletteColor[];
}

export type StitchType = 'sc' | 'hdc' | 'dc';

export interface Gauge {
  /** Stitches per inch (horizontal). */
  stitchesPerInch: number;
  /** Rows per inch (vertical). */
  rowsPerInch: number;
}

/** Standard Craft Yarn Council weight numbers we care about. */
export type YarnWeight = 'lace' | 'fingering' | 'sport' | 'dk' | 'worsted' | 'aran' | 'bulky';

export interface Yarn {
  id: string;
  brand: string;
  line: string;
  colorName: string;
  hex: string;
  weight: YarnWeight;
  /** Yards per skein/ball, for skein-count estimates. */
  yardsPerSkein: number;
}

export interface MatchedYarn {
  yarn: Yarn;
  /** CIEDE2000 perceptual distance between the palette color and the yarn (0 = identical). */
  deltaE: number;
}

export interface SizeSpec {
  /** Drives everything else; height is derived from image aspect + gauge. */
  widthStitches: number;
}

export interface PatternOptions {
  gauge: Gauge;
  size: SizeSpec;
  /** Target number of colors in the reduced palette. */
  colorCount: number;
  /** Floyd–Steinberg dithering. Off by default (dithering fights crochet). */
  dither: boolean;
  /** 0 = off … 4 = aggressive orphan-stitch removal. */
  confettiLevel: number;
  stitchType: StitchType;
  /** 'fast' = Wu quantization; 'high' = NeuQuant (slower, smoother). */
  quality: 'fast' | 'high';
}

export interface GridDimensions {
  widthStitches: number;
  heightRows: number;
  widthInches: number;
  heightInches: number;
}

export interface ColorRun {
  colorIndex: number;
  count: number;
}

export interface InstructionRow {
  /** 1-based crochet row number, counting from the bottom up. */
  rowNumber: number;
  /** Reading side: which direction this row is worked. */
  side: 'RS' | 'WS';
  runs: ColorRun[];
  totalStitches: number;
}

export interface WrittenInstructions {
  stitchType: StitchType;
  rows: InstructionRow[];
}

export interface ColorEstimate {
  colorIndex: number;
  stitchCount: number;
  /** Estimated yards of yarn for this color. */
  yards: number;
  /** Skeins to buy, if a yarn was matched (rounded up). */
  skeins?: number;
}

export interface YarnEstimate {
  stitchType: StitchType;
  totalStitches: number;
  totalYards: number;
  /** Per-color breakdown. */
  colors: ColorEstimate[];
  /** True when figures are derived from matched yarn yardage. */
  hasYarnData: boolean;
}

export interface PatternResult {
  grid: StitchGrid;
  dimensions: GridDimensions;
  instructions: WrittenInstructions;
  estimate: YarnEstimate;
  options: PatternOptions;
}
