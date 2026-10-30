// Hand-drawn pixel sprites as character maps. Each character is a palette
// key; '.' is transparent. Rows are drawn left to right, top to bottom.

export const PALETTE: Record<string, string> = {
  k: '#0a090c', // outline
  a: '#2b2d35', // armour shadow
  b: '#555a66', // armour
  c: '#8f95a3', // armour light
  d: '#c9ced8', // armour shine
  y: '#000000', // visor slit
  r: '#4a1c16', // tabard dark
  R: '#7a2e1f', // tabard
  g: '#8a6a2a', // gold dark
  G: '#c79a3e', // gold
  w: '#d8cfb8', // bone
  W: '#9c927c', // bone shadow
  e: '#3a3530', // ash dark
  E: '#5e564c', // ash
  f: '#857a6a', // ash light
  s: '#b8bcc4', // steel
  S: '#e6e9ee', // steel shine
  o: '#ff6a1f', // ember
  O: '#ffcf5a', // ember hot
  i: '#2a1a12', // wood dark
  I: '#4d3220', // wood
  x: '#ff2a2a', // red eye
  U: '#2f5d93', // sea
  v: '#4f7d3a', // land
};

export type Sprite = string[];

/** Knight standing, 14×20. */
export const KNIGHT: Sprite = [
  '.....kkkk.....',
  '....kcddck....',
  '...kbcddcbk...',
  '...kbccccbk...',
  '...kyyyyyyk...',
  '...kbbccbbk...',
  '....kaGGak....',
  '..kkbarRabkk..',
  '.kbcbarRrabcbk',
  '.kbbkarRrakbbk',
  '.kbak.rRr.kabk',
  '.kck..rRr..kck',
  '.kk..kgGgk..kk',
  '.....kaRak....',
  '....kbarRbk...',
  '....kbr.Rbk...',
  '....kba.abk...',
  '....kba.abk...',
  '...kkbk.kbkk..',
  '...kkkk.kkkk..',
];

/** Knight seen from the side, facing right: idle, then a four-frame walk. */
export const KNIGHT_SIDE: Sprite = [
  '......kkkk....',
  '.....kcddck...',
  '....kbcddcbk..',
  '....kbcccccyk.',
  '....kbbccyyyk.',
  '.....kbbbbbk..',
  '......kaGak...',
  '...kkkbbbbbk..',
  '..krRkbccbbbk.',
  '..krRkbbcbbsk.',
  '..krRkabbbbSk.',
  '..krRrkgGgksk.',
  '...krRkabakk..',
  '...krRkbbbak..',
  '....kkkbkbk...',
  '....kbk.kbk...',
  '....kbk.kbk...',
  '....kbk.kbk...',
  '...kkbk.kbkk..',
  '...kkkk.kkkk..',
];

export const KNIGHT_WALK: Sprite[] = [
  [
    '......kkkk....',
    '.....kcddck...',
    '....kbcddcbk..',
    '....kbcccccyk.',
    '....kbbccyyyk.',
    '.....kbbbbbk..',
    '......kaGak...',
    '...kkkbbbbbk..',
    '..krRkbccbbbk.',
    '..krRkbbcbbsk.',
    '..krRkabbbbSk.',
    '..krRrkgGgksk.',
    '...krRkabakk..',
    '...krRkbbbak..',
    '....kkbkkbk...',
    '...kbk...kbk..',
    '..kbk.....kbk.',
    '..kbk.....kbk.',
    '.kkbk.....kbkk',
    '.kkkk.....kkkk',
  ],
  [
    '......kkkk....',
    '.....kcddck...',
    '....kbcddcbk..',
    '....kbcccccyk.',
    '....kbbccyyyk.',
    '.....kbbbbbk..',
    '......kaGak...',
    '...kkkbbbbbk..',
    '..krRkbccbbbk.',
    '..krRkbbcbbsk.',
    '..krRkabbbbSk.',
    '..krRrkgGgksk.',
    '...krRkabakk..',
    '...krRkbbbak..',
    '....kkbkbk....',
    '....kbkkbk....',
    '....kbk.kbk...',
    '...kbk...kbk..',
    '..kkbk...kbkk.',
    '..kkkk...kkkk.',
  ],
  [
    '......kkkk....',
    '.....kcddck...',
    '....kbcddcbk..',
    '....kbcccccyk.',
    '....kbbccyyyk.',
    '.....kbbbbbk..',
    '......kaGak...',
    '...kkkbbbbbk..',
    '..krRkbccbbbk.',
    '..krRkbbcbbsk.',
    '..krRkabbbbSk.',
    '..krRrkgGgksk.',
    '...krRkabakk..',
    '...krRkbbbak..',
    '....kbkkbkk...',
    '...kbk...kbk..',
    '..kbk.....kbk.',
    '..kbk.....kbk.',
    '.kkbk.....kbkk',
    '.kkkk.....kkkk',
  ],
  [
    '......kkkk....',
    '.....kcddck...',
    '....kbcddcbk..',
    '....kbcccccyk.',
    '....kbbccyyyk.',
    '.....kbbbbbk..',
    '......kaGak...',
    '...kkkbbbbbk..',
    '..krRkbccbbbk.',
    '..krRkbbcbbsk.',
    '..krRkabbbbSk.',
    '..krRrkgGgksk.',
    '...krRkabakk..',
    '...krRkbbbak..',
    '....kbkbkk....',
    '....kbkkbk....',
    '...kbk.kbk....',
    '..kbk...kbk...',
    '.kkbk...kbkk..',
    '.kkkk...kkkk..',
  ],
];

/** Knight seated by the fire, 14×14, facing right. */
export const KNIGHT_SIT: Sprite = [
  '....kkkk......',
  '...kcddck.....',
  '..kbcddcbk....',
  '..kbccyyyk....',
  '..kbbcccbk....',
  '...kaGGak.....',
  '..kbarRabk....',
  '.kbcarRrabk...',
  '.kbbarRrakck..',
  '.kbkarRrkkdk..',
  '.kkkkgGgkbbbk.',
  '.kbbbbbbbbbbk.',
  'kbaaabkkkkabk.',
  'kkkkkk....kkk.',
];

/** Coiled sword in a mound of ash and bone, 21×16. */
export const BONFIRE: Sprite = [
  '.........kkk.........',
  '.........kGk.........',
  '.........kgk.........',
  '.........kIk.........',
  '.......kkGGGkk.......',
  '........kkskk........',
  '.........kSk.........',
  '........kdsck........',
  '.........kSk.........',
  '........kdsck........',
  '.........kSk.........',
  '.....w..kdsck..W.....',
  '...EEwEEEkskEEEWE....',
  '..EfEEWEEEkEEfEEEwE..',
  '.EEEfEEEwwEEEEEfEEEE.',
  'eeEEEEeEEEEeEEEEEeEee',
];

/** Wall skull in a niche, 9×8. */
export const SKULL: Sprite = [
  'kkkkkkkkk',
  'k.kkkkk.k',
  'k.kwwwk.k',
  'kkwwwwwkk',
  'kkwkwkwkk',
  'kkwwWwwkk',
  'kk.wWw.kk',
  'kkkkkkkkk',
];

/** Torch bracket, 5×7 (flame is drawn procedurally above it). */
export const TORCH: Sprite = [
  '.kIk.',
  '.kik.',
  'kgGgk',
  '.kIk.',
  '.kik.',
  '.kIk.',
  'kkkkk',
];

/** One chain link pair, 3×6 (tiles vertically). */
export const CHAIN: Sprite = [
  '.b.',
  'b.b',
  '.b.',
  '.c.',
  '.c.',
  '.b.',
];

/** Remains of a fallen adventurer, 12×5. */
export const BONES: Sprite = [
  '..kkk.......',
  '.kwwwk..W...',
  '.kwkwk.wWw..',
  'WwwwWwwWwwwW',
  '.W..W..W..W.',
];

/** Knight with arms raised: \\[T]/ */
export const KNIGHT_PRAISE: Sprite = [
  'kk...kkkk...kk',
  'kck.kcddck.kck',
  'kbkkbcddcbkkbk',
  '.kbkbccccbkbk.',
  '.kbkyyyyyykbk.',
  '..kkbbccbbkk..',
  '..kbkaGGakbk..',
  '..kbbarRabbk..',
  '...kbarRrabk..',
  '...kaarRraak..',
  '....krRrRrk...',
  '....krrRrrk...',
  '....kgGGGgk...',
  '.....kaRak....',
  '....kbarRbk...',
  '....kbr.Rbk...',
  '....kba.abk...',
  '....kba.abk...',
  '...kkbk.kbkk..',
  '...kkkk.kkkk..',
];

/** Rusted, withered colours for a knight going Hollow. */
export const HOLLOW_PALETTE: Record<string, string> = {
  a: '#2e2620', b: '#5a4a3a', c: '#7d6a55', d: '#9a8670', r: '#3a2a20', R: '#56402c', G: '#7a6a40', g: '#5a4c30',
};

const cache = new Map<string, HTMLCanvasElement>();

/** Pre-renders a sprite (optionally tinted or recoloured) to an offscreen canvas. */
export function bake(sprite: Sprite, tint?: string, palette?: Record<string, string>): HTMLCanvasElement {
  const id = sprite.join('/') + (tint ?? '') + (palette ? JSON.stringify(palette) : '');
  const hit = cache.get(id);
  if (hit) return hit;
  const w = Math.max(...sprite.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = sprite.length;
  const g = c.getContext('2d')!;
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = palette?.[row[x]] ?? PALETTE[row[x]];
      if (!col) continue;
      g.fillStyle = tint && row[x] !== 'k' && row[x] !== 'y' ? tint : col;
      g.fillRect(x, y, 1, 1);
    }
  });
  cache.set(id, c);
  return c;
}

/** Mirrors a sprite horizontally. */
export function flip(sprite: Sprite): Sprite {
  const w = Math.max(...sprite.map((r) => r.length));
  return sprite.map((r) => r.padEnd(w, '.').split('').reverse().join(''));
}
