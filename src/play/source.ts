// Where a run's prompts and verdicts come from. The game screens only talk
// to a Source, so the same UI drives:
// - a local run (content bundled in the browser: offline, no accounts), and
// - a remote run (the game server deals prompts and judges answers; the
//   browser never sees an answer it hasn't guessed).

import { ApiError, callGame } from '../account/api.ts';
import type { Difficulty, L10n, Prompt, Tier } from '../data/types.ts';
import { TIER_POINTS, shuffle, type Turn } from '../engine/game.ts';
import { findAnswer } from '../engine/match.ts';

export type RunKind = 'daily' | 'pack' | 'archive' | 'endless' | 'party';

export interface PromptView {
  idx: number;
  seat: number;
  q: L10n;
  d: Difficulty;
  /** How long this prompt has already been on screen (resumed runs). */
  elapsedMs: number;
}

export interface TurnView {
  promptId: string;
  q: L10n;
  d: Difficulty;
  seat: number;
  guess: string;
  answer: L10n | null;
  tier: Tier | 0;
  points: number;
  common: L10n[];
  rare: L10n[];
  /** Passed over: scores nothing, but isn't a death. */
  skipped?: boolean;
}

export interface Verdict extends TurnView {
  timedOut: boolean;
  finished: boolean;
  lives: number | null;
  /** Achievement keys unlocked by finishing this run. */
  unlocked: string[];
}

/** A wrong guess in time: the prompt stays open. */
export interface Retry {
  retry: true;
  misses: number;
  /** The server stopped accepting guesses for this prompt. */
  capped?: boolean;
}

export type Outcome = Verdict | Retry;

export const isRetry = (o: Outcome): o is Retry => 'retry' in o && o.retry === true;

export interface Source {
  kind: RunKind;
  id: string;
  /** Prompts in the run; null for the Endless Road. */
  total: number | null;
  seats: number;
  lives: number | null;
  turns: TurnView[];
  /** Free runs left today after this one (null = unlimited / not counted). */
  freeLeft: number | null;
  next(): Promise<PromptView | null>;
  /**
   * A guess for the current prompt. A wrong one returns a Retry and the
   * prompt stays open; `null` gives up (a death).
   */
  answer(guess: string | null): Promise<Outcome>;
  /** Passes over the current prompt: no points, no death; spends a flask on the Endless Road. */
  skip(): Promise<Verdict>;
  /** Local runs only: whether a guess is a real answer (protects easter eggs). */
  accepts(guess: string): boolean;
  /** Prompt ids dealt so far (local daily runs persist these). */
  promptIds(): string[];
}

/** The answers a reveal shows: the obvious ones and a few deep cuts. */
export function revealLists(p: Prompt): { common: L10n[]; rare: L10n[] } {
  return {
    common: p.answers.filter((a) => a.tier === 1).slice(0, 4).map((a) => a.names),
    rare: shuffle(p.answers.filter((a) => a.tier === 6)).slice(0, 4).map((a) => a.names),
  };
}

/** Rebuilds a turn's view from bundled content (local runs, old saves). */
export function viewOf(p: Prompt, turn: Turn, seat = 0): TurnView {
  const a = turn.answer ? p.answers.find((x) => x.names.en === turn.answer) : undefined;
  return { promptId: p.id, q: p.q, d: p.d, seat, guess: turn.guess, answer: a?.names ?? null, tier: turn.tier, points: turn.points, skipped: turn.skipped, ...revealLists(p) };
}

/** The compact form stored in the save file. */
export function turnOf(v: TurnView): Turn {
  return { promptId: v.promptId, guess: v.guess, answer: v.answer?.en ?? null, tier: v.tier, points: v.points, ...(v.skipped ? { skipped: true } : {}) };
}

export interface LocalOptions {
  kind: RunKind;
  id: string;
  prompts: Prompt[];
  /** Endless: deals further prompts on demand. */
  draw?: () => Prompt;
  lives?: number;
  seats?: number;
  /** Turns already played (resumed daily). */
  turns?: Turn[];
}

export function localSource(o: LocalOptions): Source {
  const prompts = o.prompts.slice();
  const seats = o.seats ?? 1;
  const byId = new Map(prompts.map((p) => [p.id, p]));
  let lives = o.lives ?? null;
  let misses = 0;
  const turns: TurnView[] = (o.turns ?? []).map((t, i) => viewOf(byId.get(t.promptId) ?? prompts[Math.floor(i / seats)], t, i % seats));
  const position = () => ({ idx: Math.floor(turns.length / seats), seat: turns.length % seats });
  const done = () => (lives !== null && lives <= 0) || (!o.draw && position().idx >= prompts.length);

  return {
    kind: o.kind,
    id: o.id,
    total: o.draw ? null : prompts.length,
    seats,
    get lives() {
      return lives;
    },
    turns,
    freeLeft: null,
    async next() {
      if (done()) return null;
      const { idx, seat } = position();
      if (o.draw && idx >= prompts.length) prompts.push(o.draw());
      const p = prompts[idx];
      return { idx, seat, q: p.q, d: p.d, elapsedMs: 0 };
    },
    async answer(guess) {
      const { idx, seat } = position();
      const p = prompts[idx];
      const m = guess ? findAnswer(p, guess) : null;
      if (guess && !m) return { retry: true, misses: ++misses };
      misses = 0;
      const tier = (m?.answer.tier ?? 0) as Tier | 0;
      const view: TurnView = {
        promptId: p.id, q: p.q, d: p.d, seat, guess: guess ?? '', answer: m?.answer.names ?? null,
        tier, points: tier ? TIER_POINTS[tier as Tier] : 0, ...revealLists(p),
      };
      turns.push(view);
      // A wound, or a common answer (the foe survives and strikes back), costs a flask.
      if (lives !== null && tier <= 1) lives--;
      return { ...view, timedOut: false, finished: done(), lives, unlocked: [] };
    },
    async skip() {
      const { idx, seat } = position();
      const p = prompts[idx];
      misses = 0;
      const view: TurnView = { promptId: p.id, q: p.q, d: p.d, seat, guess: '', answer: null, tier: 0, points: 0, skipped: true, ...revealLists(p) };
      turns.push(view);
      // Passing costs a flask where there are flasks (the Endless Road).
      if (lives !== null) lives--;
      return { ...view, timedOut: false, finished: done(), lives, unlocked: [] };
    },
    accepts(guess) {
      const p = prompts[position().idx];
      return !!p && !!findAnswer(p, guess);
    },
    promptIds: () => prompts.map((p) => p.id),
  };
}

interface RunInfo {
  runId: string;
  total: number | null;
  seats: number;
  lives: number | null;
  cursor: number;
  seat: number;
  finished: boolean;
  freeLeft: number | null;
}

/** A run on the game server. Throws ApiError (e.g. 402 quota). */
export async function remoteSource(kind: RunKind, id: string, start: Record<string, unknown>): Promise<Source & { runId: string; finished: boolean }> {
  const run = await callGame<RunInfo>('start', { mode: kind, ...start });
  const turns: TurnView[] =
    run.cursor > 0 || run.seat > 0 || run.finished ? (await callGame<{ turns: TurnView[] }>('state', { runId: run.runId })).turns : [];
  let lives = run.lives;
  let finished = run.finished;
  let current: PromptView | null = null;

  return {
    kind,
    id,
    runId: run.runId,
    get finished() {
      return finished;
    },
    total: run.total,
    seats: run.seats,
    get lives() {
      return lives;
    },
    turns,
    freeLeft: run.freeLeft,
    async next() {
      if (finished) return null;
      current = await callGame<PromptView>('prompt', { runId: run.runId });
      return current;
    },
    async answer(guess) {
      let v;
      try {
        v = await callGame<(Omit<Verdict, 'promptId' | 'q' | 'd' | 'guess' | 'seat'> & { seat: number; cursor: number; retry: false }) | Retry>('answer', {
          runId: run.runId,
          ...(guess ? { guess } : { giveUp: true }),
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 429) return { retry: true, misses: 0, capped: true };
        throw e;
      }
      if (v.retry) return v;
      const view: TurnView = {
        promptId: '', q: current!.q, d: current!.d, seat: current!.seat, guess: guess ?? '', answer: v.answer,
        tier: v.tier, points: v.points, common: v.common, rare: v.rare,
      };
      turns.push(view);
      lives = v.lives;
      finished = v.finished;
      return { ...view, timedOut: v.timedOut, finished: v.finished, lives: v.lives, unlocked: v.unlocked };
    },
    async skip() {
      const v = await callGame<Omit<Verdict, 'promptId' | 'q' | 'd' | 'guess' | 'seat'> & { seat: number }>('answer', { runId: run.runId, skip: true });
      const view: TurnView = {
        promptId: '', q: current!.q, d: current!.d, seat: current!.seat, guess: '', answer: null, tier: 0, points: 0, skipped: true, common: v.common, rare: v.rare,
      };
      turns.push(view);
      lives = v.lives;
      finished = v.finished;
      return { ...view, timedOut: false, finished: v.finished, lives: v.lives, unlocked: v.unlocked };
    },
    // Secret phrases are never real answers; the server can't be asked cheaply.
    accepts: () => false,
    promptIds: () => [],
  };
}

export { ApiError };
