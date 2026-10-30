// Account / payment configuration, read from Vite env vars at build time.
// With no Supabase keys the game runs fully local and free, with no account UI.

const env = import.meta.env;

export const SUPABASE_URL: string = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY ?? '';

/** Local fake backend for development and tests: any email "logs in". */
export const MOCK = env.VITE_ACCOUNTS_MOCK === '1';

export const ACCOUNTS_ENABLED = MOCK || Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Remote play: the game server deals prompts and judges answers, and the
 * answer banks are left out of the browser bundle entirely.
 */
export const REMOTE = !MOCK && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Free non-daily runs per day (the server enforces its own copy). */
export const FREE_RUNS_PER_DAY = Number(env.VITE_FREE_RUNS ?? 3) || 3;

/** Shown on the purchase buttons; the real price lives in Stripe. */
export const PRICE_LABEL = { pln: env.VITE_PRICE_PLN ?? '19,99 zł', eur: env.VITE_PRICE_EUR ?? '5 €' };

/** Copy only: whether the Stripe Price is a monthly subscription (default) or one-time. */
export const PURCHASE: 'one-time' | 'subscription' = env.VITE_PURCHASE === 'one-time' ? 'one-time' : 'subscription';

/** Show the Google button (needs the provider enabled in Supabase). */
export const GOOGLE_ENABLED = env.VITE_AUTH_GOOGLE !== '0';
