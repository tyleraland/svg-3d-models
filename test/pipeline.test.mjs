// Behavior-parity tests: the extracted pure pipeline must reproduce the original
// monolithic workbench's output exactly, for every captured creature.
//
//   npm test
//
// Fixtures under fixtures/ are the golden oracle, captured from the source-of-
// truth HTML by scripts/capture-fixtures.mjs. These tests let CI (or an agent)
// validate a creature in milliseconds without launching a browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compilePackage, renderSvg } from '@paper-rig/compiler';
import { validate } from '@paper-rig/validator';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const models = readdirSync(join(ROOT, 'fixtures/rigs')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

// Serialize exactly as the CLI does so undefined-valued keys drop the same way
// the golden capture (JSON.stringify) dropped them.
const normalize = (obj) => JSON.parse(JSON.stringify(obj));

test('compiles every creature to the golden paper-rig/1 package', () => {
  for (const m of models) {
    const rig = readJSON(`fixtures/rigs/${m}.json`);
    const golden = readJSON(`fixtures/packages/${m}.json`);
    assert.deepEqual(normalize(compilePackage(rig)), golden, `package mismatch for ${m}`);
  }
});

test('produces the golden validation report for every creature', () => {
  for (const m of models) {
    const rig = readJSON(`fixtures/rigs/${m}.json`);
    const golden = readJSON(`fixtures/packages/${m}.json`).validation;
    assert.deepEqual(normalize(validate(rig)), golden, `validation mismatch for ${m}`);
  }
});

test('renders byte-identical SVG for every captured pose and camera', () => {
  const rigCache = {};
  const getRig = (m) => (rigCache[m] ??= readJSON(`fixtures/rigs/${m}.json`));
  const svgs = readdirSync(join(ROOT, 'fixtures/svg')).filter((f) => f.endsWith('.svg'));
  assert.ok(svgs.length > 0, 'expected SVG fixtures');
  for (const f of svgs) {
    const m = /^(.+)@([^@]+)@([^@]+)@([^@]+)@([^@]+)\.svg$/.exec(f);
    assert.ok(m, `unexpected fixture name ${f}`);
    const [, model, clip, t, elev, az] = m;
    const golden = readFileSync(join(ROOT, 'fixtures/svg', f), 'utf8');
    const mine = renderSvg(getRig(model), {
      clip, time: Number(t), elevation: Number(elev), heading: Number(az),
    });
    assert.equal(mine, golden, `SVG mismatch for ${f}`);
  }
});
