// Daily and Endless leaderboards, served by the game server. Only signed-in
// players rank; everyone can look.

import { callGame } from '../account/api.ts';
import { signedIn } from '../account/session.ts';
import { ACHIEVEMENTS } from '../achievements.ts';
import { METRES_PER_POINT, dayNumber } from '../engine/game.ts';
import { sfx } from '../render/sfx.ts';
import { showSignIn } from './account.ts';
import { app, go, route } from './app.ts';
import { fmt, h } from './dom.ts';

interface Row {
  rank: number;
  name: string;
  points: number;
  me: boolean;
}

interface Board {
  top: Row[];
  me: Row | null;
  players: number;
}

type Tab = 'today' | 'yesterday' | 'endless';

route('leaderboard', ([tab]) => {
  const t = app.t;
  const current: Tab = tab === 'yesterday' || tab === 'endless' ? tab : 'today';
  app.scene.setMode('bonfire');

  const list = h('div', { class: 'board' }, h('p', { class: 'loading' }, t.loading));
  const body = current === 'endless' ? { board: 'endless' } : { board: 'daily', day: dayNumber() - (current === 'yesterday' ? 1 : 0) };
  void callGame<Board>('leaderboard', body)
    .then((b) => {
      const m = (pts: number) => `${fmt(pts * METRES_PER_POINT, app.lang)} ${t.metres}`;
      const row = (r: Row) =>
        h('li', { class: r.me ? 'me' : '' }, h('span', { class: 'rank-n' }, `${r.rank}.`), h('span', { class: 'pname' }, r.name, r.me ? h('em', null, ` (${t.you})`) : null), h('b', null, m(r.points)));
      list.replaceChildren(
        b.top.length ? h('ol', { class: 'board-list' }, b.top.map(row)) : h('p', { class: 'empty' }, t.noEntries),
        ...(b.me && !b.top.some((r) => r.me) ? [h('ol', { class: 'board-list mine' }, row(b.me))] : []),
        h('p', { class: 'note' }, `${b.players} ${t.players}`),
      );
    })
    .catch(() => list.replaceChildren(h('p', { class: 'empty' }, t.loadFailed)));

  const tabBtn = (id: Tab, label: string) =>
    h('button', { class: `tab ${id === current ? 'on' : ''}`, 'aria-pressed': String(id === current), onclick: () => (sfx.click(), go(`leaderboard/${id}`)) }, label);

  return h(
    'main',
    { class: 'screen leaderboard' },
    h('h2', { class: 'screen-title' }, t.leaderboard),
    h('div', { class: 'tabs', role: 'group' }, tabBtn('today', t.boardToday), tabBtn('yesterday', t.boardYesterday), tabBtn('endless', t.boardEndless)),
    h('section', { class: 'panel' }, list),
    signedIn() ? null : h('div', { class: 'center-col' }, h('p', { class: 'note' }, t.signInToRank), h('button', { class: 'btn primary', onclick: () => showSignIn() }, t.signIn)),
    h('button', { class: 'btn ghost', onclick: () => go('') }, `← ${t.back}`),
  );
});

/** The achievements block in the Status screen (signed-in players). */
export function achievementsSection(): HTMLElement {
  const t = app.t;
  const box = h('div', { class: 'ach' }, h('h3', null, t.achievements));
  if (!signedIn()) {
    box.append(h('p', { class: 'note' }, t.achievementsSignIn));
    return box;
  }
  const grid = h('ul', { class: 'ach-grid' }, h('li', { class: 'muted' }, t.loading));
  box.append(grid);
  void callGame<{ achievements: { key: string }[] }>('stats')
    .then((s) => {
      const owned = new Set(s.achievements.map((a) => a.key));
      grid.replaceChildren(
        ...ACHIEVEMENTS.map((a) =>
          h(
            'li',
            { class: owned.has(a.key) ? 'got' : 'locked', title: a.desc[app.lang] },
            h('b', null, a.name[app.lang]),
            h('span', null, a.desc[app.lang]),
          ),
        ),
      );
    })
    .catch(() => grid.replaceChildren(h('li', { class: 'muted' }, t.loadFailed)));
  return box;
}
