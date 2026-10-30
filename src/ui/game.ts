import { THEMES, loadAll, loadPack } from '../data/packs/index.ts';
import type { Prompt } from '../data/types.ts';
import {
  METRES_PER_POINT, PROMPTS_PER_RUN, SECONDS_PER_PROMPT, TIER_POINTS, byDifficulty, dailyPrompts, endlessDealer, dayNumber, shuffle, totalPoints, type Turn,
} from '../engine/game.ts';
import { findAnswer } from '../engine/match.ts';
import { load, recordDay, recordPack, save } from '../engine/storage.ts';
import { PACK_NAMES } from '../i18n/strings.ts';
import { TIER_COLORS } from '../render/scene.ts';
import { sfx } from '../render/sfx.ts';
import { BONFIRE_LIT, PATCHES, SECRET_TEXT, quipFor, secretOf, zoneAt } from '../eggs.ts';
import { app, banner, go, onLeave, route, tierBadge } from './app.ts';
import { countUp, fmt, h, wait } from './dom.ts';
import { icon } from './icons.ts';
import { gateRun } from './account.ts';

export type RunKind = 'daily' | 'pack' | 'archive' | 'endless';

export interface Run {
  kind: RunKind;
  /** Day number for daily/archive runs, pack id for pack runs, 'endless'. */
  id: string;
  prompts: Prompt[];
  turns: Turn[];
  /** Endless only: remaining Estus flasks and the source of further prompts. */
  lives?: number;
  draw?: () => Prompt;
}

/** Estus flasks at the start of an Endless Abyss run. */
export const ENDLESS_LIVES = 3;


/** The most recent finished run, for the results screen. */
export let lastRun: Run | null = null;

const recentPackPrompts = new Map<string, string[]>();

/** Draws seven prompts from a pack, avoiding the ones seen in the last runs. */
function drawFromPack(pack: string, prompts: Prompt[]): Prompt[] {
  const recent = recentPackPrompts.get(pack) ?? [];
  const fresh = shuffle(prompts.filter((p) => !recent.includes(p.id)));
  const rest = shuffle(prompts.filter((p) => recent.includes(p.id)));
  const picked = byDifficulty([...fresh, ...rest].slice(0, PROMPTS_PER_RUN));
  recentPackPrompts.set(pack, [...recent, ...picked.map((p) => p.id)].slice(-Math.max(0, prompts.length - PROMPTS_PER_RUN)));
  return picked;
}

function loading(): HTMLElement {
  return h('main', { class: 'screen center' }, h('p', { class: 'loading' }, app.t.loading));
}

function empty(): HTMLElement {
  return h('main', { class: 'screen center' }, h('p', { class: 'empty' }, '…'), h('button', { class: 'btn', onclick: () => go('') }, app.t.home));
}

route('daily', async () => {
  const today = dayNumber();
  const s = load();
  if (s.days.some((d) => d.day === today)) {
    queueMicrotask(() => go(`results/daily/${today}`));
    return loading();
  }
  const pool = await loadAll();
  if (!pool.length) return empty();
  // A run in progress keeps its prompts even if content changed meanwhile.
  const resume = s.pending?.day === today && s.pending.ids?.length ? s.pending : null;
  const byId = new Map(pool.map((p) => [p.id, p]));
  const pinned = resume?.ids.map((id) => byId.get(id)).filter((p): p is Prompt => !!p);
  const prompts = pinned?.length === PROMPTS_PER_RUN ? pinned : dailyPrompts(pool, today);
  const turns = pinned?.length === PROMPTS_PER_RUN ? resume!.turns.slice(0, PROMPTS_PER_RUN) : [];
  return play({ kind: 'daily', id: String(today), prompts, turns });
});

/** Sends the player home (with the paywall) if today's free runs are spent. */
function blocked(): HTMLElement | null {
  if (gateRun()) return null;
  queueMicrotask(() => go(''));
  return loading();
}

route('archive-run', async ([d]) => {
  const day = Number(d);
  if (!(day >= 1 && day < dayNumber())) return empty();
  const stop = blocked();
  if (stop) return stop;
  const pool = await loadAll();
  if (!pool.length) return empty();
  return play({ kind: 'archive', id: String(day), prompts: dailyPrompts(pool, day), turns: [] });
});

route('endless', async () => {
  const stop = blocked();
  if (stop) return stop;
  const pool = await loadAll();
  if (!pool.length) return empty();
  const draw = endlessDealer(pool, Math.random);
  return play({ kind: 'endless', id: 'endless', prompts: [], turns: [], lives: ENDLESS_LIVES, draw });
});

route('pack', async ([id]) => {
  if (!THEMES.includes(id)) return empty();
  const stop = blocked();
  if (stop) return stop;
  const prompts = await loadPack(id);
  if (!prompts.length) return empty();
  return play({ kind: 'pack', id, prompts: drawFromPack(id, prompts), turns: [] });
});

function difficultyBadge(d: number): HTMLElement {
  const label = app.t.difficulty[d];
  return h(
    'span',
    { class: `diff d${d}`, title: label, 'aria-label': label },
    Array.from({ length: d }, () => h('img', { src: icon('skull'), alt: '' })),
    h('span', null, label),
  );
}

function runLabel(run: Run): string {
  if (run.kind === 'pack' || run.kind === 'endless') return PACK_NAMES[run.id][app.lang];
  return `${app.t.day} #${run.id}${run.kind === 'archive' ? ' · ' + app.t.archive : ''}`;
}

function play(run: Run): HTMLElement {
  const t = app.t;
  const lang = app.lang;
  let alive = true;
  onLeave(() => (alive = false));

  app.scene.setMode('descent');
  app.scene.setDepth(totalPoints(run.turns) * METRES_PER_POINT, run.turns.length > 0);

  const endless = run.kind === 'endless';
  const pips = endless
    ? h(
        'ol',
        { class: 'flasks', 'aria-label': t.estus },
        Array.from({ length: ENDLESS_LIVES }, () => h('li', null, h('img', { src: icon('estus'), alt: '' }))),
      )
    : h(
        'ol',
        { class: 'pips', 'aria-label': t.prompt },
        run.prompts.map(() => h('li', { class: 'pip' })),
      );
  const depthEl = h('b', { class: 'depth-num' }, `0 ${t.metres}`);
  const kicker = h('span', { class: 'prompt-kicker' });
  const question = h('h2', { class: 'question' });
  const input = h('input', {
    class: 'answer',
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    enterkeyhint: 'send',
    maxlength: 80,
    placeholder: t.placeholder,
    'aria-label': t.placeholder,
  });
  const submit = h('button', { class: 'btn primary', type: 'submit' }, t.submit);
  const form = h('form', { class: 'answer-row' }, input, submit);
  const bar = h('div', { class: 'stamina-fill' });
  const secs = h('span', { class: 'stamina-secs' });
  const giveUp = h('button', { class: 'linkbtn', type: 'button' }, t.skip);
  const ask = h(
    'section',
    { class: 'ask panel', hidden: true },
    kicker,
    question,
    form,
    h('div', { class: 'stamina', role: 'timer' }, h('div', { class: 'stamina-track' }, bar), secs),
    giveUp,
  );
  const reveal = h('section', { class: 'reveal panel', hidden: true, 'aria-live': 'polite' });
  const died = h('div', { class: 'died', hidden: true, style: { '--chars': String(t.youDied.length) } }, h('span', null, t.youDied));

  const screen = h(
    'main',
    { class: 'screen game' },
    h('div', { class: 'hud' }, h('span', { class: 'hud-label' }, runLabel(run)), pips, h('span', { class: 'hud-depth' }, t.depth, ' ', depthEl)),
    h('div', { class: 'anchor knight-gap', 'aria-hidden': 'true' }),
    ask,
    reveal,
    died,
  );

  const points = () => totalPoints(run.turns);
  const paintPips = () => {
    if (endless) {
      pips.querySelectorAll('li').forEach((li, i) => li.classList.toggle('empty', i >= run.lives!));
      pips.setAttribute('title', `${t.estus}: ${run.lives}`);
      return;
    }
    pips.querySelectorAll('.pip').forEach((p, i) => {
      const turn = run.turns[i];
      p.className = 'pip' + (i === run.turns.length ? ' current' : '');
      if (turn) {
        p.classList.add('done');
        (p as HTMLElement).style.setProperty('--tc', TIER_COLORS[turn.tier]);
        p.setAttribute('title', `${turn.tier ? '+' + turn.points : '✕'}`);
      }
    });
  };
  const paintDepth = (from: number) => {
    countUp(depthEl, from * METRES_PER_POINT, points() * METRES_PER_POINT, 900, (n) => `${fmt(n, lang)} ${t.metres}`);
  };
  paintDepth(points());
  paintPips();

  const persistPending = (extra: Turn[] = []) => {
    if (run.kind === 'daily') {
      save({ pending: { day: Number(run.id), ids: run.prompts.map((p) => p.id), turns: [...run.turns, ...extra] } });
    }
  };

  async function next() {
    if (!alive) return;
    const i = run.turns.length;
    if (endless) {
      if (run.lives! <= 0) return finish();
      if (i >= run.prompts.length) run.prompts.push(run.draw!());
    }
    if (i >= run.prompts.length) return finish();
    const prompt = run.prompts[i];

    // Count the prompt as lost until answered, so reloading can't reroll it.
    persistPending([{ promptId: prompt.id, guess: '', answer: null, tier: 0, points: 0 }]);

    kicker.replaceChildren(endless ? `${t.prompt} ${i + 1}` : `${t.prompt} ${i + 1} / ${run.prompts.length}`, difficultyBadge(prompt.d));
    question.textContent = prompt.q[lang];
    input.value = '';
    input.disabled = false;
    submit.disabled = false;
    reveal.hidden = true;
    ask.hidden = false;
    ask.classList.remove('enter');
    void ask.offsetWidth;
    ask.classList.add('enter');
    paintPips();
    input.focus();

    const guess = await countdown(prompt);
    if (!alive) return;
    await answer(prompt, guess);
  }

  function countdown(prompt: Prompt): Promise<string | null> {
    return new Promise((resolve) => {
      let start = performance.now();
      let lastSec = SECONDS_PER_PROMPT;
      // Practice modes pause while the tab is hidden; the daily keeps running
      // so it can't be used to look answers up.
      let hiddenAt = 0;
      const onVisibility = () => {
        if (run.kind === 'daily') return;
        if (document.hidden) hiddenAt = performance.now();
        else if (hiddenAt) {
          start += performance.now() - hiddenAt;
          hiddenAt = 0;
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      let done = false;
      const end = (v: string | null) => {
        if (done) return;
        done = true;
        document.removeEventListener('visibilitychange', onVisibility);
        form.onsubmit = null;
        giveUp.onclick = null;
        resolve(v);
      };
      form.onsubmit = (e) => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v) {
          input.classList.remove('shake');
          void input.offsetWidth;
          input.classList.add('shake');
          return;
        }
        // Secret phrases trigger an easter egg instead of being offered,
        // unless they happen to be a valid answer for this prompt.
        const secret = secretOf(v);
        if (secret && !findAnswer(prompt, v)) {
          input.value = '';
          if (secret === 'sun') {
            app.scene.praise();
            sfx.praise();
          }
          void banner(SECRET_TEXT[secret][lang], secret === 'sun' ? 'sun' : 'quote', 2400);
          return;
        }
        end(v);
      };
      giveUp.onclick = () => end(null);
      const tick = (now: number) => {
        if (done || !alive) return;
        if (hiddenAt) return void requestAnimationFrame(tick);
        const left = Math.max(0, SECONDS_PER_PROMPT - (now - start) / 1000);
        bar.style.width = `${(left / SECONDS_PER_PROMPT) * 100}%`;
        bar.classList.toggle('low', left < 6);
        const sec = Math.ceil(left);
        secs.textContent = String(sec);
        if (sec !== lastSec) {
          lastSec = sec;
          if (sec <= 5 && sec > 0) sfx.tick();
        }
        if (left <= 0) return end(input.value.trim() || null);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function answer(prompt: Prompt, guess: string | null) {
    input.disabled = true;
    submit.disabled = true;
    const match = guess ? findAnswer(prompt, guess) : null;
    const before = points();
    const turn: Turn = match
      ? { promptId: prompt.id, guess: guess!, answer: match.answer.names.en, tier: match.answer.tier, points: TIER_POINTS[match.answer.tier] }
      : { promptId: prompt.id, guess: guess ?? '', answer: null, tier: 0, points: 0 };
    run.turns.push(turn);
    persistPending();
    paintPips();

    let reason: string | null = null;
    if (match) {
      sfx.reward(match.answer.tier);
      app.scene.reward(match.answer.tier);
      app.scene.setDepth(points() * METRES_PER_POINT);
      paintDepth(before);
      const from = zoneAt(before * METRES_PER_POINT);
      const to = zoneAt(points() * METRES_PER_POINT);
      if (to !== from) void wait(700).then(() => { if (alive) void banner(to.name[lang], 'zone', 3000); });
    } else {
      if (endless) run.lives! -= 1;
      paintPips();
      reason = guess ? quipFor(guess, lang) ?? (Math.random() < 0.04 ? PATCHES[lang] : null) : null;
      app.scene.setHollow(run.turns.filter((x) => !x.tier).length >= 3);
      sfx.death();
      app.scene.die();
      died.hidden = false;
      died.classList.remove('show');
      void died.offsetWidth;
      died.classList.add('show');
      await wait(app.scene.motion ? 2300 : 900);
      if (!alive) return;
      died.hidden = true;
    }

    showReveal(prompt, turn, match?.answer.names[lang] ?? null, reason);
  }

  function showReveal(prompt: Prompt, turn: Turn, acceptedAs: string | null, reason: string | null) {
    const last = endless ? run.lives! <= 0 : run.turns.length >= run.prompts.length;
    const common = prompt.answers.filter((a) => a.tier === 1).slice(0, 4);
    const rare = shuffle(prompt.answers.filter((a) => a.tier === 6)).slice(0, 4);
    const cont = h('button', { class: 'btn primary' }, last ? t.finish : t.next);
    const verdict = turn.tier
      ? h('div', { class: `verdict stamp t${turn.tier}` }, tierBadge(turn.tier), h('span', { class: 'gain' }, `+${turn.points} ${t.points}`))
      : h('div', { class: 'verdict dead' }, h('span', { class: 'dead-reason' }, reason ?? (turn.guess ? t.notFound : t.timeUp)));

    reveal.replaceChildren(
      h('p', { class: 'prompt-kicker' }, prompt.q[lang]),
      verdict,
      h(
        'p',
        { class: 'offered' },
        turn.guess ? [t.youSaid, ': ', h('q', null, turn.guess)] : t.nothing,
        acceptedAs && acceptedAs.toLowerCase() !== turn.guess.toLowerCase() ? [' → ', h('b', null, acceptedAs)] : null,
      ),
      h(
        'div',
        { class: 'answer-lists' },
        h('div', null, h('h4', null, t.commonest), h('ul', null, common.map((a) => h('li', null, a.names[lang])))),
        h('div', null, h('h4', null, t.rarest), h('ul', null, rare.map((a) => h('li', { class: 'rare' }, a.names[lang])))),
      ),
      cont,
    );
    ask.hidden = true;
    reveal.hidden = false;
    reveal.classList.remove('enter');
    void reveal.offsetWidth;
    reveal.classList.add('enter');

    const proceed = () => {
      removeEventListener('keydown', onKey);
      sfx.click();
      void next();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        proceed();
      }
    };
    cont.onclick = proceed;
    // Delay so the Enter that submitted the answer doesn't skip the reveal.
    setTimeout(() => {
      if (!alive || reveal.hidden) return;
      cont.focus();
      addEventListener('keydown', onKey);
    }, 450);
    onLeave(() => removeEventListener('keydown', onKey));
  }

  function finish() {
    const pts = points();
    if (run.kind === 'daily') recordDay(Number(run.id), run.turns, pts);
    if (run.kind === 'pack' || endless) recordPack(run.id, pts);
    lastRun = run;
    sfx.complete();
    go(`results/${run.kind}/${run.id}`);
  }

  app.scene.setHollow(run.turns.filter((x) => !x.tier).length >= 3);
  if (run.kind === 'daily' && run.turns.length === 0) {
    sfx.kindle();
    void banner(BONFIRE_LIT[lang], 'lit', 2000).then(() => alive && void next());
  } else setTimeout(() => void next(), 350);
  return screen;
}
