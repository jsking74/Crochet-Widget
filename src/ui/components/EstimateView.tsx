import { useStore } from '../../state/store';
import { finishedSizeInches } from '../../core/grid/gauge';

export function EstimateView() {
  const result = useStore((s) => s.result);
  if (!result) return null;

  const { widthInches, heightInches } = finishedSizeInches(
    result.grid.width,
    result.grid.height,
    result.options.gauge,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Grid" value={`${result.grid.width} × ${result.grid.height}`} />
        <Stat label="Finished" value={`${widthInches.toFixed(1)}" × ${heightInches.toFixed(1)}"`} />
        <Stat label="Stitches" value={result.estimate.totalStitches.toLocaleString()} />
        <Stat label="Total yarn" value={`~${result.estimate.totalYards.toLocaleString()} yd`} />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-400">
            <th className="py-1">Color</th>
            <th className="py-1">Stitches</th>
            <th className="py-1">Yards</th>
            <th className="py-1">Skeins</th>
          </tr>
        </thead>
        <tbody>
          {result.estimate.colors.map((e) => {
            const c = result.grid.palette[e.colorIndex];
            return (
              <tr key={e.colorIndex} className="border-t border-slate-100">
                <td className="flex items-center gap-2 py-1">
                  <span className="h-4 w-4 rounded" style={{ background: c?.hex }} />
                  {c?.yarn ? `${c.yarn.yarn.brand} ${c.yarn.yarn.colorName}` : c?.hex}
                </td>
                <td className="py-1">{e.stitchCount.toLocaleString()}</td>
                <td className="py-1">~{e.yards}</td>
                <td className="py-1">{e.skeins ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-[11px] leading-tight text-slate-400">
        Yardage and skein counts are estimates (includes a ~10% allowance for tails and weave-in).
        Yarn colors are approximate screen renderings of published color cards — swatch and verify
        before buying.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-semibold text-slate-800">{value}</div>
    </div>
  );
}
