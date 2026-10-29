import { loadAll } from '../data/packs/index.ts';
import type { Lang, Prompt } from '../data/types.ts';
import { MAX_SCORE, METRES_PER_POINT, dayNumber, totalPoints, type Turn } from '../engine/game.ts';
import { load } from '../engine/storage.ts';
import { PACK_NAMES } from '../i18n/strings.ts';
import { TIER_COLORS } from '../render/scene.ts';
import { sfx } from '../render/sfx.ts';
import { app, go, route, tierBadge } from './app.ts';
import { countdown } from './home.ts';
import { countUp, fmt, h } from './dom.ts';
import { lastRun, type RunKind } from './game.ts';

const TIER_EMOJI = ['💀', '🦴', '🎭', '🕯️', '🔥', '👑', '🌑'];

/** Titles earned by final score, from the shallowest to the deepest. */
const RANKS: Record<Lang, [number, string][]> = {
  en: [[0, 'Hollowed Wretch'], [100, 'Undead Pilgrim'], [200, 'Ashen Wanderer'], [300, 'Knight of the Pit'], [400, 'Abyss Walker'], [500, 'Lord of the Depths'], [620, 'One in a Mortillion']],
  pl: [[0, 'Wydrążony Nędznik'], [100, 'Nieumarły Pielgrzym'], [200, 'Popielny Wędrowiec'], [300, 'Rycerz Czeluści'], [400, 'Kroczący w Otchłani'], [500, 'Władca Głębin'], [620, 'Jeden na mortylion']],
  uk: [[0, 'Спустошений Бідолаха'], [100, 'Немертвий Прочанин'], [200, 'Попелястий Мандрівник'], [300, 'Лицар Прірви'], [400, 'Той, хто ходить Безоднею'], [500, 'Володар Глибин'], [620, 'Один на мортильйон']],
};

function rankOf(points: number, lang: Lang): string {
  return RANKS[lang].filter(([min]) => points >= min).pop()![1];
}

export function shareText(kind: RunKind, id: string, turns: Turn[], lang: Lang): string {
  const pts = totalPoints(turns);
  const label = kind === 'pack' ? PACK_NAMES[id][lang] : `#${id}`;
  return [
    `MORTILLION ${label} · ${fmt(pts * METRES_PER_POINT, lang)} ${app.t.metres}`,
    turns.map((t) => TIER_EMOJI[t.tier]).join(''),
    rankOf(pts, lang),
    location.origin + location.pathname,
  ].join('\n');
}

route('results', async ([kind, id]) => {
  const t = app.t;
  const lang = app.lang;
  let turns: Turn[] | undefined;
  let prompts: Prompt[] | undefined;

  if (kind === 'daily') {
    turns = load().days.find((d) => d.day === Number(id))?.turns;
    // Look prompts up by id: the pool may have grown since that day.
    prompts = await loadAll();
  } else if (lastRun && lastRun.kind === kind && lastRun.id === id) {
    turns = lastRun.turns;
    prompts = lastRun.prompts;
  }
  if (!turns || !prompts) {
    queueMicrotask(() => go(''));
    return h('main', { class: 'screen' });
  }

  const pts = totalPoints(turns);
  app.scene.setMode('descent');
  app.scene.setDepth(pts * METRES_PER_POINT);

  const depthEl = h('span', { class: 'final-depth' }, `0 ${t.metres}`);
  setTimeout(() => countUp(depthEl, 0, pts * METRES_PER_POINT, 1800, (n) => `${fmt(n, lang)} ${t.metres}`), 500);

  const byId = new Map(prompts.map((p) => [p.id, p]));
  const shareBtn = h('button', { class: 'btn primary' }, t.share);
  const toast = h('span', { class: 'toast', hidden: true }, t.copied);
  shareBtn.onclick = async () => {
    sfx.click();
    const text = shareText(kind as RunKind, id, turns!, lang);
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast.hidden = false;
        setTimeout(() => (toast.hidden = true), 1800);
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  const actions = [shareBtn];
  if (kind === 'pack') actions.push(h('button', { class: 'btn', onclick: () => (sfx.kindle(), go(`pack/${id}`)) }, t.again));
  actions.push(h('button', { class: 'btn ghost', onclick: () => go('') }, t.home));

  const next = kind === 'daily' && Number(id) === dayNumber() ? h('p', { class: 'next-in' }, t.nextIn, ' ', countdown()) : null;

  return h(
    'main',
    { class: 'screen results' },
    h('div', { class: 'victory' }, h('span', null, t.descentComplete)),
    h('div', { class: 'anchor knight-gap', 'aria-hidden': 'true' }),
    h(
      'section',
      { class: 'panel summary enter' },
      h('p', { class: 'prompt-kicker' }, kind === 'pack' ? PACK_NAMES[id][lang] : `${t.day} #${id}${kind === 'archive' ? ' · ' + t.practice : ''}`),
      h('p', { class: 'label' }, t.finalDepth),
      depthEl,
      h('p', { class: 'of-max' }, `${t.ofMax} ${fmt(MAX_SCORE * METRES_PER_POINT, lang)} ${t.metres}`),
      h('p', { class: 'rank' }, rankOf(pts, lang)),
      h('div', { class: 'emoji-row', 'aria-hidden': 'true' }, turns.map((tn, i) => h('span', { style: { '--d': `${0.6 + i * 0.12}s`, '--tc': TIER_COLORS[tn.tier] } }, TIER_EMOJI[tn.tier]))),
      h('div', { class: 'actions' }, actions, toast),
      next,
    ),
    h(
      'section',
      { class: 'panel turns' },
      h('h3', null, t.yourTurns),
      h(
        'ol',
        null,
        turns.map((tn) => {
          const p = byId.get(tn.promptId);
          const ans = tn.answer && p?.answers.find((a) => a.names.en === tn.answer);
          return h(
            'li',
            { style: { '--tc': TIER_COLORS[tn.tier] } },
            h('span', { class: 'tq' }, p?.q[lang] ?? tn.promptId),
            h('span', { class: 'ta' }, ans ? ans.names[lang] : tn.guess ? h('s', null, tn.guess) : '—'),
            h('span', { class: 'tt' }, tierBadge(tn.tier), h('b', null, tn.points ? `+${tn.points}` : '0')),
          );
        }),
      ),
    ),
  );
});

