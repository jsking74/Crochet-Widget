import { jsPDF } from 'jspdf';
import type { Gauge, PatternResult } from '../core/types';
import { instructionsToText } from '../core/output/instructions';
import { renderChartToCanvas } from './renderChart';
import { finishedSizeInches } from '../core/grid/gauge';

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, '_') || 'pattern';
}

/** Render the chart to a fresh canvas at print resolution. */
function chartCanvas(result: PatternResult, gauge: Gauge, cellSize = 16): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  renderChartToCanvas(canvas, result.grid, {
    cellSize,
    showGrid: true,
    showSymbols: true,
    showNumbers: true,
    trueProportion: false,
    gauge,
  });
  return canvas;
}

export function exportPng(result: PatternResult, name: string): void {
  const canvas = chartCanvas(result, result.options.gauge, 18);
  canvas.toBlob((blob) => {
    if (blob) download(blob, `${safeName(name)}-chart.png`);
  }, 'image/png');
}

export function exportInstructionsText(result: PatternResult, name: string): void {
  const { widthInches, heightInches } = finishedSizeInches(
    result.grid.width,
    result.grid.height,
    result.options.gauge,
  );
  const header = [
    `${name}`,
    `Tapestry / single crochet`,
    `Grid: ${result.grid.width} sts × ${result.grid.height} rows`,
    `Finished: ${widthInches.toFixed(1)}" × ${heightInches.toFixed(1)}" at gauge ` +
      `${result.options.gauge.stitchesPerInch} sts/in, ${result.options.gauge.rowsPerInch} rows/in`,
    '',
    'Colors:',
    ...result.grid.palette.map(
      (c) => `  ${c.symbol}: ${c.yarn ? `${c.yarn.yarn.brand} ${c.yarn.yarn.colorName}` : c.hex}`,
    ),
    '',
    'Rows (worked bottom to top, turning each row):',
    '',
  ].join('\n');
  const body = instructionsToText(result.instructions, result.grid.palette);
  download(new Blob([header + body], { type: 'text/plain' }), `${safeName(name)}-instructions.txt`);
}

export function exportPdf(result: PatternResult, name: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const { widthInches, heightInches } = finishedSizeInches(
    result.grid.width,
    result.grid.height,
    result.options.gauge,
  );

  // Page 1: title + chart.
  doc.setFontSize(18);
  doc.text(name, margin, margin);
  doc.setFontSize(10);
  doc.text(
    [
      `Tapestry / single crochet · ${result.grid.width} sts × ${result.grid.height} rows`,
      `Finished ~${widthInches.toFixed(1)}" × ${heightInches.toFixed(1)}" · ` +
        `gauge ${result.options.gauge.stitchesPerInch} sts/in, ${result.options.gauge.rowsPerInch} rows/in`,
    ],
    margin,
    margin + 18,
  );

  const canvas = chartCanvas(result, result.options.gauge, 16);
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin - 90;
  const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
  doc.addImage(
    canvas.toDataURL('image/png'),
    'PNG',
    margin,
    margin + 60,
    canvas.width * scale,
    canvas.height * scale,
  );

  // Page 2: legend + yarn.
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Colors & yarn', margin, margin);
  doc.setFontSize(10);
  let y = margin + 24;
  for (const c of result.grid.palette) {
    doc.setFillColor(c.hex);
    doc.rect(margin, y - 9, 14, 12, 'F');
    const est = result.estimate.colors.find((e) => e.colorIndex === c.index);
    const yarnText = c.yarn ? `${c.yarn.yarn.brand} ${c.yarn.yarn.colorName}` : c.hex;
    const usage = est
      ? ` — ${est.stitchCount} sts, ~${est.yards} yd${est.skeins ? `, ${est.skeins} skein(s)` : ''}`
      : '';
    doc.text(`${c.symbol}  ${yarnText}${usage}`, margin + 22, y);
    y += 18;
    if (y > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }
  doc.setFontSize(8);
  doc.setTextColor(120);
  if (y < pageH - margin - 20) {
    doc.text('Yarn colors and yardage are estimates. Swatch and verify before buying.', margin, y + 6);
  }
  doc.setTextColor(0);

  // Instructions pages.
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Written instructions', margin, margin);
  doc.setFontSize(9);
  const text = instructionsToText(result.instructions, result.grid.palette);
  const lines = doc.splitTextToSize(text, pageW - margin * 2) as string[];
  let ty = margin + 22;
  const lineH = 12;
  for (const line of lines) {
    if (ty > pageH - margin) {
      doc.addPage();
      ty = margin;
    }
    doc.text(line, margin, ty);
    ty += lineH;
  }

  doc.save(`${safeName(name)}.pdf`);
}
