import { create } from 'zustand';
import type { PatternOptions, PatternResult, RgbaImage } from '../core/types';
import { preprocess, type PreprocessOptions } from '../core/image/preprocess';
import { generatePattern } from '../core/pipeline';
import { getYarns } from '../core/yarn/database';
import { defaultGaugeForYarn } from '../core/grid/gauge';
import {
  deleteProject,
  getProject,
  listProjects,
  putProject,
  type SavedProject,
} from './db';

export interface YarnSelection {
  brand: string;
  line: string;
}

interface AppState {
  source: RgbaImage | null;
  sourceName: string;
  preprocess: PreprocessOptions;
  options: PatternOptions;
  yarn: YarnSelection | null;

  result: PatternResult | null;
  generating: boolean;
  error: string | null;

  projectId: string | null;
  projectName: string;
  projects: SavedProject[];

  setSource: (image: RgbaImage, name: string) => void;
  setPreprocess: (patch: Partial<PreprocessOptions>) => void;
  setOptions: (patch: Partial<PatternOptions>) => void;
  setProjectName: (name: string) => void;
  setYarn: (yarn: YarnSelection | null) => void;
  regenerate: () => void;
  refreshProjects: () => Promise<void>;
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  newProject: () => void;
}

export const DEFAULT_OPTIONS: PatternOptions = {
  gauge: defaultGaugeForYarn('worsted', 'sc'),
  size: { widthStitches: 50 },
  colorCount: 10,
  dither: false,
  confettiLevel: 2,
  stitchType: 'sc',
  quality: 'fast',
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>((set, get) => ({
  source: null,
  sourceName: '',
  preprocess: { brightness: 0, contrast: 0, saturation: 1 },
  options: DEFAULT_OPTIONS,
  yarn: null,

  result: null,
  generating: false,
  error: null,

  projectId: null,
  projectName: 'Untitled pattern',
  projects: [],

  setSource: (image, name) => {
    set({ source: image, sourceName: name });
    get().regenerate();
  },

  setPreprocess: (patch) => {
    set((s) => ({ preprocess: { ...s.preprocess, ...patch } }));
    get().regenerate();
  },

  setOptions: (patch) => {
    set((s) => ({ options: { ...s.options, ...patch } }));
    get().regenerate();
  },

  setProjectName: (name) => set({ projectName: name }),

  setYarn: (yarn) => {
    set({ yarn });
    get().regenerate();
  },

  regenerate: () => {
    const { source } = get();
    if (!source) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    set({ generating: true, error: null });
    debounceTimer = setTimeout(() => {
      const { source: src, preprocess: pp, options, yarn } = get();
      if (!src) return;
      try {
        const prepared = preprocess(src, pp);
        const yarns = yarn ? getYarns(yarn.brand, yarn.line) : undefined;
        const result = generatePattern(prepared, options, yarns);
        set({ result, generating: false });
      } catch (err) {
        set({ generating: false, error: err instanceof Error ? err.message : String(err) });
      }
    }, 250);
  },

  refreshProjects: async () => set({ projects: await listProjects() }),

  saveProject: async () => {
    const s = get();
    if (!s.source) return;
    const now = Date.now();
    const id = s.projectId ?? crypto.randomUUID();
    const project: SavedProject = {
      id,
      name: s.projectName || 'Untitled pattern',
      createdAt: now,
      updatedAt: now,
      source: s.source,
      sourceName: s.sourceName,
      preprocess: s.preprocess,
      options: s.options,
      yarn: s.yarn,
    };
    await putProject(project);
    set({ projectId: id });
    await get().refreshProjects();
  },

  loadProject: async (id) => {
    const project = await getProject(id);
    if (!project) return;
    set({
      projectId: project.id,
      projectName: project.name,
      source: project.source,
      sourceName: project.sourceName,
      preprocess: project.preprocess,
      options: project.options,
      yarn: project.yarn,
    });
    get().regenerate();
  },

  removeProject: async (id) => {
    await deleteProject(id);
    if (get().projectId === id) get().newProject();
    await get().refreshProjects();
  },

  newProject: () =>
    set({
      projectId: null,
      projectName: 'Untitled pattern',
      source: null,
      sourceName: '',
      preprocess: { brightness: 0, contrast: 0, saturation: 1 },
      options: DEFAULT_OPTIONS,
      yarn: null,
      result: null,
      error: null,
    }),
}));
