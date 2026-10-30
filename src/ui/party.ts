// Summon Signs: local pass-and-play for 2–6 players on one device. Everyone
// answers the same prompts in turn (the screen is hidden between players),
// then the round is revealed. Answers shared by several players are "echoes"
// and score half, so the rarest offering wins.

import { REMOTE } from '../account/config.ts';
import { syncFreeRuns } from '../account/gate.ts';
import { loadAll, loadPack } from '../data/packs/index.ts';
import type { L10n, Tier } from '../data/types.ts';
import { METRES_PER_POINT, SECONDS_PER_PROMPT, byDifficulty, shuffle } from '../engine/game.ts';
import { PACK_NAMES } from '../i18n/strings.ts';
import { themeList } from '../play/catalog.ts';
import { ApiError, isRetry, localSource, remoteSource, type PromptView, type Source, type Verdict } from '../play/source.ts';
import { TIER_COLORS } from '../render/scene.ts';
import { sfx } from '../render/sfx.ts';
import { app, banner, go, onLeave, route, tierBadge } from './app.ts';
import { fmt, h } from './dom.ts';
import { gateRun, showPaywall } from './account.ts';

const ROUNDS = 5;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
/** Phantom colours, after the series' summon signs. */
const PHANTOMS = ['#e8e2d0', '#f0c95e', '#6fa8ff', '#e0473d', '#7fd08a', '#c58cff'];

interface Offering {
  guess: string;
  /** English name of the matched answer (compares echoes), or null. */
  answer: string | null;
  names: L10n | null;
  tier: Tier | 0;
  points: number;
  echo: boolean;
}

interface Player {
  name: string;
  color: string;
  total: number;
}

let lastSetup: { names: string[]; pack: string } | null = null;

route('party', async () => setup(await themeList()));

function setup(themes: string[]): HTMLElement {
  const t = app.t;
  app.scene.setMode('bonfire');
  const names = lastSetup?.names.slice() ?? [`${t.phantom} 1`, `${t.phantom} 2`];
  let pack = lastSetup?.pack ?? 'all';

  const list = h('ol', { class: 'party-players' });
  const add = h('button', { class: 'btn small', type: 'button' }, `+ ${t.addPlayer}`);
  const paint = () => {
    list.replaceChildren(
      ...names.map((n, i) => {
        const input = h('input', { class: 'answer', value: n, maxlength: 18, 'aria-label': `${t.phantom} ${i + 1}` });
        input.oninput = () => (names[i] = input.value);
        const remove = h('button', { class: 'iconbtn', type: 'button', title: t.removePlayer, 'aria-label': t.removePlayer }, '×');
        remove.disabled = names.length <= MIN_PLAYERS;
        remove.onclick = () => {
          names.splice(i, 1);
          paint();
        };
        return h('li', { style: { '--pc': PHANTOMS[i] } }, h('span', { class: 'sign', 'aria-hidden': 'true' }), input, remove);
      }),
    );
    add.disabled = names.length >= MAX_PLAYERS;
  };
  add.onclick = () => {
    names.push(`${t.phantom} ${names.length + 1}`);
    paint();
    list.querySelectorAll('input')[names.length - 1]?.select();
  };
  paint();

  const select = h(
    'select',
    { class: 'answer party-pack', 'aria-label': t.pack },
    h('option', { value: 'all' }, t.allThemes),
    themes.map((id) => h('option', { value: id }, PACK_NAMES[id][app.lang])),
  );
  select.value = pack;
  select.onchange = () => (pack = select.value);

  const start = h('button', { class: 'btn primary', type: 'submit' }, t.begin);
  const form = h(
    'form',
    { class: 'panel party-setup' },
    h('p', { class: 'note' }, t.partyRules),
    list,
    add,
    h('label', { class: 'setting' }, h('span', null, t.pack), select),
    start,
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    const clean = names.map((n, i) => n.trim() || `${t.phantom} ${i + 1}`);
    lastSetup = { names: clean, pack };
    let src: Source;
    if (REMOTE) {
      // The server deals the prompts, judges every phantom and counts the run.
      start.disabled = true;
      try {
        src = await remoteSource('party', 'party', { seats: clean.length, pack: pack === 'all' ? undefined : pack });
        syncFreeRuns(src.freeLeft);
      } catch (err) {
        start.disabled = false;
        if (err instanceof ApiError && err.status === 402) showPaywall(err.data.resetAt as string | undefined, 'other');
        return;
      }
    } else {
      if (!gateRun('other')) return;
      const pool = pack === 'all' ? await loadAll() : await loadPack(pack);
      if (!pool.length) return;
      src = localSource({ kind: 'party', id: 'party', prompts: byDifficulty(shuffle(pool).slice(0, ROUNDS)), seats: clean.length });
    }
    sfx.kindle();
    app.root.lastElementChild?.replaceWith(
      play(
        clean.map((name, i) => ({ name, color: PHANTOMS[i], total: 0 })),
        src,
      ),
    );
  };

  return h(
    'main',
    { class: 'screen party' },
    h('h2', { class: 'screen-title' }, t.party),
    form,
    h('button', { class: 'btn ghost', onclick: () => go('') }, `← ${t.back}`),
  );
}

function play(players: Player[], src: Source): HTMLElement {
  const rounds = src.total ?? ROUNDS;
  const t = app.t;
  const lang = app.lang;
  let alive = true;
  onLeave(() => (alive = false));
  app.scene.setMode('journey');
  app.scene.setDepth(0, true);

  const stage = h('section', { class: 'panel party-stage' });
  const hud = h('div', { class: 'hud' });
  const screen = h('main', { class: 'screen game party' }, hud, h('div', { class: 'anchor knight-gap', 'aria-hidden': 'true' }), stage);

  const paintHud = (round: number) =>
    hud.replaceChildren(
      h('span', { class: 'hud-label' }, `${t.party} · ${t.round} ${round + 1}/${rounds}`),
      h(
        'span',
        { class: 'party-scores' },
        players.map((p) => h('span', { style: { color: p.color } }, `${p.name}: ${p.total}`)),
      ),
    );

  const show = (...children: (Node | string | null)[]) => {
    stage.replaceChildren(...children.filter((c): c is Node | string => c !== null));
    stage.classList.remove('enter');
    void stage.offsetWidth;
    stage.classList.add('enter');
  };

  /** Resolves when the button is pressed (or Enter, after a short guard). */
  const waitButton = (label: string, ...before: (Node | string | null)[]) =>
    new Promise<void>((resolve) => {
      const btn = h('button', { class: 'btn primary' }, label);
      const done = () => {
        removeEventListener('keydown', onKey);
        sfx.click();
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          done();
        }
      };
      btn.onclick = done;
      show(...before, btn);
      setTimeout(() => {
        if (!alive) return;
        btn.focus();
        addEventListener('keydown', onKey);
      }, 400);
      onLeave(() => removeEventListener('keydown', onKey));
    });

  /** One phantom's turn: keep guessing until a valid answer or the timer ends. */
  const ask = (pv: PromptView, player: Player) =>
    new Promise<Verdict | null>((resolve) => {
      const input = h('input', { class: 'answer', type: 'text', autocomplete: 'off', spellcheck: false, maxlength: 80, placeholder: t.placeholder, 'aria-label': t.placeholder });
      const bar = h('div', { class: 'stamina-fill' });
      const missEl = h('p', { class: 'miss', role: 'status' });
      const form = h('form', { class: 'answer-row' }, input, h('button', { class: 'btn primary', type: 'submit' }, t.submit));
      let done = false;
      let busy = false;
      const offer = async (g: string | null, final = false) => {
        if (done || busy) return;
        busy = true;
        const o = await src.answer(g);
        busy = false;
        if (!isRetry(o)) {
          done = true;
          return resolve(o);
        }
        if (final || o.capped) {
          const v = await src.answer(null);
          done = true;
          return resolve(isRetry(v) ? null : v);
        }
        input.value = '';
        input.classList.remove('shake');
        void input.offsetWidth;
        input.classList.add('shake');
        missEl.textContent = t.tryAgain;
        sfx.miss();
      };
      form.onsubmit = (e) => {
        e.preventDefault();
        if (input.value.trim()) void offer(input.value.trim());
      };
      show(
        h('p', { class: 'prompt-kicker' }, h('span', { style: { color: player.color } }, player.name)),
        h('h2', { class: 'question' }, pv.q[lang]),
        form,
        missEl,
        h('div', { class: 'stamina' }, h('div', { class: 'stamina-track' }, bar)),
      );
      input.focus();
      const start = performance.now() - pv.elapsedMs;
      const tick = (now: number) => {
        if (done || !alive) return;
        const left = Math.max(0, SECONDS_PER_PROMPT - (now - start) / 1000);
        bar.style.width = `${(left / SECONDS_PER_PROMPT) * 100}%`;
        bar.classList.toggle('low', left < 6);
        if (left <= 0) return void offer(input.value.trim() || null, true);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  const run = async () => {
    for (let r = 0; r < rounds && alive; r++) {
      let q = null as PromptView['q'] | null;
      paintHud(r);
      const offerings: Offering[] = [];
      for (const player of players) {
        await waitButton(t.ready, h('p', { class: 'handoff', style: { '--pc': player.color } }, t.yourTurn.replace('{name}', player.name)), h('p', { class: 'note' }, t.noPeeking));
        if (!alive) return;
        const pv = await src.next();
        if (!alive || !pv) return;
        if (!q) app.scene.spawnEnemy(r === rounds - 1);
        q = pv.q;
        const v = await ask(pv, player);
        if (!alive || !v) return;
        offerings.push({ guess: v.guess, answer: v.answer?.en ?? null, names: v.answer, tier: v.tier, points: v.points, echo: false });
      }

      // Shared answers echo: half points each.
      for (const o of offerings) {
        if (o.answer && offerings.filter((x) => x.answer === o.answer).length > 1) {
          o.echo = true;
          o.points = Math.floor(o.points / 2);
        }
      }
      players.forEach((p, i) => (p.total += offerings[i].points));
      const best = Math.max(...offerings.map((o) => o.tier));
      stage.replaceChildren();
      if (best) {
        await app.scene.kill(best);
        if (!alive) return;
        sfx.reward(best);
        app.scene.reward(best);
      } else {
        await app.scene.enemyStrike();
        if (!alive) return;
      }
      const leader = Math.max(...players.map((p) => p.total));
      app.scene.setDepth(leader * METRES_PER_POINT);
      paintHud(r);

      const rows = players.map((p, i) => {
        const o = offerings[i];
        const ans = o.names?.[lang] ?? null;
        return h(
          'li',
          { style: { '--tc': TIER_COLORS[o.tier], '--pc': p.color } },
          h('span', { class: 'pname' }, p.name),
          h('span', { class: 'ta' }, ans ?? (o.guess ? h('s', null, o.guess) : '—')),
          h('span', { class: 'tt' }, tierBadge(o.tier), o.echo ? h('em', { class: 'echo', title: t.echo }, '½') : null, h('b', null, `+${o.points}`)),
        );
      });
      await waitButton(
        r === rounds - 1 ? t.finish : t.next,
        h('p', { class: 'prompt-kicker' }, q?.[lang] ?? ''),
        h('ol', { class: 'party-reveal' }, rows),
        offerings.some((o) => o.echo) ? h('p', { class: 'note' }, t.echo) : null,
      );
    }
    if (!alive) return;

    const ranked = players.slice().sort((a, b) => b.total - a.total);
    sfx.complete();
    void banner(t.victoryFor.replace('{name}', ranked[0].name), 'victory', 2600);
    show(
      h('h3', { class: 'screen-title' }, t.standings),
      h(
        'ol',
        { class: 'party-final' },
        ranked.map((p, i) =>
          h('li', { style: { '--pc': p.color } }, h('span', { class: 'rank-n' }, `${i + 1}.`), h('span', { class: 'pname' }, p.name), h('b', null, `${fmt(p.total * METRES_PER_POINT, lang)} ${t.metres}`)),
        ),
      ),
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => go('party') }, t.again),
        h('button', { class: 'btn ghost', onclick: () => go('') }, t.home),
      ),
    );
  };

  setTimeout(() => void run(), 300);
  return screen;
}
