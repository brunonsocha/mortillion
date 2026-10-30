// Sessions, sign-in and purchases, talking to Supabase Auth (GoTrue),
// PostgREST and Edge Functions with plain fetch: no SDK in the bundle.
//
// Every player gets a silent *anonymous* account the first time they play, so
// the server can enforce quotas and one Daily Descent per day. Signing in
// with Google or email *links* to that same account (identity linking or
// email change), so nothing played before signing in is lost. Paid access is
// stored on the account and therefore persists across devices.

import { MOCK, SUPABASE_ANON_KEY, SUPABASE_URL } from './config.ts';

export interface Account {
  /** null while anonymous. */
  email: string | null;
  anonymous: boolean;
  /** Paid: a lifetime purchase or a live subscription. */
  fullAccess: boolean;
  displayName: string | null;
  /** ISO date a subscription renews, if any. */
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

/** The current account; null before the first session exists. */
export function currentAccount(): Account | null {
  return account;
}

/** Signed in with Google or email (not anonymous). */
export function signedIn(): boolean {
  return !!account && !account.anonymous;
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

export async function api(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
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

function storeTokens(j: { access_token: string; refresh_token: string; expires_in?: number }): Tokens {
  const t = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600) };
  write(TOKENS_KEY, t);
  return t;
}

/** Picks up tokens (or an error) Supabase put in the hash after OAuth / email links. */
function takeHash(): { tokens?: Tokens; error?: string } {
  const h = location.hash;
  if (!h.includes('access_token=') && !h.includes('error=')) return {};
  const p = new URLSearchParams(h.slice(1));
  // Hand the hash back to the router.
  history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  const error = p.get('error_description') ?? p.get('error') ?? undefined;
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return { error };
  return { tokens: storeTokens({ access_token, refresh_token, expires_in: Number(p.get('expires_in') ?? 3600) }) };
}

let refreshing: Promise<Tokens | null> | null = null;

/** A valid access token, refreshing it if it is about to expire. */
async function validTokens(): Promise<Tokens | null> {
  const t = read<Tokens>(TOKENS_KEY);
  if (!t) return null;
  if (t.expires_at - 60 > Date.now() / 1000) return t;
  refreshing ??= (async () => {
    const res = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: t.refresh_token }) });
    if (!res.ok) {
      write(TOKENS_KEY, null);
      return null;
    }
    return storeTokens(await res.json());
  })().finally(() => (refreshing = null));
  return refreshing;
}

/** A token for API calls, creating an anonymous account on first use. */
export async function sessionToken(): Promise<string> {
  const t = await validTokens();
  if (t) return t.access_token;
  const res = await api('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ data: {} }) });
  if (!res.ok) throw new Error(`anonymous sign-in ${res.status}`);
  const fresh = storeTokens(await res.json());
  void refreshAccount();
  return fresh.access_token;
}

async function loadAccount(): Promise<Account | null> {
  const t = await validTokens();
  if (!t) return null;
  const user = await api('/auth/v1/user', {}, t.access_token);
  if (!user.ok) return null;
  const u = await user.json();
  // RLS lets each player read only their own row.
  const prof = await api('/rest/v1/profiles?select=full_access,subscription_status,current_period_end,display_name&limit=1', {}, t.access_token);
  const row = prof.ok ? ((await prof.json()) as Record<string, unknown>[])[0] : undefined;
  const status = (row?.subscription_status as string | null) ?? null;
  return {
    email: u.email || null,
    anonymous: !!u.is_anonymous,
    fullAccess: !!row?.full_access || status === 'active' || status === 'trialing',
    displayName: (row?.display_name as string | null) ?? null,
    periodEnd: (row?.current_period_end as string | null) ?? null,
  };
}

export async function refreshAccount(): Promise<void> {
  if (MOCK) return setAccount(read<Account>(MOCK_KEY));
  setAccount(await loadAccount().catch(() => account));
}

/** Last sign-in problem to show the player (e.g. Google already linked elsewhere). */
export let authNotice: string | null = null;

export async function initAccount(): Promise<void> {
  if (MOCK) {
    setAccount(read<Account>(MOCK_KEY) ?? { email: null, anonymous: true, fullAccess: false, displayName: null, periodEnd: null });
    return;
  }
  const { error } = takeHash();
  if (error) {
    // Linking failed because that Google account already has its own
    // Mortillion account: sign into that one instead.
    if (/already/i.test(error) && sessionStorage.getItem('mortillion:linking') === 'google') {
      sessionStorage.removeItem('mortillion:linking');
      location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(returnUrl())}`;
      return;
    }
    authNotice = error;
  }
  sessionStorage.removeItem('mortillion:linking');
  await refreshAccount();
  // Back from Stripe Checkout: the webhook may land a moment after us.
  if (new URLSearchParams(location.search).get('checkout') === 'success') {
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
    for (let i = 0; i < 8 && account && !account.fullAccess; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      await refreshAccount();
    }
  }
}

/** Google: links to the current anonymous account, keeping its progress. */
export async function signInWithGoogle(): Promise<void> {
  if (MOCK) return mockSignIn('knight@gmail.com');
  const redirect = encodeURIComponent(returnUrl());
  const t = await validTokens();
  if (t && account?.anonymous) {
    const res = await api(`/auth/v1/user/identities/authorize?provider=google&redirect_to=${redirect}&skip_http_redirect=true`, {}, t.access_token);
    if (res.ok) {
      sessionStorage.setItem('mortillion:linking', 'google');
      location.href = (await res.json()).url;
      return;
    }
  }
  location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirect}`;
}

/**
 * Email: an anonymous player adds the address to their own account (a
 * confirmation link makes it permanent); if the address already belongs to
 * an account, a magic link signs into that one instead.
 */
export async function sendMagicLink(email: string): Promise<'linked' | 'magic'> {
  if (MOCK) {
    mockSignIn(email);
    return 'linked';
  }
  const redirect = encodeURIComponent(returnUrl());
  const t = await validTokens();
  if (t && account?.anonymous) {
    const res = await api(`/auth/v1/user?redirect_to=${redirect}`, { method: 'PUT', body: JSON.stringify({ email }) }, t.access_token);
    if (res.ok) {
      // Without email confirmation the account is permanent immediately.
      await refreshAccount();
      return 'linked';
    }
  }
  const res = await api(`/auth/v1/otp?redirect_to=${redirect}`, { method: 'POST', body: JSON.stringify({ email, create_user: true }) });
  if (!res.ok) throw new Error(`otp ${res.status}`);
  return 'magic';
}

export async function signOut(): Promise<void> {
  if (MOCK) {
    write(MOCK_KEY, null);
    return initAccount();
  }
  const t = read<Tokens>(TOKENS_KEY);
  write(TOKENS_KEY, null);
  setAccount(null);
  if (t) await api('/auth/v1/logout', { method: 'POST' }, t.access_token).catch(() => {});
}

function mockSignIn(email: string) {
  const a: Account = { email, anonymous: false, fullAccess: false, displayName: null, periodEnd: null };
  write(MOCK_KEY, a);
  setAccount(a);
}

export type Currency = 'pln' | 'eur';

/** Calls one of our Edge Functions and follows the Stripe URL it returns. */
async function goToStripe(fn: 'create-checkout' | 'customer-portal', currency?: Currency): Promise<void> {
  if (MOCK) {
    const a = { ...account!, fullAccess: fn === 'create-checkout' };
    write(MOCK_KEY, a);
    setAccount(a);
    return;
  }
  const token = await sessionToken();
  const res = await api(`/functions/v1/${fn}`, { method: 'POST', body: JSON.stringify({ currency }) }, token);
  if (!res.ok) throw new Error(`${fn} ${res.status}`);
  location.href = (await res.json()).url;
}

export const startCheckout = (currency: Currency) => goToStripe('create-checkout', currency);
export const openPortal = () => goToStripe('customer-portal');

/** Updates the local view after the player renames themselves. */
export function setDisplayName(name: string) {
  if (account) setAccount({ ...account, displayName: name });
}
