// The free-run quota as the browser sees it. With the game server (REMOTE)
// the server is authoritative and this only mirrors it for display; in local
// and mock builds it is the whole gate.

import { dayNumber } from '../engine/game.ts';
import { ACCOUNTS_ENABLED, FREE_RUNS_PER_DAY, REMOTE } from './config.ts';
import { currentAccount } from './session.ts';

const KEY = 'mortillion:runs';

interface Quota {
  day: number;
  used: number;
}

function quota(): Quota {
  try {
    const q = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Quota | null;
    if (q && q.day === dayNumber()) return q;
  } catch {
    // fall through to a fresh quota
  }
  return { day: dayNumber(), used: 0 };
}

function store(q: Quota) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // Storage unavailable: the display resets on reload.
  }
}

export function unlimited(): boolean {
  return !ACCOUNTS_ENABLED || !!currentAccount()?.fullAccess;
}

export function freeRunsLeft(): number {
  return Math.max(0, FREE_RUNS_PER_DAY - quota().used);
}

/** Whether a new non-daily run may begin (always true remotely: the server decides). */
export function canStartRun(): boolean {
  return REMOTE || unlimited() || freeRunsLeft() > 0;
}

/** Spends one free run locally (no-op for paid players). */
export function spendRun(): void {
  if (unlimited()) return;
  const q = quota();
  q.used++;
  store(q);
}

/** Mirrors the server's count after it starts a run. */
export function syncFreeRuns(left: number | null): void {
  if (left == null) return;
  store({ day: dayNumber(), used: FREE_RUNS_PER_DAY - left });
}
