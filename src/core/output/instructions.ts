import type {
  ColorRun,
  InstructionRow,
  PaletteColor,
  StitchGrid,
  StitchType,
  WrittenInstructions,
} from '../types';

/**
 * Turn the stitch grid into written, row-by-row instructions.
 *
 * Two conventions matter for a tapestry/SC chart worked flat:
 *  - Rows are numbered from the BOTTOM up (row 1 is the first row you crochet),
 *    so crochet row `rn` maps to grid row `height - rn` (grid row 0 is the top).
 *  - Work is turned each row ("boustrophedon"): we read the chart right→left on
 *    right-side (odd) rows and left→right on wrong-side (even) rows. Consecutive
 *    same-color stitches are run-length encoded into "5 A, 3 B, …".
 *
 * `gridFromInstructions` is the exact inverse and exists so tests can prove the
 * encoding is lossless.
 */

export function buildInstructions(grid: StitchGrid, stitchType: StitchType): WrittenInstructions {
  const { width, height, cells } = grid;
  const rows: InstructionRow[] = [];

  for (let rn = 1; rn <= height; rn++) {
    const gridRow = height - rn;
    const rightToLeft = rn % 2 === 1; // odd rows = RS, read right→left
    const runs: ColorRun[] = [];

    const pushCell = (colorIndex: number) => {
      const last = runs[runs.length - 1];
      if (last && last.colorIndex === colorIndex) last.count++;
      else runs.push({ colorIndex, count: 1 });
    };

    if (rightToLeft) {
      for (let x = width - 1; x >= 0; x--) pushCell(cells[gridRow * width + x]);
    } else {
      for (let x = 0; x < width; x++) pushCell(cells[gridRow * width + x]);
    }

    rows.push({
      rowNumber: rn,
      side: rightToLeft ? 'RS' : 'WS',
      runs,
      totalStitches: width,
    });
  }

  return { stitchType, rows };
}

/** Exact inverse of buildInstructions — reconstructs the grid cells. */
export function gridFromInstructions(
  instructions: WrittenInstructions,
  width: number,
  height: number,
): Int16Array {
  const cells = new Int16Array(width * height);
  for (const row of instructions.rows) {
    const gridRow = height - row.rowNumber;
    const rightToLeft = row.side === 'RS';
    let x = rightToLeft ? width - 1 : 0;
    const step = rightToLeft ? -1 : 1;
    for (const run of row.runs) {
      for (let k = 0; k < run.count; k++) {
        cells[gridRow * width + x] = run.colorIndex;
        x += step;
      }
    }
  }
  return cells;
}

/** Human-readable text, one line per row, using palette symbols + color names. */
export function instructionsToText(
  instructions: WrittenInstructions,
  palette: PaletteColor[],
): string {
  const label = (i: number) => {
    const c = palette[i];
    if (!c) return `#${i}`;
    const name = c.yarn ? c.yarn.yarn.colorName : c.hex;
    return `${c.symbol} (${name})`;
  };
  const lines = instructions.rows.map((row) => {
    const runText = row.runs.map((r) => `${r.count} ${label(r.colorIndex)}`).join(', ');
    return `Row ${row.rowNumber} (${row.side}): ${runText} — ${row.totalStitches} sts`;
  });
  return lines.join('\n');
}
