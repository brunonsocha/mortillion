import type { Lang } from '../data/types.ts';
import { LANGS } from '../data/types.ts';
import { load, save } from '../engine/storage.ts';
import { LANG_LABELS, STRINGS, TIER_LORE, TIER_NAMES, detectLang, type Strings } from '../i18n/strings.ts';
import type { Scene } from '../render/scene.ts';
import { SKIP_COLOR, TIER_COLORS } from '../render/scene.ts';
import { setSound, sfx } from '../render/sfx.ts';
import { TIER_POINTS } from '../engine/game.ts';
import { h } from './dom.ts';
import { icon } from './icons.ts';
import { accountSection } from './account.ts';
import { dismissMaiden } from './maiden.ts';
import { REMOTE } from '../account/config.ts';

export interface App {
  lang: Lang;
  t: Strings;
  scene: Scene;
  root: HTMLElement;
}

export const app = {} as App;

type Screen = (params: string[]) => HTMLElement | Promise<HTMLElement>;
const routes: Record<string, Screen> = {};
let cleanup: (() => void) | null = null;

export function route(name: string, screen: Screen) {
  routes[name] = screen;
}

/** Registers a teardown for the current screen (timers, listeners). */
export function onLeave(fn: () => void) {
  const prev = cleanup;
  cleanup = () => {
    prev?.();
    fn();
  };
}

export function go(path: string) {
  if (location.hash === `#/${path}`) void render();
  else location.hash = `/${path}`;
}

let renderId = 0;

export async function render() {
  const id = ++renderId;
  dismissMaiden();
  cleanup?.();
  cleanup = null;
  const [name, ...params] = location.hash.replace(/^#\/?/, '').split('/');
  const screen = routes[name] ?? routes[''];
  let el: HTMLElement;
  try {
    el = await screen(params);
  } catch {
    // Usually a content chunk that failed to load: offline, or a new deploy
    // replaced the files this tab knows about. A reload fixes both.
    el = h(
      'main',
      { class: 'screen center' },
      h('p', { class: 'empty' }, app.t.loadFailed),
      h('button', { class: 'btn primary', onclick: () => location.reload() }, app.t.reload),
    );
  }
  if (id !== renderId) return;
  app.root.replaceChildren(header(), el);
  scrollTo(0, 0);
  measureAnchor();
}

/** Lines the canvas scene up with the current screen's `.anchor` element. */
export function measureAnchor() {
  const a = app.root.querySelector('.anchor');
  const r = a?.getBoundingClientRect();
  app.scene.setAnchor(r ? { top: r.top + scrollY, bottom: r.bottom + scrollY } : null);
}

export function initApp(root: HTMLElement, scene: Scene) {
  const s = load();
  app.root = root;
  app.scene = scene;
  setLang(s.lang ?? detectLang(), false);
  setSound(s.sound);
  scene.motion = s.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('still', !scene.motion);
  addEventListener('hashchange', () => void render());
  addEventListener('resize', measureAnchor);
}

export function setLang(l: Lang, rerender = true) {
  app.lang = l;
  app.t = STRINGS[l];
  document.documentElement.lang = l;
  if (rerender) {
    save({ lang: l });
    void render();
  }
}

function header(): HTMLElement {
  return h(
    'header',
    { class: 'topbar' },
    h('a', { class: 'brand', href: '#/', onclick: () => sfx.click() }, h('img', { src: icon('flame'), alt: '' }), 'MORTILLION'),
    h(
      'nav',
      { class: 'topnav' },
      h(
        'div',
        { class: 'langs', role: 'group', 'aria-label': app.t.language },
        LANGS.map((l) =>
          h('button', { class: l === app.lang ? 'on' : '', 'aria-pressed': String(l === app.lang), title: LANG_LABELS[l], onclick: () => (sfx.click(), setLang(l)) }, l.toUpperCase()),
        ),
      ),
      REMOTE
        ? h('button', { class: 'iconbtn', title: app.t.leaderboard, 'aria-label': app.t.leaderboard, onclick: () => (sfx.click(), go('leaderboard')) }, h('img', { src: icon('history'), alt: '' }))
        : null,
      h('button', { class: 'iconbtn', title: app.t.howTo, 'aria-label': app.t.howTo, onclick: () => showHelp() }, '?'),
      h('button', { class: 'iconbtn', title: app.t.settings, 'aria-label': app.t.settings, onclick: () => showSettings() }, '⚙'),
    ),
  );
}

export function modal(title: string, body: HTMLElement): void {
  sfx.click();
  const close = () => {
    dlg.classList.add('closing');
    setTimeout(() => dlg.remove(), 180);
  };
  const dlg = h(
    'div',
    { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, onclick: (e: Event) => e.target === dlg && close() },
    h('div', { class: 'panel modal-panel' }, h('h2', null, title), body, h('button', { class: 'btn', onclick: close }, app.t.close)),
  );
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
      removeEventListener('keydown', onKey);
    }
  };
  addEventListener('keydown', onKey);
  document.body.appendChild(dlg);
  // Forms want their first field; everything else focuses Close.
  (dlg.querySelector<HTMLElement>('.modal-panel input') ?? dlg.querySelector<HTMLElement>('.modal-panel > .btn'))?.focus({ preventScroll: true });
}

export type BannerKind = 'zone' | 'lit' | 'sun' | 'quote' | 'victory' | 'crit';

/** A Dark Souls style announcement that fades in and out over the screen. */
export function banner(text: string, kind: BannerKind, ms = 2800): Promise<void> {
  document.querySelector(`.banner.${kind}`)?.remove();
  const el = h('div', { class: `banner ${kind}`, role: 'status', style: { '--ms': `${ms}ms` } }, h('span', null, text));
  document.body.appendChild(el);
  return new Promise((r) =>
    setTimeout(() => {
      el.remove();
      r();
    }, ms),
  );
}

export function tierBadge(tier: number, skipped = false): HTMLElement {
  if (skipped) return h('span', { class: 'tier skipped', style: { '--tc': SKIP_COLOR } }, app.t.skipped);
  return h('span', { class: `tier t${tier}`, style: { '--tc': TIER_COLORS[tier] } }, tier ? TIER_NAMES[app.lang][tier] : app.t.wounded);
}

export function showHelp() {
  const t = app.t;
  modal(
    t.howTo,
    h(
      'div',
      { class: 'help' },
      h('ol', null, t.rules.map((r) => h('li', null, r))),
      h('h3', null, t.modesTitle),
      h(
        'ul',
        { class: 'modes' },
        h('li', null, h('b', null, t.daily), ' · ', t.dailySub),
        h('li', null, h('b', null, t.endless), ' · ', t.endlessSub),
        h('li', null, h('b', null, t.themes), ' · ', t.themesSub),
        h('li', null, h('b', null, t.party), ' · ', t.partySub),
      ),
      h('p', { class: 'secret-hint' }, t.secretHint),
      h('h3', null, t.tiersTitle),
      h(
        'ul',
        { class: 'tierlist' },
        [6, 5, 4, 3, 2, 1].map((n) =>
          h('li', null, tierBadge(n), h('span', { class: 'lore' }, TIER_LORE[app.lang][n]), h('b', null, `+${TIER_POINTS[n as 1]}`)),
        ),
      ),
    ),
  );
  save({ seenHelp: true });
}

export function showSettings() {
  const t = app.t;
  const s = load();
  const toggle = (label: string, on: boolean, set: (v: boolean) => void) => {
    const b = h('button', { class: 'btn small', 'aria-pressed': String(on) }, on ? t.on : t.off);
    b.onclick = () => {
      on = !on;
      b.textContent = on ? t.on : t.off;
      b.setAttribute('aria-pressed', String(on));
      set(on);
      sfx.click();
    };
    return h('div', { class: 'setting' }, h('span', null, label), b);
  };
  modal(
    t.settings,
    h(
      'div',
      { class: 'settings' },
      toggle(t.sound, s.sound, (v) => (save({ sound: v }), setSound(v))),
      toggle(t.maidenToggle, s.maiden, (v) => {
        save({ maiden: v });
        if (!v) dismissMaiden();
        document.querySelector<HTMLElement>('.maiden-hit')?.toggleAttribute('hidden', !v);
      }),
      h('p', { class: 'note setting-note' }, t.maidenHint),
      toggle(t.motion, s.motion, (v) => {
        save({ motion: v });
        app.scene.motion = v;
        document.documentElement.classList.toggle('still', !v);
      }),
      accountSection(),
      h(
        'button',
        {
          class: 'btn danger small',
          onclick: () => {
            if (!confirm(t.resetConfirm)) return;
            localStorage.removeItem('mortillion:v1');
            location.reload();
          },
        },
        t.resetProgress,
      ),
    ),
  );
}
