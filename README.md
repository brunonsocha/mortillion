# Mortillion · the daily descent

A dark-fantasy, pixel-art daily word game in the style of
[krillion.io](https://krillion.io) and [cosmillion.com](https://cosmillion.com).
Each descent has seven prompts ("Name a mammal") and you get 25 seconds per
prompt to offer **one** answer. Rare answers sink you deeper into the abyss,
obvious ones barely count, and a wrong answer means **YOU DIED**.

Playable in **English, Polish and Ukrainian**. Answers in any of the three
languages (and Cyrillic typed on a Russian layout) are accepted.

## Modes

- **Daily Descent:** the same seven prompts for everyone, ordered easy → hard. One attempt
  per day, with streaks, an emoji share and a shareable image card.
- **Endless Abyss:** three Estus flasks are your lives. Descend until the last is gone.
- **Themed Catacombs:** seven prompts from one theme: Sports, Movies & TV, Geography,
  Video games, Music, History and Science. Literature, Art and Food are sealed teasers.
- **Summon Signs:** local pass-and-play for 2–6 players. Shared answers "echo" for half
  points.
- **Archive:** replay past daily descents as practice.
- **Status:** lifetime records and a histogram of your answers by tier.

Dark Souls easter eggs are hidden throughout. `DEVLOG.md` lists them if you want spoilers.

| Tier | Points | |
|---|---:|---|
| Hollow | 10 | what everyone says first |
| Pretender | 15 | the "clever" pick everyone makes |
| Unkindled | 30 | known, but not first to mind |
| Ashen | 60 | known to the informed |
| Lord of Cinder | 85 | enthusiast level |
| One in a Mortillion | 100 | genuinely obscure, still correct |

Depth = points × 10 m. The maximum is 7,000 m.

## Stack

Krillion and Cosmillion are both Next.js + React apps (Turbopack chunks, CSS
modules, PNG sprites, localStorage for guest progress). Mortillion keeps the
same idea but is deliberately lightweight:

- **Vite + vanilla TypeScript**, with no UI framework. A 20-line hyperscript helper
  (`src/ui/dom.ts`) and hash routing.
- **All pixel art is code.** Sprites are character maps (`src/render/sprites.ts`)
  drawn to a low-resolution `<canvas>` and scaled up with nearest-neighbour
  filtering. The torch-lit shaft, bonfire, embers, ash, watching eyes and the
  knight's descent are drawn in `src/render/scene.ts`. No image files.
- **Sound is synthesized** with WebAudio (`src/render/sfx.ts`). No audio files.
- **Fonts:** self-hosted Tiny5 for text (clear digits and Cyrillic) and
  Pixelify Sans Bold for titles.
- **Static output.** `dist/` can go on any static host. The core JS is about
  20 KB gzipped, and each content pack is a lazily loaded chunk.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run validate   # check all content packs (or: npm run validate -- sports)
npm test           # engine tests (matching, daily deal, easter eggs)
```

Writing content: see `docs/content-guide.md` (schema, rarity tiers, difficulty,
wording rules). Accounts and the optional subscription: see `docs/subscriptions.md`
(off unless Supabase/Stripe keys are configured). Change history: `DEVLOG.md`.

## Content packs

Packs live in `src/data/packs/<id>.ts` and are discovered automatically.
Each answer is one pipe-separated string grouped by tier:

```ts
answers: {
  1: ['Germany|Niemcy|Німеччина|Deutschland'],   // en|pl|uk|aliases…
  6: ['Liechtenstein||Ліхтенштейн'],             // empty field = same as English
},
reject: ['Iceland', 'Islandia'],                 // near-misses that must not fuzzy-match
```

Matching (`src/engine/normalize.ts`, `src/engine/match.ts`):

- lowercases the input, strips diacritics, punctuation and leading articles
- transliterates Ukrainian/Russian Cyrillic
- converts Roman numerals ("Final Fantasy VII" = "Final Fantasy 7")
- applies phonetic folding (sz/sch/sh, w/v, c/k/s…)
- forgives small typos by length

Exact spellings win over folded ones, so Ukrainian кіт (cat) and кит (whale)
stay apart.

To add a theme:
1. Create `src/data/packs/<id>.ts`. If its id is in `THEME_ORDER`
   (`src/data/packs/index.ts`), the theme unlocks automatically.
2. Name it in `PACK_NAMES` / `PACK_SUBS` in `src/i18n/strings.ts`.
3. Give it an icon in `src/ui/icons.ts`.

New packs join the daily rotation automatically. Prompts are dealt per pack
from seeded decks, so nothing repeats until the pack has been used up.

### Caveat

Like any purely static daily game, the answer banks ship to the browser, so a
determined player can read them. Moving validation to a small API endpoint
would close that gap if leaderboards are ever added.
