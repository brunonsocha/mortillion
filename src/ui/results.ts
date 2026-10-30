import { loadAll } from '../data/packs/index.ts';
import type { Lang } from '../data/types.ts';
import { ACHIEVEMENTS } from '../achievements.ts';
import { turnOf, viewOf, type TurnView } from '../play/source.ts';
import { MAX_SCORE, METRES_PER_POINT, dayNumber, totalPoints, type Turn } from '../engine/game.ts';
import { load } from '../engine/storage.ts';
import { VICTORY } from '../eggs.ts';
import { PACK_NAMES } from '../i18n/strings.ts';
import { shareCard } from './card.ts';
import { SKIP_COLOR, TIER_COLORS } from '../render/scene.ts';
import { sfx } from '../render/sfx.ts';
import { app, banner, go, route, tierBadge } from './app.ts';
import { countdown } from './home.ts';
import { say } from './maiden.ts';
import { resultEvent } from '../maiden-lines.ts';
import { countUp, fmt, h } from './dom.ts';
import { lastRun, type RunKind } from './game.ts';

/** A score worthy of the Kiln: an average of Lord of Cinder or better. */
const VICTORY_POINTS = 600;

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
  const label = kind === 'pack' || kind === 'endless' ? PACK_NAMES[id][lang] : `#${id}`;
  return [
    `MORTILLION ${label} · ${fmt(pts * METRES_PER_POINT, lang)} ${app.t.metres}`,
    turns.map((t) => (t.skipped ? '➖' : TIER_EMOJI[t.tier])).join(''),
    rankOf(pts, lang),
    location.origin + location.pathname,
  ].join('\n');
}

route('results', async ([kind, id]) => {
  const t = app.t;
  const lang = app.lang;
  let views: TurnView[] | undefined;
  let unlocked: string[] = [];

  if (lastRun && lastRun.kind === kind && lastRun.id === id) {
    views = lastRun.turns;
    unlocked = lastRun.unlocked;
    // Announce achievements once, not again on revisit.
    lastRun.unlocked = [];
  } else if (kind === 'daily') {
    const rec = load().days.find((d) => d.day === Number(id));
    if (rec?.views) views = rec.views;
    else if (rec) {
      // Older saves kept only compact turns: rebuild from bundled content.
      const byId = new Map((await loadAll()).map((p) => [p.id, p]));
      views = rec.turns.filter((x) => byId.has(x.promptId)).map((x) => viewOf(byId.get(x.promptId)!, x));
    }
  }
  if (!views) {
    queueMicrotask(() => go(''));
    return h('main', { class: 'screen' });
  }
  const turns: Turn[] = views.map(turnOf);
  // Achievements earned by this run, announced one after another, then
  // Liora's verdict on the journey (only right after playing it).
  const fresh = lastRun?.kind === kind && lastRun.id === id;
  void (async () => {
    await new Promise((r) => setTimeout(r, 2000));
    for (const key of unlocked) {
      const a = ACHIEVEMENTS.find((x) => x.key === key);
      if (!a) continue;
      sfx.reward(6);
      await banner(`${t.achievementUnlocked}: ${a.name[lang]}`, 'victory', 2600);
    }
    if (fresh && kind !== 'party' && location.hash.startsWith('#/results')) say(resultEvent(turns.reduce((n, x) => n + x.points, 0)));
  })();

  const pts = totalPoints(turns);
  const allDead = kind !== 'endless' && turns.every((tn) => !tn.tier && !tn.skipped);
  // The knight walks on to a camp at the end of the road, where Liora waits.
  app.scene.setDepth(pts * METRES_PER_POINT);
  app.scene.setMode('bonfire', pts * METRES_PER_POINT);

  const depthEl = h('span', { class: 'final-depth' }, `0 ${t.metres}`);
  setTimeout(() => countUp(depthEl, 0, pts * METRES_PER_POINT, 1800, (n) => `${fmt(n, lang)} ${t.metres}`), 500);

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

  const imageBtn = h('button', { class: 'btn' }, t.saveImage);
  imageBtn.onclick = async () => {
    sfx.click();
    const label = kind === 'pack' || kind === 'endless' ? PACK_NAMES[id][lang] : `${t.day} #${id}`;
    try {
      await shareCard(
        {
          label,
          depth: `${fmt(pts * METRES_PER_POINT, lang)} ${t.metres}`,
          rank: rankOf(pts, lang),
          turns: turns!,
          url: location.host,
        },
        `mortillion-${kind}-${id}.png`,
      );
    } catch {
      // Share sheet dismissed.
    }
  };
  const actions = [shareBtn, imageBtn];
  if (kind === 'pack') actions.push(h('button', { class: 'btn', onclick: () => (sfx.kindle(), go(`pack/${id}`)) }, t.again));
  if (kind === 'endless') actions.push(h('button', { class: 'btn', onclick: () => (sfx.kindle(), go('endless')) }, t.again));
  actions.push(h('button', { class: 'btn ghost', onclick: () => go('') }, t.home));

  const next = kind === 'daily' && Number(id) === dayNumber() ? h('p', { class: 'next-in' }, t.nextIn, ' ', countdown()) : null;

  return h(
    'main',
    { class: 'screen results' },
    h(
      'div',
      { class: `victory${allDead ? ' fallen' : ''}` },
      h('span', null, kind !== 'endless' && pts >= VICTORY_POINTS ? VICTORY[lang] : allDead ? t.youDied : t.descentComplete),
    ),
    h('div', { class: 'anchor knight-gap', 'aria-hidden': 'true' }),
    h(
      'section',
      { class: 'panel summary enter' },
      h('p', { class: 'prompt-kicker' }, kind === 'pack' || kind === 'endless' ? PACK_NAMES[id][lang] : `${t.day} #${id}${kind === 'archive' ? ' · ' + t.practice : ''}`),
      h('p', { class: 'label' }, t.finalDepth),
      depthEl,
      kind === 'endless'
        ? h('p', { class: 'of-max' }, `${turns.length} ${t.promptsFaced}`)
        : h('p', { class: 'of-max' }, `${t.ofMax} ${fmt(MAX_SCORE * METRES_PER_POINT, lang)} ${t.metres}`),
      h('p', { class: 'rank' }, rankOf(pts, lang)),
      h('div', { class: 'emoji-row', 'aria-hidden': 'true' }, turns.map((tn, i) => h('span', { style: { '--d': `${0.6 + i * 0.12}s`, '--tc': tn.skipped ? SKIP_COLOR : TIER_COLORS[tn.tier] } }, tn.skipped ? '➖' : TIER_EMOJI[tn.tier]))),
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
        views.map((v) =>
          h(
            'li',
            { style: { '--tc': v.skipped ? SKIP_COLOR : TIER_COLORS[v.tier] } },
            h(
              'details',
              null,
              h(
                'summary',
                null,
                h('span', { class: 'tq' }, v.q[lang]),
                h('span', { class: 'ta' }, v.answer ? v.answer[lang] : v.guess ? h('s', null, v.guess) : '—'),
                h('span', { class: 'tt' }, tierBadge(v.tier, v.skipped), h('b', null, v.points ? `+${v.points}` : '0')),
              ),
              h(
                'div',
                { class: 'answer-lists' },
                h('div', null, h('h4', null, t.commonest), h('ul', null, v.common.slice(0, 3).map((a) => h('li', null, a[lang])))),
                h('div', null, h('h4', null, t.rarest), h('ul', null, v.rare.slice(0, 3).map((a) => h('li', { class: 'rare' }, a[lang])))),
              ),
            ),
          ),
        ),
      ),
    ),
  );
});

