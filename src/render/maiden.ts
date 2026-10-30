// Liora, the Ember Maiden: the game's guide at the bonfire. Drawn as
// character maps like every other sprite, with her own palette.
import type { Sprite } from './sprites.ts';

export const MAIDEN_PALETTE: Record<string, string> = { k: '#0a060c', w: '#4a3d72', v: '#1e1830', j: '#0f0b18', s: '#f8ecef', S: '#d9b8c6', e: '#e2322c', l: '#4a2034', m: '#6a1236', b: '#ff8fa6', x: '#fff3ec', R: '#231a30', r: '#0e0a14', P: '#4a3a5e', g: '#f2c35e', o: '#ff6a1f', O: '#ffd46e', c: '#3a1830' };

/** Standing at the bonfire, 16×28, facing the knight: black hime-cut hair, off-shoulder black gown, gold belt, a slit skirt. */
export const MAIDEN: Sprite = [
  '....kkkkk.......',
  '...kwgOgwk......',
  '..kwwwvwwvk.....',
  '..kvwvwvwvjk....',
  '..kwsvsswvjk....',
  '..kesSeswvjk....',
  '..ksssSwvwjk....',
  '...kmsSkwvjk....',
  '...kSckwvwjk....',
  '..kssSswvvjjk...',
  '.ksSsssSwvwjk...',
  '.kssSsSswvvjk...',
  '.kgggRgggkvjk...',
  '..kRPRrRkvjk....',
  '..kRPRrkvwjk....',
  '..kgOggkvjjk....',
  '.kRPRRRrkjk.....',
  'kRPRRRRrrRk.....',
  'kRPRRRRrrRk.....',
  'kRPsRRRrrRk.....',
  '.kPsSRRrrRk.....',
  '.kPsSRRrrrRk....',
  '.kRsSRRrrrRk....',
  '.kRsSRRrrrRk....',
  'kRPsSRRrrrrRk...',
  'kRPsSRRRrrrRk...',
  'kRPsSRRrrrrrRk..',
  'kkkkSkkkkkkkkk..',
];

