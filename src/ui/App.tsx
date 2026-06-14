import { useState } from 'react';
import { Loader2, Image as ImageIcon, FileDown, FileText, FileType } from 'lucide-react';
import { useStore } from '../state/store';
import { ControlsPanel } from './components/ControlsPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { ChartView } from './components/ChartView';
import { PaletteLegend } from './components/PaletteLegend';
import { InstructionsView } from './components/InstructionsView';
import { EstimateView } from './components/EstimateView';
import { exportPng, exportPdf, exportInstructionsText } from './export';

type Tab = 'chart' | 'instructions' | 'yarn';

export function App() {
  const { result, generating, error, source, projectName } = useStore();
  const [tab, setTab] = useState<Tab>('chart');

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-violet-700">🧶 Crochet Pattern Generator</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
            tapestry / single crochet
          </span>
        </div>
        {result && (
          <div className="flex gap-2">
            <ExportButton onClick={() => exportPng(result, projectName)} icon={<FileDown size={15} />}>
              PNG
            </ExportButton>
            <ExportButton
              onClick={() => exportInstructionsText(result, projectName)}
              icon={<FileText size={15} />}
            >
              Text
            </ExportButton>
            <ExportButton onClick={() => exportPdf(result, projectName)} icon={<FileType size={15} />}>
              PDF
            </ExportButton>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-80 flex-none space-y-6 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
          <ControlsPanel />
          <hr className="border-slate-200" />
          <ProjectsPanel />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          {!source ? (
            <EmptyState />
          ) : (
            <>
              <nav className="mb-4 flex gap-1 border-b border-slate-200">
                <TabButton active={tab === 'chart'} onClick={() => setTab('chart')}>
                  Chart
                </TabButton>
                <TabButton active={tab === 'instructions'} onClick={() => setTab('instructions')}>
                  Instructions
                </TabButton>
                <TabButton active={tab === 'yarn'} onClick={() => setTab('yarn')}>
                  Yarn & estimate
                </TabButton>
                {generating && (
                  <span className="ml-auto flex items-center gap-1.5 px-2 text-sm text-slate-400">
                    <Loader2 size={14} className="animate-spin" /> Generating…
                  </span>
                )}
              </nav>

              {error && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!result ? (
                <p className="text-sm text-slate-400">Adjust settings to generate a pattern…</p>
              ) : tab === 'chart' ? (
                <div className="space-y-6">
                  <ChartView />
                  <PaletteLegend />
                </div>
              ) : tab === 'instructions' ? (
                <InstructionsView />
              ) : (
                <EstimateView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
      <ImageIcon size={48} strokeWidth={1.2} />
      <p className="mt-3 max-w-sm text-sm">
        Upload an image to turn it into a single-crochet tapestry chart with written instructions and
        a yarn shopping list. Clear, high-contrast photos work best.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
        active
          ? 'border-violet-600 text-violet-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function ExportButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {icon}
      {children}
    </button>
  );
}
