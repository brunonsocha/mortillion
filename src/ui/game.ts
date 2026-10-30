import { REMOTE } from '../account/config.ts';
import { syncFreeRuns, type Bucket } from '../account/gate.ts';
import { THEMES, loadAll, loadPack } from '../data/packs/index.ts';
import type { Prompt } from '../data/types.ts';
import {
  METRES_PER_POINT, PROMPTS_PER_RUN, SECONDS_PER_PROMPT, byDifficulty, dailyPrompts, endlessDealer, dayNumber, shuffle,
} from '../engine/game.ts';
import { load, recordDay, recordPack, save } from '../engine/storage.ts';
import { PACK_NAMES } from '../i18n/strings.ts';
import {
  ApiError, isRetry, localSource, remoteSource, turnOf, type PromptView, type RunKind, type Source, type TurnView, type Verdict,
} from '../play/source.ts';
import { SKIP_COLOR, TIER_COLORS } from '../render/scene.ts';
import { sfx } from '../render/sfx.ts';
import { BONFIRE_LIT, PATCHES, SECRET_TEXT, quipFor, secretOf, zoneAt } from '../eggs.ts';
import { gateRun, showPaywall } from './account.ts';
import { dismissMaiden, say } from './maiden.ts';
import { app, banner, go, onLeave, route, tierBadge } from './app.ts';
import { countUp, fmt, h, wait } from './dom.ts';
import { icon } from './icons.ts';

export type { RunKind };

/** Estus flasks at the start of an Endless Road run. */
export const ENDLESS_LIVES = 3;

/** The most recent finished run, for the results screen. */
export let lastRun: { kind: RunKind; id: string; turns: TurnView[]; unlocked: string[] } | null = null;

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

/** Sends the player home (with the paywall) if today's free runs are spent. */
function blocked(bucket: Bucket): HTMLElement | null {
  if (gateRun(bucket)) return null;
  queueMicrotask(() => go(''));
  return loading();
}

/**
 * Starts a run on the game server. A spent quota (402) sends the player home
 * with the paywall; any other failure surfaces as the reload screen.
 */
async function remote(kind: RunKind, id: string, start: Record<string, unknown>): Promise<HTMLElement> {
  try {
    const src = await remoteSource(kind, id, start);
    syncFreeRuns(src.freeLeft, kind === 'pack' ? `pack:${id}` : 'other');
    if (src.finished) {
      // A daily already finished elsewhere (another tab or device).
      finishRun(src, []);
      return loading();
    }
    return play(src);
  } catch (e) {
    if (e instanceof ApiError && e.status === 402) {
      const bucket = (e.data.bucket as Bucket | undefined) ?? 'other';
      syncFreeRuns(0, bucket);
      queueMicrotask(() => go(''));
      setTimeout(() => showPaywall(e.data.resetAt as string | undefined, bucket), 80);
      return loading();
    }
    throw e;
  }
}

route('daily', async () => {
  const today = dayNumber();
  const s = load();
  if (s.days.some((d) => d.day === today)) {
    queueMicrotask(() => go(`results/daily/${today}`));
    return loading();
  }
  if (REMOTE) return remote('daily', String(today), { day: today });
  const pool = await loadAll();
  if (!pool.length) return empty();
  // A run in progress keeps its prompts even if content changed meanwhile.
  const resume = s.pending?.day === today && s.pending.ids?.length ? s.pending : null;
  const byId = new Map(pool.map((p) => [p.id, p]));
  const pinned = resume?.ids.map((id) => byId.get(id)).filter((p): p is Prompt => !!p);
  const ok = pinned?.length === PROMPTS_PER_RUN;
  return play(localSource({ kind: 'daily', id: String(today), prompts: ok ? pinned! : dailyPrompts(pool, today), turns: ok ? resume!.turns.slice(0, PROMPTS_PER_RUN) : [] }));
});

route('archive-run', async ([d]) => {
  const day = Number(d);
  if (!(day >= 1 && day < dayNumber())) return empty();
  if (REMOTE) return remote('archive', String(day), { day });
  const stop = blocked('other');
  if (stop) return stop;
  const pool = await loadAll();
  if (!pool.length) return empty();
  return play(localSource({ kind: 'archive', id: String(day), prompts: dailyPrompts(pool, day) }));
});

route('endless', async () => {
  if (REMOTE) return remote('endless', 'endless', {});
  const stop = blocked('other');
  if (stop) return stop;
  const pool = await loadAll();
  if (!pool.length) return empty();
  return play(localSource({ kind: 'endless', id: 'endless', prompts: [], lives: ENDLESS_LIVES, draw: endlessDealer(pool, Math.random) }));
});

route('pack', async ([id]) => {
  if (REMOTE) return remote('pack', id, { pack: id });
  if (!THEMES.includes(id)) return empty();
  const stop = blocked(`pack:${id}`);
  if (stop) return stop;
  const prompts = await loadPack(id);
  if (!prompts.length) return empty();
  return play(localSource({ kind: 'pack', id, prompts: drawFromPack(id, prompts) }));
});

export function difficultyBadge(d: number): HTMLElement {
  const label = app.t.difficulty[d];
  return h(
    'span',
    { class: `diff d${d}`, title: label, 'aria-label': label },
    Array.from({ length: d }, () => h('img', { src: icon('skull'), alt: '' })),
    h('span', null, label),
  );
}

function runLabel(src: Source): string {
  if (src.kind === 'pack' || src.kind === 'endless') return PACK_NAMES[src.id][app.lang];
  return `${app.t.day} #${src.id}${src.kind === 'archive' ? ' · ' + app.t.archive : ''}`;
}

/** Records a finished run locally and moves to its results. */
function finishRun(src: Source, unlocked: string[]) {
  const turns = src.turns.map(turnOf);
  const pts = turns.reduce((a, t) => a + t.points, 0);
  if (src.kind === 'daily') recordDay(Number(src.id), turns, pts, src.turns);
  if (src.kind === 'pack' || src.kind === 'endless') recordPack(src.id, pts);
  lastRun = { kind: src.kind, id: src.id, turns: src.turns, unlocked };
  go(`results/${src.kind}/${src.id}`);
}

function play(src: Source): HTMLElement {
  const t = app.t;
  const lang = app.lang;
  let alive = true;
  onLeave(() => (alive = false));

  const points = () => src.turns.reduce((a, x) => a + x.points, 0);
  const deaths = () => src.turns.filter((x) => !x.tier && !x.skipped).length;
  app.scene.setMode('journey');
  app.scene.setDepth(points() * METRES_PER_POINT, src.turns.length > 0);

  const endless = src.total === null;
  const pips = endless
    ? h(
        'ol',
        { class: 'flasks', 'aria-label': t.estus },
        Array.from({ length: ENDLESS_LIVES }, () => h('li', null, h('img', { src: icon('estus'), alt: '' }))),
      )
    : h(
        'ol',
        { class: 'pips', 'aria-label': t.prompt },
        Array.from({ length: src.total! }, () => h('li', { class: 'pip' })),
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
  const missEl = h('p', { class: 'miss', role: 'status', 'aria-live': 'polite' });
  const triedEl = h('p', { class: 'tried', 'aria-label': t.tried });
  const ask = h(
    'section',
    { class: 'ask panel', hidden: true },
    kicker,
    question,
    form,
    missEl,
    triedEl,
    h('div', { class: 'stamina', role: 'timer' }, h('div', { class: 'stamina-track' }, bar), secs),
    giveUp,
  );
  const reveal = h('section', { class: 'reveal panel', hidden: true, 'aria-live': 'polite' });
  const died = h('div', { class: 'died', hidden: true, style: { '--chars': String(t.youDied.length) } }, h('span', null, t.youDied));

  const screen = h(
    'main',
    { class: 'screen game' },
    h('div', { class: 'hud' }, h('span', { class: 'hud-label' }, runLabel(src)), pips, h('span', { class: 'hud-depth' }, t.depth, ' ', depthEl)),
    h('div', { class: 'anchor knight-gap', 'aria-hidden': 'true' }),
    ask,
    reveal,
    died,
  );

  const paintPips = () => {
    if (endless) {
      pips.querySelectorAll('li').forEach((li, i) => li.classList.toggle('empty', i >= (src.lives ?? 0)));
      pips.setAttribute('title', `${t.estus}: ${src.lives}`);
      return;
    }
    pips.querySelectorAll('.pip').forEach((p, i) => {
      const turn = src.turns[i];
      p.className = 'pip' + (i === src.turns.length ? ' current' : '');
      if (turn) {
        p.classList.add('done');
        (p as HTMLElement).style.setProperty('--tc', turn.skipped ? SKIP_COLOR : TIER_COLORS[turn.tier]);
        p.setAttribute('title', turn.tier ? `+${turn.points}` : turn.skipped ? t.skipped : '✕');
      }
    });
  };
  const paintDepth = (from: number) => {
    countUp(depthEl, from * METRES_PER_POINT, points() * METRES_PER_POINT, 900, (n) => `${fmt(n, lang)} ${t.metres}`);
  };
  paintDepth(points());
  paintPips();

  // Local dailies remember their progress so a reload can't reroll a prompt;
  // remote ones are protected by the server.
  const persistPending = (provisional: boolean) => {
    if (src.kind !== 'daily' || REMOTE) return;
    const turns = src.turns.map(turnOf);
    if (provisional) turns.push({ promptId: src.promptIds()[turns.length], guess: '', answer: null, tier: 0, points: 0 });
    save({ pending: { day: Number(src.id), ids: src.promptIds(), turns } });
  };

  async function next() {
    if (!alive) return;
    const pv = await src.next();
    if (!alive) return;
    if (!pv) return finish([]);
    // Count the prompt as lost until answered.
    persistPending(true);

    kicker.replaceChildren(endless ? `${t.prompt} ${pv.idx + 1}` : `${t.prompt} ${pv.idx + 1} / ${src.total}`, difficultyBadge(pv.d));
    question.textContent = pv.q[lang];
    input.value = '';
    input.disabled = false;
    submit.disabled = false;
    reveal.hidden = true;
    // A foe of this biome bars the road; the last one (every tenth on the
    // Endless Road) is a boss.
    app.scene.spawnEnemy(endless ? (pv.idx + 1) % 10 === 0 : pv.idx === (src.total ?? 0) - 1);
    ask.hidden = false;
    ask.classList.remove('enter');
    void ask.offsetWidth;
    ask.classList.add('enter');
    paintPips();
    input.focus();

    const { verdict, tries } = await countdown(pv);
    if (!alive || !verdict) return;
    await answer(verdict, tries);
  }

  /** Shows why a guess didn't count, and keeps the prompt open. */
  function miss(text: string, tries: string[]) {
    input.classList.remove('shake');
    void input.offsetWidth;
    input.classList.add('shake');
    input.value = '';
    missEl.textContent = text;
    missEl.classList.remove('flash');
    void missEl.offsetWidth;
    missEl.classList.add('flash');
    triedEl.replaceChildren(...tries.slice(-6).map((g) => h('s', null, g)));
    sfx.miss();
  }

  /**
   * Runs the prompt until a valid answer, the end of the timer, or giving up.
   * Wrong guesses only say "try again"; death comes from time or surrender.
   */
  function countdown(pv: PromptView): Promise<{ verdict: Verdict | null; tries: string[] }> {
    missEl.textContent = '';
    triedEl.replaceChildren();
    return new Promise((resolve) => {
      // A resumed remote prompt keeps the time already spent on it.
      let start = performance.now() - pv.elapsedMs;
      let lastSec = SECONDS_PER_PROMPT;
      const tries: string[] = [];
      let busy = false;
      // Local practice runs pause while the tab is hidden. The daily, and
      // every server-judged run, keep running.
      let hiddenAt = 0;
      const onVisibility = () => {
        if (src.kind === 'daily' || REMOTE) return;
        if (document.hidden) hiddenAt = performance.now();
        else if (hiddenAt) {
          start += performance.now() - hiddenAt;
          hiddenAt = 0;
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      let done = false;
      const finish = (v: Verdict | null) => {
        done = true;
        document.removeEventListener('visibilitychange', onVisibility);
        form.onsubmit = null;
        giveUp.onclick = null;
        input.disabled = true;
        submit.disabled = true;
        resolve({ verdict: v, tries });
      };
      /** Offers a guess (null gives up). Resolves the prompt unless it's a miss. */
      const offer = async (g: string | null, final = false) => {
        if (done || busy) return;
        busy = true;
        try {
          const o = await src.answer(g);
          if (!alive) return finish(null);
          if (isRetry(o)) {
            tries.push(g!);
            // Out of time (or guesses): the prompt ends in death.
            if (final || o.capped) {
              const v = await src.answer(null);
              if (!isRetry(v)) return finish(v);
            }
            miss(o.capped ? t.tooManyGuesses : quipFor(g!, lang) ?? t.tryAgain, tries);
          } else finish(o);
        } finally {
          busy = false;
        }
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
        if (secret && !src.accepts(v)) {
          input.value = '';
          if (secret === 'sun') {
            app.scene.praise();
            sfx.praise();
          }
          void banner(SECRET_TEXT[secret][lang], secret === 'sun' ? 'sun' : 'quote', 2400);
          return;
        }
        // The same wrong guess twice costs nothing and tells you so.
        if (tries.some((x) => x.toLowerCase() === v.toLowerCase())) return miss(t.alreadyTried, tries);
        void offer(v);
      };
      // Skip: no points, no death; the knight just doesn't walk.
      giveUp.onclick = async () => {
        if (done || busy) return;
        busy = true;
        try {
          const v = await src.skip();
          if (alive) finish(v);
        } finally {
          busy = false;
        }
      };
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
        if (left <= 0) {
          // Whatever is typed gets one last look; otherwise the flame is out.
          const last = input.value.trim();
          void offer(last || null, true);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function answer(v: Verdict, tries: string[]) {
    const before = points() - v.points;
    persistPending(false);
    paintPips();

    let reason: string | null = null;
    // Liora reacts to the remarkable (and to the hopeless).
    const prevDead = src.turns.length > 1 && !src.turns[src.turns.length - 2].tier;
    // (Praise for a rare answer waits until the kill has played out.)
    const praise = () => {
      if (v.tier === 6) setTimeout(() => alive && say('rare', 'top'), 500);
      else if (v.tier === 5 && Math.random() < 0.5) setTimeout(() => alive && say('lord', 'top'), 500);
    };
    if (!v.tier && !v.skipped && prevDead && Math.random() < 0.5) setTimeout(() => alive && say('deaths', 'top'), 2500);
    if (v.skipped) {
      sfx.click();
      ask.hidden = true;
      app.scene.enemyFlee();
      // Passing over a prompt: the knight drinks a flask (on the Endless
      // Road it's one of the three).
      await app.scene.drinkEstus();
      if (!alive) return;
    } else if (v.tier) {
      // The kill first: the rarer the answer, the grander the blow.
      ask.hidden = true;
      if (v.tier >= 4) dismissMaiden();
      if (v.tier >= 5 && app.scene.motion) setTimeout(() => alive && void banner(t.critical, 'crit', 1500), v.tier === 6 ? 700 : 450);
      await app.scene.kill(v.tier);
      if (!alive) return;
      praise();
      sfx.reward(v.tier);
      app.scene.reward(v.tier);
      app.scene.setDepth(points() * METRES_PER_POINT);
      paintDepth(before);
      const from = zoneAt(before * METRES_PER_POINT);
      const to = zoneAt(points() * METRES_PER_POINT);
      if (to !== from) void wait(700).then(() => { if (alive) void banner(to.name[lang], 'zone', 3000); });
      if (to !== from && to.final && v.tier < 6) setTimeout(() => alive && say('final', 'top'), 3800);
    } else {
      reason = Math.random() < 0.04 ? PATCHES[lang] : null;
      app.scene.setHollow(deaths() >= 3);
      ask.hidden = true;
      // Only a real loss (the last flask spent) is a death; otherwise the
      // foe's blow just wounds the knight and the journey goes on.
      const fatal = v.lives === 0;
      await app.scene.enemyStrike(fatal);
      if (!alive) return;
      if (fatal) {
        sfx.death();
        died.hidden = false;
        died.classList.remove('show');
        void died.offsetWidth;
        died.classList.add('show');
        await wait(app.scene.motion ? 2300 : 900);
        if (!alive) return;
        died.hidden = true;
      } else {
        // Wounded, the knight drinks a flask and stands firm.
        await wait(app.scene.motion ? 350 : 0);
        if (!alive) return;
        await app.scene.drinkEstus();
      }
    }

    showReveal(v, reason, tries);
  }

  function showReveal(v: Verdict, reason: string | null, tries: string[]) {
    const acceptedAs = v.answer?.[lang] ?? null;
    const cont = h('button', { class: 'btn primary' }, v.finished ? t.finish : t.next);
    const verdict = v.tier
      ? h('div', { class: `verdict stamp t${v.tier}` }, tierBadge(v.tier), h('span', { class: 'gain' }, `+${v.points} ${t.points}`))
      : v.skipped
        ? h('div', { class: 'verdict skipped' }, h('span', { class: 'dead-reason' }, t.skipped))
        : h('div', { class: 'verdict dead' }, h('span', { class: 'dead-reason' }, reason ?? (tries.length ? t.noneHeld : t.timeUp)));

    reveal.replaceChildren(
      h('p', { class: 'prompt-kicker' }, v.q[lang]),
      verdict,
      h(
        'p',
        { class: 'offered' },
        v.tier ? [t.youSaid, ': ', h('q', null, v.guess)] : tries.length ? [t.tried, ': ', tries.map((g, i) => [i ? ', ' : '', h('s', null, g)])] : t.nothing,
        acceptedAs && acceptedAs.toLowerCase() !== v.guess.toLowerCase() ? [' → ', h('b', null, acceptedAs)] : null,
      ),
      h(
        'div',
        { class: 'answer-lists' },
        h('div', null, h('h4', null, t.commonest), h('ul', null, v.common.map((a) => h('li', null, a[lang])))),
        h('div', null, h('h4', null, t.rarest), h('ul', null, v.rare.map((a) => h('li', { class: 'rare' }, a[lang])))),
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
      if (v.finished) finish(v.unlocked);
      else void next();
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

  function finish(unlocked: string[]) {
    sfx.complete();
    finishRun(src, unlocked);
  }

  app.scene.setHollow(deaths() >= 3);
  if (endless && src.turns.length === 0) setTimeout(() => alive && say('endless', 'top'), 500);
  if (src.kind === 'daily' && src.turns.length === 0) {
    sfx.kindle();
    void banner(BONFIRE_LIT[lang], 'lit', 2000).then(() => alive && void next());
  } else setTimeout(() => void next(), 350);
  return screen;
}
