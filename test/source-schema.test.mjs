import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadFamily, loadModelSource } from '@paper-rig/rigs';
import { validateFamilySource, validateModelSource, validateSourcePair } from '@paper-rig/validator/source';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = readdirSync(join(ROOT, 'rigs/models')).filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, '')).sort();
const FAMILIES = readdirSync(join(ROOT, 'rigs/families')).filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, '')).sort();

test('all family sources pass their schema and source-reference checks', () => {
  assert.equal(FAMILIES.length, 30);
  for (const name of FAMILIES) {
    const report = validateFamilySource(loadFamily(name));
    assert.equal(report.status, 'passed', `${name}: ${report.issues.map((issue) => issue.detail).join('; ')}`);
  }
});

test('all model sources pass their schema and match an existing family', () => {
  assert.equal(MODELS.length, 31);
  for (const name of MODELS) {
    const model = loadModelSource(name);
    const report = validateSourcePair(model, loadFamily(model.family));
    assert.equal(report.status, 'passed', `${name}: ${report.issues.map((issue) => issue.detail).join('; ')}`);
  }
});

test('model schema rejects unknown authoring fields', () => {
  const model = structuredClone(loadModelSource('horse'));
  model.pltaeOverrides = [];
  const report = validateModelSource(model);
  assert.equal(report.status, 'failed');
  assert.ok(report.issues.some((issue) => issue.detail.includes('additional properties')));
});

test('family source validation rejects broken geometry references', () => {
  const family = structuredClone(loadFamily('horse'));
  family.plates[0].bone = 'missingJoint';
  const report = validateFamilySource(family);
  assert.equal(report.status, 'failed');
  assert.ok(report.issues.some((issue) => issue.id === 'family-plate-references'));
});

test('source schemas accept explicit right-handed plate surface frames', () => {
  const family = structuredClone(loadFamily('horse'));
  family.plates[0].surfaceFrame = {
    normal: [0, 0, 1],
    tangent: [1, 0, 0],
    bitangent: [0, 1, 0],
  };
  assert.equal(validateFamilySource(family).status, 'passed');

  const model = structuredClone(loadModelSource('horse'));
  model.plateOverrides = [...(model.plateOverrides || []), {
    id: family.plates[0].id,
    set: { surfaceFrame: family.plates[0].surfaceFrame },
  }];
  assert.equal(validateModelSource(model).status, 'passed');
});

test('source validation rejects degenerate or left-handed surface frames', () => {
  const family = structuredClone(loadFamily('horse'));
  family.plates[0].surfaceFrame = {
    normal: [0, 0, 1],
    tangent: [1, 0, 0],
    bitangent: [0, -1, 0],
  };
  const report = validateFamilySource(family);
  assert.equal(report.status, 'failed');
  assert.ok(report.issues.some((issue) => issue.id === 'family-surface-frames'));
});

test('family plates and model overrides accept only versioned semantic detail tiers', () => {
  const family = structuredClone(loadFamily('horse'));
  family.plates[0].semanticDetailTier = 'texture';
  assert.equal(validateFamilySource(family).status, 'passed');
  family.plates[0].semanticDetailTier = 'tiny';
  assert.equal(validateFamilySource(family).status, 'failed');

  const model = structuredClone(loadModelSource('horse'));
  model.plateOverrides = [...(model.plateOverrides || []), {
    id: family.plates[0].id,
    set: { semanticDetailTier: 'texture' },
  }];
  assert.equal(validateModelSource(model).status, 'passed');
  model.plateOverrides.at(-1).set.semanticDetailTier = 'tiny';
  assert.equal(validateModelSource(model).status, 'failed');
});
