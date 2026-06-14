import type { PaletteColor } from '../types';
import { symbolForIndex } from '../color/quantize';

export interface FinalizedGrid {
  cells: Int16Array;
  palette: PaletteColor[];
}

/**
 * After quantization + confetti cleanup, some palette colors may be unused (their
 * stitches got dissolved). This compacts the palette to only the colors actually
 * present, reindexes the grid, refreshes per-color counts, and reassigns symbols
 * (A, B, C…) in palette order so the chart legend is clean.
 */
export function finalizeGrid(cells: Int16Array, palette: PaletteColor[]): FinalizedGrid {
  const counts = new Map<number, number>();
  for (let i = 0; i < cells.length; i++) counts.set(cells[i], (counts.get(cells[i]) ?? 0) + 1);

  // Keep used colors in their original order; build old->new index map.
  const remap = new Map<number, number>();
  const newPalette: PaletteColor[] = [];
  for (const color of palette) {
    const count = counts.get(color.index) ?? 0;
    if (count === 0) continue;
    const newIndex = newPalette.length;
    remap.set(color.index, newIndex);
    newPalette.push({
      ...color,
      index: newIndex,
      count,
      symbol: symbolForIndex(newIndex),
    });
  }

  const newCells = new Int16Array(cells.length);
  for (let i = 0; i < cells.length; i++) newCells[i] = remap.get(cells[i]) ?? 0;

  return { cells: newCells, palette: newPalette };
}
