import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useStore } from '../../state/store';
import { loadImageFromFile } from '../../core/image/loadImage';
import { YARN_LINES, lineKey } from '../../core/yarn/database';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function ControlsPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { source, sourceName, options, preprocess, yarn, setSource, setOptions, setPreprocess, setYarn } =
    useStore();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const image = await loadImageFromFile(file);
    setSource(image, file.name);
  }

  const yarnValue = yarn ? lineKey(yarn.brand, yarn.line) : '';

  return (
    <div className="space-y-5">
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 px-4 py-6 text-sm font-medium text-violet-700 hover:bg-violet-100"
        >
          <Upload size={18} />
          {source ? 'Replace image' : 'Upload an image'}
        </button>
        {source && (
          <p className="mt-1 truncate text-xs text-slate-500">
            {sourceName} · {source.width}×{source.height}px
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pattern</h3>

        <Row label={`Width: ${options.size.widthStitches} stitches`}>
          <input
            type="range"
            min={20}
            max={200}
            value={options.size.widthStitches}
            onChange={(e) => setOptions({ size: { widthStitches: Number(e.target.value) } })}
          />
        </Row>

        <Row label={`Colors: ${options.colorCount}`}>
          <input
            type="range"
            min={2}
            max={24}
            value={options.colorCount}
            onChange={(e) => setOptions({ colorCount: Number(e.target.value) })}
          />
        </Row>

        <Row label={`Confetti reduction: ${options.confettiLevel}`}>
          <input
            type="range"
            min={0}
            max={4}
            value={options.confettiLevel}
            onChange={(e) => setOptions({ confettiLevel: Number(e.target.value) })}
          />
        </Row>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={options.dither}
              onChange={(e) => setOptions({ dither: e.target.checked })}
            />
            Dither
          </label>
          <Row label="Quality">
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={options.quality}
              onChange={(e) => setOptions({ quality: e.target.value as 'fast' | 'high' })}
            >
              <option value="fast">Fast</option>
              <option value="high">High</option>
            </select>
          </Row>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Yarn</h3>
        <Row label="Match to yarn line">
          <select
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={yarnValue}
            onChange={(e) => {
              const found = YARN_LINES.find((l) => lineKey(l.brand, l.line) === e.target.value);
              setYarn(found ? { brand: found.brand, line: found.line } : null);
            }}
          >
            <option value="">Generic colors (no yarn)</option>
            {YARN_LINES.map((l) => (
              <option key={lineKey(l.brand, l.line)} value={lineKey(l.brand, l.line)}>
                {l.brand} {l.line} ({l.count})
              </option>
            ))}
          </select>
        </Row>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gauge</h3>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Sts / inch">
            <input
              type="number"
              step={0.5}
              min={1}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={options.gauge.stitchesPerInch}
              onChange={(e) =>
                setOptions({ gauge: { ...options.gauge, stitchesPerInch: Number(e.target.value) } })
              }
            />
          </Row>
          <Row label="Rows / inch">
            <input
              type="number"
              step={0.5}
              min={1}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              value={options.gauge.rowsPerInch}
              onChange={(e) =>
                setOptions({ gauge: { ...options.gauge, rowsPerInch: Number(e.target.value) } })
              }
            />
          </Row>
        </div>
        <p className="text-[11px] leading-tight text-slate-400">
          Gauge sets the finished proportions — stitches aren't square, so this keeps your piece
          from coming out squashed.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Image</h3>
        <Row label={`Brightness: ${preprocess.brightness?.toFixed(2)}`}>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.01}
            value={preprocess.brightness}
            onChange={(e) => setPreprocess({ brightness: Number(e.target.value) })}
          />
        </Row>
        <Row label={`Contrast: ${preprocess.contrast?.toFixed(2)}`}>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.01}
            value={preprocess.contrast}
            onChange={(e) => setPreprocess({ contrast: Number(e.target.value) })}
          />
        </Row>
        <Row label={`Saturation: ${preprocess.saturation?.toFixed(2)}`}>
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={preprocess.saturation}
            onChange={(e) => setPreprocess({ saturation: Number(e.target.value) })}
          />
        </Row>
      </section>
    </div>
  );
}
