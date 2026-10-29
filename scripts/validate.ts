// Validates content packs: schema, translations, tier spread and key
// collisions. Usage: npm run validate [-- packId …]   (defaults to all packs)

import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { buildPack, editDistance, findAnswer } from '../src/engine/match.ts';
import { matchKey } from '../src/engine/normalize.ts';
import { LANGS, type PackSpec } from '../src/data/types.ts';

const dir = fileURLToPath(new URL('../src/data/packs/', import.meta.url));
const wanted = process.argv.slice(2);
const files = readdirSync(dir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts' && (!wanted.length || wanted.includes(f.slice(0, -3))),
);

let errors = 0;
let warnings = 0;
const seenIds = new Map<string, string>();
const err = (m: string) => (errors++, console.log(`  ✖ ${m}`));
const warn = (m: string) => (warnings++, console.log(`  ⚠ ${m}`));

for (const f of files) {
  const spec: PackSpec = (await import(pathToFileURL(join(dir, f)).href)).default;
  console.log(`\n■ ${f}  (${spec.prompts.length} prompts)`);
  if (spec.id !== f.slice(0, -3)) err(`pack id "${spec.id}" must equal file name`);
  const prompts = buildPack(spec);

  spec.prompts.forEach((p, i) => {
    const where = `[${p.id}]`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) err(`${where} id must be kebab-case`);
    if (seenIds.has(p.id)) err(`${where} duplicate id (also in ${seenIds.get(p.id)})`);
    seenIds.set(p.id, f);
    for (const l of LANGS) if (!p.q?.[l]?.trim()) err(`${where} missing question text for "${l}"`);
    for (const l of LANGS) if ((p.q?.[l]?.length ?? 0) > 60) warn(`${where} "${l}" question is ${p.q[l].length} chars; keep it ≤ 55`);
    if (![1, 2, 3].includes(p.d)) err(`${where} difficulty "d" must be 1 (easy), 2 (medium) or 3 (hard)`);
    if (p.q?.uk && !/[а-яіїєґ]/i.test(p.q.uk)) err(`${where} Ukrainian question is not in Cyrillic`);

    const prompt = prompts[i];
    const counts = [1, 2, 3, 4, 5, 6].map((t) => prompt.answers.filter((a) => a.tier === t).length);
    const total = prompt.answers.length;
    if (total < 12) err(`${where} only ${total} answers (need ≥ 12)`);
    else if (total < 25) warn(`${where} only ${total} answers; fine for a closed set, otherwise add more`);
    if (counts.some((c) => c === 0)) err(`${where} every tier 1–6 needs answers, got ${counts.join('/')}`);
    if (counts[0] > 12) warn(`${where} tier 1 should hold only the obvious picks, has ${counts[0]}`);

    const owner = new Map<string, string>();
    let missingUk = 0;
    for (const a of prompt.answers) {
      if (a.names.uk === a.names.en && /[a-z]/i.test(a.names.en)) missingUk++;
      for (const k of a.keys) {
        const prev = owner.get(k);
        if (prev && prev !== a.names.en) {
          // A folded clash is fine when every spelling is still exactly distinct.
          const other = prompt.answers.find((b) => b.names.en === prev)!;
          const clash = a.exact.some((e) => other.exact.includes(e));
          if (clash) err(`${where} "${a.names.en}" and "${prev}" share spelling "${k}"`);
          else warn(`${where} "${a.names.en}" and "${prev}" fold to the same key "${k}"; only exact spellings separate them`);
        }
        owner.set(k, a.names.en);
      }
      if (findAnswer(prompt, a.names.en)?.answer !== a) err(`${where} "${a.names.en}" does not match itself`);
    }
    if (missingUk > total * 0.5) warn(`${where} ${missingUk}/${total} answers have no Ukrainian name`);

    for (const r of p.reject ?? []) {
      if (owner.has(matchKey(r))) err(`${where} reject "${r}" collides with a valid answer`);
    }

    // Distinct answers whose keys are within typo distance: a typo of one may
    // land on the other. Usually harmless, but worth a look.
    const all = [...owner.entries()];
    for (let x = 0; x < all.length; x++) {
      for (let y = x + 1; y < all.length; y++) {
        const [ka, na] = all[x];
        const [kb, nb] = all[y];
        if (na === nb || Math.min(ka.length, kb.length) < 5) continue;
        if (editDistance(ka, kb, 1) <= 1) warn(`${where} "${na}" ≈ "${nb}" (typo-close)`);
      }
    }
  });
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
