// Which themes exist. Local builds know from their bundled packs; remote
// builds ship no content, so the game server says.

import { callGame } from '../account/api.ts';
import { REMOTE } from '../account/config.ts';
import { THEMES } from '../data/packs/index.ts';

let cached: Promise<string[]> | null = null;

export function themeList(): Promise<string[]> {
  if (!REMOTE) return Promise.resolve(THEMES);
  cached ??= callGame<{ themes: string[] }>('catalog')
    .then((r) => r.themes)
    .catch((e) => {
      cached = null;
      throw e;
    });
  return cached;
}
