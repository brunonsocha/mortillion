// Tiny synthesized sound effects. No audio files are shipped.

let ctx: AudioContext | null = null;
let enabled = true;
let unlocked = false;

export function setSound(on: boolean) {
  enabled = on;
  setAmbience(wantAmbience);
}

let crackleTimer: ReturnType<typeof setTimeout> | null = null;
let wantAmbience = false;

// Browsers only allow audio after a user gesture.
for (const ev of ['pointerdown', 'keydown']) {
  addEventListener(ev, () => {
    unlocked = true;
    // Create/resume the context inside the gesture so browsers allow it.
    ac();
    if (wantAmbience && !crackleTimer) setAmbience(true);
  }, { passive: true });
}

// Silence the fire while the tab is hidden.
document.addEventListener('visibilitychange', () => setAmbience(wantAmbience));

/** Quiet bonfire crackle while the player rests at the bonfire. */
export function setAmbience(on: boolean) {
  wantAmbience = on;
  if (!on || !enabled || !unlocked || document.hidden) {
    if (crackleTimer) clearTimeout(crackleTimer);
    crackleTimer = null;
    return;
  }
  if (crackleTimer) return;
  const pop = () => {
    // A cluster of short, filtered clicks; occasionally a louder snap.
    const snap = Math.random() < 0.12;
    const n = snap ? 3 : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      noise(i * 0.015, 0.025 + Math.random() * 0.03, snap ? 0.05 : 0.018, 1800 + Math.random() * 2400, 600);
    }
    crackleTimer = setTimeout(pop, 90 + Math.random() * 420);
  };
  pop();
}

function ac(): AudioContext | null {
  // Before the first gesture browsers refuse audio anyway; stay silent.
  if (!enabled || !unlocked) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(start: number, dur: number, vol: number, from: number, to: number) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const len = Math.ceil(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const sfx = {
  click() {
    tone(220, 0, 0.06, 'square', 0.03);
  },
  tick() {
    tone(880, 0, 0.05, 'square', 0.025);
  },
  kindle() {
    noise(0, 0.9, 0.25, 300, 2400);
    tone(110, 0.05, 0.8, 'sawtooth', 0.04, 55);
  },
  reward(tier: number) {
    // A rising arpeggio in a minor key; rarer tiers climb higher.
    const notes = [220, 261.6, 329.6, 392, 440, 523.3, 659.3, 784];
    const n = 2 + tier;
    for (let i = 0; i < n; i++) tone(notes[i % notes.length] * (i >= notes.length ? 2 : 1), i * 0.07, 0.35, 'triangle', 0.07);
    if (tier >= 5) tone(1046.5, n * 0.07, 0.9, 'sine', 0.06);
  },
  /** A dull thud: that guess didn't hold, keep trying. */
  miss() {
    tone(160, 0, 0.18, 'square', 0.03, 110);
  },
  /** A soft, low chime when Liora begins to speak. */
  voice() {
    tone(523.3, 0, 0.5, 'sine', 0.025);
    tone(784, 0.08, 0.6, 'sine', 0.018);
  },
  praise() {
    // A bright major chord swelling upward.
    [392, 493.9, 587.3, 784].forEach((f, i) => tone(f, i * 0.05, 1.4, 'triangle', 0.06));
    tone(1568, 0.25, 1.2, 'sine', 0.03);
  },
  death() {
    tone(98, 0, 1.6, 'sawtooth', 0.09, 41);
    tone(146.8, 0, 1.4, 'triangle', 0.06, 61);
    noise(0, 0.5, 0.2, 800, 80);
  },
  /** A blade cutting air; `heavy` for the critical strokes. */
  slash(heavy = false) {
    noise(0, heavy ? 0.22 : 0.14, heavy ? 0.3 : 0.18, 5200, 900);
    tone(heavy ? 330 : 520, 0, 0.08, 'square', 0.03, heavy ? 140 : 260);
  },
  /** The critical-hit sting: a bright stab and a low boom. */
  crit() {
    tone(1318.5, 0, 0.25, 'square', 0.05, 1760);
    tone(65, 0.02, 0.7, 'sawtooth', 0.09, 32);
    noise(0.02, 0.5, 0.3, 400, 60);
  },
  /** The foe shatters into fragments. */
  shatter() {
    for (let i = 0; i < 5; i++) tone(1400 + Math.random() * 1600, i * 0.03, 0.12, 'triangle', 0.025);
    noise(0, 0.35, 0.18, 3000, 600);
  },
  /** The foe's blow lands on the knight. */
  hit() {
    noise(0, 0.2, 0.3, 1400, 200);
    tone(120, 0, 0.25, 'square', 0.05, 60);
  },
  /** Drinking Estus: two gulps and a warm chime. */
  estus() {
    tone(180, 0.3, 0.09, 'sine', 0.05, 120);
    tone(170, 0.5, 0.09, 'sine', 0.05, 110);
    noise(0.28, 0.4, 0.08, 900, 300);
    [523.3, 659.3, 784].forEach((f, i) => tone(f, 0.62 + i * 0.06, 0.8, 'triangle', 0.04));
  },
  /** The bonfire warp: a hollow rising whoosh and a soft bell. */
  warp() {
    noise(0, 0.9, 0.12, 600, 3200);
    tone(196, 0, 1.2, 'sine', 0.05, 392);
    tone(784, 0.85, 1.2, 'triangle', 0.03);
  },
  /**
   * Crossing a rarity marker. Each line crossed in the same walk climbs the
   * scale; the rare tiers add sparkle, and the last tier rings out a chord.
   */
  milestone(tier: number, combo: number) {
    const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5];
    const f = scale[Math.min(combo, scale.length - 1)];
    tone(f, 0, 0.18, 'square', 0.035);
    tone(f * 2, 0.02, 0.35, 'triangle', 0.04);
    if (tier >= 4) tone(f * 1.5, 0.06, 0.4, 'triangle', 0.035);
    if (tier >= 5) [1, 1.25, 1.5, 2].forEach((m, i) => tone(f * m * 2, 0.08 + i * 0.04, 0.25, 'sine', 0.025));
    if (tier === 6) [1, 1.26, 1.5, 2].forEach((m) => tone(523.3 * m, 0.12, 1.4, 'triangle', 0.04));
  },
  complete() {
    [196, 246.9, 293.7, 392].forEach((f, i) => tone(f, i * 0.18, 1.2, 'triangle', 0.06));
  },
};
