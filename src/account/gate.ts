// The free-run allowances as the browser sees them: one free journey on each
// themed path, and a shared allowance for Endless, Summon Signs and Archive.
// With the game server (REMOTE) the server is authoritative and this only
// mirrors it for display; in local and mock builds it is the whole gate.

import { dayNumber } from '../engine/game.ts';
import { ACCOUNTS_ENABLED, FREE_RUNS_PER_DAY, REMOTE } from './config.ts';
import { currentAccount } from './session.ts';

const KEY = 'mortillion:runs';
/** Free journeys on each themed path. */
export const FREE_PER_THEME = 1;

/** Which allowance a run spends: each theme its own, the rest shared. */
export type Bucket = 'other' | `pack:${string}`;

interface Quota {
  day: number;
  used: Record<string, number>;
}

function quota(): Quota {
  try {
    const q = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Quota | null;
    if (q && q.day === dayNumber() && q.used && typeof q.used === 'object') return q;
  } catch {
    // fall through to a fresh quota
  }
  return { day: dayNumber(), used: {} };
}

function store(q: Quota) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // Storage unavailable: the display resets on reload.
  }
}

const limitOf = (b: Bucket) => (b === 'other' ? FREE_RUNS_PER_DAY : FREE_PER_THEME);

export function unlimited(): boolean {
  return !ACCOUNTS_ENABLED || !!currentAccount()?.fullAccess;
}

export function freeRunsLeft(bucket: Bucket = 'other'): number {
  return Math.max(0, limitOf(bucket) - (quota().used[bucket] ?? 0));
}

/** Whether a new run may begin (always true remotely: the server decides). */
export function canStartRun(bucket: Bucket): boolean {
  return REMOTE || unlimited() || freeRunsLeft(bucket) > 0;
}

/** Spends one free run locally (no-op for paid players). */
export function spendRun(bucket: Bucket): void {
  if (unlimited()) return;
  const q = quota();
  q.used[bucket] = (q.used[bucket] ?? 0) + 1;
  store(q);
}

/** Mirrors the server's count after it starts (or refuses) a run. */
export function syncFreeRuns(left: number | null, bucket: Bucket = 'other'): void {
  if (left == null) return;
  const q = quota();
  q.used[bucket] = limitOf(bucket) - left;
  store(q);
}
