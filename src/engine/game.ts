import type { Prompt, Tier } from '../data/types.ts';

export const PROMPTS_PER_RUN = 7;
export const SECONDS_PER_PROMPT = 25;
export const METRES_PER_POINT = 10;

export const TIER_POINTS: Record<Tier, number> = { 1: 10, 2: 15, 3: 30, 4: 60, 5: 85, 6: 100 };
export const MAX_SCORE = PROMPTS_PER_RUN * TIER_POINTS[6];

/** Day 1 of the Daily Pilgrimage. Days roll over at local midnight. */
const EPOCH = Date.UTC(2026, 9, 29);

export function dayNumber(now = new Date()): number {
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((local - EPOCH) / 86_400_000) + 1;
}

export function dateOfDay(day: number): Date {
  const d = new Date(EPOCH + (day - 1) * 86_400_000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function msUntilNextDay(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** mulberry32: small, fast, good enough for shuffling prompts. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: T[], rand: () => number = Math.random): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Easy first, hard last: the further you walk, the harder it gets. Stable. */
export function byDifficulty(prompts: Prompt[]): Prompt[] {
  return prompts.map((p, i) => [p, i] as const).sort((a, b) => a[0].d - b[0].d || a[1] - b[1]).map(([p]) => p);
}

/** How often each pack appears in the daily rotation (default 1). */
const DAILY_WEIGHT: Record<string, number> = {};

/**
 * The deck order for one cycle of a pack. Each new cycle shuffles the two
 * halves of the previous deck separately, so prompts dealt late in one cycle
 * are dealt late again and never return within half a cycle.
 */
function packDeck(pack: string, list: Prompt[], cycle: number): Prompt[] {
  const base = [...pack].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
  let deck = shuffle(list, rng(base));
  const half = Math.ceil(deck.length / 2);
  for (let k = 1; k <= cycle; k++) {
    const rand = rng(base + k * 7919);
    deck = [...shuffle(deck.slice(0, half), rand), ...shuffle(deck.slice(half), rand)];
  }
  return deck;
}

/**
 * The prompts for a given day, identical for every player.
 *
 * Packs take turns through a fixed weighted rotation, so each day mixes
 * themes. Each pack deals from its own seeded deck: no prompt repeats until
 * that pack's deck is used up, and then a freshly shuffled deck starts.
 */
export function dailyPrompts(pool: Prompt[], day: number): Prompt[] {
  const byPack = new Map<string, Prompt[]>();
  for (const p of pool.slice().sort((a, b) => (a.id < b.id ? -1 : 1))) {
    byPack.set(p.pack, [...(byPack.get(p.pack) ?? []), p]);
  }
  const packs = [...byPack.keys()].sort();
  const plan: string[] = [];
  const maxW = Math.max(1, ...packs.map((p) => DAILY_WEIGHT[p] ?? 1));
  for (let round = 0; round < maxW; round++) {
    for (const p of packs) if (round < (DAILY_WEIGHT[p] ?? 1)) plan.push(p);
  }
  if (!plan.length) return [];

  const usesBefore = (pack: string, slot: number) => {
    const perPlan = plan.filter((p) => p === pack).length;
    let n = Math.floor(slot / plan.length) * perPlan;
    for (let i = 0; i < slot % plan.length; i++) if (plan[i] === pack) n++;
    return n;
  };

  const out: Prompt[] = [];
  for (let i = 0; i < PROMPTS_PER_RUN; i++) {
    const slot = (day - 1) * PROMPTS_PER_RUN + i;
    const pack = plan[slot % plan.length];
    const list = byPack.get(pack)!;
    const n = usesBefore(pack, slot);
    out.push(packDeck(pack, list, Math.floor(n / list.length))[n % list.length]);
  }
  return byDifficulty(shuffle(out, rng(day * 2654435761)));
}

/**
 * Deals prompts for the Endless Road: easy ones first, then mostly medium,
 * then mostly hard, never repeating a prompt until every prompt of that
 * difficulty has been seen.
 */
export function endlessDealer(pool: Prompt[], rand: () => number): () => Prompt {
  const decks = new Map<number, Prompt[]>();
  const take = (d: number): Prompt => {
    let deck = decks.get(d);
    if (!deck?.length) {
      deck = shuffle(pool.filter((p) => p.d === d), rand);
      if (!deck.length) deck = shuffle(pool, rand);
      decks.set(d, deck);
    }
    return deck.pop()!;
  };
  let n = 0;
  return () => {
    const r = rand();
    const d = n < 3 ? 1 : n < 8 ? (r < 0.25 ? 1 : 2) : n < 14 ? (r < 0.6 ? 2 : 3) : r < 0.35 ? 2 : 3;
    n++;
    return take(d);
  };
}

export interface Turn {
  promptId: string;
  guess: string;
  /** Matched answer display name in English, or null if rejected / timed out. */
  answer: string | null;
  tier: Tier | 0;
  points: number;
}

export function totalPoints(turns: Turn[]): number {
  return turns.reduce((s, t) => s + t.points, 0);
}
