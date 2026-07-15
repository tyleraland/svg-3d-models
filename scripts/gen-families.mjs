#!/usr/bin/env node
// Generate raw (pre-normalization) family bases for every creature by replaying
// the workbench construction with the normalization CALLS stripped out — attack,
// gait, bespoke clip overrides, canonical-clip derivation, anchor-module
// inference, and occlusion. What remains is pure geometry + the idleA/walkA/attack
// clip pack. Each creature's declarative model re-applies the stripped
// normalization, and resolveModel reproduces the golden rig exactly.
//
//   node scripts/gen-families.mjs
//
// Writes rigs/families/<name>.json for every creature (quadruped is already
// authored as the shared base for the variant models; it is left untouched).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scan } from './lib/scan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Read the preserved original, NOT the (now generated) paper-rig-workbench.html.
const HTML = readFileSync(join(ROOT, 'fixtures/paper-rig-workbench.baseline.html'), 'utf8');
const mainOpen = HTML.indexOf('<script>', HTML.indexOf('id="workbench-maintainer-spec"'));
const body = HTML.slice(mainOpen + '<script>'.length, HTML.indexOf('</script>', mainOpen));
const { units, text } = scan(body);

// Normalization CALL units to strip (see scripts dump of units 123-164):
//  125-144 setRotationalAttack + mimic bespoke attack
//  147,149,150,151,152,153 rotationalGait + dragon/serpentine/harpy bespoke clips
//  157 ensureCanonicalClips forEach, 159 anchor-module forEach
//  162,163,164 tusk/rabbit/spider occlusion
const STRIP = new Set([
  ...range(125, 144), 147, 149, 150, 151, 152, 153, 157, 159, 162, 163, 164,
]);
function range(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }

// Reassemble the construction script without the stripped normalization, then
// evaluate it and grab the raw `rigs` table. Units 0-164 define V/C/factories,
// every creature, and `rigs`; stripping only removes normalization side-effects.
let src = '';
for (let i = 0; i <= 164; i++) if (!STRIP.has(i)) src += text(i) + '\n';
const rigs = new Function(src + '\n;return rigs;')();

// rabbit and quadruped share the hand-authored quadruped family (variant models),
// so they don't get their own raw base.
const SHARED = new Set(['quadruped', 'rabbit']);
let count = 0;
for (const [name, rig] of Object.entries(rigs)) {
  if (SHARED.has(name)) continue;
  writeFileSync(join(ROOT, 'rigs/families', `${name}.json`), JSON.stringify(rig, null, 2) + '\n');
  count++;
}
console.log(`wrote ${count} raw family bases to rigs/families/`);
