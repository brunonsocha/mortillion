// Dark Souls easter eggs: depth zones, secret phrases, quips and soapstone
// messages. Everything here is flavour; none of it changes scoring.

import type { L10n, Lang } from './data/types.ts';
import { exactKey } from './engine/normalize.ts';

export interface Zone {
  /** Depth in metres where the zone begins. */
  from: number;
  name: L10n;
  /** Back-wall tint, darkness of the unlit shaft, and drifting particle colours. */
  tint: [number, number, number];
  dark: number;
  motes: string[];
  /** Colour wash (r, g, b, strength) blended over the walls in 'color' mode. */
  wash: [number, number, number, number];
}

export const ZONES: Zone[] = [
  { from: 0, name: { en: 'The Bonfire Shaft', pl: 'Szyb Ogniska', uk: 'Шахта Багаття' }, tint: [20, 20, 28], dark: 0.8, wash: [0, 0, 0, 0], motes: ['#4a4540', '#77706a'] },
  { from: 600, name: { en: 'Undead Burrows', pl: 'Nory Nieumarłych', uk: 'Нори Немертвих' }, tint: [24, 21, 24], dark: 0.82, wash: [122, 106, 90, 0.18], motes: ['#4a4540', '#77706a'] },
  { from: 1500, name: { en: 'The Depths', pl: 'Głębiny', uk: 'Глибини' }, tint: [16, 22, 24], dark: 0.85, wash: [58, 106, 120, 0.4], motes: ['#3c4a4c', '#5b6a6a'] },
  { from: 2500, name: { en: 'Blightpit', pl: 'Zgniłodół', uk: 'Гнилояма' }, tint: [16, 27, 12], dark: 0.86, wash: [90, 160, 40, 0.55], motes: ['#5f7a2a', '#8fae3a'] },
  { from: 3500, name: { en: 'Catacombs of the Hollow', pl: 'Katakumby Pustych', uk: 'Катакомби Порожніх' }, tint: [26, 22, 18], dark: 0.87, wash: [170, 145, 105, 0.35], motes: ['#7a6d58', '#a39478'] },
  { from: 4500, name: { en: 'Tomb of Giants', pl: 'Grobowiec Olbrzymów', uk: 'Гробниця Велетнів' }, tint: [8, 8, 11], dark: 0.95, wash: [40, 40, 60, 0.3], motes: ['#2a2a30', '#3c3c44'] },
  { from: 5500, name: { en: 'The Abyss', pl: 'Otchłań', uk: 'Безодня' }, tint: [18, 8, 28], dark: 0.91, wash: [122, 58, 208, 0.6], motes: ['#5a2a8a', '#a66cf0'] },
  { from: 6500, name: { en: 'Kiln of the First Flame', pl: 'Piec Pierwszego Płomienia', uk: 'Горнило Першого Полум’я' }, tint: [52, 48, 44], dark: 0.62, wash: [235, 225, 210, 0.7], motes: ['#cfc8bc', '#f2ece0'] },
  { from: 9000, name: { en: 'The Age of Dark', pl: 'Era Mroku', uk: 'Епоха Темряви' }, tint: [6, 6, 8], dark: 0.96, wash: [20, 20, 24, 0.65], motes: ['#d8d8e0', '#8a8a96'] },
];

export function zoneAt(metres: number): Zone {
  let z = ZONES[0];
  for (const zone of ZONES) if (metres >= zone.from) z = zone;
  return z;
}

/** Things players may type instead of an answer. Matched on exact spelling. */
export type Secret = 'sun' | 'gitgud' | 'bonfire';

const SECRETS: Record<Secret, string[]> = {
  sun: ['praise the sun', 'chwała słońcu', 'слава сонцю', 'хвала сонцю'],
  gitgud: ['git gud', 'get good', 'git good'],
  bonfire: ['rest at bonfire', 'odpocznij przy ognisku', 'відпочити біля багаття'],
};

const secretKeys = new Map<string, Secret>();
for (const [k, list] of Object.entries(SECRETS) as [Secret, string[]][]) {
  for (const phrase of list) secretKeys.set(exactKey(phrase), k);
}

export function secretOf(input: string): Secret | null {
  // The sun pose \[T]/ is all punctuation, so it is matched on the raw text.
  if (/^\\?\[t\]\/?$/i.test(input.replace(/\s/g, ''))) return 'sun';
  return secretKeys.get(exactKey(input)) ?? null;
}

export const SECRET_TEXT: Record<Secret, L10n> = {
  sun: { en: 'PRAISE THE SUN!', pl: 'CHWAŁA SŁOŃCU!', uk: 'СЛАВА СОНЦЮ!' },
  gitgud: { en: 'Then descend, and get good.', pl: 'Więc schodź i bądź lepszy.', uk: 'То спускайся — і стань кращим.' },
  bonfire: { en: 'No resting now. The flame still burns.', pl: 'Nie czas na odpoczynek. Płomień wciąż płonie.', uk: 'Не час відпочивати. Полум’я ще горить.' },
};

/**
 * Death quips for guesses that are famous Dark Souls names. Shown in place of
 * the usual "not in the tome" when one of these is offered as a wrong answer.
 */
const QUIPS: [string[], L10n][] = [
  [['solaire', 'solaire of astora'], { en: 'If only you could be so grossly incandescent.', pl: 'Gdybyś tylko mógł tak rażąco jaśnieć.', uk: 'Якби ж і ти міг так сліпучо сяяти.' }],
  [['siegmeyer', 'siegmeyer of catarina', 'onion knight'], { en: 'Mmm… mmm… (he is napping again)', pl: 'Mmm… mmm… (znowu drzemie)', uk: 'Ммм… ммм… (він знову дрімає)' }],
  [['patches', 'trusty patches'], { en: 'Hehehe… sorry, friend. Nothing personal.', pl: 'Hehehe… wybacz, przyjacielu. Nic osobistego.', uk: 'Хе-хе-хе… вибач, друже. Нічого особистого.' }],
  [['artorias', 'knight artorias'], { en: 'He walked the Abyss. Not this prompt.', pl: 'Kroczył przez Otchłań. Nie przez to pytanie.', uk: 'Він ходив Безоднею. Не цим запитанням.' }],
  [['gwyn', 'lord gwyn'], { en: 'The Age of Fire fades, and so does this answer.', pl: 'Era Ognia gaśnie — a wraz z nią ta odpowiedź.', uk: 'Епоха Вогню згасає — а з нею й ця відповідь.' }],
  [['ornstein', 'smough', 'ornstein and smough'], { en: 'Two answers for the price of none.', pl: 'Dwie odpowiedzi w cenie żadnej.', uk: 'Дві відповіді за ціною жодної.' }],
  [['you died', 'nie zyjesz', 'ви загинули'], { en: 'Yes. Yes, you did.', pl: 'Tak. Owszem.', uk: 'Так. Саме так.' }],
  [['estus', 'estus flask'], { en: 'The flask is empty. So is this answer.', pl: 'Flakon jest pusty. Ta odpowiedź też.', uk: 'Фляга порожня. Як і ця відповідь.' }],
  [['firekeeper', 'fire keeper'], { en: 'Ashen one, hearest thou my voice still?', pl: 'Popielny, czy wciąż słyszysz mój głos?', uk: 'Попелястий, чи чуєш ти ще мій голос?' }],
  [['mimic'], { en: 'It was a mimic all along.', pl: 'To od początku był mimik.', uk: 'Це весь час був мімік.' }],
];

const quipKeys = new Map<string, L10n>();
for (const [names, text] of QUIPS) for (const n of names) quipKeys.set(exactKey(n), text);

export function quipFor(guess: string, lang: Lang): string | null {
  return quipKeys.get(exactKey(guess))?.[lang] ?? null;
}

/** Patches occasionally takes credit for a death. */
export const PATCHES: L10n = {
  en: 'Patches kicked you down the shaft. Hehehe.',
  pl: 'Patches zepchnął cię w szyb. Hehehe.',
  uk: 'Патчес зіштовхнув тебе в шахту. Хе-хе-хе.',
};

/**
 * Orange soapstone messages left by other (imaginary) players at the
 * bonfire, in the "template + word" style of the series.
 */
export const SOAPSTONE: L10n[] = [
  { en: 'Rare answer ahead', pl: 'Przed tobą rzadka odpowiedź', uk: 'Попереду рідкісна відповідь' },
  { en: 'Try platypus', pl: 'Spróbuj dziobaka', uk: 'Спробуй качкодзьоба' },
  { en: 'Be wary of the obvious', pl: 'Strzeż się oczywistego', uk: 'Стережися очевидного' },
  { en: 'Praise the Sun!', pl: 'Chwała Słońcu!', uk: 'Слава Сонцю!' },
  { en: 'Liar ahead', pl: 'Przed tobą kłamca', uk: 'Попереду брехун' },
  { en: 'If only I had a rarer answer…', pl: 'Gdybym tylko miał rzadszą odpowiedź…', uk: 'Якби ж мені рідкіснішу відповідь…' },
  { en: 'Visions of the abyss…', pl: 'Wizje otchłani…', uk: 'Видіння безодні…' },
  { en: 'Hollow, therefore, think deeper', pl: 'Pusty, więc myśl głębiej', uk: 'Порожній, тож думай глибше' },
  { en: 'Time for typo', pl: 'Czas na literówkę', uk: 'Час для одруківки' },
  { en: 'Don’t give up, skeleton!', pl: 'Nie poddawaj się, szkielecie!', uk: 'Не здавайся, скелете!' },
  { en: 'Amazing chest ahead', pl: 'Przed tobą niesamowita skrzynia', uk: 'Попереду дивовижна скриня' },
  { en: 'Seek obscurity', pl: 'Szukaj mroku', uk: 'Шукай невідомого' },
  { en: 'Try jumping', pl: 'Spróbuj skoczyć', uk: 'Спробуй стрибнути' },
  { en: 'Fort, night', pl: 'Fort, noc', uk: 'Форт, ніч' },
  { en: 'Nothing here but Hollow answers', pl: 'Tu same puste odpowiedzi', uk: 'Тут лише порожні відповіді' },
  { en: 'Behold, Lord of Cinder!', pl: 'Oto Władca Żaru!', uk: 'Узріть, Володар Жару!' },
];

export const BONFIRE_LIT: L10n = { en: 'BONFIRE LIT', pl: 'OGNISKO ROZPALONE', uk: 'БАГАТТЯ РОЗПАЛЕНО' };
export const VICTORY: L10n = { en: 'VICTORY ACHIEVED', pl: 'ZWYCIĘSTWO', uk: 'ПЕРЕМОГУ ЗДОБУТО' };

/** Lines the Fire Keeper speaks when the title is tapped repeatedly. */
export const FIRE_KEEPER: L10n[] = [
  { en: 'Welcome to the bonfire, Unkindled.', pl: 'Witaj przy ognisku, Nierozpalony.', uk: 'Ласкаво просимо до багаття, Нерозпалений.' },
  { en: 'Seek rarer answers, ashen one.', pl: 'Szukaj rzadszych odpowiedzi, popielny.', uk: 'Шукай рідкісніших відповідей, попелястий.' },
  { en: 'Don’t you dare go Hollow.', pl: 'Nie waż się stać Pustym.', uk: 'Не смій стати Порожнім.' },
  { en: 'The fire fades… but the descent remains.', pl: 'Ogień gaśnie… ale zejście trwa.', uk: 'Вогонь згасає… але спуск триває.' },
];
