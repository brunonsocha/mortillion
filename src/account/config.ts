// Account / subscription configuration, read from Vite env vars at build time.
// With no Supabase keys the game runs fully free and no account UI appears.

const env = import.meta.env;

export const SUPABASE_URL: string = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY ?? '';

/** Local fake backend for development and tests: any email "logs in". */
export const MOCK = env.VITE_ACCOUNTS_MOCK === '1';

export const ACCOUNTS_ENABLED = MOCK || Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * What unlocks unlimited runs:
 * - 'login': any signed-in account;
 * - 'subscription': an active paid subscription (signing in alone keeps the free quota).
 */
export const GATE: 'login' | 'subscription' = env.VITE_GATE === 'login' ? 'login' : 'subscription';

/** Free non-daily runs per local day. The Daily Descent is always free. */
export const FREE_RUNS_PER_DAY = Number(env.VITE_FREE_RUNS ?? 3) || 3;

/** Show the Google button only when the provider is configured in Supabase. */
export const GOOGLE_ENABLED = env.VITE_AUTH_GOOGLE === '1';
