// The animated abyss behind the UI. Everything is drawn at a low internal
// resolution and scaled up with nearest-neighbour filtering.

import { ZONES, zoneAt } from '../eggs.ts';
import { BONES, BONFIRE, CHAIN, HOLLOW_PALETTE, KNIGHT, KNIGHT_PRAISE, KNIGHT_SIT, SKULL, TORCH, bake } from './sprites.ts';

export type Mode = 'bonfire' | 'descent';

/** World pixels per metre of depth. 7000 m ≈ 2100 px of shaft. */
const PX_PER_M = 0.3;
const TORCH_GAP = 70;
const DEEP = 2100;

export const TIER_COLORS = ['#a01818', '#8a857b', '#cbb98a', '#e8823e', '#e0473d', '#a66cf0', '#fff2b0'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  kind: 'ash' | 'ember' | 'flame' | 'spark' | 'blood';
}

interface Light {
  x: number;
  y: number;
  r: number;
}

function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function brickTile(w: number, h: number, bw: number, bh: number, base: number[], seed: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0d0c0f';
  g.fillRect(0, 0, w, h);
  for (let row = 0; row < h / bh; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col <= w / bw; col++) {
      const x = col * bw + off;
      const y = row * bh;
      const n = hash(col + seed, row * 7 + seed);
      const k = 0.75 + n * 0.45;
      const rgb = base.map((v) => Math.round(v * k));
      g.fillStyle = `rgb(${rgb})`;
      g.fillRect(x + 1, y + 1, bw - 1, bh - 1);
      g.fillStyle = `rgba(255,240,220,${0.06 + n * 0.05})`;
      g.fillRect(x + 1, y + 1, bw - 1, 1);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x + 1, y + bh - 1, bw - 1, 1);
      if (n > 0.86) {
        // crack
        g.fillStyle = 'rgba(0,0,0,0.55)';
        const cx = x + 2 + Math.floor(n * 100) % (bw - 3);
        g.fillRect(cx, y + 1, 1, 2);
        g.fillRect(cx + 1, y + 2, 1, bh - 3);
      } else if (n < 0.07) {
        // moss
        g.fillStyle = '#26301f';
        g.fillRect(x + 1, y + 1, Math.ceil(bw / 2), 1);
        g.fillRect(x + 2, y + 2, 1, 1);
      }
    }
  }
  return c;
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
  private side!: CanvasPattern;
  private back!: CanvasPattern;
  private sideTile = brickTile(32, 32, 8, 4, [58, 54, 52], 11);
  private backTile = brickTile(48, 48, 16, 8, [30, 29, 34], 37);

  private mode: Mode = 'bonfire';
  private t = 0;
  private last = 0;
  private cam = 0;
  private knightY = -18;
  private targetY = 0;
  private floorAlpha = 1;
  private shake = 0;
  private flash = 0;
  private flashColor = '#a01818';
  private glow = 0;
  private glowColor = '#fff';
  private dead = 0;
  private praising = 0;
  private hollow = false;
  /** Current zone look, eased toward the zone the camera is in. */
  private tint = [...ZONES[0].tint];
  private dark = ZONES[0].dark;
  private wash = [...ZONES[0].wash];
  private particles: Particle[] = [];
  /** Screen-space anchor (CSS px) for the floor or the knight's centre. */
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
    for (const c of [this.canvas, this.light, this.vignette]) {
      c.width = this.W;
      c.height = this.H;
    }
    this.g.imageSmoothingEnabled = false;
    this.side = this.g.createPattern(this.sideTile, 'repeat')!;
    this.back = this.g.createPattern(this.backTile, 'repeat')!;
    const vg = this.vignette.getContext('2d')!;
    const grad = vg.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.25, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    vg.fillStyle = grad;
    vg.fillRect(0, 0, this.W, this.H);
  }

  setMode(mode: Mode) {
    this.mode = mode;
    if (mode === 'bonfire') {
      this.targetY = 0;
      this.knightY = Math.min(this.knightY, 0);
    }
  }

  /**
   * Aligns the scene with a DOM element: in bonfire mode the floor sits on
   * its bottom edge, while descending the knight is centred in it.
   */
  setAnchor(rect: { top: number; bottom: number } | null) {
    this.anchor = rect;
  }

  /** Sets the depth (in metres) the knight should sink to. */
  setDepth(metres: number, instant = false) {
    this.targetY = metres * PX_PER_M;
    if (instant) {
      this.knightY = this.targetY;
      this.cam = this.camTarget();
    }
  }

  /** Celebrates an accepted answer of the given tier. */
  reward(tier: number) {
    this.glow = 1;
    this.glowColor = TIER_COLORS[tier];
    if (!this.motion) return;
    const kx = this.W / 2;
    const ky = this.knightY + 10;
    for (let i = 0; i < 10 + tier * 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 15 + Math.random() * (20 + tier * 12);
      this.particles.push({
        x: kx, y: ky, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10,
        life: 0, max: 0.6 + Math.random() * 0.8, color: TIER_COLORS[tier], kind: 'spark',
      });
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
    const sitting = this.floorAlpha > 0.5;
    const kx = sitting ? this.W / 2 - 17 : this.W / 2;
    const ky = sitting ? -14 : this.knightY + 4;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const v = 30 + Math.random() * 30;
      this.particles.push({
        x: kx, y: ky, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0, max: 0.9 + Math.random() * 0.6, color: i % 2 ? '#ffd75a' : '#fff2b0', kind: 'spark',
      });
    }
  }

  /** The knight's armour rusts after repeated deaths in one run. */
  setHollow(on: boolean) {
    this.hollow = on;
  }

  die() {
    this.dead = 1.6;
    this.flashOnce('#7a0b0b', 0.8);
    if (!this.motion) return;
    this.shake = 0.45;
    const kx = this.W / 2;
    const ky = this.knightY + 8;
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: kx + (Math.random() - 0.5) * 8, y: ky, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 40,
        life: 0, max: 0.8 + Math.random() * 0.6, color: Math.random() < 0.5 ? '#6e0d0d' : '#a01818', kind: 'blood',
      });
    }
  }

  private flashOnce(color: string, strength: number) {
    this.flashColor = color;
    this.flash = strength;
  }

  private camTarget(): number {
    const a = this.anchor;
    // Without an anchor the chamber floor sits just below the screen, so only
    // the bonfire's glow rises behind the content.
    if (this.mode === 'bonfire') return -Math.round(a ? a.bottom / this.scale : this.H + 4);
    const centre = a ? (a.top + a.bottom) / 2 / this.scale : this.H * 0.3;
    return this.knightY - Math.round(centre - KNIGHT.length / 2);
  }

  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    this.t += dt;
    this.update(dt);
    this.draw();
    requestAnimationFrame((t) => this.frame(t));
  }

  private update(dt: number) {
    const ease = 1 - Math.exp(-dt * 2.6);
    const prevCam = this.cam;
    this.knightY += (this.targetY - this.knightY) * ease;
    if (this.mode === 'bonfire') this.knightY = this.targetY;
    // Track the knight tightly while descending; glide on mode changes.
    const follow = this.mode === 'descent' && this.floorAlpha < 0.05 ? 14 : 3.2;
    this.cam += (this.camTarget() - this.cam) * (1 - Math.exp(-dt * follow));
    const camDelta = this.cam - prevCam;
    // The chamber floor fades in gently but vanishes fast once the descent begins.
    this.floorAlpha += ((this.mode === 'bonfire' ? 1 : 0) - this.floorAlpha) * (1 - Math.exp(-dt * (this.mode === 'bonfire' ? 4 : 12)));
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt * 1.4);
    this.glow = Math.max(0, this.glow - dt * 0.8);
    this.dead = Math.max(0, this.dead - dt);
    this.praising = Math.max(0, this.praising - dt);
    const zone = this.mode === 'bonfire' ? ZONES[0] : zoneAt(Math.max(0, this.cam / PX_PER_M));
    const zk = 1 - Math.exp(-dt * 1.5);
    this.tint = this.tint.map((v, i) => v + (zone.tint[i] - v) * zk);
    this.dark += (zone.dark - this.dark) * zk;
    this.wash = this.wash.map((v, i) => v + (zone.wash[i] - v) * zk);

    if (this.motion) this.spawn(dt, camDelta);
    for (const p of this.particles) {
      p.life += dt;
      if (p.kind === 'ash') p.vx = Math.sin(this.t * 1.3 + p.max * 10) * 4;
      if (p.kind === 'flame') p.vx *= 0.96;
      if (p.kind === 'blood') p.vy += 90 * dt;
      if (p.kind === 'spark') {
        p.vx *= 0.95;
        p.vy = p.vy * 0.95 - 12 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max && p.y > this.cam - 40 && p.y < this.cam + this.H + 40);
  }

  private spawn(dt: number, camDelta: number) {
    // Drifting ash: more of it when the camera is falling fast.
    const rate = this.W * 0.06 + Math.abs(camDelta) * 2;
    for (let n = rate * dt; n > 0; n--) {
      if (n < 1 && Math.random() > n) break;
      const fromBelow = camDelta > 0.4;
      this.particles.push({
        x: Math.random() * this.W,
        y: fromBelow ? this.cam + this.H + 2 : this.cam - 2 + Math.random() * this.H * 0.2,
        vx: 0, vy: 4 + Math.random() * 6, life: 0, max: 6 + Math.random() * 6,
        color: this.motes()[Math.random() < 0.7 ? 0 : 1], kind: 'ash',
      });
    }
    // Torch embers.
    for (const l of this.torchLights()) {
      if (Math.random() < dt * 3) {
        this.particles.push({
          x: l.x + (Math.random() - 0.5) * 2, y: l.y - 2, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 10,
          life: 0, max: 0.8 + Math.random() * 1.2, color: Math.random() < 0.5 ? '#ff6a1f' : '#ffcf5a', kind: 'ember',
        });
      }
    }
    // Bonfire flames and embers.
    if (this.floorAlpha > 0.3) {
      const bx = Math.round(this.W / 2);
      for (let i = 0; i < 150 * dt; i++) {
        const off = (Math.random() - 0.5) * 10;
        this.particles.push({
          x: bx + off, y: -4 - Math.random() * 2, vx: -off * 0.6 + (Math.random() - 0.5) * 4, vy: -12 - Math.random() * 14,
          life: 0, max: 0.3 + Math.random() * 0.45, color: '', kind: 'flame',
        });
      }
      if (Math.random() < dt * 8) {
        this.particles.push({
          x: bx + (Math.random() - 0.5) * 8, y: -14, vx: (Math.random() - 0.5) * 14, vy: -18 - Math.random() * 18,
          life: 0, max: 1.5 + Math.random() * 1.5, color: Math.random() < 0.5 ? '#ff6a1f' : '#ffcf5a', kind: 'ember',
        });
      }
    }
  }

  private motes(): string[] {
    return this.mode === 'bonfire' ? ZONES[0].motes : zoneAt(Math.max(0, this.cam / PX_PER_M)).motes;
  }

  private wallWidth() {
    return Math.max(14, Math.min(46, Math.floor(this.W * 0.16)));
  }

  private torchLights(): Light[] {
    const out: Light[] = [];
    const ww = this.wallWidth();
    const first = Math.floor((this.cam - 40) / TORCH_GAP);
    const lastK = Math.ceil((this.cam + this.H + 40) / TORCH_GAP);
    for (let k = first; k <= lastK; k++) {
      const left = k % 2 === 0;
      // The bonfire chamber floor hides the shaft below it.
      if (this.floorAlpha > 0.5 && k * TORCH_GAP + 18 > -6) continue;
      const flick = 0.9 + Math.sin(this.t * 9 + k) * 0.05 + Math.sin(this.t * 23 + k * 3) * 0.05;
      out.push({ x: left ? ww + 3 : this.W - ww - 3, y: k * TORCH_GAP + 18, r: 34 * flick });
    }
    return out;
  }

  private draw() {
    const { g, W, H } = this;
    const depthT = Math.min(1, Math.max(0, this.cam / DEEP));
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 6 * this.shake * 2) : 0;
    const sy = this.shake > 0 ? Math.round((Math.random() - 0.5) * 6 * this.shake * 2) : 0;
    const cam = Math.round(this.cam) + sy;
    const ww = this.wallWidth();

    g.save();
    g.translate(sx, 0);

    // Back wall with parallax.
    g.fillStyle = `rgb(${this.tint.map(Math.round).join(',')})`;
    g.fillRect(-4, 0, W + 8, H);
    g.save();
    const backOff = Math.round(cam * 0.6);
    g.translate(0, -backOff);
    g.globalAlpha = 0.55 - depthT * 0.15;
    g.fillStyle = this.back;
    g.fillRect(-4, backOff, W + 8, H);
    g.restore();

    this.drawBackDecor(cam, ww, depthT);

    // Side walls.
    g.save();
    g.translate(0, -cam);
    g.fillStyle = this.side;
    g.fillRect(-4, cam, ww + 4, H);
    g.fillRect(W - ww, cam, ww + 4, H);
    g.restore();
    g.fillStyle = '#060507';
    g.fillRect(ww, 0, 1, H);
    g.fillRect(W - ww - 1, 0, 1, H);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(ww + 1, 0, 2, H);
    g.fillRect(W - ww - 3, 0, 2, H);

    this.drawWallDecor(cam, ww);

    // Recolour the stonework for the current zone, keeping its shading.
    if (this.wash[3] > 0.01) {
      g.globalCompositeOperation = 'color';
      g.globalAlpha = this.wash[3];
      g.fillStyle = `rgb(${this.wash.slice(0, 3).map(Math.round).join(',')})`;
      g.fillRect(-4, 0, W + 8, H);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    // Torches.
    const torch = bake(TORCH);
    for (const l of this.torchLights()) {
      g.drawImage(torch, Math.round(l.x - 2), Math.round(l.y - cam));
      this.drawFlame(l.x, l.y - cam, 1);
    }

    // Floor and bonfire.
    if (this.floorAlpha > 0.01) {
      g.globalAlpha = this.floorAlpha;
      const fy = -cam;
      g.fillStyle = '#16141a';
      g.fillRect(0, fy, W, H);
      g.fillStyle = '#2c2a30';
      g.fillRect(0, fy, W, 2);
      g.fillStyle = '#3d3a40';
      for (let x = 0; x < W; x += 12) g.fillRect(x + ((x / 12) % 2) * 3, fy + 4, 8, 1);
      this.drawParticles(cam, 'flame');
      const bf = bake(BONFIRE);
      g.drawImage(bf, Math.round(W / 2 - bf.width / 2), fy - bf.height + 1);
      g.globalAlpha = 1;
    }

    this.drawParticles(cam, 'back');
    this.drawKnight(cam);
    this.drawParticles(cam, 'front');

    // Lighting: darkness with banded light holes.
    const lights: Light[] = this.torchLights().map((l) => ({ ...l, y: l.y - cam }));
    const kr = 26 + this.glow * 30;
    lights.push({ x: W / 2, y: this.knightY - cam + 10, r: this.floorAlpha > 0.5 ? 18 : kr });
    if (this.floorAlpha > 0.05) {
      const f = 0.92 + Math.sin(this.t * 7) * 0.04 + Math.sin(this.t * 17) * 0.04;
      lights.push({ x: W / 2, y: -cam - 8, r: 78 * f * this.floorAlpha });
    }
    this.drawLighting(lights, this.dark);
    g.restore();

    // Warm additive glow.
    g.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
      gr.addColorStop(0, 'rgba(255,120,40,0.18)');
      gr.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = gr;
      g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    if (this.glow > 0) {
      const ky = this.knightY - cam + 10;
      const gr = g.createRadialGradient(W / 2, ky, 0, W / 2, ky, 50);
      gr.addColorStop(0, this.glowColor);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = this.glow * 0.45;
      g.fillStyle = gr;
      g.fillRect(W / 2 - 50, ky - 50, 100, 100);
      g.globalAlpha = 1;
    }
    g.globalCompositeOperation = 'source-over';

    g.drawImage(this.vignette, 0, 0);
    if (this.flash > 0) {
      g.globalAlpha = Math.min(0.7, this.flash);
      g.fillStyle = this.flashColor;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
  }

  private drawLighting(lights: Light[], darkness: number) {
    const { lg, W, H } = this;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, W, H);
    lg.fillStyle = `rgba(4,3,6,${darkness})`;
    lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (l.y < -l.r || l.y > H + l.r) continue;
      const gr = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      // Hard-edged bands give the light a dithered, pixel-art falloff.
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(0.3, 'rgba(0,0,0,1)');
      gr.addColorStop(0.31, 'rgba(0,0,0,0.78)');
      gr.addColorStop(0.55, 'rgba(0,0,0,0.78)');
      gr.addColorStop(0.56, 'rgba(0,0,0,0.5)');
      gr.addColorStop(0.78, 'rgba(0,0,0,0.5)');
      gr.addColorStop(0.79, 'rgba(0,0,0,0.22)');
      gr.addColorStop(0.99, 'rgba(0,0,0,0.22)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr;
      lg.fillRect(Math.floor(l.x - l.r), Math.floor(l.y - l.r), Math.ceil(l.r * 2), Math.ceil(l.r * 2));
    }
    this.g.drawImage(this.light, 0, 0);
  }

  private drawFlame(x: number, y: number, size: number) {
    const { g, t } = this;
    const h = Math.round((5 + Math.sin(t * 13 + x) * 1.2 + Math.sin(t * 29 + x) * 0.8) * size);
    const rx = Math.round(x);
    const ry = Math.round(y);
    g.fillStyle = '#c2310f';
    g.fillRect(rx - 2, ry - h + 2, 5, h - 1);
    g.fillStyle = '#ff6a1f';
    g.fillRect(rx - 1, ry - h, 3, h);
    g.fillRect(rx + (Math.sin(t * 17 + x) > 0 ? 1 : -1), ry - h - 1, 1, 1);
    g.fillStyle = '#ffcf5a';
    g.fillRect(rx, ry - h + 2, 1, h - 2);
  }

  private drawBackDecor(cam: number, ww: number, depthT: number) {
    const { g, W, H, t } = this;
    const p = 0.6;
    const pc = cam * p;
    // Hanging chains in the far layer.
    const chain = bake(CHAIN);
    const first = Math.floor((pc - 120) / 120);
    for (let k = first; k < first + Math.ceil(H / 120) + 3; k++) {
      const n = hash(k, 3);
      if (n < 0.5) continue;
      const x = Math.round(ww + 6 + n * (W - ww * 2 - 12));
      const top = k * 120 - pc;
      const len = 30 + Math.floor(hash(k, 9) * 60);
      g.globalAlpha = 0.5;
      for (let y = 0; y < len; y += 6) g.drawImage(chain, x, Math.round(top + y));
      g.globalAlpha = 1;
    }
    // Watching eyes, deep down.
    if (depthT > 0.3) {
      const cell = 40;
      const f = Math.floor((pc - cell) / cell);
      for (let k = f; k < f + Math.ceil(H / cell) + 2; k++) {
        const n = hash(k, 77);
        if (n > depthT * 0.5) continue;
        const x = Math.round(ww + 4 + hash(k, 5) * (W - ww * 2 - 10));
        const y = Math.round(k * cell - pc + hash(k, 6) * cell);
        const blink = Math.sin(t * 0.7 + n * 50) > -0.92;
        if (!blink) continue;
        g.fillStyle = n < 0.05 ? '#a66cf0' : '#ff2a2a';
        g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + k);
        g.fillRect(x, y, 1, 1);
        g.fillRect(x + 3, y, 1, 1);
        g.globalAlpha = 1;
      }
    }
  }

  private drawWallDecor(cam: number, ww: number) {
    const { g, W, H } = this;
    const skull = bake(SKULL);
    const bones = bake(BONES);
    const gap = 53;
    const first = Math.floor((cam - 20) / gap);
    for (let k = first; k < first + Math.ceil(H / gap) + 2; k++) {
      const n = hash(k, 21);
      const y = k * gap - cam;
      const left = hash(k, 22) < 0.5;
      if (n < 0.28 && ww >= 12) {
        const x = left ? Math.floor(ww / 2 - 4) : Math.floor(W - ww / 2 - 5);
        g.drawImage(skull, x, y);
      } else if (n > 0.85) {
        // Stone ledge with remains.
        const lw = 16;
        const x = left ? ww : W - ww - lw;
        g.fillStyle = '#3a3638';
        g.fillRect(x, y + 5, lw, 3);
        g.fillStyle = '#5a5558';
        g.fillRect(x, y + 5, lw, 1);
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.fillRect(x, y + 8, lw, 2);
        g.drawImage(bones, x + 2, y);
      }
    }
  }

  private drawKnight(cam: number) {
    const { g, W } = this;
    const sitting = this.floorAlpha > 0.5;
    const tint = this.dead > 0 && Math.floor(this.t * 12) % 2 === 0 ? '#8a1010' : undefined;
    if (sitting && this.praising > 0) {
      const k = bake(KNIGHT_PRAISE, tint);
      g.drawImage(k, Math.round(W / 2 - 24), -cam - k.height);
      return;
    }
    if (sitting) {
      const k = bake(KNIGHT_SIT, tint, this.hollow ? HOLLOW_PALETTE : undefined);
      g.drawImage(k, Math.round(W / 2 - 24), -cam - k.height);
      return;
    }
    const k = bake(this.praising > 0 ? KNIGHT_PRAISE : KNIGHT, tint, this.hollow ? HOLLOW_PALETTE : undefined);
    const bob = this.motion ? Math.round(Math.sin(this.t * 2.2) * 1) : 0;
    const x = Math.round(W / 2 - k.width / 2);
    const y = Math.round(this.knightY - cam) + bob;
    if (this.dead > 0) g.globalAlpha = 0.5 + 0.5 * Math.min(1, this.dead);
    g.drawImage(k, x, y);
    g.globalAlpha = 1;
    // Tattered cape fluttering upward while sinking.
    const speed = this.targetY - this.knightY;
    if (speed > 2 && this.motion) {
      g.fillStyle = '#4a1c16';
      for (let i = 0; i < 4; i++) {
        const h = 2 + Math.round(Math.abs(Math.sin(this.t * 15 + i)) * Math.min(6, speed / 4));
        g.fillRect(x + 4 + i * 2, y + 7 - h, 1, h);
      }
    }
  }

  private drawParticles(cam: number, layer: 'back' | 'flame' | 'front') {
    const { g } = this;
    for (const p of this.particles) {
      const l = p.kind === 'flame' ? 'flame' : p.kind === 'spark' || p.kind === 'blood' ? 'front' : 'back';
      if (l !== layer) continue;
      const k = p.life / p.max;
      const x = Math.round(p.x);
      const y = Math.round(p.y - cam);
      if (p.kind === 'flame') {
        g.fillStyle = k < 0.2 ? '#fff2b0' : k < 0.45 ? '#ffcf5a' : k < 0.7 ? '#ff6a1f' : k < 0.9 ? '#c2310f' : '#3a1510';
        const s = k < 0.5 ? 2 : 1;
        g.fillRect(x, y, s, s);
        continue;
      }
      g.globalAlpha = p.kind === 'ash' ? 0.8 : 1 - k * 0.7;
      g.fillStyle = p.color;
      g.fillRect(x, y, 1, 1);
      if (p.kind === 'spark' && k < 0.4) g.fillRect(x - 1, y, 3, 1);
    }
    g.globalAlpha = 1;
  }
}
