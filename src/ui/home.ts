import { SEALED, THEMES } from '../data/packs/index.ts';
import { METRES_PER_POINT, dateOfDay, dayNumber, msUntilNextDay } from '../engine/game.ts';
import { currentStreak, load } from '../engine/storage.ts';
import { PACK_NAMES, PACK_SUBS } from '../i18n/strings.ts';
import { sfx } from '../render/sfx.ts';
import { FIRE_KEEPER, SECRET_TEXT, SOAPSTONE } from '../eggs.ts';
import { app, banner, go, onLeave, route, showHelp } from './app.ts';
import { fmt, h } from './dom.ts';
import { icon } from './icons.ts';

export function countdown(): HTMLElement {
  const el = h('span', { class: 'mono' });
  const tick = () => {
    const ms = msUntilNextDay();
    const s = Math.floor(ms / 1000);
    el.textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  };
  tick();
  const id = setInterval(tick, 1000);
  onLeave(() => clearInterval(id));
  return el;
}

function dateLabel(day: number): string {
  return dateOfDay(day).toLocaleDateString(app.lang, { day: 'numeric', month: 'long', year: 'numeric' });
}

route('', () => {
  const t = app.t;
  const s = load();
  const today = dayNumber();
  const done = s.days.find((d) => d.day === today);
  const resuming = s.pending?.day === today && !done;
  app.scene.setMode('bonfire');

  if (!s.seenHelp) setTimeout(showHelp, 600);

  const dailyCard = done
    ? h(
        'button',
        { class: 'card daily done', onclick: () => (sfx.click(), go(`results/daily/${today}`)) },
        h('span', { class: 'card-kicker' }, `${t.day} #${today} · ${t.dailyDone}`),
        h('span', { class: 'card-title' }, `${fmt(done.points * METRES_PER_POINT, app.lang)} ${t.metres}`),
        h('span', { class: 'card-sub' }, t.nextIn, ' ', countdown()),
      )
    : h(
        'button',
        { class: 'card daily', onclick: () => (sfx.kindle(), go('daily')) },
        h('span', { class: 'card-kicker' }, `${t.day} #${today} · ${dateLabel(today)}`),
        h('span', { class: 'card-title' }, resuming ? t.dailyResume : t.daily),
        h('span', { class: 'card-sub' }, t.dailySub),
      );

  const best = Math.max(0, ...s.days.map((d) => d.points));
  return h(
    'main',
    { class: 'screen home' },
    h(
      'section',
      { class: 'hero' },
      h('h1', { class: 'title', 'data-text': 'MORTILLION', onclick: tapTitle }, 'MORTILLION'),
      h('p', { class: 'tagline' }, `— ${t.tagline} —`),
      h('p', { class: 'blurb' }, t.blurb),
    ),
    h('div', { class: 'anchor fire-gap' }, soapstone()),
    h(
      'section',
      { class: 'menu' },
      dailyCard,
      h(
        'div',
        { class: 'row2' },
        h('button', { class: 'card', onclick: () => (sfx.click(), go('themes')) }, h('span', { class: 'card-title sm' }, t.themes), h('span', { class: 'card-sub' }, t.themesSub)),
        h('button', { class: 'card', onclick: () => (sfx.click(), go('archive')) }, h('span', { class: 'card-title sm' }, t.archive), h('span', { class: 'card-sub' }, t.archiveSub)),
      ),
      h(
        'div',
        { class: 'stats' },
        stat(t.streak, String(currentStreak(today))),
        stat(t.best, `${fmt(best * METRES_PER_POINT, app.lang)} ${t.metres}`),
        stat(t.plays, String(s.days.length)),
      ),
    ),
  );
});

/** An orange soapstone message left on the floor by another "player". */
function soapstone(): HTMLElement {
  const msg = SOAPSTONE[Math.floor(Math.random() * SOAPSTONE.length)][app.lang];
  const appraised = 3 + Math.floor(Math.random() * 400);
  const bubble = h(
    'div',
    { class: 'soap-bubble', hidden: true, role: 'note' },
    h('p', null, msg),
    h('span', null, `${app.t.appraised} ×${appraised}`),
  );
  const rune = h('button', { class: 'soap-rune', 'aria-label': app.t.readMessage, title: app.t.readMessage }, '⟡');
  rune.onclick = () => {
    sfx.click();
    bubble.hidden = !bubble.hidden;
  };
  return h('div', { class: 'soapstone' }, bubble, rune);
}

let titleTaps = 0;
function tapTitle() {
  titleTaps++;
  if (titleTaps % 5 === 0) {
    const lines = FIRE_KEEPER;
    void banner(lines[(titleTaps / 5 - 1) % lines.length][app.lang], 'quote', 3200);
  }
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konami = 0;
addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
  konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (konami === KONAMI.length) {
    konami = 0;
    app.scene.praise();
    sfx.praise();
    void banner(SECRET_TEXT.sun[app.lang], 'sun', 2400);
  }
});

function stat(label: string, value: string) {
  return h('div', { class: 'stat' }, h('b', null, value), h('span', null, label));
}

route('themes', () => {
  const t = app.t;
  const s = load();
  app.scene.setMode('bonfire');
  return h(
    'main',
    { class: 'screen themes' },
    h('h2', { class: 'screen-title' }, t.themes),
    h(
      'div',
      { class: 'grid' },
      THEMES.map((id) =>
        h(
          'button',
          { class: 'card theme', onclick: () => (sfx.kindle(), go(`pack/${id}`)) },
          h('img', { class: 'pix', src: icon(id), alt: '' }),
          h('span', { class: 'card-title sm' }, PACK_NAMES[id][app.lang]),
          h('span', { class: 'card-kicker' }, PACK_SUBS[id][app.lang]),
          h(
            'span',
            { class: 'card-sub' },
            s.packs[id] ? `${t.bestDepth}: ${fmt(s.packs[id].best * METRES_PER_POINT, app.lang)} ${t.metres} · ${t.plays}: ${s.packs[id].plays}` : '—',
          ),
        ),
      ),
      SEALED.map((id) =>
        h(
          'div',
          { class: 'card theme sealed', 'aria-disabled': 'true' },
          h('img', { class: 'pix', src: icon('sealed'), alt: '' }),
          h('span', { class: 'card-title sm' }, PACK_NAMES[id][app.lang]),
          h('span', { class: 'card-kicker' }, PACK_SUBS[id][app.lang]),
          h('span', { class: 'card-sub' }, t.comingSoon),
        ),
      ),
    ),
    h('button', { class: 'btn ghost', onclick: () => go('') }, `← ${t.back}`),
  );
});

route('archive', () => {
  const t = app.t;
  const s = load();
  const today = dayNumber();
  app.scene.setMode('bonfire');
  const days = [];
  for (let d = today - 1; d >= 1 && days.length < 60; d--) days.push(d);
  return h(
    'main',
    { class: 'screen archive' },
    h('h2', { class: 'screen-title' }, t.archive),
    h('p', { class: 'note' }, t.practice),
    days.length
      ? h(
          'ul',
          { class: 'archive-list' },
          days.map((d) => {
            const rec = s.days.find((x) => x.day === d);
            return h(
              'li',
              null,
              h(
                'button',
                { class: 'card row', onclick: () => (sfx.kindle(), go(rec ? `results/daily/${d}` : `archive-run/${d}`)) },
                h('span', { class: 'card-title sm' }, `#${d}`),
                h('span', { class: 'card-sub' }, dateLabel(d)),
                h('span', { class: 'card-kicker' }, rec ? `${fmt(rec.points * METRES_PER_POINT, app.lang)} ${t.metres}` : t.notPlayed),
              ),
            );
          }),
        )
      : h('p', { class: 'empty' }, '…'),
    h('button', { class: 'btn ghost', onclick: () => go('') }, `← ${t.back}`),
  );
});
