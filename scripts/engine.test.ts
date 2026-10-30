// Engine tests: node --test scripts/engine.test.ts  (npm test)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPack, findAnswer } from '../src/engine/match.ts';
import { exactKey, matchKey, normalize } from '../src/engine/normalize.ts';
import { byDifficulty, dailyPrompts, PROMPTS_PER_RUN } from '../src/engine/game.ts';
import { quipFor, secretOf, zoneAt } from '../src/eggs.ts';
import type { PackSpec, Prompt } from '../src/data/types.ts';

const spec: PackSpec = {
  id: 'test',
  prompts: [
    {
      id: 'animal',
      q: { en: 'Name an animal', pl: 'Podaj zwierzę', uk: 'Назвіть тварину' },
      d: 1,
      answers: {
        1: ['Dog|Pies|Собака', 'Cat|Kot|Кіт|кішка'],
        2: ['Platypus|Dziobak|Качкодзьоб'],
        3: ['Whale|Wieloryb|Кит'],
        4: ['Elephant|Słoń|Слон'],
        5: ['Dolphin|Delfin|Дельфін'],
        6: ['Okapi||Окапі'],
      },
      reject: ['Shark'],
    },
    {
      id: 'game',
      q: { en: 'Name a game', pl: 'Podaj grę', uk: 'Назвіть гру' },
      d: 3,
      answers: {
        1: ['Final Fantasy VII|||FF7'],
        2: ['Final Fantasy VIII|||FF8'],
        3: ['Dark Souls III'],
        4: ['Dark Souls II'],
        5: ['Rocky IV'],
        6: ['Schwarzenegger||Шварценеггер'],
      },
    },
  ],
};

const [animal, game] = buildPack(spec);
const name = (p: Prompt, guess: string) => findAnswer(p, guess)?.answer.names.en ?? null;

test('normalize strips case, diacritics, punctuation and articles', () => {
  assert.equal(normalize('  The Łódź-Kaliska!  '), 'lodz kaliska');
  assert.equal(normalize('Ελλάδα'), ''); // unsupported scripts fold to nothing (no answer)
  assert.equal(normalize('Final Fantasy VII'), 'final fantasy 7');
});

test('Cyrillic is transliterated so scripts meet', () => {
  assert.equal(name(animal, 'КАЧКОДЗЬОБ'), 'Platypus');
  assert.equal(name(animal, 'слон'), 'Elephant');
  assert.equal(name(animal, 'słoń'), 'Elephant');
  assert.equal(name(animal, 'slon'), 'Elephant');
});

test('exact spelling wins over phonetic folding (кіт vs кит)', () => {
  assert.equal(matchKey('кіт'), matchKey('кит'));
  assert.notEqual(exactKey('кіт'), exactKey('кит'));
  assert.equal(name(animal, 'кіт'), 'Cat');
  assert.equal(name(animal, 'кит'), 'Whale');
});

test('small typos are forgiven, by length', () => {
  assert.equal(name(animal, 'elephnat'), 'Elephant');
  assert.equal(name(animal, 'dolhpin'), 'Dolphin');
  assert.equal(name(animal, 'platypuss'), 'Platypus');
  assert.equal(name(animal, 'dgo'), null, 'three letters must be exact');
});

test('gibberish and rejected near-misses never match', () => {
  assert.equal(name(animal, 'qwzzxq'), null);
  assert.equal(name(animal, 'Shark'), null);
  assert.equal(name(animal, 'vmlf'), null, 'short words need the right first letter');
});

test('Roman numerals and glued numerals stay distinct', () => {
  assert.equal(name(game, 'final fantasy 7'), 'Final Fantasy VII');
  assert.equal(name(game, 'FF8'), 'Final Fantasy VIII');
  assert.notEqual(matchKey('FFVIII'), matchKey('FFVII'), 'doubled i must survive folding');
  assert.equal(name(game, 'Dark Souls 3'), 'Dark Souls III');
  assert.equal(name(game, 'dark souls ii'), 'Dark Souls II');
  assert.equal(name(game, 'rocky 4'), 'Rocky IV');
});

test('phonetic folding bridges spellings across languages', () => {
  assert.equal(name(game, 'Szwarceneger'), 'Schwarzenegger');
  assert.equal(name(game, 'шварценегер'), 'Schwarzenegger');
});

const pool: Prompt[] = [];
for (const pack of ['a', 'b', 'c']) {
  for (let i = 0; i < 12; i++) {
    pool.push({ id: `${pack}-${i}`, pack, q: { en: '', pl: '', uk: '' }, d: ((i % 3) + 1) as 1 | 2 | 3, answers: [], reject: [] });
  }
}

test('the daily deal is deterministic, unique and ordered easy→hard', () => {
  for (let day = 1; day <= 60; day++) {
    const a = dailyPrompts(pool, day).map((p) => p.id);
    const b = dailyPrompts(pool.slice().reverse(), day).map((p) => p.id);
    assert.deepEqual(a, b, 'pool order must not matter');
    assert.equal(new Set(a).size, PROMPTS_PER_RUN);
    const ds = dailyPrompts(pool, day).map((p) => p.d);
    assert.deepEqual(ds, ds.slice().sort());
  }
});

test('no prompt repeats within half a pack cycle', () => {
  const last = new Map<string, number>();
  for (let day = 1; day <= 200; day++) {
    for (const p of dailyPrompts(pool, day)) {
      const prev = last.get(p.id);
      // 12 prompts per pack, each pack ~7/3 slots a day: a cycle is ~5 days.
      if (prev !== undefined) assert.ok(day - prev >= 2, `${p.id} repeated after ${day - prev} days`);
      last.set(p.id, day);
    }
  }
});

test('byDifficulty is a stable sort', () => {
  const ids = byDifficulty(pool.slice(0, 6)).map((p) => p.id);
  assert.deepEqual(ids, ['a-0', 'a-3', 'a-1', 'a-4', 'a-2', 'a-5']);
});

test('easter-egg phrases', () => {
  assert.equal(secretOf('Praise the Sun!'), 'sun');
  assert.equal(secretOf('\\[T]/'), 'sun');
  assert.equal(secretOf('СЛАВА СОНЦЮ'), 'sun');
  assert.equal(secretOf('t'), null);
  assert.equal(secretOf('git gud'), 'gitgud');
  assert.ok(quipFor('Solaire', 'en')?.includes('incandescent'));
  assert.equal(quipFor('dog', 'en'), null);
});

test('journey zones', () => {
  assert.equal(zoneAt(0).kind, 'meadow');
  assert.equal(zoneAt(1500).kind, 'ruins');
  assert.equal(zoneAt(3000).kind, 'cathedral');
  assert.equal(zoneAt(4500).kind, 'castle');
  assert.equal(zoneAt(7000).kind, 'kiln');
  assert.ok(zoneAt(7000).final);
  assert.equal(zoneAt(99999).kind, 'dark');
});
