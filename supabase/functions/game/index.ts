// The authoritative game server. The answer banks live only here; the browser
// sees one question at a time, sends a guess, and gets back the verdict. That
// enforces the free-run quota, the 25-second limit and one Daily Descent per
// player per day, and makes leaderboards and achievements trustworthy.
//
// POST /functions/v1/game  { action, ... }  with the player's JWT (anonymous
// players have one too). Actions: start, prompt, answer, state, stats,
// leaderboard, profile.

import type { User } from 'npm:@supabase/supabase-js@2.49.4';
import { admin, cors, hasFullAccess, json, playerFrom } from '../_supabase.ts';
import { SPECS, THEMES } from '../_game/packs.ts';
import { buildPack, findAnswer } from '../_game/engine/match.ts';
import {
  PROMPTS_PER_RUN, SECONDS_PER_PROMPT, TIER_POINTS, byDifficulty, dailyPrompts, dayNumber, endlessDealer, rng, shuffle,
} from '../_game/engine/game.ts';
import type { Answer, L10n, Prompt, Tier } from '../_game/data/types.ts';
import { earnedKeys, type PlayerStats } from '../_game/achievements.ts';

const ALL: Prompt[] = SPECS.flatMap(buildPack);
const BY_ID = new Map(ALL.map((p) => [p.id, p]));
const BY_PACK = new Map<string, Prompt[]>();
for (const p of ALL) BY_PACK.set(p.pack, [...(BY_PACK.get(p.pack) ?? []), p]);

const FREE_RUNS = Number(Deno.env.get('FREE_RUNS_PER_DAY') ?? 3);
/** Network latency allowance on top of the 25 s the player sees. */
const GRACE_MS = 3000;
const ENDLESS_LIVES = 3;
const ENDLESS_DECK = 300;
const PARTY_ROUNDS = 5;
/** Wrong guesses allowed per prompt: plenty for a person, too few to brute-force. */
const MAX_MISSES = 25;
const NAME_RE = /^[\p{L}\p{N} _.'-]{2,24}$/u;

type Mode = 'daily' | 'pack' | 'endless' | 'archive' | 'party';

interface Run {
  id: string;
  user_id: string;
  mode: Mode;
  pack: string | null;
  day: number;
  prompt_ids: string[];
  seats: number;
  lives: number | null;
  cursor: number;
  seat: number;
  served_at: string | null;
  misses: number;
  points: number;
  finished_at: string | null;
}

class HttpError extends Error {
  constructor(public status: number, public code: string, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

const reveal = (p: Prompt, tier: Tier, n: number, seed: number): L10n[] =>
  shuffle(p.answers.filter((a) => a.tier === tier), rng(seed)).slice(0, n).map((a) => a.names);

/** Common and rare answers shown after a prompt (stable per run and prompt). */
function lists(p: Prompt, runId: string) {
  const seed = [...runId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  return { common: p.answers.filter((a) => a.tier === 1).slice(0, 4).map((a) => a.names), rare: reveal(p, 6, 4, seed) };
}

async function loadRun(id: string, user: User): Promise<Run> {
  const { data } = await admin.from('runs').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!data) throw new HttpError(404, 'no_run');
  return data as Run;
}

function publicRun(run: Run, freeLeft: number | null) {
  return {
    runId: run.id,
    mode: run.mode,
    pack: run.pack,
    day: run.day,
    total: run.mode === 'endless' ? null : run.prompt_ids.length,
    seats: run.seats,
    lives: run.lives,
    cursor: run.cursor,
    seat: run.seat,
    points: run.points,
    finished: !!run.finished_at,
    freeLeft,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Free runs on each themed path (one taste of every theme). */
const FREE_PER_THEME = Number(Deno.env.get('FREE_PER_THEME') ?? 1);

/** Which allowance a run spends: each theme its own, everything else shared. */
function bucketOf(mode: string, pack: string | null | undefined): string {
  return mode === 'pack' ? `pack:${pack}` : 'other';
}

/**
 * A free-run allowance: `limit` runs, which come back 24 hours after the run
 * that used the last of them. A partly used allowance also lapses 24 hours
 * after its first run, so old runs never linger.
 */
async function quotaState(userId: string, bucket: string): Promise<{ used: number; limit: number; resetAt: number | null }> {
  const limit = bucket === 'other' ? FREE_RUNS : FREE_PER_THEME;
  const { data } = await admin
    .from('runs')
    .select('created_at, mode, pack')
    .eq('user_id', userId)
    .eq('free', true)
    .gte('created_at', new Date(Date.now() - 3 * DAY_MS).toISOString())
    .order('created_at');
  let used = 0;
  let windowStart: number | null = null;
  let lockedUntil: number | null = null;
  const lapse = (t: number) => {
    if ((lockedUntil !== null && t >= lockedUntil) || (lockedUntil === null && windowStart !== null && t >= windowStart + DAY_MS)) {
      used = 0;
      windowStart = null;
      lockedUntil = null;
    }
  };
  for (const r of (data ?? []).filter((r) => bucketOf(r.mode, r.pack) === bucket)) {
    const t = Date.parse(r.created_at);
    lapse(t);
    windowStart ??= t;
    used++;
    if (used >= limit) lockedUntil = t + DAY_MS;
  }
  lapse(Date.now());
  return { used, limit, resetAt: lockedUntil ?? (windowStart !== null ? windowStart + DAY_MS : null) };
}

async function start(user: User, body: { mode?: Mode; pack?: string; day?: number; seats?: number }) {
  const mode = body.mode;
  const today = dayNumber();
  if (!mode || !['daily', 'pack', 'endless', 'archive', 'party'].includes(mode)) throw new HttpError(400, 'bad_mode');

  if (mode === 'daily') {
    // The player's local day may differ from UTC by one either way.
    const day = Number(body.day);
    if (!Number.isInteger(day) || Math.abs(day - today) > 1) throw new HttpError(400, 'bad_day');
    const { data: existing } = await admin.from('runs').select('*').eq('user_id', user.id).eq('mode', 'daily').eq('day', day).maybeSingle();
    if (existing) return publicRun(existing as Run, null);
    const ids = dailyPrompts(ALL, day).map((p) => p.id);
    const { data, error } = await admin.from('runs').insert({ user_id: user.id, mode, day, prompt_ids: ids }).select('*').single();
    if (error) throw new HttpError(409, 'daily_exists');
    return publicRun(data as Run, null);
  }

  // Everything except the Daily Pilgrimage spends a free run: one per themed
  // path, and a shared allowance for Endless, Summon Signs and Archive.
  const paid = await hasFullAccess(user.id);
  const bucket = bucketOf(mode, body.pack);
  const quota = paid ? { used: 0, limit: 0, resetAt: null } : await quotaState(user.id, bucket);
  if (!paid && quota.used >= quota.limit) {
    throw new HttpError(402, 'quota', { resetAt: new Date(quota.resetAt!).toISOString(), bucket });
  }

  let ids: string[];
  let day = today;
  let seats = 1;
  let lives: number | null = null;
  if (mode === 'pack') {
    const pool = BY_PACK.get(String(body.pack));
    if (!pool || !THEMES.includes(String(body.pack))) throw new HttpError(400, 'bad_pack');
    ids = byDifficulty(shuffle(pool).slice(0, PROMPTS_PER_RUN)).map((p) => p.id);
  } else if (mode === 'archive') {
    day = Number(body.day);
    if (!Number.isInteger(day) || day < 1 || day >= today) throw new HttpError(400, 'bad_day');
    ids = dailyPrompts(ALL, day).map((p) => p.id);
  } else if (mode === 'endless') {
    const draw = endlessDealer(ALL, Math.random);
    ids = Array.from({ length: ENDLESS_DECK }, () => draw().id);
    lives = ENDLESS_LIVES;
  } else {
    seats = Math.min(6, Math.max(2, Number(body.seats) || 2));
    const pool = body.pack && THEMES.includes(body.pack) ? BY_PACK.get(body.pack)! : ALL;
    ids = byDifficulty(shuffle(pool).slice(0, PARTY_ROUNDS)).map((p) => p.id);
  }

  const { data, error } = await admin
    .from('runs')
    .insert({ user_id: user.id, mode, pack: body.pack ?? null, day, prompt_ids: ids, seats, lives, free: !paid })
    .select('*')
    .single();
  if (error) throw new HttpError(500, 'insert_failed');
  return publicRun(data as Run, paid ? null : quota.limit - quota.used - 1);
}

/** Reveals the current prompt and starts its clock (once: reloads don't reset it). */
async function prompt(user: User, body: { runId?: string }) {
  const run = await loadRun(String(body.runId), user);
  if (run.finished_at) throw new HttpError(409, 'finished');
  const p = BY_ID.get(run.prompt_ids[run.cursor])!;
  let served = run.served_at;
  if (!served) {
    served = new Date().toISOString();
    await admin.from('runs').update({ served_at: served }).eq('id', run.id);
  }
  return {
    ...publicRun(run, null),
    idx: run.cursor,
    q: p.q,
    d: p.d,
    elapsedMs: Date.now() - Date.parse(served),
  };
}

/**
 * A guess for the current prompt. A wrong guess in time just says "try
 * again" (`retry`); the prompt ends with a valid answer, when time runs out,
 * or when the player gives up (`giveUp`, or an empty guess).
 */
async function answer(user: User, body: { runId?: string; guess?: string; giveUp?: boolean; skip?: boolean }) {
  const run = await loadRun(String(body.runId), user);
  if (run.finished_at) throw new HttpError(409, 'finished');
  if (!run.served_at) throw new HttpError(409, 'not_served');
  const p = BY_ID.get(run.prompt_ids[run.cursor])!;
  const skipped = !!body.skip;
  const guess = body.giveUp || skipped ? '' : String(body.guess ?? '').slice(0, 80).trim();
  const timedOut = Date.now() - Date.parse(run.served_at) > SECONDS_PER_PROMPT * 1000 + GRACE_MS;
  const match = !timedOut && guess ? findAnswer(p, guess) : null;

  if (guess && !match && !timedOut) {
    if (run.misses >= MAX_MISSES) throw new HttpError(429, 'too_many_guesses');
    // Only bump if the prompt hasn't moved on meanwhile (double submits).
    await admin.from('runs').update({ misses: run.misses + 1 }).eq('id', run.id).eq('cursor', run.cursor).eq('seat', run.seat);
    return { retry: true, misses: run.misses + 1 };
  }
  const tier = (match?.answer.tier ?? 0) as Tier | 0;
  const points = tier ? TIER_POINTS[tier as Tier] : 0;

  const { error } = await admin.from('turns').insert({
    run_id: run.id, idx: run.cursor, seat: run.seat, prompt_id: p.id, guess, answer: match?.answer.names.en ?? null, tier, points, misses: run.misses, skipped,
  });
  // A duplicate means this turn was already answered (double submit).
  if (error) throw new HttpError(409, 'answered');

  // Advance: party rotates seats within a prompt; endless spends lives.
  let { cursor, seat, lives } = run;
  if (run.mode === 'party') {
    seat++;
    if (seat >= run.seats) {
      seat = 0;
      cursor++;
    }
  } else cursor++;
  // Skipping costs no flask; only a real death does.
  if (run.mode === 'endless' && !tier && !skipped) lives = (lives ?? 1) - 1;
  const finished = run.mode === 'endless' ? (lives ?? 0) <= 0 || cursor >= run.prompt_ids.length : cursor >= run.prompt_ids.length;
  const total = run.points + points;

  await admin
    .from('runs')
    .update({ cursor, seat, lives, points: total, served_at: null, misses: 0, finished_at: finished ? new Date().toISOString() : null })
    .eq('id', run.id);

  const unlocked = finished && !user.is_anonymous ? await awardAchievements(user.id) : [];
  return {
    retry: false,
    skipped,
    tier,
    points,
    total,
    timedOut,
    answer: match ? match.answer.names : null,
    ...lists(p, run.id),
    finished,
    lives,
    cursor,
    seat,
    unlocked,
  };
}

/** Every turn of a run with its prompt text and reveal lists, for results. */
async function state(user: User, body: { runId?: string }) {
  const run = await loadRun(String(body.runId), user);
  const { data: turns } = await admin.from('turns').select('*').eq('run_id', run.id).order('idx').order('seat');
  return {
    ...publicRun(run, null),
    turns: (turns ?? []).map((t) => {
      const p = BY_ID.get(t.prompt_id)!;
      const a: Answer | undefined = t.answer ? p.answers.find((x) => x.names.en === t.answer) : undefined;
      return { idx: t.idx, seat: t.seat, promptId: t.prompt_id, q: p.q, d: p.d, guess: t.guess, answer: a?.names ?? null, tier: t.tier, points: t.points, skipped: t.skipped, ...lists(p, run.id) };
    }),
  };
}

async function playerStats(userId: string): Promise<{ stats: PlayerStats; days: { day: number; points: number }[] }> {
  const { data: runs } = await admin
    .from('runs')
    .select('id, mode, pack, day, points, cursor')
    .eq('user_id', userId)
    .not('finished_at', 'is', null);
  const list = runs ?? [];
  const ids = list.map((r) => r.id);
  const { data: turns } = ids.length ? await admin.from('turns').select('run_id, tier, skipped').in('run_id', ids) : { data: [] };
  // Tiers per run; a skipped prompt is -1 (not a death, not a score).
  const byRun = new Map<string, number[]>();
  for (const t of turns ?? []) byRun.set(t.run_id, [...(byRun.get(t.run_id) ?? []), t.skipped ? -1 : t.tier]);

  const dailies = list.filter((r) => r.mode === 'daily');
  const days = dailies.map((r) => r.day).sort((a, b) => b - a);
  let streak = 0;
  if (days.length && days[0] >= dayNumber() - 1) {
    streak = 1;
    while (streak < days.length && days[streak] === days[0] - streak) streak++;
  }
  const tiersOf = (id: string) => byRun.get(id) ?? [];
  const stats: PlayerStats = {
    dailies: dailies.length,
    bestDaily: Math.max(0, ...dailies.map((r) => r.points)),
    streak,
    deathlessDailies: dailies.filter((r) => tiersOf(r.id).length > 0 && tiersOf(r.id).every((t) => t !== 0)).length,
    allDeadDailies: dailies.filter((r) => tiersOf(r.id).length >= PROMPTS_PER_RUN && tiersOf(r.id).every((t) => t === 0)).length,
    deepest: Math.max(0, ...list.filter((r) => r.mode !== 'party').map((r) => r.points)),
    endlessBest: Math.max(0, ...list.filter((r) => r.mode === 'endless').map((r) => r.points)),
    endlessMostPrompts: Math.max(0, ...list.filter((r) => r.mode === 'endless').map((r) => tiersOf(r.id).length)),
    themesFinished: [...new Set(list.filter((r) => r.mode === 'pack' && r.pack).map((r) => r.pack as string))],
    partyGames: list.filter((r) => r.mode === 'party').length,
    tier6Total: (turns ?? []).filter((t) => t.tier === 6).length,
    mostTiersInRun: Math.max(0, ...list.map((r) => new Set(tiersOf(r.id).filter((t) => t > 0)).size)),
    runs: list.length,
  };
  return { stats, days: dailies.map((r) => ({ day: r.day, points: r.points })) };
}

async function awardAchievements(userId: string): Promise<string[]> {
  const { stats } = await playerStats(userId);
  const { data: have } = await admin.from('achievements').select('key').eq('user_id', userId);
  const owned = new Set((have ?? []).map((a) => a.key));
  const fresh = earnedKeys(stats, THEMES).filter((k) => !owned.has(k));
  if (fresh.length) await admin.from('achievements').insert(fresh.map((key) => ({ user_id: userId, key })));
  return fresh;
}

async function stats(user: User) {
  // Runs finished while anonymous count once the player signs in.
  if (!user.is_anonymous) await awardAchievements(user.id);
  const { stats, days } = await playerStats(user.id);
  const { data: ach } = await admin.from('achievements').select('key, unlocked_at').eq('user_id', user.id);
  const { data: prof } = await admin.from('profiles').select('display_name').eq('id', user.id).single();
  return { stats, days, achievements: ach ?? [], displayName: prof?.display_name ?? null, fullAccess: await hasFullAccess(user.id) };
}

function fallbackName(id: string) {
  return `Unkindled #${id.slice(0, 4).toUpperCase()}`;
}

/** Top 50 signed-in players (anonymous runs never rank), plus the caller's place. */
async function leaderboard(user: User, body: { board?: string; day?: number }) {
  const endless = body.board === 'endless';
  let q = admin
    .from('runs')
    .select('user_id, points, finished_at, profiles!inner(display_name, is_anonymous)')
    .eq('mode', endless ? 'endless' : 'daily')
    .eq('profiles.is_anonymous', false)
    .not('finished_at', 'is', null);
  if (!endless) q = q.eq('day', Number(body.day) || dayNumber());
  const { data } = await q.order('points', { ascending: false }).order('finished_at').limit(1000);

  // Keep each player's best (endless has many runs per player).
  const seen = new Set<string>();
  const rows: { name: string; points: number; me: boolean }[] = [];
  for (const r of data ?? []) {
    if (seen.has(r.user_id)) continue;
    seen.add(r.user_id);
    const prof = r.profiles as unknown as { display_name: string | null };
    rows.push({ name: prof?.display_name ?? fallbackName(r.user_id), points: r.points, me: r.user_id === user.id });
  }
  // Competition ranking: ties share a rank.
  const ranked = rows.map((r, i) => ({ ...r, rank: rows.findIndex((x) => x.points === r.points) + 1, i }));
  return { board: endless ? 'endless' : 'daily', day: endless ? null : Number(body.day) || dayNumber(), top: ranked.slice(0, 50), me: ranked.find((r) => r.me) ?? null, players: ranked.length };
}

async function profile(user: User, body: { displayName?: string }) {
  if (user.is_anonymous) throw new HttpError(403, 'sign_in_required');
  const name = String(body.displayName ?? '').trim().replace(/\s+/g, ' ');
  if (!NAME_RE.test(name)) throw new HttpError(400, 'bad_name');
  const { error } = await admin.from('profiles').update({ display_name: name, updated_at: new Date().toISOString() }).eq('id', user.id);
  // 23505: unique violation, someone already bears that name.
  if (error) throw new HttpError(error.code === '23505' ? 409 : 500, error.code === '23505' ? 'name_taken' : 'update_failed');
  return { displayName: name };
}

const ACTIONS: Record<string, (u: User, b: Record<string, unknown>) => Promise<unknown>> = {
  catalog: async () => ({ themes: THEMES }),
  start: (u, b) => start(u, b as never),
  prompt: (u, b) => prompt(u, b as never),
  answer: (u, b) => answer(u, b as never),
  state: (u, b) => state(u, b as never),
  stats: (u) => stats(u),
  leaderboard: (u, b) => leaderboard(u, b as never),
  profile: (u, b) => profile(u, b as never),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await playerFrom(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  const fn = ACTIONS[String(body.action)];
  if (!fn) return json({ error: 'bad_action' }, 400);
  try {
    return json(await fn(user, body));
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.code, ...e.extra }, e.status);
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
