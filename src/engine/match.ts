import { LANGS, type Answer, type PackSpec, type Prompt, type Tier } from '../data/types.ts';
import { exactKey, matchKey } from './normalize.ts';

export function parseAnswer(spec: string, tier: Tier): Answer {
  const parts = spec.split('|').map((p) => p.trim());
  const en = parts[0];
  const names = { en, pl: parts[1] || en, uk: parts[2] || en };
  const keys = new Set<string>();
  const exact = new Set<string>();
  for (const p of parts) {
    if (!p) continue;
    keys.add(matchKey(p));
    exact.add(exactKey(p));
  }
  keys.delete('');
  exact.delete('');
  return { names, tier, keys: [...keys], exact: [...exact] };
}

export function buildPack(spec: PackSpec): Prompt[] {
  return spec.prompts.map((p) => {
    const answers: Answer[] = [];
    for (const [t, list] of Object.entries(p.answers)) {
      for (const a of list ?? []) answers.push(parseAnswer(a, Number(t) as Tier));
    }
    return { id: p.id, pack: spec.id, q: p.q, answers, reject: (p.reject ?? []).map(matchKey) };
  });
}

/** Optimal-string-alignment distance with an early exit above `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = b.length;
  let prev2 = new Array<number>(n + 1).fill(0);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let cur = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    [prev2, prev, cur] = [prev, cur, prev2];
  }
  return prev[n];
}

function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 12) return 2;
  return 3;
}

export interface MatchResult {
  answer: Answer;
  exact: boolean;
}

/** Finds the answer a guess refers to, forgiving small typos. */
export function findAnswer(prompt: Prompt, guess: string): MatchResult | null {
  const key = matchKey(guess);
  if (!key) return null;
  // Exact spelling first, so Ukrainian "кіт" (cat) beats "кит" (whale) even
  // though both fold to the same key.
  const ex = exactKey(guess);
  for (const a of prompt.answers) if (a.exact.includes(ex)) return { answer: a, exact: true };
  for (const a of prompt.answers) if (a.keys.includes(key)) return { answer: a, exact: true };

  if (prompt.reject.includes(key)) return null;

  const max = tolerance(key.length);
  if (max === 0) return null;
  let best: Answer | null = null;
  let bestD = max + 1;
  for (const a of prompt.answers) {
    for (const k of a.keys) {
      // The allowed distance follows both lengths, so a long guess can't
      // be bent into a short key.
      // Short words are rarely mistyped in their first letter; requiring it
      // keeps "vmlf" from becoming "wolf".
      if (key.length <= 6 && key[0] !== k[0]) continue;
      const kmax = tolerance(Math.round((key.length + k.length) / 2));
      const d = editDistance(key, k, kmax);
      if (d > kmax) continue;
      if (d < bestD || (d === bestD && best && a.tier < best.tier)) {
        best = a;
        bestD = d;
      }
    }
  }
  return best && bestD <= max ? { answer: best, exact: false } : null;
}

export function displayName(a: Answer, lang: (typeof LANGS)[number]): string {
  return a.names[lang];
}
