// The animated world behind the UI: a side-scrolling pilgrimage. The knight
// walks right as the player scores, through a meadow, ruins, a cathedral, a
// castle and finally the Kiln of the First Flame. Everything is drawn at a
// low internal resolution and scaled up with nearest-neighbour filtering.

import { ZONES, zoneAt, type Zone, type ZoneKind } from '../eggs.ts';
import { MAIDEN, MAIDEN_PALETTE } from './maiden.ts';
import { setAmbience } from './sfx.ts';
import { BONFIRE, HOLLOW_PALETTE, KNIGHT_PRAISE, KNIGHT_SIDE, KNIGHT_SIT, KNIGHT_WALK, SKULL, bake } from './sprites.ts';

/** 'bonfire': resting at a camp. 'journey': walking the road. */
export type Mode = 'bonfire' | 'journey';

/** World pixels per metre. A full 7,000 m run is ~2,100 px of road. */
const PX_PER_M = 0.3;
/** Where the home camp stands, just before the road begins. */
const START_CAMP = -46;

// Validated for adjacent-pair separation (normal + CVD) and 3:1 contrast on the
// dark panels; the pale tiers are always shown with a text label.
export const TIER_COLORS = ['#c83a3a', '#8a857b', '#d6d0b4', '#e8823e', '#c9284f', '#a66cf0', '#fff2b0'];

/** Liora's offset from the bonfire's centre, in scene pixels. */
export const MAIDEN_X = 13;

/** Seconds the death animation lasts (topple, lie, respawn). */
const DEATH_TIME = 1.6;

type RGB = [number, number, number];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  kind: 'mote' | 'ember' | 'flame' | 'spark' | 'blood' | 'firefly' | 'crow';
}

interface Light {
  x: number;
  y: number;
  r: number;
  warm?: boolean;
}

function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const rgb = (c: number[]) => `rgb(${c.map(Math.round).join(',')})`;
const mixC = (a: number[], b: number[], t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;

/** The zone at a distance, and how far (0–1) its look has blended in. */
function zoneBlend(metres: number): { a: Zone; b: Zone; t: number } {
  const z = zoneAt(metres);
  const i = ZONES.indexOf(z);
  const fade = 160;
  if (i > 0 && metres - z.from < fade) return { a: ZONES[i - 1], b: z, t: Math.max(0, (metres - z.from) / fade) };
  return { a: z, b: z, t: 1 };
}

export class Scene {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private light = document.createElement('canvas');
  private lg = this.light.getContext('2d')!;
  private vignette = document.createElement('canvas');
  private W = 0;
  private H = 0;
  private scale = 3;

  private mode: Mode = 'bonfire';
  private t = 0;
  private last = 0;
  /** World x of the screen's left edge. */
  private camX = START_CAMP - 120;
  private knightX = START_CAMP - 24;
  private targetX = 0;
  private campX = START_CAMP;
  private facing = 1;
  private walkPhase = 0;
  private groundY = 140;
  private shake = 0;
  private flash = 0;
  private flashColor = '#a01818';
  private glow = 0;
  private glowColor = '#fff';
  private dead = 0;
  private praising = 0;
  private hollow = false;
  private particles: Particle[] = [];
  /** Opacity of the background layer being drawn (zone crossfade). */
  private layerAlpha = 1;
  /** Screen-space anchor (CSS px): the ground sits on its bottom edge. */
  private anchor: { top: number; bottom: number } | null = null;
  motion = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d')!;
    this.resize();
    addEventListener('resize', () => this.resize());
    requestAnimationFrame((t) => this.frame(t));
  }

  private resize() {
    this.scale = Math.max(2, Math.round(innerHeight / 180));
    this.W = Math.ceil(innerWidth / this.scale);
    this.H = Math.ceil(innerHeight / this.scale);
    // Lets the DOM line things up with sprites (e.g. tapping the maiden).
    document.documentElement.style.setProperty('--ps', String(this.scale));
    for (const c of [this.canvas, this.light, this.vignette]) {
      c.width = this.W;
      c.height = this.H;
    }
    this.g.imageSmoothingEnabled = false;
    const vg = this.vignette.getContext('2d')!;
    const grad = vg.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    vg.fillStyle = grad;
    vg.fillRect(0, 0, this.W, this.H);
  }

  /**
   * Rest at a camp ('bonfire') or walk the road ('journey'). Resting with a
   * distance pitches camp there (the end of a run); without, at home.
   */
  setMode(mode: Mode, restMetres: number | null = null) {
    if (mode === 'bonfire') this.restAt(restMetres);
    this.mode = mode;
    setAmbience(mode === 'bonfire');
  }

  /**
   * Makes camp. `metres` null is the home camp before the road; a distance
   * pitches the camp just ahead of where the knight stopped (results).
   */
  restAt(metres: number | null) {
    this.campX = metres === null ? START_CAMP : metres * PX_PER_M + 34;
    // Far away (e.g. back home after a long run): jump rather than walk back.
    if (Math.abs(this.knightX - (this.campX - 24)) > this.W) {
      this.knightX = this.campX - 24;
      this.camX = this.campX - this.W / 2;
    }
  }

  /** Aligns the ground line with the bottom edge of a DOM element. */
  setAnchor(rect: { top: number; bottom: number } | null) {
    this.anchor = rect;
  }

  /** Sets how far (in metres) the knight should walk. */
  setDepth(metres: number, instant = false) {
    this.targetX = metres * PX_PER_M;
    if (instant) {
      this.knightX = this.targetX;
      this.camX = this.camTarget();
    }
  }

  /** Celebrates an accepted answer of the given tier. */
  reward(tier: number) {
    this.glow = 1;
    this.glowColor = TIER_COLORS[tier];
    if (!this.motion) return;
    const kx = this.knightX + 7;
    const ky = this.groundY - 10;
    for (let i = 0; i < 10 + tier * 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 15 + Math.random() * (20 + tier * 12);
      this.particles.push({ x: kx, y: ky, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: 0, max: 0.6 + Math.random() * 0.8, color: TIER_COLORS[tier], kind: 'spark' });
    }
    if (tier >= 5) this.flashOnce(TIER_COLORS[tier], 0.35);
  }

  /** \\[T]/ */
  praise() {
    this.praising = 2.6;
    this.glow = 1;
    this.glowColor = '#ffd75a';
    this.flashOnce('#ffe9a0', 0.3);
    if (!this.motion) return;
    const kx = this.knightX + 7;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const v = 30 + Math.random() * 30;
      this.particles.push({ x: kx, y: this.groundY - 14, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.9 + Math.random() * 0.6, color: i % 2 ? '#ffd75a' : '#fff2b0', kind: 'spark' });
    }
  }

  /** The knight's armour rusts after repeated deaths in one run. */
  setHollow(on: boolean) {
    this.hollow = on;
  }

  die() {
    this.dead = DEATH_TIME;
    this.flashOnce('#7a0b0b', 0.8);
    if (!this.motion) return;
    this.shake = 0.45;
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.knightX + 7 + (Math.random() - 0.5) * 8, y: this.groundY - 10, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 40,
        life: 0, max: 0.8 + Math.random() * 0.6, color: Math.random() < 0.5 ? '#6e0d0d' : '#a01818', kind: 'blood',
      });
    }
  }

  private flashOnce(color: string, strength: number) {
    this.flashColor = color;
    this.flash = strength;
  }

  private resting() {
    return this.mode === 'bonfire';
  }

  private camTarget(): number {
    if (this.resting()) return Math.round(this.campX - this.W / 2);
    // The knight walks a little left of centre, looking ahead.
    return Math.round(this.knightX - this.W * 0.36);
  }

  private frame(now: number) {
    requestAnimationFrame((t) => this.frame(t));
    // Pixel art at 3–6× scale gains nothing from 60 fps; 30 halves the
    // battery cost on phones. The small margin tolerates rAF jitter.
    if (now - this.last < 1000 / 30 - 4) return;
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.033);
    this.last = now;
    this.t += dt;
    this.update(dt);
    this.draw();
  }

  private update(dt: number) {
    const a = this.anchor;
    this.groundY = Math.round(a ? a.bottom / this.scale : this.H * 0.94);

    // Walk toward the goal at a steady pace (faster when far behind).
    const goal = this.resting() ? this.campX - 24 : this.targetX;
    const gap = goal - this.knightX;
    const speed = Math.min(160, 28 + Math.abs(gap) * 1.6);
    const step = Math.sign(gap) * Math.min(Math.abs(gap), speed * dt);
    this.knightX += step;
    if (Math.abs(step) > 0.01) {
      this.facing = Math.sign(step);
      this.walkPhase += Math.abs(step) / 3;
    }
    const prevCam = this.camX;
    this.camX += (this.camTarget() - this.camX) * (1 - Math.exp(-dt * 6));
    const pan = this.camX - prevCam;

    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt * 1.4);
    this.glow = Math.max(0, this.glow - dt * 0.8);
    this.dead = Math.max(0, this.dead - dt);
    this.praising = Math.max(0, this.praising - dt);

    if (this.motion) this.spawn(dt, pan);
    for (const p of this.particles) {
      p.life += dt;
      if (p.kind === 'mote') p.vx = Math.sin(this.t * 1.3 + p.max * 10) * 4 - 3;
      if (p.kind === 'firefly') {
        p.vx = Math.sin(this.t * 0.9 + p.max * 7) * 6;
        p.vy = Math.cos(this.t * 1.1 + p.max * 5) * 4;
      }
      if (p.kind === 'flame') p.vx *= 0.96;
      if (p.kind === 'blood') p.vy += 90 * dt;
      if (p.kind === 'spark') {
        p.vx *= 0.95;
        p.vy = p.vy * 0.95 - 12 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max && p.x > this.camX - 60 && p.x < this.camX + this.W + 60);
  }

  private zoneHere(): Zone {
    return zoneAt(Math.max(0, (this.camX + this.W / 2) / PX_PER_M));
  }

  private spawn(dt: number, pan: number) {
    const z = this.zoneHere();
    const top = this.groundY - 90;
    const rate = this.W * (z.kind === 'kiln' ? 0.14 : 0.05) + Math.abs(pan) * 0.5;
    for (let n = rate * dt; n > 0; n--) {
      if (n < 1 && Math.random() > n) break;
      const x = this.camX + Math.random() * this.W;
      if (z.kind === 'meadow') {
        if (Math.random() < 0.5) this.particles.push({ x, y: this.groundY - 4 - Math.random() * 40, vx: 0, vy: 0, life: 0, max: 3 + Math.random() * 4, color: z.motes[0], kind: 'firefly' });
      } else if (z.kind === 'kiln' || z.kind === 'castle') {
        const up = Math.random() < 0.6;
        this.particles.push({
          x, y: up ? this.groundY : top + Math.random() * 30, vx: (Math.random() - 0.5) * 8, vy: up ? -10 - Math.random() * 18 : 6 + Math.random() * 6,
          life: 0, max: 3 + Math.random() * 3, color: up ? z.motes[0] : z.motes[1], kind: up ? 'ember' : 'mote',
        });
      } else {
        this.particles.push({ x, y: top + Math.random() * 100, vx: 0, vy: 2 + Math.random() * 3, life: 0, max: 4 + Math.random() * 4, color: z.motes[Math.random() < 0.7 ? 0 : 1], kind: 'mote' });
      }
    }
    // Crows over the ruins.
    if (z.kind === 'ruins' && Math.random() < dt * 0.25) {
      this.particles.push({ x: this.camX - 10, y: this.groundY - 70 - Math.random() * 30, vx: 22 + Math.random() * 10, vy: -1, life: 0, max: 14, color: '#141418', kind: 'crow' });
    }
    // Camp bonfire flames and embers.
    if (Math.abs(this.campX - this.camX - this.W / 2) < this.W) {
      for (let i = 0; i < 150 * dt; i++) {
        const off = (Math.random() - 0.5) * 10;
        this.particles.push({ x: this.campX + off, y: this.groundY - 4 - Math.random() * 2, vx: -off * 0.6 + (Math.random() - 0.5) * 4, vy: -12 - Math.random() * 14, life: 0, max: 0.3 + Math.random() * 0.45, color: '', kind: 'flame' });
      }
      if (Math.random() < dt * 8) {
        this.particles.push({ x: this.campX + (Math.random() - 0.5) * 8, y: this.groundY - 14, vx: (Math.random() - 0.5) * 14, vy: -18 - Math.random() * 18, life: 0, max: 1.5 + Math.random() * 1.5, color: Math.random() < 0.5 ? '#ff6a1f' : '#ffcf5a', kind: 'ember' });
      }
    }
  }

  // ───────────────────────────── drawing ─────────────────────────────

  private draw() {
    const { g, W, H } = this;
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 12 * this.shake) : 0;
    const sy = this.shake > 0 ? Math.round((Math.random() - 0.5) * 12 * this.shake) : 0;
    const cam = Math.round(this.camX) + sx;
    const gy = this.groundY + sy;
    const here = zoneBlend(Math.max(0, (this.camX + W / 2) / PX_PER_M));

    // Sky, crossfading between zones.
    const top = mixC(here.a.sky[0], here.b.sky[0], here.t);
    const bot = mixC(here.a.sky[1], here.b.sky[1], here.t);
    const sky = g.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, rgb(top));
    sky.addColorStop(1, rgb(bot));
    g.fillStyle = sky;
    g.fillRect(0, 0, W, gy + 1);
    if (here.t < 1) this.drawCelestial(here.a.kind, gy, 1 - here.t);
    this.drawCelestial(here.b.kind, gy, here.t);

    // Parallax layers, far to near; backgrounds crossfade between zones.
    for (const [kind, alpha] of this.layers(here)) {
      this.layerAlpha = alpha;
      g.globalAlpha = alpha;
      this.drawFar(cam, gy, kind);
      this.drawMid(cam, gy, kind);
    }
    this.layerAlpha = 1;
    g.globalAlpha = 1;
    this.drawGround(cam, gy, here);
    this.drawProps(cam, gy);

    const lights: Light[] = [];
    this.drawCamp(cam, gy, lights);
    this.drawParticles(cam, 'back');
    this.drawKnight(cam, gy);
    this.drawParticles(cam, 'front');
    this.collectLights(cam, gy, lights);
    lights.push({ x: this.knightX + 7 - cam, y: gy - 10, r: 22 + this.glow * 30 });

    const dark = here.a.dark + (here.b.dark - here.a.dark) * here.t;
    this.drawLighting(lights, dark);
    this.drawLightShafts(cam, gy);

    // Warm additive glow.
    g.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      if (!l.warm) continue;
      const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
      gr.addColorStop(0, 'rgba(255,120,40,0.16)');
      gr.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = gr;
      g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    if (this.glow > 0) {
      const kx = this.knightX + 7 - cam;
      const gr = g.createRadialGradient(kx, gy - 10, 0, kx, gy - 10, 50);
      gr.addColorStop(0, this.glowColor);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = this.glow * 0.45;
      g.fillStyle = gr;
      g.fillRect(kx - 50, gy - 60, 100, 100);
      g.globalAlpha = 1;
    }
    g.globalCompositeOperation = 'source-over';

    this.drawForeground(cam, gy);
    g.drawImage(this.vignette, 0, 0);
    if (this.flash > 0) {
      g.globalAlpha = Math.min(0.7, this.flash);
      g.fillStyle = this.flashColor;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
  }

  /** Sun, moon or eclipse for a zone, fading with its share of the sky. */
  private drawCelestial(kind: ZoneKind, gy: number, alpha: number) {
    if (alpha <= 0.01) return;
    const { g, W, t } = this;
    g.globalAlpha = alpha;
    const cx = Math.round(W * 0.72);
    if (kind === 'meadow') {
      // A low, swollen sunset sun.
      const cy = gy - 26;
      const halo = g.createRadialGradient(cx, cy, 2, cx, cy, 60);
      halo.addColorStop(0, 'rgba(255,220,140,0.55)');
      halo.addColorStop(1, 'rgba(255,140,80,0)');
      g.fillStyle = halo;
      g.fillRect(cx - 60, cy - 60, 120, 120);
      this.disc(cx, cy, 13, '#ffd28a');
      this.disc(cx, cy, 11, '#ffe6b0');
    } else if (kind === 'ruins') {
      // Clouds drifting over a washed-out sky.
      for (let i = 0; i < 6; i++) {
        const y = 12 + i * 9;
        const x = ((i * 97 + t * (3 + i)) % (W + 120)) - 60;
        g.fillStyle = `rgba(230,234,240,${0.12 + (i % 3) * 0.05})`;
        g.fillRect(Math.round(x), y, 70 + (i % 3) * 30, 3);
        g.fillRect(Math.round(x) + 12, y - 2, 40, 2);
      }
    } else if (kind === 'castle') {
      // A blood moon behind columns of smoke.
      const cy = 26;
      this.disc(cx, cy, 12, '#7a1810');
      this.disc(cx - 2, cy - 1, 10, '#b02a18');
      for (let i = 0; i < 4; i++) {
        const sx = Math.round(W * (0.15 + i * 0.25) + Math.sin(t * 0.3 + i) * 6);
        g.fillStyle = 'rgba(20,10,12,0.45)';
        for (let y = 0; y < gy - 30; y += 4) g.fillRect(sx + Math.round(Math.sin(y * 0.08 + t + i) * 4), y, 8 + ((y / 20) | 0), 4);
      }
    } else if (kind === 'kiln') {
      // The dark sun: an eclipse with a burning corona.
      const cy = 30;
      for (let r = 26; r > 13; r -= 2) this.disc(cx, cy, r + Math.sin(t * 3 + r) * 0.8, `rgba(255,${90 + (26 - r) * 8},30,${0.05 + (26 - r) * 0.012})`);
      this.disc(cx, cy, 12, '#ffb04a');
      this.disc(cx, cy, 10, '#050405');
    } else if (kind === 'dark') {
      for (let i = 0; i < 60; i++) {
        const tw = Math.sin(t * 2 + i * 3) > 0.6 ? 1 : 0.5;
        g.fillStyle = `rgba(220,220,240,${0.3 * tw})`;
        g.fillRect(Math.round(hash(i, 1) * W), Math.round(hash(i, 2) * (gy - 20)), 1, 1);
      }
    }
    g.globalAlpha = 1;
  }

  private disc(cx: number, cy: number, r: number, color: string) {
    const { g } = this;
    g.fillStyle = color;
    for (let y = -Math.floor(r); y <= r; y++) {
      const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
    }
  }

  /**
   * Visits cells of a parallax layer. Ground-level layers (p = 1) take the
   * zone at each cell's own position; slower background layers show the
   * camera's zone (`kind`), crossfaded by the caller at boundaries.
   */
  private cells(cam: number, p: number, cw: number, fn: (k: number, x: number, kind: ZoneKind, n: number) => void, kind?: ZoneKind) {
    const shift = cam * p;
    const first = Math.floor((shift - cw * 2) / cw);
    for (let k = first; k < first + Math.ceil(this.W / cw) + 4; k++) {
      const n = hash(k, Math.round(cw * 31 + p * 100));
      const worldX = k * cw;
      fn(k, Math.round(worldX - shift + n * cw * 0.4), kind ?? zoneAt(Math.max(0, worldX / PX_PER_M)).kind, n);
    }
  }

  /** Background layers for the zones in view, faded across a boundary. */
  private layers(here: { a: Zone; b: Zone; t: number }): [ZoneKind, number][] {
    return here.t < 1 ? [[here.a.kind, 1 - here.t], [here.b.kind, here.t]] : [[here.b.kind, 1]];
  }

  private drawFar(cam: number, gy: number, zone: ZoneKind) {
    const { g } = this;
    this.cells(cam, 0.15, 24, (k, x, kind, n) => {
      if (kind === 'meadow') {
        // Rolling hills.
        const h1 = Math.round(22 + Math.sin(k * 0.6) * 8 + n * 6);
        g.fillStyle = '#5a3a5e';
        g.fillRect(x, gy - h1, 25, h1);
        g.fillStyle = '#6e4a68';
        g.fillRect(x, gy - h1, 25, 2);
      } else if (kind === 'ruins') {
        if (n < 0.35) {
          g.fillStyle = '#6a7080';
          const h = Math.round(30 + n * 60);
          g.fillRect(x, gy - h, 8, h);
          g.fillRect(x - 2, gy - h, 3, 4);
          g.fillRect(x + 6, gy - h + 3, 4, 3);
        }
        g.fillStyle = '#7a808c';
        g.fillRect(x, gy - 10 - (k % 3) * 2, 25, 12);
      } else if (kind === 'cathedral') {
        // The far wall with tall stained-glass windows.
        g.fillStyle = '#1a1726';
        g.fillRect(x - 2, 0, 28, gy);
        if (k % 2 === 0) this.window(x + 4, gy - 84, k);
      } else if (kind === 'castle') {
        g.fillStyle = '#26121a';
        const h = Math.round(40 + (k % 4) * 12 + n * 10);
        g.fillRect(x, gy - h, 14, h);
        if (k % 3 === 0) {
          // Conical tower roof.
          for (let i = 0; i < 7; i++) g.fillRect(x + i, gy - h - 7 + i, 14 - i * 2, 1);
          g.fillRect(x + 6, gy - h - 12, 2, 6);
        }
        g.fillRect(x - 6, gy - 30, 26, 30);
      } else if (kind === 'kiln') {
        // Great swords driven into the ash, leaning.
        if (n < 0.4) {
          g.fillStyle = '#2a2420';
          const h = Math.round(50 + n * 60);
          const lean = n < 0.2 ? 1 : -1;
          for (let y = 0; y < h; y++) g.fillRect(x + Math.round((y / h) * 8 * lean), gy - y, 4, 1);
          g.fillRect(x - 4 + Math.round(8 * lean), gy - h, 12, 2);
        }
        g.fillStyle = '#3a302a';
        g.fillRect(x, gy - 8 - (k % 2) * 3, 25, 10);
      }
    }, zone);
  }

  /** A gothic stained-glass window with leaded panes and a pointed arch. */
  private window(x: number, y: number, k: number) {
    const { g, t } = this;
    const panes = ['#8a1a2a', '#1a3a8a', '#c79a3e', '#2a6a4a', '#5a2a8a'];
    g.fillStyle = '#0c0a12';
    g.fillRect(x - 1, y - 1, 16, 50);
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 3; col++) {
        g.fillStyle = panes[(row * 3 + col + k) % panes.length];
        g.globalAlpha = this.layerAlpha * (0.7 + 0.3 * Math.sin(t * 0.8 + row + k));
        g.fillRect(x + col * 5, y + row * 4, 4, 3);
      }
    }
    g.globalAlpha = this.layerAlpha;
    g.fillStyle = '#0c0a12';
    for (let i = 0; i < 8; i++) g.fillRect(x - 1 + i, y - 8 + Math.max(0, 7 - i * 2), 16 - i * 2, 1);
    g.fillStyle = panes[k % panes.length];
    g.fillRect(x + 6, y - 5, 2, 4);
  }

  private drawMid(cam: number, gy: number, zone: ZoneKind) {
    const { g, t } = this;
    this.cells(cam, 0.45, 40, (k, x, kind, n) => {
      if (kind === 'meadow') {
        if (n < 0.55) {
          // A tree: trunk and layered canopy, swaying.
          const h = 24 + Math.round(n * 20);
          g.fillStyle = '#3a2618';
          g.fillRect(x + 8, gy - h + 10, 4, h - 10);
          const sway = Math.round(Math.sin(t * 0.8 + k));
          g.fillStyle = '#2a4226';
          g.fillRect(x + sway, gy - h, 20, 12);
          g.fillRect(x + 3 + sway, gy - h - 6, 14, 8);
          g.fillStyle = '#3a5a30';
          g.fillRect(x + 3 + sway, gy - h - 4, 10, 4);
          g.fillRect(x + 1 + sway, gy - h + 2, 8, 3);
        } else if (n > 0.85) {
          // A wooden fence.
          g.fillStyle = '#4a3220';
          for (let i = 0; i < 4; i++) g.fillRect(x + i * 7, gy - 9, 2, 9);
          g.fillRect(x, gy - 7, 23, 1);
          g.fillRect(x, gy - 4, 23, 1);
        }
      } else if (kind === 'ruins') {
        if (n < 0.6) {
          // A broken column with ivy.
          const h = 18 + Math.round(n * 40);
          g.fillStyle = '#8a8578';
          g.fillRect(x, gy - h, 8, h);
          g.fillStyle = '#a8a294';
          g.fillRect(x + 1, gy - h, 2, h);
          g.fillStyle = '#5e5a50';
          g.fillRect(x + 6, gy - h, 2, h);
          g.fillStyle = '#9a9486';
          g.fillRect(x - 1, gy - h, 10 - (k % 3), 2);
          g.fillStyle = '#4a6a34';
          for (let i = 0; i < h; i += 3) if (hash(k, i) < 0.5) g.fillRect(x + (i % 7), gy - h + i, 2, 2);
        } else if (n > 0.8) {
          // A ruined arch.
          g.fillStyle = '#7a7568';
          g.fillRect(x, gy - 34, 6, 34);
          g.fillRect(x + 20, gy - 26, 6, 26);
          for (let i = 0; i < 10; i++) g.fillRect(x + 4 + i, gy - 36 + Math.round(Math.abs(i - 5) * 0.8), 2, 3);
        }
      } else if (kind === 'cathedral') {
        if (k % 2 === 0) {
          // Massive pillars with carved capitals.
          g.fillStyle = '#2e2a3a';
          g.fillRect(x, 0, 12, gy);
          g.fillStyle = '#3e3a4c';
          g.fillRect(x + 2, 0, 3, gy);
          g.fillStyle = '#1e1a28';
          g.fillRect(x + 10, 0, 2, gy);
          g.fillStyle = '#4a4458';
          g.fillRect(x - 2, gy - 72, 16, 3);
          g.fillRect(x - 2, gy - 4, 16, 4);
        } else if (n < 0.5) {
          // A hanging chandelier.
          g.fillStyle = '#2a2420';
          g.fillRect(x + 6, 0, 1, gy - 70);
          g.fillStyle = '#5a4a2a';
          g.fillRect(x + 1, gy - 70, 11, 2);
          g.fillStyle = Math.sin(t * 9 + k) > 0 ? '#ffcf5a' : '#ff9a3a';
          for (let i = 0; i < 3; i++) g.fillRect(x + 2 + i * 4, gy - 73, 1, 2);
        }
      } else if (kind === 'castle') {
        // A crenellated wall with red banners.
        g.fillStyle = '#4a3a3a';
        g.fillRect(x - 2, gy - 44, 44, 44);
        g.fillStyle = '#5a4848';
        for (let i = 0; i < 44; i += 8) g.fillRect(x - 2 + i, gy - 50, 5, 6);
        g.fillStyle = '#3a2c2c';
        for (let y = gy - 40; y < gy; y += 6) g.fillRect(x - 2, y, 44, 1);
        if (n < 0.6) {
          const wave = Math.round(Math.sin(t * 2 + k));
          g.fillStyle = '#7a1414';
          g.fillRect(x + 14, gy - 42, 8, 20);
          g.fillRect(x + 15 + wave, gy - 22, 6, 3);
          g.fillStyle = '#c79a3e';
          g.fillRect(x + 17, gy - 36, 2, 6);
          g.fillRect(x + 16, gy - 34, 4, 2);
        } else {
          g.fillStyle = '#1a1010';
          g.fillRect(x + 18, gy - 34, 2, 6);
        }
      } else if (kind === 'kiln') {
        if (n < 0.4) {
          // Toppled arena pillars.
          g.fillStyle = '#6a6058';
          const h = 16 + Math.round(n * 50);
          g.fillRect(x, gy - h, 9, h);
          g.fillStyle = '#857a70';
          g.fillRect(x + 1, gy - h, 2, h);
        } else if (n > 0.82) {
          // A pillar of flame.
          for (let y = 0; y < 50; y += 2) {
            const w = 3 + Math.round(Math.sin(t * 8 + y * 0.4 + k) * 2);
            g.fillStyle = y < 10 ? '#fff2b0' : y < 25 ? '#ffb04a' : '#ff6a1f';
            g.globalAlpha = this.layerAlpha * (0.25 + (y / 50) * 0.5);
            g.fillRect(Math.round(x + 6 - w / 2), gy - 50 + y, w, 2);
          }
          g.globalAlpha = this.layerAlpha;
        }
      } else if (kind === 'dark' && n < 0.15) {
        // An extinguished bonfire: the age of fire has ended.
        g.fillStyle = '#2a2a30';
        g.fillRect(x, gy - 3, 10, 3);
        g.fillRect(x + 4, gy - 14, 2, 11);
      }
    }, zone);
  }

  private drawGround(cam: number, gy: number, here: { a: Zone; b: Zone; t: number }) {
    const { g, W, H } = this;
    const [s, m, d] = [0, 1, 2].map((i) => mixC(here.a.ground[i], here.b.ground[i], here.t));
    g.fillStyle = rgb(m);
    g.fillRect(0, gy, W, 6);
    g.fillStyle = rgb(d);
    g.fillRect(0, gy + 6, W, H - gy);
    g.fillStyle = rgb(s);
    g.fillRect(0, gy, W, 2);
    // Surface details, per column of world x.
    for (let sx = 0; sx < W; sx++) {
      const wx = sx + cam;
      const kind = zoneAt(Math.max(0, wx / PX_PER_M)).kind;
      const n = hash(wx, 7);
      if (kind === 'meadow') {
        if (n < 0.5) {
          g.fillStyle = n < 0.25 ? '#6a9a46' : '#4a7034';
          g.fillRect(sx, gy - 1 - (n < 0.1 ? 1 : 0), 1, 2);
        }
        if (n > 0.985) {
          g.fillStyle = n > 0.995 ? '#f2e6a0' : '#e85a5a';
          g.fillRect(sx, gy - 2, 1, 1);
        }
      } else if (kind === 'ruins' || kind === 'castle') {
        if (((wx % 9) + 9) % 9 === 0) {
          g.fillStyle = 'rgba(0,0,0,0.35)';
          g.fillRect(sx, gy, 1, 6);
        }
        if (kind === 'ruins' && n < 0.12) {
          g.fillStyle = '#4f6a3a';
          g.fillRect(sx, gy - 1, 1, 2);
        }
      } else if (kind === 'cathedral') {
        // Checkered marble and a red carpet down the nave.
        g.fillStyle = Math.floor(wx / 6) % 2 ? '#4a445a' : '#2c2838';
        g.fillRect(sx, gy + 2, 1, 4);
        g.fillStyle = '#6a1418';
        g.fillRect(sx, gy, 1, 2);
      } else if (kind === 'kiln' && n < 0.03) {
        // Glowing cracks in the ash.
        g.fillStyle = Math.sin(this.t * 3 + wx) > 0 ? '#ff7a2a' : '#c84a1a';
        g.fillRect(sx, gy + 2 + Math.round(n * 60), 1, 2);
      }
    }
  }

  private drawProps(cam: number, gy: number) {
    const { g } = this;
    const skull = bake(SKULL);
    this.cells(cam, 1, 30, (k, x, kind, n) => {
      if (Math.abs(k * 30 - this.campX) < 50) return;
      if (kind === 'meadow') {
        if (n < 0.08) {
          // A pilgrim's gravestone.
          g.fillStyle = '#6a6a72';
          g.fillRect(x, gy - 8, 6, 8);
          g.fillRect(x + 1, gy - 9, 4, 1);
          g.fillStyle = '#4a4a52';
          g.fillRect(x + 2, gy - 6, 2, 1);
          g.fillRect(x + 2, gy - 5, 1, 2);
        } else if (n > 0.9) {
          g.fillStyle = '#3a5a2a';
          for (let i = 0; i < 4; i++) g.fillRect(x + i * 2, gy - 3 - (i % 2) * 2, 1, 4 + (i % 2) * 2);
        }
      } else if (kind === 'ruins') {
        if (n < 0.2) {
          g.fillStyle = '#7a7568';
          g.fillRect(x, gy - 4, 10, 4);
          g.fillRect(x + 3, gy - 6, 4, 2);
        } else if (n > 0.92) g.drawImage(skull, x, gy - 8);
      } else if (kind === 'cathedral') {
        if (n < 0.3) {
          // A candelabra.
          g.fillStyle = '#5a4a2a';
          g.fillRect(x + 3, gy - 16, 1, 16);
          g.fillRect(x, gy - 16, 7, 1);
          g.fillRect(x + 1, gy - 1, 5, 1);
          g.fillStyle = '#ece4d0';
          for (const cx of [0, 3, 6]) g.fillRect(x + cx, gy - 19, 1, 3);
          this.flameAt(x + 3, gy - 20, 0.5);
        }
      } else if (kind === 'castle') {
        if (n < 0.3) {
          // A torch on a post.
          g.fillStyle = '#3a2618';
          g.fillRect(x + 2, gy - 14, 2, 14);
          this.flameAt(x + 3, gy - 15, 1);
        } else if (n > 0.85) {
          g.fillStyle = '#4a3220';
          g.fillRect(x, gy - 7, 6, 7);
          g.fillStyle = '#2a1a10';
          g.fillRect(x, gy - 5, 6, 1);
          g.fillRect(x, gy - 2, 6, 1);
        }
      } else if (kind === 'kiln') {
        if (n < 0.35) {
          // A sword stuck in the ash.
          const lean = n < 0.17 ? 1 : 0;
          g.fillStyle = '#9a9ea8';
          for (let y = 0; y < 12; y++) g.fillRect(x + (y < 6 ? lean : 0), gy - y, 1, 1);
          g.fillStyle = '#c79a3e';
          g.fillRect(x - 1 + lean, gy - 12, 3, 1);
          g.fillStyle = '#4a3220';
          g.fillRect(x + lean, gy - 15, 1, 3);
        } else if (n > 0.9) g.drawImage(skull, x, gy - 8);
      }
    });
  }

  /** Dark silhouettes passing in front (grass, rubble), for depth. */
  private drawForeground(cam: number, gy: number) {
    const { g, H } = this;
    this.cells(cam, 1.35, 70, (_k, x, kind, n) => {
      if (n > 0.35) return;
      g.fillStyle = 'rgba(8,6,10,0.85)';
      if (kind === 'meadow') for (let i = 0; i < 6; i++) g.fillRect(x + i * 2, H - 6 - (i % 3) * 4, 1, 12);
      else g.fillRect(x, Math.max(gy + 8, H - 6), 16, 8);
    });
  }

  private flameAt(x: number, y: number, size: number) {
    const { g, t } = this;
    const h = Math.max(2, Math.round((5 + Math.sin(t * 13 + x) * 1.2 + Math.sin(t * 29 + x) * 0.8) * size));
    const rx = Math.round(x);
    const ry = Math.round(y);
    g.fillStyle = '#c2310f';
    g.fillRect(rx - 1, ry - h + 2, 3, h - 1);
    g.fillStyle = '#ff6a1f';
    g.fillRect(rx - 1, ry - h, 2, h);
    g.fillStyle = '#ffcf5a';
    g.fillRect(rx, ry - h + 2, 1, Math.max(1, h - 2));
  }

  /** Torches and candles that cut through the darkness. */
  private collectLights(cam: number, gy: number, lights: Light[]) {
    this.cells(cam, 1, 30, (k, x, kind, n) => {
      if (Math.abs(k * 30 - this.campX) < 50) return;
      if (kind === 'cathedral' && n < 0.3) lights.push({ x: x + 3, y: gy - 20, r: 26, warm: true });
      if (kind === 'castle' && n < 0.3) lights.push({ x: x + 3, y: gy - 17, r: 30, warm: true });
    });
    if (this.zoneHere().kind === 'kiln') lights.push({ x: this.W * 0.72, y: 30, r: 90 });
  }

  /** God rays falling from the cathedral's windows. */
  private drawLightShafts(cam: number, gy: number) {
    const { g, t } = this;
    g.globalCompositeOperation = 'lighter';
    this.cells(cam, 0.15, 24, (k, x, kind) => {
      if (kind !== 'cathedral' || k % 2) return;
      g.fillStyle = `rgba(255,220,160,${0.05 + 0.03 * Math.sin(t * 0.7 + k)})`;
      for (let y = gy - 70; y < gy; y += 2) g.fillRect(x + 4 + Math.round((y - (gy - 70)) * 0.5), y, 12, 2);
    }, this.zoneHere().kind);
    g.globalCompositeOperation = 'source-over';
  }

  private drawLighting(lights: Light[], darkness: number) {
    const { lg, W, H } = this;
    if (darkness <= 0.02) return;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, W, H);
    lg.fillStyle = `rgba(6,4,10,${darkness})`;
    lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (l.x < -l.r || l.x > W + l.r) continue;
      const gr = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      // Hard-edged bands give the light a pixel-art falloff.
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(0.3, 'rgba(0,0,0,1)');
      gr.addColorStop(0.31, 'rgba(0,0,0,0.7)');
      gr.addColorStop(0.6, 'rgba(0,0,0,0.7)');
      gr.addColorStop(0.61, 'rgba(0,0,0,0.35)');
      gr.addColorStop(0.99, 'rgba(0,0,0,0.35)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr;
      lg.fillRect(Math.floor(l.x - l.r), Math.floor(l.y - l.r), Math.ceil(l.r * 2), Math.ceil(l.r * 2));
    }
    this.g.drawImage(this.light, 0, 0);
  }

  /** The bonfire camp, with Liora tending it. */
  private drawCamp(cam: number, gy: number, lights: Light[]) {
    const { g } = this;
    const x = this.campX - cam;
    if (x < -60 || x > this.W + 60) return;
    this.drawParticles(cam, 'flame');
    const bf = bake(BONFIRE);
    g.drawImage(bf, Math.round(x - bf.width / 2), gy - bf.height + 1);
    const maiden = bake(MAIDEN, undefined, MAIDEN_PALETTE);
    const sway = this.motion && Math.sin(this.t * 1.3) > 0.97 ? 1 : 0;
    g.drawImage(maiden, Math.round(x + MAIDEN_X), gy - maiden.height + 1 - sway);
    const f = 0.92 + Math.sin(this.t * 7) * 0.04 + Math.sin(this.t * 17) * 0.04;
    lights.push({ x, y: gy - 8, r: 70 * f, warm: true });
  }

  private drawKnight(cam: number, gy: number) {
    const { g } = this;
    const goal = this.resting() ? this.campX - 24 : this.targetX;
    const arrived = Math.abs(goal - this.knightX) < 0.5;
    const tint = this.dead > DEATH_TIME - 0.5 && Math.floor(this.t * 12) % 2 === 0 ? '#8a1010' : undefined;
    const pal = this.hollow ? HOLLOW_PALETTE : undefined;
    const x = Math.round(this.knightX - cam);

    if (this.praising > 0) {
      const k = bake(KNIGHT_PRAISE, tint);
      g.drawImage(k, x, gy - k.height);
      return;
    }
    if (this.resting() && arrived) {
      const k = bake(KNIGHT_SIT, tint, pal);
      g.drawImage(k, x, gy - k.height);
      return;
    }
    const walking = this.motion && !arrived;
    const sprite = walking ? KNIGHT_WALK[Math.floor(this.walkPhase) % KNIGHT_WALK.length] : KNIGHT_SIDE;
    const k = bake(sprite, tint, pal);
    const y = gy - k.height + (walking && Math.floor(this.walkPhase) % 2 ? -1 : 0);

    if (this.dead > 0 && this.motion) {
      // Topple forward in three crisp steps, lie still, then fade back in
      // standing: the respawn.
      const since = DEATH_TIME - this.dead;
      if (since < 1.1) {
        const steps = Math.min(3, Math.floor(since / 0.08));
        g.save();
        g.translate(x + k.width / 2, gy);
        g.rotate((steps * Math.PI) / 6);
        g.globalAlpha = since > 0.8 ? 1 - (since - 0.8) / 0.3 : 1;
        g.drawImage(k, -k.width / 2, -k.height);
        g.restore();
      } else {
        g.globalAlpha = Math.min(1, (since - 1.1) / 0.4);
        g.drawImage(k, x, y);
      }
      g.globalAlpha = 1;
      return;
    }
    if (this.facing < 0) {
      g.save();
      g.translate(x + k.width, 0);
      g.scale(-1, 1);
      g.drawImage(k, 0, y);
      g.restore();
    } else g.drawImage(k, x, y);
  }

  private drawParticles(cam: number, layer: 'back' | 'flame' | 'front') {
    const { g } = this;
    for (const p of this.particles) {
      const l = p.kind === 'flame' ? 'flame' : p.kind === 'spark' || p.kind === 'blood' ? 'front' : 'back';
      if (l !== layer) continue;
      const k = p.life / p.max;
      const x = Math.round(p.x - cam);
      const y = Math.round(p.y);
      if (p.kind === 'flame') {
        g.fillStyle = k < 0.2 ? '#fff2b0' : k < 0.45 ? '#ffcf5a' : k < 0.7 ? '#ff6a1f' : k < 0.9 ? '#c2310f' : '#3a1510';
        const s = k < 0.5 ? 2 : 1;
        g.fillRect(x, y, s, s);
        continue;
      }
      if (p.kind === 'crow') {
        const flap = Math.floor(this.t * 6 + p.max) % 2;
        g.fillStyle = p.color;
        g.fillRect(x, y, 1, 1);
        g.fillRect(x - 1, y - flap, 1, 1);
        g.fillRect(x + 1, y - flap, 1, 1);
        g.fillRect(x - 2, y - 1 + flap, 1, 1);
        g.fillRect(x + 2, y - 1 + flap, 1, 1);
        continue;
      }
      if (p.kind === 'firefly') {
        g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 4 + p.max * 9);
        g.fillStyle = p.color;
        g.fillRect(x, y, 1, 1);
        g.globalAlpha = 1;
        continue;
      }
      g.globalAlpha = p.kind === 'mote' ? 0.75 : 1 - k * 0.7;
      g.fillStyle = p.color;
      g.fillRect(x, y, 1, 1);
      if (p.kind === 'spark' && k < 0.4) g.fillRect(x - 1, y, 3, 1);
    }
    g.globalAlpha = 1;
  }
}
