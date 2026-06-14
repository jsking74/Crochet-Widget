import { useStore } from '../../state/store';

export function InstructionsView() {
  const result = useStore((s) => s.result);
  if (!result) return null;

  const label = (i: number) => {
    const c = result.grid.palette[i];
    return c?.yarn ? c.yarn.yarn.colorName : c?.hex ?? `#${i}`;
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        Worked bottom to top in single crochet, turning each row. RS rows read right→left, WS rows
        left→right.
      </p>
      <ol className="space-y-1 font-mono text-xs">
        {result.instructions.rows.map((row) => (
          <li key={row.rowNumber} className="rounded bg-white px-2 py-1">
            <span className="font-semibold text-slate-500">
              Row {row.rowNumber} ({row.side}):
            </span>{' '}
            {row.runs.map((run, i) => {
              const c = result.grid.palette[run.colorIndex];
              return (
                <span key={i}>
                  {i > 0 && ', '}
                  <span
                    className="inline-block h-2.5 w-2.5 translate-y-0.5 rounded-sm"
                    style={{ background: c?.hex }}
                  />{' '}
                  {run.count} {label(run.colorIndex)}
                </span>
              );
            })}
            <span className="text-slate-400"> — {row.totalStitches} sts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
