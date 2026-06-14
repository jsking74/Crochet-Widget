import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PatternOptions, RgbaImage } from '../core/types';
import type { PreprocessOptions } from '../core/image/preprocess';

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Structured-clonable raw image (typed array survives IndexedDB). */
  source: RgbaImage;
  sourceName: string;
  preprocess: PreprocessOptions;
  options: PatternOptions;
  yarn: { brand: string; line: string } | null;
}

interface CrochetDB extends DBSchema {
  projects: {
    key: string;
    value: SavedProject;
    indexes: { 'by-updated': number };
  };
}

let dbPromise: Promise<IDBPDatabase<CrochetDB>> | null = null;

function db(): Promise<IDBPDatabase<CrochetDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CrochetDB>('crochet-pattern-generator', 1, {
      upgrade(database) {
        const store = database.createObjectStore('projects', { keyPath: 'id' });
        store.createIndex('by-updated', 'updatedAt');
      },
    });
  }
  return dbPromise;
}

export async function putProject(project: SavedProject): Promise<void> {
  await (await db()).put('projects', project);
}

export async function listProjects(): Promise<SavedProject[]> {
  const all = await (await db()).getAllFromIndex('projects', 'by-updated');
  return all.reverse(); // newest first
}

export async function getProject(id: string): Promise<SavedProject | undefined> {
  return (await db()).get('projects', id);
}

export async function deleteProject(id: string): Promise<void> {
  await (await db()).delete('projects', id);
}
