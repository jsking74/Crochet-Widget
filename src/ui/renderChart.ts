import type { Gauge, StitchGrid } from '../core/types';

export interface ChartRenderOptions {
  /** Base cell width in px. */
  cellSize: number;
  showGrid: boolean;
  showSymbols: boolean;
  showNumbers: boolean;
  /**
   * When true, cell height is scaled by the gauge so the chart shows the real
   * finished proportions (stitches aren't square). When false, square cells.
   */
  trueProportion: boolean;
  gauge: Gauge;
}

interface CellMetrics {
  cellW: number;
  cellH: number;
  margin: number;
  originX: number;
  originY: number;
  pixelWidth: number;
  pixelHeight: number;
}

function metrics(grid: StitchGrid, opts: ChartRenderOptions): CellMetrics {
  const cellW = opts.cellSize;
  const cellH = opts.trueProportion
    ? opts.cellSize * (opts.gauge.stitchesPerInch / opts.gauge.rowsPerInch)
    : opts.cellSize;
  const margin = opts.showNumbers ? Math.max(18, opts.cellSize * 1.4) : 0;
  return {
    cellW,
    cellH,
    margin,
    originX: margin,
    originY: 0,
    pixelWidth: margin + grid.width * cellW,
    pixelHeight: grid.height * cellH + margin,
  };
}

/** Draw the chart into a 2D context. Returns the total pixel size used. */
export function drawChart(
  ctx: CanvasRenderingContext2D,
  grid: StitchGrid,
  opts: ChartRenderOptions,
): { width: number; height: number } {
  const m = metrics(grid, opts);

  ctx.clearRect(0, 0, m.pixelWidth, m.pixelHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, m.pixelWidth, m.pixelHeight);

  // Cells.
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const color = grid.palette[grid.cells[y * grid.width + x]];
      if (!color) continue;
      const px = m.originX + x * m.cellW;
      const py = m.originY + y * m.cellH;
      ctx.fillStyle = color.hex;
      ctx.fillRect(px, py, m.cellW + 0.5, m.cellH + 0.5);

      if (opts.showSymbols && m.cellW >= 8) {
        ctx.fillStyle = luminance(color.r, color.g, color.b) > 140 ? '#000' : '#fff';
        ctx.font = `${Math.floor(Math.min(m.cellW, m.cellH) * 0.6)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.symbol, px + m.cellW / 2, py + m.cellH / 2);
      }
    }
  }

  // Grid lines.
  if (opts.showGrid && m.cellW >= 4) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= grid.width; x++) {
      const px = m.originX + x * m.cellW;
      ctx.moveTo(px, m.originY);
      ctx.lineTo(px, m.originY + grid.height * m.cellH);
    }
    for (let y = 0; y <= grid.height; y++) {
      const py = m.originY + y * m.cellH;
      ctx.moveTo(m.originX, py);
      ctx.lineTo(m.originX + grid.width * m.cellW, py);
    }
    ctx.stroke();

    // Heavier every 10 for counting.
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= grid.width; x += 10) {
      const px = m.originX + x * m.cellW;
      ctx.moveTo(px, m.originY);
      ctx.lineTo(px, m.originY + grid.height * m.cellH);
    }
    for (let y = 0; y <= grid.height; y += 10) {
      const py = m.originY + y * m.cellH;
      ctx.moveTo(m.originX, py);
      ctx.lineTo(m.originX + grid.width * m.cellW, py);
    }
    ctx.stroke();
  }

  // Numbers: columns along the top, crochet rows (bottom-up) on the left.
  if (opts.showNumbers) {
    ctx.fillStyle = '#334155';
    ctx.font = `${Math.max(9, Math.floor(opts.cellSize * 0.8))}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (let x = 0; x < grid.width; x += 5) {
      ctx.fillText(String(x + 1), m.originX + (x + 0.5) * m.cellW, m.pixelHeight - m.margin / 2);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y < grid.height; y += 5) {
      const rowNumber = grid.height - y; // bottom-up crochet numbering
      ctx.fillText(String(rowNumber), m.margin - 4, m.originY + (y + 0.5) * m.cellH);
    }
  }

  return { width: m.pixelWidth, height: m.pixelHeight };
}

/** Render into a (possibly offscreen) canvas, sizing it to fit. */
export function renderChartToCanvas(
  canvas: HTMLCanvasElement,
  grid: StitchGrid,
  opts: ChartRenderOptions,
): void {
  const m = metrics(grid, opts);
  canvas.width = Math.ceil(m.pixelWidth);
  canvas.height = Math.ceil(m.pixelHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawChart(ctx, grid, opts);
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
