// Folds any user input (English, Polish, Ukrainian, or Ukrainian typed on a
// Russian layout) into a lowercase ASCII key so all three languages can be
// compared against one answer bank.

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
  // Russian-only letters, for people typing on a Russian layout.
  ы: 'y', э: 'e', ё: 'e', ъ: '',
};

const LATIN_SPECIAL: Record<string, string> = {
  ł: 'l', ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ı: 'i',
};

const ARTICLES = /^(the|a|an) /;

const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50 };

/** "vii" → "7" for standalone numerals, so "Final Fantasy VII" = "Final Fantasy 7". */
function romanToArabic(word: string): string {
  if (!/^(x{0,3})(ix|iv|v?i{0,3})$/.test(word) || !word) return word;
  let n = 0;
  for (let i = 0; i < word.length; i++) {
    const v = ROMAN[word[i]];
    n += v < (ROMAN[word[i + 1]] ?? 0) ? -v : v;
  }
  return String(n);
}

function translit(s: string): string {
  let out = '';
  for (const ch of s) out += CYR[ch] ?? LATIN_SPECIAL[ch] ?? ch;
  return out;
}

/**
 * Phonetic folding applied after transliteration so that "Shvartseneger",
 * "Szwarceneger" and "Schwarzenegger" collapse to similar keys.
 */
function fold(s: string): string {
  return s
    .replace(/sch/g, 'sh')
    .replace(/sz/g, 'sh')
    .replace(/cz/g, 'ch')
    .replace(/kh/g, 'h')
    .replace(/ck/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/w/g, 'v')
    .replace(/ts/g, 'c')
    .replace(/tz/g, 'c')
    .replace(/z/g, 's')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/[yj]/g, 'i')
    // i, v and x stay doubled so glued numerals survive ("FFVIII" ≠ "FFVII").
    .replace(/([a-hj-uwyz])\1+/g, '$1');
}

/** Readable key: lowercase ascii words separated by single spaces. */
export function normalize(input: string): string {
  let s = input.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
  s = translit(s);
  s = s.replace(/&/g, ' and ').replace(/['’`ʼ"]/g, '');
  s = s.replace(/[^a-z0-9]+/g, ' ').trim();
  s = s.replace(ARTICLES, '');
  // A lone "i" or "x" is usually a word or letter ("I, Robot", "Malcolm X"),
  // but converting it is harmless because both sides normalize the same way.
  return s.split(' ').map(romanToArabic).join(' ');
}

/** Exact key: normalized with spaces removed but no phonetic folding. */
export function exactKey(input: string): string {
  return normalize(input).replace(/ /g, '');
}

/** Matching key: normalized, spaces removed, phonetically folded. */
export function matchKey(input: string): string {
  return fold(normalize(input).replace(/ /g, ''));
}
