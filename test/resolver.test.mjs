// Resolver parity tests: each declarative model must resolve to the exact rig the
// monolithic workbench built imperatively, and that rig must compile and validate.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage } from '@paper-rig/compiler';
import { validate } from '@paper-rig/validator';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const normalize = (obj) => JSON.parse(JSON.stringify(obj));

// Models with a golden raw-rig fixture to prove exact reproduction against.
const MODELS = ['rabbit', 'quadruped'];

for (const m of MODELS) {
  test(`resolves ${m} to the golden rig, byte-identical to the workbench`, () => {
    const golden = readJSON(`fixtures/rigs/${m}.json`);
    assert.deepEqual(normalize(loadModel(m)), golden);
  });

  test(`resolved ${m} compiles and passes validation`, () => {
    const rig = loadModel(m);
    const pkg = compilePackage(rig);
    assert.equal(pkg.modelId, `${m === 'quadruped' ? 'quadruped' : 'rabbit'}Base`);
    assert.equal(validate(rig).status, 'passed');
  });
}
