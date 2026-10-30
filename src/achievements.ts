// Achievements for signed-in players. Shared by the browser (names and
// descriptions) and the `game` Edge Function (unlock rules), which evaluates
// them from runs it recorded itself, so they cannot be forged.

import type { L10n } from './data/types.ts';

/** Lifetime numbers the server computes from a player's finished runs. */
export interface PlayerStats {
  dailies: number;
  bestDaily: number;
  /** Longest run of consecutive daily days ending today or yesterday. */
  streak: number;
  deathlessDailies: number;
  allDeadDailies: number;
  /** Deepest finish of any run, in points. */
  deepest: number;
  endlessBest: number;
  endlessMostPrompts: number;
  themesFinished: string[];
  partyGames: number;
  tier6Total: number;
  /** Most distinct scoring tiers (1–6) in a single run. */
  mostTiersInRun: number;
  runs: number;
}

export interface Achievement {
  key: string;
  name: L10n;
  desc: L10n;
  earned: (s: PlayerStats, themes: string[]) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'first_descent',
    name: { en: 'Undead Pilgrim', pl: 'Nieumarły Pielgrzym', uk: 'Немертвий Прочанин' },
    desc: { en: 'Complete your first Daily Pilgrimage.', pl: 'Ukończ pierwszą Codzienną Pielgrzymkę.', uk: 'Завершіть перше Щоденне Паломництво.' },
    earned: (s) => s.dailies >= 1,
  },
  {
    key: 'kindled',
    name: { en: 'Kindled', pl: 'Rozpalony', uk: 'Розпалений' },
    desc: { en: 'Find your first One-in-a-Mortillion answer.', pl: 'Znajdź pierwszą odpowiedź jedną na mortylion.', uk: 'Знайдіть першу відповідь одну на мортильйон.' },
    earned: (s) => s.tier6Total >= 1,
  },
  {
    key: 'deathless',
    name: { en: 'No Death', pl: 'Bez Śmierci', uk: 'Без Смерті' },
    desc: { en: 'Finish a Daily Pilgrimage without dying once.', pl: 'Ukończ Codzienną Pielgrzymkę ani razu nie ginąc.', uk: 'Завершіть Щоденне Паломництво, жодного разу не загинувши.' },
    earned: (s) => s.deathlessDailies >= 1,
  },
  {
    key: 'hollowed',
    name: { en: 'Hollowed', pl: 'Wydrążony', uk: 'Спустошений' },
    desc: { en: 'Die on all seven prompts of a Daily Pilgrimage.', pl: 'Zgiń na wszystkich siedmiu pytaniach pielgrzymki.', uk: 'Загиньте на всіх семи запитаннях паломництва.' },
    earned: (s) => s.allDeadDailies >= 1,
  },
  {
    key: 'lord_of_cinder',
    name: { en: 'Lord of Cinder', pl: 'Władca Żaru', uk: 'Володар Жару' },
    desc: { en: 'Walk 6,000 m in a Daily Pilgrimage.', pl: 'Przejdź 6000 m w Codziennej Pielgrzymce.', uk: 'Пройдіть 6000 м у Щоденному Паломництві.' },
    earned: (s) => s.bestDaily >= 600,
  },
  {
    key: 'streak7',
    name: { en: 'Way of the Pilgrim', pl: 'Droga Pielgrzyma', uk: 'Шлях Прочанина' },
    desc: { en: 'Set out seven days in a row.', pl: 'Wyruszaj siedem dni z rzędu.', uk: 'Вирушайте сім днів поспіль.' },
    earned: (s) => s.streak >= 7,
  },
  {
    key: 'streak30',
    name: { en: 'Undying', pl: 'Nieśmiertelny', uk: 'Невмирущий' },
    desc: { en: 'Set out thirty days in a row.', pl: 'Wyruszaj trzydzieści dni z rzędu.', uk: 'Вирушайте тридцять днів поспіль.' },
    earned: (s) => s.streak >= 30,
  },
  {
    key: 'abysswalker',
    name: { en: 'Ashen One', pl: 'Popielny', uk: 'Попелястий' },
    desc: { en: 'Reach the Kiln of the First Flame (5,500 m) in any journey.', pl: 'Dotrzyj do Pieca Pierwszego Płomienia (5500 m) w dowolnej podróży.', uk: 'Дістаньтеся Горнила Першого Полум’я (5500 м) у будь-якій подорожі.' },
    earned: (s) => s.deepest >= 550,
  },
  {
    key: 'age_of_dark',
    name: { en: 'Age of Dark', pl: 'Era Mroku', uk: 'Епоха Темряви' },
    desc: { en: 'Walk 9,000 m on the Endless Road.', pl: 'Przejdź 9000 m na Bezkresnej Drodze.', uk: 'Пройдіть 9000 м Нескінченною Дорогою.' },
    earned: (s) => s.endlessBest >= 900,
  },
  {
    key: 'estus_hoarder',
    name: { en: 'Estus Hoarder', pl: 'Zbieracz Estusa', uk: 'Збирач Естусу' },
    desc: { en: 'Face 25 prompts in one Endless Road run.', pl: 'Zmierz się z 25 pytaniami w jednej wędrówce Bezkresnej Drogi.', uk: 'Подолайте 25 запитань за одну мандрівку Нескінченною Дорогою.' },
    earned: (s) => s.endlessMostPrompts >= 25,
  },
  {
    key: 'lorekeeper',
    name: { en: 'Lorekeeper', pl: 'Strażnik Wiedzy', uk: 'Хранитель Знань' },
    desc: { en: 'Finish a journey on every themed path.', pl: 'Ukończ podróż na każdej ścieżce tematycznej.', uk: 'Завершіть подорож кожною тематичною стежкою.' },
    earned: (s, themes) => themes.length > 0 && themes.every((t) => s.themesFinished.includes(t)),
  },
  {
    key: 'soul_collector',
    name: { en: 'Soul Collector', pl: 'Zbieracz Dusz', uk: 'Збирач Душ' },
    desc: { en: 'Collect 10 One-in-a-Mortillion answers.', pl: 'Zbierz 10 odpowiedzi jednych na mortylion.', uk: 'Зберіть 10 відповідей одна на мортильйон.' },
    earned: (s) => s.tier6Total >= 10,
  },
  {
    key: 'soul_of_cinder',
    name: { en: 'Soul of Cinder', pl: 'Dusza Żaru', uk: 'Душа Жару' },
    desc: { en: 'Collect 50 One-in-a-Mortillion answers.', pl: 'Zbierz 50 odpowiedzi jednych na mortylion.', uk: 'Зберіть 50 відповідей одна на мортильйон.' },
    earned: (s) => s.tier6Total >= 50,
  },
  {
    key: 'sunbro',
    name: { en: 'Sunbro', pl: 'Brat Słońca', uk: 'Брат Сонця' },
    desc: { en: 'Finish a Summon Signs game.', pl: 'Ukończ grę w Znaki Przywołania.', uk: 'Завершіть гру в Знаки Виклику.' },
    earned: (s) => s.partyGames >= 1,
  },
  {
    key: 'spectrum',
    name: { en: 'Spectrum of Souls', pl: 'Widmo Dusz', uk: 'Спектр Душ' },
    desc: { en: 'Score five different tiers in a single run.', pl: 'Zdobądź pięć różnych stopni rzadkości w jednej podróży.', uk: 'Здобудьте п’ять різних ступенів рідкості за одну подорож.' },
    earned: (s) => s.mostTiersInRun >= 5,
  },
  {
    key: 'centurion',
    name: { en: 'Centurion of the Pit', pl: 'Centurion Czeluści', uk: 'Центуріон Прірви' },
    desc: { en: 'Finish 100 journeys of any kind.', pl: 'Ukończ 100 podróży dowolnego rodzaju.', uk: 'Завершіть 100 подорожей будь-якого типу.' },
    earned: (s) => s.runs >= 100,
  },
];

export function earnedKeys(stats: PlayerStats, themes: string[]): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(stats, themes)).map((a) => a.key);
}
