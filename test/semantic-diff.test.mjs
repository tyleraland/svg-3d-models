// Provenance-aware semantic diff tests: compare declarative source edits by
// their stable-ID resolved effects without treating either revision as correct.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import semanticDiffSchema from '@paper-rig/schema/schemas/semantic-diff-1.schema.json' with { type: 'json' };
import { cloneData } from '@paper-rig/schema';
import {
  diffResolvedModels,
  loadFamily,
  loadModelSource,
  resolveModelWithProvenance,
} from '@paper-rig/rigs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = readdirSync(join(ROOT, 'rigs/models'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();
const validateDiff = new Ajv2020({ allErrors: true, strict: true }).compile(semanticDiffSchema);

function analyze(source, sourceModelId) {
  const family = loadFamily(source.family);
  return {
    source,
    ...resolveModelWithProvenance(source, family, { sourceModelId }),
  };
}

function assertValid(diff, label) {
  assert.equal(validateDiff(diff), true, `${label}: ${JSON.stringify(validateDiff.errors)}`);
}

test('every catalog model has a deterministic schema-valid unchanged self-diff', () => {
  assert.equal(MODELS.length, 31);
  for (const model of MODELS) {
    const source = loadModelSource(model);
    const analysis = analyze(source, model);
    const diff = diffResolvedModels(analysis, analysis);
    assertValid(diff, model);
    assert.equal(diff.status, 'unchanged', model);
    assert.equal(diff.summary.sourceChangeCount, 0, model);
    assert.equal(diff.summary.resolvedChangeCount, 0, model);
  }
});

test('a direct variant edit maps one source leaf to its stable-ID plate effect', () => {
  const baselineSource = loadModelSource('rabbit');
  const candidateSource = cloneData(baselineSource);
  candidateSource.variant.plateTweaks.headPlate[0] = 0.4;
  const diff = diffResolvedModels(
    analyze(baselineSource, 'rabbit'),
    analyze(candidateSource, 'rabbitCandidate'),
  );
  assertValid(diff, 'direct variant edit');
  assert.equal(diff.status, 'changed');
  assert.deepEqual(diff.summary, {
    sourceChangeCount: 1,
    resolvedChangeCount: 1,
    addedLeafCount: 0,
    removedLeafCount: 0,
    changedLeafCount: 1,
    affectedEntityCount: 1,
    unlinkedSourceChangeCount: 0,
    unlinkedResolvedChangeCount: 0,
  });
  assert.equal(diff.sourceChanges[0].sourcePointer, '/variant/plateTweaks/headPlate/0');
  assert.deepEqual(diff.sourceChanges[0].affectedTargetPointers, ['/plates/headPlate/size/0']);
  assert.equal(diff.changes[0].target.kind, 'plate');
  assert.equal(diff.changes[0].target.id, 'headPlate');
  assert.equal(diff.changes[0].candidateOrigin.sourcePointer, '/variant/plateTweaks/headPlate/0');
});

test('recipe input edits link to every resolved effect attributed to that recipe scope', () => {
  const baselineSource = loadModelSource('rabbit');
  const candidateSource = cloneData(baselineSource);
  candidateSource.variant.sx = 0.55;
  const diff = diffResolvedModels(
    analyze(baselineSource, 'rabbit'),
    analyze(candidateSource, 'rabbitCandidate'),
  );
  assertValid(diff, 'recipe input edit');
  assert.equal(diff.sourceChanges.length, 1);
  assert.equal(diff.sourceChanges[0].sourcePointer, '/variant/sx');
  assert.ok(diff.sourceChanges[0].affectedTargetPointers.length > 10);
  assert.ok(diff.changes.filter((change) => change.candidateOrigin.kind !== 'derived-default')
    .every((change) => change.relatedSourcePointers.includes('/variant/sx')));
  assert.ok(diff.changes.some((change) => change.candidateOrigin.kind === 'recipe'));
  assert.ok(diff.summary.unlinkedResolvedChangeCount > 0);
});

test('semantically equivalent source edits remain visible as source-only', () => {
  const baselineSource = loadModelSource('rabbit');
  const candidateSource = cloneData(baselineSource);
  candidateSource.plateSizeOverrides[0].match = '(?:Rear).*UpperPlate$';
  const diff = diffResolvedModels(
    analyze(baselineSource, 'rabbit'),
    analyze(candidateSource, 'rabbitCandidate'),
  );
  assertValid(diff, 'source-only edit');
  assert.equal(diff.status, 'source-only');
  assert.equal(diff.summary.sourceChangeCount, 1);
  assert.equal(diff.summary.resolvedChangeCount, 0);
  assert.equal(diff.summary.unlinkedSourceChangeCount, 1);
  assert.deepEqual(diff.sourceChanges[0].affectedTargetPointers, []);
});

test('new resolved fields are reported as additions with candidate provenance', () => {
  const baselineSource = loadModelSource('rabbit');
  const candidateSource = cloneData(baselineSource);
  candidateSource.anchorOverrides = [{ id: 'nearEarTipAnchor', set: { role: 'ear-tip' } }];
  const diff = diffResolvedModels(
    analyze(baselineSource, 'rabbit'),
    analyze(candidateSource, 'rabbitCandidate'),
  );
  assertValid(diff, 'added anchor field');
  const addition = diff.changes.find((change) => change.targetPointer === '/anchors/nearEarTipAnchor/role');
  assert.ok(addition);
  assert.equal(addition.kind, 'added');
  assert.equal(addition.baselinePresent, false);
  assert.equal(addition.candidateOrigin.sourcePointer, '/anchorOverrides/0');
  assert.deepEqual(addition.relatedSourcePointers, [
    '/anchorOverrides/0/id',
    '/anchorOverrides/0/set/role',
  ]);
});

test('removed resolved fields retain baseline provenance and source links', () => {
  const candidateSource = loadModelSource('rabbit');
  const baselineSource = cloneData(candidateSource);
  baselineSource.anchorOverrides = [{ id: 'nearEarTipAnchor', set: { role: 'ear-tip' } }];
  const diff = diffResolvedModels(
    analyze(baselineSource, 'rabbitBaseline'),
    analyze(candidateSource, 'rabbit'),
  );
  assertValid(diff, 'removed anchor field');
  const removal = diff.changes.find((change) => change.targetPointer === '/anchors/nearEarTipAnchor/role');
  assert.ok(removal);
  assert.equal(removal.kind, 'removed');
  assert.equal(removal.candidatePresent, false);
  assert.equal(removal.baselineOrigin.sourcePointer, '/anchorOverrides/0');
  assert.deepEqual(removal.relatedSourcePointers, [
    '/anchorOverrides/0/id',
    '/anchorOverrides/0/set/role',
  ]);
});

test('stable model ID changes are explicitly incompatible', () => {
  const baselineSource = loadModelSource('rabbit');
  const candidateSource = cloneData(baselineSource);
  candidateSource.variant.id = 'otherRabbit';
  const diff = diffResolvedModels(
    analyze(baselineSource, 'rabbit'),
    analyze(candidateSource, 'rabbitCandidate'),
  );
  assertValid(diff, 'incompatible model id');
  assert.equal(diff.compatible, false);
  assert.equal(diff.status, 'incompatible');
  assert.ok(diff.incompatibilities.some((item) => item.code === 'semantic-diff.model-id'));
  assert.deepEqual(diff.changes, []);
});
