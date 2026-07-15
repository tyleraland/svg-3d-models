// Resolver parity tests: every declarative model must resolve to the exact rig the
// monolithic workbench built imperatively, and that rig must compile and validate.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage } from '@paper-rig/compiler';
import { validate } from '@paper-rig/validator';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const normalize = (obj) => JSON.parse(JSON.stringify(obj));
const MODELS = readdirSync(join(ROOT, 'rigs/models')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

test('every declarative model resolves byte-identical to its golden rig', () => {
  assert.equal(MODELS.length, 31, 'expected all 31 creatures as declarative models');
  for (const m of MODELS) {
    const golden = readJSON(`fixtures/rigs/${m}.json`);
    assert.deepEqual(normalize(loadModel(m)), golden, `resolved rig mismatch for ${m}`);
  }
});

test('every resolved model compiles and passes validation', () => {
  for (const m of MODELS) {
    const rig = loadModel(m);
    const pkg = compilePackage(rig);
    assert.ok(pkg.modelId, `no modelId for ${m}`);
    assert.equal(validate(rig).status, 'passed', `${m} failed validation`);
  }
});
