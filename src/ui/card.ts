// Renders a run as a square pixel-art image for sharing on social media.

import type { Turn } from '../engine/game.ts';
import { TIER_COLORS } from '../render/scene.ts';
import { BONFIRE, KNIGHT, bake } from '../render/sprites.ts';

export interface CardInfo {
  label: string;
  depth: string;
  rank: string;
  turns: Turn[];
  url: string;
}

const SIZE = 1080;

export async function renderCard(info: CardInfo): Promise<Blob> {
  await document.fonts.ready;
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  // Stone backdrop: rows of offset bricks, darkening toward the bottom.
  g.fillStyle = '#07060a';
  g.fillRect(0, 0, SIZE, SIZE);
  const bw = 72;
  const bh = 36;
  for (let y = 0; y < SIZE; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < SIZE; x += bw) {
      const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233)) % 1;
      const v = Math.round(22 + n * 14 - (y / SIZE) * 14);
      g.fillStyle = `rgb(${v},${v - 1},${v + 3})`;
      g.fillRect(x + off + 4, y + 4, bw - 4, bh - 4);
    }
  }
  const vignette = g.createRadialGradient(SIZE / 2, SIZE * 0.55, SIZE * 0.15, SIZE / 2, SIZE * 0.55, SIZE * 0.75);
  vignette.addColorStop(0, 'rgba(255,120,40,0.16)');
  vignette.addColorStop(0.45, 'rgba(0,0,0,0.35)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.92)');
  g.fillStyle = vignette;
  g.fillRect(0, 0, SIZE, SIZE);

  const text = (s: string, y: number, size: number, color: string, font = 'Tiny5') => {
    g.font = `${size}px "${font}", monospace`;
    g.textAlign = 'center';
    g.fillStyle = '#000';
    g.fillText(s, SIZE / 2, y + Math.max(3, size / 14));
    g.fillStyle = color;
    g.fillText(s, SIZE / 2, y);
  };

  g.save();
  g.shadowColor = 'rgba(255,140,40,0.55)';
  g.shadowBlur = 36;
  text('MORTILLION', 150, 118, '#f2d98c', 'Pixelify Sans');
  g.restore();
  text(info.label, 225, 38, '#e8823e');

  // The knight standing beside the bonfire, scaled up crisply.
  const knight = bake(KNIGHT);
  const fire = bake(BONFIRE);
  const s = 9;
  g.drawImage(knight, SIZE / 2 - knight.width * s - 30, 520 - knight.height * s, knight.width * s, knight.height * s);
  // A pixel flame rising around the sword, narrowing as it climbs.
  const fx = SIZE / 2 + 30 + (fire.width * s) / 2;
  const base = 520 - 4 * s;
  for (let row = 0; row < 14; row++) {
    const half = Math.max(0, 5 - Math.floor(row / 2.6) + (Math.random() < 0.4 ? 1 : 0));
    for (let col = -half; col <= half; col++) {
      if (Math.random() < 0.18 + row * 0.03) continue;
      const k = Math.abs(col) / (half + 1) + row / 16;
      g.fillStyle = k < 0.45 ? '#fff2b0' : k < 0.75 ? '#ffcf5a' : k < 1 ? '#ff6a1f' : '#c2310f';
      g.fillRect(Math.round(fx + col * s - s / 2), base - row * s, s, s);
    }
  }
  g.drawImage(fire, SIZE / 2 + 30, 520 - fire.height * s, fire.width * s, fire.height * s);
  g.fillStyle = '#ffb347';
  for (let i = 0; i < 26; i++) {
    const x = SIZE / 2 + 30 + 40 + Math.random() * 110;
    const y = 520 - fire.height * s - Math.random() * 120;
    g.fillRect(Math.round(x / 9) * 9, Math.round(y / 9) * 9, 9, 9);
  }

  text(info.depth, 690, 140, '#fff2b0');
  text(info.rank, 770, 46, '#e8823e');

  // One block per prompt, coloured by tier.
  const n = info.turns.length;
  const cell = Math.min(96, Math.floor((SIZE - 160) / Math.max(n, 1)) - 12);
  const total = n * cell + (n - 1) * 12;
  info.turns.forEach((t, i) => {
    const x = SIZE / 2 - total / 2 + i * (cell + 12);
    g.fillStyle = '#000';
    g.fillRect(x - 4, 830 - 4, cell + 8, cell + 8);
    g.fillStyle = TIER_COLORS[t.tier];
    g.fillRect(x, 830, cell, cell);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(x, 830 + cell - 9, cell, 9);
  });

  text(info.url, 1020, 30, '#8f8574');

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

/** Opens the native share sheet with the image, or downloads it. */
export async function shareCard(info: CardInfo, filename: string): Promise<void> {
  const blob = await renderCard(info);
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    await navigator.share({ files: [file] });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
