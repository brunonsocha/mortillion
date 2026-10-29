export type Lang = 'en' | 'pl' | 'uk';
export const LANGS: Lang[] = ['en', 'pl', 'uk'];

/** A string in each supported language. */
export type L10n = Record<Lang, string>;

/** Tier 1 = most common (fewest points) … tier 6 = one in a mortillion. */
export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * An answer entry is a single pipe-separated string:
 *
 *   "English name|Polish name|Ukrainian name|alias|alias…"
 *
 * - The first three fields are the display names. Leave the Polish or
 *   Ukrainian field empty ("") when it is identical to the English one.
 * - Every field (display names and aliases) is accepted as input.
 * - Matching ignores case, diacritics, punctuation, leading articles and
 *   transliterates Cyrillic, so do not add aliases that only differ by those.
 */
export type AnswerSpec = string;

export interface PromptSpec {
  /** Stable, unique, kebab-case id. Never change once published. */
  id: string;
  q: L10n;
  /** Answers grouped by rarity tier. */
  answers: Partial<Record<Tier, AnswerSpec[]>>;
  /**
   * Plausible wrong answers that are close in spelling to a valid one
   * (e.g. "Iceland" for an EU-members prompt that accepts "Ireland").
   * An exact hit here is rejected instead of being fuzzy-matched.
   */
  reject?: string[];
}

export interface PackSpec {
  id: string;
  prompts: PromptSpec[];
}

export interface Answer {
  names: L10n;
  tier: Tier;
  /** Phonetically folded keys, used for forgiving matches. */
  keys: string[];
  /** Exact normalized spellings; they win over folded keys on a tie. */
  exact: string[];
}

export interface Prompt {
  id: string;
  pack: string;
  q: L10n;
  answers: Answer[];
  reject: string[];
}
