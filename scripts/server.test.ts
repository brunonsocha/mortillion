// Integration tests for the `game` Edge Function against a local Supabase:
//   npx supabase start && npm run functions:sync && npx supabase functions serve --env-file supabase/functions/.env
//   npm run test:server
// Skips everything if the local stack isn't running.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { dayNumber } from '../src/engine/game.ts';

const API = 'http://127.0.0.1:54321';
let ANON = '';
let SERVICE = '';
let up = false;

before(async () => {
  try {
    const env = execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    ANON = env.match(/^ANON_KEY="(.+)"$/m)?.[1] ?? '';
    SERVICE = env.match(/^SERVICE_ROLE_KEY="(.+)"$/m)?.[1] ?? '';
    up = (await fetch(`${API}/auth/v1/health`, { headers: { apikey: ANON } })).ok;
  } catch {
    up = false;
  }
});

async function anonToken(): Promise<string> {
  const r = await fetch(`${API}/auth/v1/signup`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: '{"data":{}}' });
  return (await r.json()).access_token;
}

/** A confirmed email account, signed in: a "permanent" player. */
async function userToken(): Promise<{ token: string; id: string }> {
  const email = `knight${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;
  const admin = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };
  const created = await (await fetch(`${API}/auth/v1/admin/users`, { method: 'POST', headers: admin, body: JSON.stringify({ email, password: 'praise-the-sun', email_confirm: true }) })).json();
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'praise-the-sun' }) });
  return { token: (await r.json()).access_token, id: created.id };
}

async function sql(query: string) {
  execSync(`docker exec supabase_db_mortillion psql -U postgres -c "${query.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
}

async function game(token: string, body: Record<string, unknown>) {
  const r = await fetch(`${API}/functions/v1/game`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
}

/** Plays every remaining prompt of a run with the given guesses (cycled). */
async function playOut(token: string, runId: string, guesses: string[]) {
  let last;
  for (let i = 0; i < 400; i++) {
    const p = await game(token, { action: 'prompt', runId });
    if (p.status !== 200) break;
    const guess = guesses[i % guesses.length];
    last = (await game(token, { action: 'answer', runId, ...(guess ? { guess } : { giveUp: true }) })).body;
    if (last.finished) break;
  }
  return last;
}

test('anonymous players can play the daily, once per day', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const token = await anonToken();
  const day = dayNumber();
  const a = await game(token, { action: 'start', mode: 'daily', day });
  assert.equal(a.status, 200);
  assert.equal(a.body.total, 7);
  const again = await game(token, { action: 'start', mode: 'daily', day });
  assert.equal(again.body.runId, a.body.runId, 'restarting resumes the same run');
  const last = await playOut(token, a.body.runId, ['']);
  assert.equal(last.finished, true);
  const third = await game(token, { action: 'start', mode: 'daily', day });
  assert.equal(third.body.finished, true, 'a finished daily cannot be replayed');
  const far = await game(token, { action: 'start', mode: 'daily', day: day + 5 });
  assert.equal(far.status, 400, 'future days are refused');
});

test('a wrong guess asks for another; a right one scores; guesses are capped', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const token = await anonToken();
  const run = (await game(token, { action: 'start', mode: 'pack', pack: 'geography' })).body;
  const p = (await game(token, { action: 'prompt', runId: run.runId })).body;
  const wrong = (await game(token, { action: 'answer', runId: run.runId, guess: 'qqqq' })).body;
  assert.equal(wrong.retry, true);
  assert.equal(wrong.misses, 1);
  const again = (await game(token, { action: 'prompt', runId: run.runId })).body;
  assert.equal(again.idx, p.idx, 'still the same prompt');
  // Spam until the cap.
  let capped = 0;
  for (let i = 0; i < 30 && !capped; i++) {
    const r = await game(token, { action: 'answer', runId: run.runId, guess: `nope${i}` });
    if (r.status === 429) capped = i;
  }
  assert.ok(capped > 0, 'guessing is capped per prompt');
  const done = (await game(token, { action: 'answer', runId: run.runId, giveUp: true })).body;
  assert.equal(done.retry, false);
  assert.equal(done.tier, 0);
  assert.equal(done.cursor, 1, 'giving up moves on');
});

test('the server never sends answers before they are guessed', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const token = await anonToken();
  const run = (await game(token, { action: 'start', mode: 'pack', pack: 'geography' })).body;
  const p = (await game(token, { action: 'prompt', runId: run.runId })).body;
  assert.ok(p.q.en);
  assert.equal('answers' in p, false);
  assert.equal(JSON.stringify(p).includes('"tier"'), false);
});

test('three free runs, back 24 h after the third; full access lifts the limit', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const { token, id } = await userToken();
  for (let i = 0; i < 3; i++) assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'sports' })).status, 200);
  const fourth = await game(token, { action: 'start', mode: 'endless' });
  assert.equal(fourth.status, 402);
  assert.equal(fourth.body.error, 'quota');
  const wait = Date.parse(fourth.body.resetAt) - Date.now();
  assert.ok(wait > 23.9 * 3600e3 && wait <= 24 * 3600e3, `resets ~24 h after the third run (${wait} ms)`);
  // The daily is never limited.
  assert.equal((await game(token, { action: 'start', mode: 'daily', day: dayNumber() })).status, 200);
  // 24 h after the third run, the embers return.
  await sql(`update public.runs set created_at = created_at - interval '24 hours 1 minute' where user_id = '${id}' and free`);
  assert.equal((await game(token, { action: 'start', mode: 'endless' })).status, 200);
  await sql(`update public.profiles set full_access = true where id = '${id}'`);
  for (let i = 0; i < 4; i++) assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'movies' })).status, 200);
});

test('a partly used allowance lapses 24 h after its first run', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const { token, id } = await userToken();
  for (let i = 0; i < 2; i++) assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'music' })).status, 200);
  await sql(`update public.runs set created_at = created_at - interval '25 hours' where user_id = '${id}'`);
  for (let i = 0; i < 3; i++) assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'music' })).status, 200, `run ${i + 1} after the lapse`);
  assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'music' })).status, 402);
});

test('answers after 25 s (+grace) are refused, double submits rejected', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const token = await anonToken();
  const run = (await game(token, { action: 'start', mode: 'pack', pack: 'movies' })).body;
  await game(token, { action: 'prompt', runId: run.runId });
  await sql(`update public.runs set served_at = now() - interval '40 seconds' where id = '${run.runId}'`);
  const late = (await game(token, { action: 'answer', runId: run.runId, guess: 'Toy Story' })).body;
  assert.equal(late.timedOut, true);
  assert.equal(late.tier, 0);
  const dup = await game(token, { action: 'answer', runId: run.runId, guess: 'Toy Story' });
  assert.equal(dup.status, 409);
});

test('re-requesting a prompt does not restart its clock', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const token = await anonToken();
  const run = (await game(token, { action: 'start', mode: 'pack', pack: 'music' })).body;
  await game(token, { action: 'prompt', runId: run.runId });
  await new Promise((r) => setTimeout(r, 1200));
  const again = (await game(token, { action: 'prompt', runId: run.runId })).body;
  assert.ok(again.elapsedMs >= 1000, `elapsed ${again.elapsedMs}`);
});

test('endless ends when three flasks are spent', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const token = await anonToken();
  const run = (await game(token, { action: 'start', mode: 'endless' })).body;
  assert.equal(run.lives, 3);
  const last = await playOut(token, run.runId, ['']);
  assert.equal(last.finished, true);
  assert.equal(last.lives, 0);
  const st = (await game(token, { action: 'state', runId: run.runId })).body;
  assert.equal(st.turns.length, 3);
});

test('players cannot touch other players\' runs', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const a = await anonToken();
  const b = await anonToken();
  const run = (await game(a, { action: 'start', mode: 'pack', pack: 'history' })).body;
  assert.equal((await game(b, { action: 'prompt', runId: run.runId })).status, 404);
});

test('signed-in players earn achievements and reach the leaderboard; anonymous ones do not', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const { token } = await userToken();
  const anon = await anonToken();
  const day = dayNumber();
  const name = `Solaire ${Date.now() % 1e6}`;
  await game(token, { action: 'profile', displayName: name });
  const run = (await game(token, { action: 'start', mode: 'daily', day })).body;
  const last = await playOut(token, run.runId, ['']);
  assert.ok(last.unlocked.includes('first_descent'));
  assert.ok(last.unlocked.includes('hollowed'), 'seven deaths');
  const stats = (await game(token, { action: 'stats' })).body;
  assert.equal(stats.displayName, name);
  assert.ok(stats.achievements.some((a: { key: string }) => a.key === 'first_descent'));

  const anonRun = (await game(anon, { action: 'start', mode: 'daily', day })).body;
  await playOut(anon, anonRun.runId, ['']);
  const board = (await game(token, { action: 'leaderboard', board: 'daily', day })).body;
  assert.ok(board.top.some((r: { name: string; me: boolean }) => r.name === name && r.me));
  const anonProfile = await game(anon, { action: 'profile', displayName: 'Patches' });
  assert.equal(anonProfile.status, 403, 'anonymous players cannot set a name');
});

test('display names are validated', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const { token } = await userToken();
  assert.equal((await game(token, { action: 'profile', displayName: 'x' })).status, 400);
  assert.equal((await game(token, { action: 'profile', displayName: '<script>alert(1)</script>' })).status, 400);
  const name = `Siegward ${Date.now() % 1e6}`;
  assert.equal((await game(token, { action: 'profile', displayName: name })).status, 200);
  const other = await userToken();
  const taken = await game(other.token, { action: 'profile', displayName: name.toUpperCase() });
  assert.equal(taken.status, 409, 'names are unique, ignoring case');
  assert.equal(taken.body.error, 'name_taken');
});

/** Sends an event signed the way Stripe signs webhooks. */
async function webhook(event: Record<string, unknown>, secret = 'whsec_localtestsecret') {
  const { createHmac } = await import('node:crypto');
  const payload = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const r = await fetch(`${API}/functions/v1/stripe-webhook`, { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}`, 'Content-Type': 'application/json' }, body: payload });
  return r.status;
}

async function fullAccess(id: string): Promise<boolean> {
  const out = execSync(`docker exec supabase_db_mortillion psql -U postgres -tAc "select full_access from public.profiles where id = '${id}'"`, { encoding: 'utf8' });
  return out.trim() === 't';
}

test('a paid one-time checkout grants full access; a refund revokes it; bad signatures fail', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const { token, id } = await userToken();
  const session = { id: 'cs_test_1', object: 'checkout.session', mode: 'payment', payment_status: 'paid', client_reference_id: id, customer: `cus_test_${id.slice(0, 8)}`, currency: 'pln', metadata: { user_id: id } };
  assert.equal(await webhook({ id: 'evt_bad', type: 'checkout.session.completed', data: { object: session } }, 'whsec_wrong'), 400);
  assert.equal(await fullAccess(id), false);
  assert.equal(await webhook({ id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: session } }), 200);
  assert.equal(await fullAccess(id), true);
  // Paid players have no quota.
  for (let i = 0; i < 5; i++) assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'science' })).status, 200);
  const charge = { id: 'ch_test_1', object: 'charge', refunded: true, customer: session.customer };
  assert.equal(await webhook({ id: 'evt_2', object: 'event', type: 'charge.refunded', data: { object: charge } }), 200);
  assert.equal(await fullAccess(id), false);
});

test('a monthly subscription grants access while active and loses it when cancelled', async (t) => {
  if (!up) return t.skip('local Supabase stack is not running');
  const { token, id } = await userToken();
  const customer = `cus_sub_${id.slice(0, 8)}`;
  await sql(`update public.profiles set stripe_customer_id = '${customer}' where id = '${id}'`);
  const sub = (status: string) => ({ id: 'sub_test_1', object: 'subscription', status, customer, items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] } });
  for (let i = 0; i < 3; i++) await game(token, { action: 'start', mode: 'pack', pack: 'geography' });
  assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'geography' })).status, 402);
  assert.equal(await webhook({ id: 'evt_s1', object: 'event', type: 'customer.subscription.created', data: { object: sub('active') } }), 200);
  assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'geography' })).status, 200, 'active subscriber plays on');
  assert.equal(await webhook({ id: 'evt_s2', object: 'event', type: 'customer.subscription.deleted', data: { object: sub('canceled') } }), 200);
  assert.equal((await game(token, { action: 'start', mode: 'pack', pack: 'geography' })).status, 402, 'cancelled subscriber is back on the free quota');
});
