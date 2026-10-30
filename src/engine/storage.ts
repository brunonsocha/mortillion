import type { Lang } from '../data/types.ts';
import type { Turn } from './game.ts';
import type { TurnView } from '../play/source.ts';

const KEY = 'mortillion:v1';

export interface DayRecord {
  day: number;
  points: number;
  turns: Turn[];
  /** Full turn views (questions, reveal lists), so results need no content. */
  views?: TurnView[];
}

export interface PackRecord {
  best: number;
  plays: number;
}

export interface Save {
  lang: Lang | null;
  sound: boolean;
  motion: boolean;
  /** Whether Liora speaks. */
  maiden: boolean;
  seenHelp: boolean;
  days: DayRecord[];
  /** Daily run in progress so a reload can't grant a fresh attempt. */
  pending: { day: number; ids: string[]; turns: Turn[] } | null;
  packs: Record<string, PackRecord>;
  streak: number;
  bestStreak: number;
  lastDay: number | null;
}

const fresh = (): Save => ({
  lang: null,
  sound: true,
  motion: true,
  maiden: true,
  seenHelp: false,
  days: [],
  pending: null,
  packs: {},
  streak: 0,
  bestStreak: 0,
  lastDay: null,
});

let cache: Save | null = null;

export function load(): Save {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    cache = fresh();
  }
  return cache!;
}

export function save(patch: Partial<Save> = {}): Save {
  const s = Object.assign(load(), patch);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or storage full: progress lives only for this session.
  }
  return s;
}

export function recordDay(day: number, turns: Turn[], points: number, views?: TurnView[]): Save {
  const s = load();
  if (s.days.some((d) => d.day === day)) return s;
  s.days.push({ day, points, turns, views });
  s.days = s.days.slice(-400);
  s.streak = s.lastDay === day - 1 ? s.streak + 1 : 1;
  s.bestStreak = Math.max(s.bestStreak, s.streak);
  s.lastDay = day;
  s.pending = null;
  return save();
}

export function recordPack(pack: string, points: number): Save {
  const s = load();
  const r = s.packs[pack] ?? { best: 0, plays: 0 };
  s.packs[pack] = { best: Math.max(r.best, points), plays: r.plays + 1 };
  return save();
}

/** The live streak, which lapses if yesterday was missed. */
export function currentStreak(today: number): number {
  const s = load();
  return s.lastDay !== null && s.lastDay >= today - 1 ? s.streak : 0;
}
