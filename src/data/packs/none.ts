// Stand-in for bundled.ts in remote builds: no content in the browser.
import type { PackSpec } from '../types.ts';

export const BUNDLED: Record<string, () => Promise<{ default: PackSpec }>> = {};
