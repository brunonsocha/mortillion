// Sign-in and subscription state, talking to Supabase Auth (GoTrue), PostgREST
// and two Edge Functions with plain fetch: no SDK in the bundle.
//
// Flow: magic link or Google OAuth → Supabase redirects back with tokens in
// the URL hash (implicit flow) → we store them, read the user's `profiles`
// row (subscription status written by the Stripe webhook) and notify the UI.

import { MOCK, SUPABASE_ANON_KEY, SUPABASE_URL } from './config.ts';

export interface Account {
  email: string;
  subscribed: boolean;
  /** ISO date the current paid period ends, if any. */
  periodEnd: string | null;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  /** Epoch seconds. */
  expires_at: number;
}

const TOKENS_KEY = 'mortillion:auth';
const MOCK_KEY = 'mortillion:mock-account';

let account: Account | null = null;
const listeners = new Set<(a: Account | null) => void>();

export function currentAccount(): Account | null {
  return account;
}

export function onAccountChange(fn: (a: Account | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setAccount(a: Account | null) {
  account = a;
  for (const fn of listeners) fn(a);
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the session lasts until reload.
  }
}

async function api(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('apikey', SUPABASE_ANON_KEY);
  headers.set('Authorization', `Bearer ${token ?? SUPABASE_ANON_KEY}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  return fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
}

/** Where auth providers send the player back to (the bonfire). */
function returnUrl(): string {
  return `${location.origin}${location.pathname}`;
}

/** Picks up tokens Supabase put in the hash after a magic link or OAuth. */
function takeTokensFromHash(): Tokens | null {
  if (!location.hash.includes('access_token=')) return null;
  const p = new URLSearchParams(location.hash.slice(1));
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  const expires_in = Number(p.get('expires_in') ?? 3600);
  // Hand the hash back to the router.
  history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  return { access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + expires_in };
}

async function validTokens(): Promise<Tokens | null> {
  const t = read<Tokens>(TOKENS_KEY);
  if (!t) return null;
  if (t.expires_at - 60 > Date.now() / 1000) return t;
  const res = await api('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: t.refresh_token }),
  });
  if (!res.ok) {
    write(TOKENS_KEY, null);
    return null;
  }
  const j = await res.json();
  const fresh: Tokens = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600) };
  write(TOKENS_KEY, fresh);
  return fresh;
}

async function loadAccount(): Promise<Account | null> {
  const t = await validTokens();
  if (!t) return null;
  const user = await api('/auth/v1/user', {}, t.access_token);
  if (!user.ok) return null;
  const { email } = await user.json();
  // RLS lets each user read only their own row.
  const prof = await api('/rest/v1/profiles?select=subscription_status,current_period_end&limit=1', {}, t.access_token);
  const row = prof.ok ? ((await prof.json()) as { subscription_status: string | null; current_period_end: string | null }[])[0] : undefined;
  const status = row?.subscription_status ?? null;
  return { email, subscribed: status === 'active' || status === 'trialing', periodEnd: row?.current_period_end ?? null };
}

export async function initAccount(): Promise<void> {
  if (MOCK) {
    setAccount(read<Account>(MOCK_KEY));
    return;
  }
  const fromHash = takeTokensFromHash();
  if (fromHash) write(TOKENS_KEY, fromHash);
  try {
    setAccount(await loadAccount());
  } catch {
    setAccount(null);
  }
  // Back from Stripe Checkout: the webhook may land a moment after us.
  if (new URLSearchParams(location.search).get('checkout') === 'success') {
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
    for (let i = 0; i < 6 && account && !account.subscribed; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      setAccount(await loadAccount().catch(() => account));
    }
  }
}

export async function sendMagicLink(email: string): Promise<void> {
  if (MOCK) {
    const a: Account = { email, subscribed: false, periodEnd: null };
    write(MOCK_KEY, a);
    setAccount(a);
    return;
  }
  const res = await api(`/auth/v1/otp?redirect_to=${encodeURIComponent(returnUrl())}`, {
    method: 'POST',
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!res.ok) throw new Error(`otp ${res.status}`);
}

export function signInWithGoogle(): void {
  location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(returnUrl())}`;
}

export async function signOut(): Promise<void> {
  if (MOCK) {
    write(MOCK_KEY, null);
    setAccount(null);
    return;
  }
  const t = read<Tokens>(TOKENS_KEY);
  write(TOKENS_KEY, null);
  setAccount(null);
  if (t) await api('/auth/v1/logout', { method: 'POST' }, t.access_token).catch(() => {});
}

/** Calls one of our Edge Functions and follows the Stripe URL it returns. */
async function goToStripe(fn: 'create-checkout' | 'customer-portal'): Promise<void> {
  if (MOCK) {
    const a = { ...account!, subscribed: fn === 'create-checkout', periodEnd: fn === 'create-checkout' ? new Date(Date.now() + 30 * 864e5).toISOString() : null };
    write(MOCK_KEY, a);
    setAccount(a);
    return;
  }
  const t = await validTokens();
  if (!t) throw new Error('not signed in');
  const res = await api(`/functions/v1/${fn}`, { method: 'POST', body: JSON.stringify({ returnUrl: returnUrl() }) }, t.access_token);
  if (!res.ok) throw new Error(`${fn} ${res.status}`);
  const { url } = await res.json();
  location.href = url;
}

export const startCheckout = () => goToStripe('create-checkout');
export const openPortal = () => goToStripe('customer-portal');
