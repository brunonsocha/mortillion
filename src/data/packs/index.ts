import { buildPack } from '../../engine/match.ts';
import type { PackSpec, Prompt } from '../types.ts';

/** Themed packs shown in the catacombs, in display order. */
export const THEMES = ['sports', 'movies', 'geography', 'videogames'] as const;
/** Teased on the themes screen until their content exists. */
export const SEALED = ['music', 'history', 'science'] as const;

const modules = import.meta.glob<{ default: PackSpec }>(['./*.ts', '!./index.ts']);
const loaded = new Map<string, Promise<Prompt[]>>();

export function packIds(): string[] {
  return Object.keys(modules).map((p) => p.slice(2, -3));
}

export function loadPack(id: string): Promise<Prompt[]> {
  const mod = modules[`./${id}.ts`];
  if (!mod) return Promise.resolve([]);
  let p = loaded.get(id);
  if (!p) {
    p = mod().then((m) => buildPack(m.default));
    loaded.set(id, p);
  }
  return p;
}

/** Every prompt from every pack: the Daily Descent pool. */
export async function loadAll(): Promise<Prompt[]> {
  const packs = await Promise.all(packIds().map(loadPack));
  return packs.flat();
}
