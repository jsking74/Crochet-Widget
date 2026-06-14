import { useStore } from '../../state/store';

export function PaletteLegend() {
  const result = useStore((s) => s.result);
  if (!result) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700">
        Palette ({result.grid.palette.length} colors)
      </h3>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {result.grid.palette.map((c) => (
          <li key={c.index} className="flex items-center gap-2 rounded border border-slate-200 bg-white p-1.5">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded text-[11px] font-bold"
              style={{ background: c.hex, color: luminance(c) > 140 ? '#000' : '#fff' }}
            >
              {c.symbol}
            </span>
            <div className="min-w-0 text-xs">
              {c.yarn ? (
                <>
                  <div className="truncate font-medium text-slate-800">{c.yarn.yarn.colorName}</div>
                  <div className="truncate text-slate-500">
                    {c.yarn.yarn.brand} {c.yarn.yarn.line} · ΔE {c.yarn.deltaE.toFixed(1)}
                  </div>
                </>
              ) : (
                <div className="font-mono text-slate-600">{c.hex}</div>
              )}
              <div className="text-slate-400">{c.count} sts</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function luminance(c: { r: number; g: number; b: number }): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}
