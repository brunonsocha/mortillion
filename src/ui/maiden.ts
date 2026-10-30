// Liora's dialogue box: an animated pixel portrait (blinking, talking while
// the text types out), her name, and the line. Tap to finish the line or to
// dismiss it; it also leaves on its own once there was time to read it.

import { load } from '../engine/storage.ts';
import { LINES, MAIDEN_NAME, type MaidenEvent } from '../maiden-lines.ts';
import portraitUrl from '../assets/liora-portrait.png';
import { sfx } from '../render/sfx.ts';
import { app } from './app.ts';
import { h } from './dom.ts';

// The portrait: a sheet of three 144×180 frames (base, blink, talk) made by
// scripts/pixelize-portrait.py from the illustration in art/liora.
const PW = 144;
const PH = 180;
const sheet = new Image();
sheet.src = portraitUrl;

const last = new Map<MaidenEvent, number>();

/** A random line for the event, never the same one twice in a row. */
function pick(event: MaidenEvent): string {
  const lines = LINES[event];
  let i = Math.floor(Math.random() * lines.length);
  if (lines.length > 1 && i === last.get(event)) i = (i + 1) % lines.length;
  last.set(event, i);
  return lines[i][app.lang];
}

let current: { el: HTMLElement; stop: () => void } | null = null;

export function dismissMaiden() {
  current?.stop();
  current = null;
}

/**
 * Liora speaks. `place` keeps her clear of the controls: 'top' during a
 * journey (over the knight), 'bottom' elsewhere.
 */
export function say(event: MaidenEvent, place: 'top' | 'bottom' = 'bottom') {
  if (!load().maiden) return;
  dismissMaiden();
  const text = pick(event);
  const still = !app.scene.motion;

  const portrait = h('canvas', { class: 'maiden-portrait', width: PW, height: PH, 'aria-hidden': 'true' });
  const pg = portrait.getContext('2d')!;
  let painted = -1;
  const paint = (f: number) => {
    if (f === painted || !sheet.complete) return;
    painted = f;
    pg.clearRect(0, 0, PW, PH);
    pg.drawImage(sheet, f * PW, 0, PW, PH, 0, 0, PW, PH);
  };
  paint(0);

  // A pixel-framed speech bubble with a stepped tail pointing at her
  // portrait, beside the central column so it never covers the controls.
  const line = h('p', { class: 'maiden-line' });
  const el = h(
    'aside',
    { class: `maiden-box ${place}`, role: 'status', 'aria-live': 'polite', 'aria-label': MAIDEN_NAME[app.lang] },
    h(
      'div',
      { class: 'maiden-bubble' },
      h('b', { class: 'maiden-name' }, MAIDEN_NAME[app.lang]),
      line,
      h('span', { class: 'maiden-more', 'aria-hidden': 'true' }),
      h('span', { class: 'maiden-tail', 'aria-hidden': 'true' }),
    ),
    h('div', { class: 'maiden-cut' }, portrait),
  );
  document.body.appendChild(el);
  sfx.voice();

  let shown = still ? text.length : 0;
  let typing = !still;
  let blinkAt = performance.now() + 1800 + Math.random() * 2500;
  let raf = 0;
  line.textContent = still ? text : '';

  // One loop: types ~28 characters a second, moves her mouth while she
  // talks, and blinks every few seconds.
  let lastStep = 0;
  const tick = (now: number) => {
    if (typing && now - lastStep >= 34) {
      lastStep = now;
      shown = Math.min(text.length, shown + 1);
      line.textContent = text.slice(0, shown);
      if (shown >= text.length) typing = false;
    }
    const blinking = now >= blinkAt && now < blinkAt + 140;
    if (now >= blinkAt + 140) blinkAt = now + 2200 + Math.random() * 3000;
    paint(blinking ? 1 : typing && Math.floor(now / 110) % 2 ? 2 : 0);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Any other action closes her line, as if the player had dismissed it:
  // a click or tap elsewhere, Enter (offering an answer, moving on), or
  // leaving the screen. Armed a tick later so the action that made her speak
  // doesn't close her at once.
  const elsewhere = (e: Event) => {
    if (!el.contains(e.target as Node)) stop();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') stop();
  };
  const arm = setTimeout(() => {
    addEventListener('pointerdown', elsewhere, true);
    addEventListener('keydown', onKey, true);
    addEventListener('hashchange', stop);
  }, 0);

  const stop = () => {
    clearTimeout(arm);
    removeEventListener('pointerdown', elsewhere, true);
    removeEventListener('keydown', onKey, true);
    removeEventListener('hashchange', stop);
    cancelAnimationFrame(raf);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
    if (current?.el === el) current = null;
  };
  el.onclick = () => {
    if (typing) {
      // First tap finishes the line, the second dismisses it. She never
      // leaves on her own.
      typing = false;
      shown = text.length;
      line.textContent = text;
    } else stop();
  };
  current = { el, stop };
}
