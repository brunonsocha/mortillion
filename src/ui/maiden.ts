// Liora's dialogue box: an animated pixel portrait (blinking, talking while
// the text types out), her name, and the line. Tap to finish the line or to
// dismiss it; it also leaves on its own once there was time to read it.

import { load } from '../engine/storage.ts';
import { LINES, MAIDEN_NAME, type MaidenEvent } from '../maiden-lines.ts';
import { MAIDEN_PALETTE, PORTRAIT, PORTRAIT_BLINK, PORTRAIT_TALK } from '../render/maiden.ts';
import { bake } from '../render/sprites.ts';
import { sfx } from '../render/sfx.ts';
import { app } from './app.ts';
import { h } from './dom.ts';

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

  const frames = [PORTRAIT, PORTRAIT_BLINK, PORTRAIT_TALK].map((s) => bake(s, undefined, MAIDEN_PALETTE));
  const portrait = h('canvas', { class: 'maiden-portrait', width: 44, height: 52, 'aria-hidden': 'true' });
  const pg = portrait.getContext('2d')!;
  const paint = (f: number) => {
    pg.clearRect(0, 0, 44, 52);
    pg.drawImage(frames[f], 0, 0);
  };
  paint(0);

  const line = h('p', { class: 'maiden-line' });
  const el = h(
    'aside',
    { class: `maiden-box ${place}`, role: 'status', 'aria-live': 'polite', 'aria-label': MAIDEN_NAME[app.lang] },
    h('div', { class: 'maiden-frame' }, portrait),
    h('div', { class: 'maiden-text' }, h('b', { class: 'maiden-name' }, MAIDEN_NAME[app.lang]), line, h('span', { class: 'maiden-more', 'aria-hidden': 'true' }, '▼')),
  );
  document.body.appendChild(el);
  sfx.voice();

  let shown = still ? text.length : 0;
  let typing = !still;
  let blinkAt = performance.now() + 1800 + Math.random() * 2500;
  let leaveAt = 0;
  let raf = 0;
  const readTime = () => Math.max(3800, text.length * 55);
  if (still) leaveAt = performance.now() + readTime();
  line.textContent = still ? text : '';

  // One loop: types ~28 characters a second, moves her mouth while she
  // talks, and blinks every few seconds.
  let lastStep = 0;
  const tick = (now: number) => {
    if (typing && now - lastStep >= 34) {
      lastStep = now;
      shown = Math.min(text.length, shown + 1);
      line.textContent = text.slice(0, shown);
      if (shown >= text.length) {
        typing = false;
        leaveAt = now + readTime();
      }
    }
    const blinking = now >= blinkAt && now < blinkAt + 140;
    if (now >= blinkAt + 140) blinkAt = now + 2200 + Math.random() * 3000;
    paint(blinking ? 1 : typing && Math.floor(now / 110) % 2 ? 2 : 0);
    if (leaveAt && now >= leaveAt) return stop();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const stop = () => {
    cancelAnimationFrame(raf);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
    if (current?.el === el) current = null;
  };
  el.onclick = () => {
    if (typing) {
      // First tap finishes the line, the second dismisses it.
      typing = false;
      shown = text.length;
      line.textContent = text;
      leaveAt = performance.now() + readTime();
    } else stop();
  };
  current = { el, stop };
}
