import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/store';
import { renderChartToCanvas } from '../renderChart';

export function ChartView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const result = useStore((s) => s.result);
  const gauge = useStore((s) => s.options.gauge);

  const [cellSize, setCellSize] = useState(12);
  const [showGrid, setShowGrid] = useState(true);
  const [showSymbols, setShowSymbols] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const [trueProportion, setTrueProportion] = useState(false);

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    renderChartToCanvas(canvasRef.current, result.grid, {
      cellSize,
      showGrid,
      showSymbols,
      showNumbers,
      trueProportion,
      gauge,
    });
  }, [result, cellSize, showGrid, showSymbols, showNumbers, trueProportion, gauge]);

  if (!result) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          Zoom
          <input
            type="range"
            min={3}
            max={28}
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
            className="w-28"
          />
        </label>
        <Toggle label="Grid" checked={showGrid} onChange={setShowGrid} />
        <Toggle label="Symbols" checked={showSymbols} onChange={setShowSymbols} />
        <Toggle label="Numbers" checked={showNumbers} onChange={setShowNumbers} />
        <Toggle label="True proportion" checked={trueProportion} onChange={setTrueProportion} />
      </div>
      {trueProportion && (
        <p className="text-xs text-amber-600">
          Showing the real finished shape (cells scaled by gauge). Turn off for a square counting
          grid.
        </p>
      )}
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white p-2">
        <canvas ref={canvasRef} className="block" style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
