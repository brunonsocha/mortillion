// Liora, the Ember Maiden: the game's guide at the bonfire. Drawn as
// character maps like every other sprite, with her own palette.
import type { Sprite } from './sprites.ts';

export const MAIDEN_PALETTE: Record<string, string> = { k: '#0a060c', w: '#ece6ea', v: '#b9b0b6', j: '#7a6f78', s: '#f6dccb', S: '#d9a891', e: '#ff9a3a', l: '#4a2034', m: '#c45a6a', b: '#ff8fa6', x: '#fff3ec', R: '#3a2218', r: '#1a0e0a', P: '#5e3a26', g: '#f2c35e', o: '#ff6a1f', O: '#ffd46e', c: '#3a1830' };

/** Standing at the bonfire, 16×28, facing the knight: long silver hair, off-shoulder dark robes, gold belt, a slit skirt. */
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

