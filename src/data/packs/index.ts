import { buildPack } from '../../engine/match.ts';
import type { PackSpec, Prompt } from '../types.ts';

/**
 * Themes in display order. A theme is playable as soon as its pack file
 * exists; the rest are teased as sealed. `general` only feeds the daily.
 */
const THEME_ORDER = ['sports', 'movies', 'geography', 'videogames', 'music', 'history', 'science', 'literature', 'art', 'food'];

const modules = import.meta.glob<{ default: PackSpec }>(['./*.ts', '!./index.ts']);

export const THEMES = THEME_ORDER.filter((id) => `./${id}.ts` in modules);
export const SEALED = THEME_ORDER.filter((id) => !(`./${id}.ts` in modules));
const loaded = new Map<string, Promise<Prompt[]>>();

export function packIds(): string[] {
  return Object.keys(modules).map((p) => p.slice(2, -3));
}

export function loadPack(id: string): Promise<Prompt[]> {
  const mod = modules[`./${id}.ts`];
  if (!mod) return Promise.resolve([]);
  let p = loaded.get(id);
  if (!p) {
    p = mod()
      .then((m) => buildPack(m.default))
      .catch((e: unknown) => {
        // Forget the failure (offline, or a stale tab after a deploy) so a
        // later attempt can succeed.
        loaded.delete(id);
        throw e;
      });
    loaded.set(id, p);
  }
  return p;
}

/** Every prompt from every pack: the Daily Descent pool. */
export async function loadAll(): Promise<Prompt[]> {
  const packs = await Promise.all(packIds().map(loadPack));
  return packs.flat();
}
