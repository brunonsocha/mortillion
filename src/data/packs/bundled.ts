// The content packs bundled into the browser build (local / offline play).
// Remote builds alias this module to `none.ts` (see vite.config.ts), so not a
// single answer ships to the browser when the game server is in charge.
import type { PackSpec } from '../types.ts';

export const BUNDLED: Record<string, () => Promise<{ default: PackSpec }>> = import.meta.glob<{ default: PackSpec }>([
  './*.ts',
  '!./index.ts',
  '!./bundled.ts',
  '!./none.ts',
]);
