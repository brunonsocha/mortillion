// The free-run quota. The Daily Descent is always free; every other run
// (themes, Endless, Summon Signs, archive) spends one of today's free runs
// unless the player's account unlocks unlimited play.

import { dayNumber } from '../engine/game.ts';
import { ACCOUNTS_ENABLED, FREE_RUNS_PER_DAY, GATE } from './config.ts';
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

export function unlimited(): boolean {
  if (!ACCOUNTS_ENABLED) return true;
  const a = currentAccount();
  return GATE === 'login' ? !!a : !!a?.subscribed;
}

export function freeRunsLeft(): number {
  return Math.max(0, FREE_RUNS_PER_DAY - quota().used);
}

/** Whether a new non-daily run may begin right now. */
export function canStartRun(): boolean {
  return unlimited() || freeRunsLeft() > 0;
}

/** Spends one free run (no-op for unlimited players). */
export function spendRun(): void {
  if (unlimited()) return;
  const q = quota();
  q.used++;
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // Storage unavailable: the quota resets on reload, which is acceptable.
  }
}
