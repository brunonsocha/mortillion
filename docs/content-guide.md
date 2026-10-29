# Writing Mortillion content

Mortillion works like krillion.io. A prompt like "Name a mammal" appears, the
player has 25 s to type **one** answer, and **rarer valid answers score more**.
The game ships in English, Polish and Ukrainian, and players are mostly Polish,
Ukrainian and international.

Read `src/data/types.ts` (schema) and `src/engine/normalize.ts` (what matching
already forgives) before writing. One pack per file in `src/data/packs/<id>.ts`.

## File shape

```ts
import type { PackSpec } from '../types.ts';

export default {
  id: 'music',
  prompts: [
    {
      id: 'beatles-song',
      q: { en: 'Name a Beatles song', pl: 'Podaj piosenkę Beatlesów', uk: 'Назвіть пісню The Beatles' },
      d: 2,
      answers: {
        1: ['Yesterday||', 'Hey Jude||', …],
        2: […], 3: […], 4: […], 5: […], 6: […],
      },
      reject: ['Imagine', 'Mrs. Robinson'],
    },
  ],
} satisfies PackSpec;
```

### Answers

An answer string has the form `"English|Polish|Ukrainian|alias|alias…"`.
- Leave the PL or UK field empty when it is identical to English.
- Every field is accepted as input.
- Use the real, standard Polish and Ukrainian forms, with Ukrainian (not Russian) spelling.
- Leave a field empty rather than invent a translation you are unsure of.
- For people, always add the surname alone as an alias unless it collides with another answer.
- Titles keep their official PL/UK release names when they exist.
- Matching already ignores case, diacritics, punctuation, leading the/a/an,
  Roman vs Arabic numerals and Cyrillic vs Latin script. Do not add aliases
  that only differ by those.

### `reject`

Use `reject` for plausible wrong answers, especially ones spelled close to a
valid answer, because typo-matching would otherwise accept them. Write one spelling per array
item; the pipe format does not apply in `reject`.

### `d`: difficulty (required)

How hard it is for a general player to name **any** valid answer at all.
- `1` easy: almost everyone can name one ("Name a fruit", "Name a Pixar film").
- `2` medium: most people can, with a moment's thought ("Name a Greek god").
- `3` hard: needs real knowledge ("Name a Tour de France winner").

The Daily Descent orders its seven prompts from easy to hard, so the game
gets harder as you descend.

## Tiers (the core of the game)

Judge familiarity for a general Polish/Ukrainian/international audience:

| Tier | Name | Points | Meaning |
|---|---|---:|---|
| 1 | Hollow | 10 | the 3–8 answers most people blurt out first |
| 2 | Pretender | 15 | the "too clever" pick many people think is obscure (platypus for mammal) |
| 3 | Unkindled | 30 | well known but not first-thought |
| 4 | Ashen | 60 | known to a moderately informed person |
| 5 | Lord of Cinder | 85 | enthusiast level |
| 6 | One in a Mortillion | 100 | genuinely obscure but verifiably correct |

- Every prompt needs all six tiers filled.
- Closed sets (at least 12 answers) must be exhaustive up to their bound.
- Open sets should have 50–150 answers. Bigger banks are better, because rejecting a valid answer
  is the worst experience in the game.
- **Accuracy is paramount.** Include only answers you are confident fit the prompt's exact
  boundary.

## Prompts

- **Short:** ≤ 55 characters in every language, with no parenthetical caveats.
- **Language-neutral:** they must work the same in all three languages, so no "starts with the
  letter X" and no wordplay.
- **Time-proof:** never "current" or "latest". Add a compact bound like "(to 2025)"
  only when the set keeps growing.
- **Ids:** stable, unique, kebab-case, and unique across all packs. Run the validator on
  everything to check.
- **Numbers:** digits and numerals are fine as answers ("Rocky IV", "1917").

## Check your work

```sh
npm run validate -- <pack>   # 0 errors required; read the warnings
npm run validate             # all packs (catches duplicate ids across packs)
```

Warnings about typo-close pairs of *valid* answers are fine. Warnings about
a near-miss *invalid* answer mean you should add it to `reject`.
