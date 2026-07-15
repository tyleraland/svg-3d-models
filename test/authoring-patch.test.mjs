// Workbench round-trip tests: generated patches are narrow, schema-valid,
// non-mutating, and resolve to the exact local keyframe deltas they describe.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import patchSchema from '@paper-rig/schema/schemas/model-patch-1.schema.json' with { type: 'json' };
import {
  applyModelPatch,
  createClipKeyframePatch,
  diffResolvedModels,
  explainProvenance,
  inspectClipKeyframePatch,
  loadFamily,
  loadModel,
  loadModelSource,
  resolveModelWithProvenance,
} from '@paper-rig/rigs';
import { validateSourcePair } from '@paper-rig/validator/source';

const validatePatch = new Ajv2020({ allErrors: true, strict: true }).compile(patchSchema);

function rabbitInput(overrides = {}) {
  return {
    sourceModelId: 'rabbit',
    source: loadModelSource('rabbit'),
    rig: loadModel('rabbit'),
    clipId: 'attack',
    time: 0.62,
    jointTransforms: {},
    ...overrides,
  };
}

function analyze(source, sourceModelId) {
  const family = loadFamily(source.family);
  return { source, ...resolveModelWithProvenance(source, family, { sourceModelId }) };
}

test('patch inspection rejects ambiguous or unsupported preview state', () => {
  assert.equal(inspectClipKeyframePatch(rabbitInput()).status, 'empty');
  assert.equal(inspectClipKeyframePatch(rabbitInput({
    time: 0.5,
    jointTransforms: { root: { move: [0, 0, 0], rot: [0, 10, 0] } },
  })).code, 'not-a-keyframe');
  assert.equal(inspectClipKeyframePatch(rabbitInput({
    modelTransform: { move: [0.1, 0, 0], rot: [0, 0, 0] },
  })).code, 'model-transform');
  assert.equal(inspectClipKeyframePatch(rabbitInput({ heightScale: 1.1 })).code, 'preview-proportions');
  assert.equal(inspectClipKeyframePatch(rabbitInput({
    jointTransforms: { nearFrontKnee: { move: [0.1, 0, 0], rot: [0, 0, 0] } },
  })).code, 'rigid-child-translation');
  assert.equal(inspectClipKeyframePatch(rabbitInput({
    jointTransforms: { missingJoint: { move: [0, 0, 0], rot: [0, 10, 0] } },
  })).code, 'unknown-joint');
  assert.equal(inspectClipKeyframePatch(rabbitInput({
    jointTransforms: { neck: { move: [0, 0, 0], rot: [0, Number.NaN, 0] } },
  })).code, 'invalid-transform');
});

test('a generated patch is schema-valid, non-mutating, and resolves additively', () => {
  const source = loadModelSource('rabbit');
  const original = structuredClone(source);
  const patch = createClipKeyframePatch(rabbitInput({
    source,
    jointTransforms: {
      neck: { move: [0, 0, 0], rot: [0, 10, 0] },
      root: { move: [-0.04, 0, 0], rot: [0, 0, 0] },
    },
  }));
  assert.equal(validatePatch(patch), true, JSON.stringify(validatePatch.errors));
  assert.deepEqual(source, original, 'patch generation mutated its model source');
  assert.deepEqual(patch.context.editedJointIds, ['neck', 'root']);

  const candidate = applyModelPatch(source, patch);
  const candidateOriginal = structuredClone(candidate);
  assert.deepEqual(source, original, 'patch application mutated its model source');
  const candidateAnalysis = analyze(candidate, 'rabbitCandidate');
  assert.deepEqual(candidate, candidateOriginal, 'model resolution mutated its patched source');
  const report = validateSourcePair(candidate, loadFamily(candidate.family), { resolvedRig: candidateAnalysis.rig });
  assert.equal(report.status, 'passed', JSON.stringify(report.issues));
  assert.deepEqual(candidateAnalysis.rig.clips.attack.frames[1].poses.root, [-0.04, 0, 0]);
  assert.deepEqual(candidateAnalysis.rig.clips.attack.frames[1].rotations.neck, [0, 38, 0]);

  const explanation = explainProvenance(
    candidateAnalysis.provenance,
    'clip:attack.frames[1].rotations.neck[1]',
  );
  assert.equal(explanation.fields.length, 1);
  assert.equal(explanation.fields[0].origin.sourcePointer, '/clipPatches/0/add/rotations/neck/1');

  const diff = diffResolvedModels(analyze(source, 'rabbit'), candidateAnalysis);
  const neckY = diff.changes.find((change) => change.targetPointer === '/clips/attack/frames/1/rotations/neck/1');
  assert.ok(neckY);
  assert.deepEqual(neckY.relatedSourcePointers, ['/clipPatches/0/add/rotations/neck/1']);

  assert.throws(
    () => applyModelPatch(source, patch, { sourceModelId: 'horse' }),
    (error) => error.code === 'source-model-mismatch',
  );
  const inconsistent = structuredClone(patch);
  inconsistent.context.clipId = 'walk';
  assert.throws(
    () => applyModelPatch(source, inconsistent, { sourceModelId: 'rabbit' }),
    (error) => error.code === 'patch-context-mismatch',
  );
});

test('source-clip patches flow through canonical derivation', () => {
  const source = loadModelSource('rabbit');
  const patch = createClipKeyframePatch(rabbitInput({
    source,
    clipId: 'idleA',
    time: 0.5,
    jointTransforms: { head: { move: [0, 0, 0], rot: [0, 8, 0] } },
  }));
  const { rig } = analyze(applyModelPatch(source, patch), 'rabbitCandidate');
  assert.deepEqual(rig.clips.idleA.frames[1].rotations.head, [0, 8, 0]);
  assert.deepEqual(rig.clips.idle.frames[1].rotations.head, [0, 8, 0]);
});

test('canonical-only patches do not silently rewrite their source clip', () => {
  const source = loadModelSource('rabbit');
  const patch = createClipKeyframePatch(rabbitInput({
    source,
    clipId: 'idle',
    time: 0.5,
    jointTransforms: { head: { move: [0, 0, 0], rot: [0, 8, 0] } },
  }));
  const { rig } = analyze(applyModelPatch(source, patch), 'rabbitCandidate');
  assert.equal(rig.clips.idleA.frames[1].rotations, undefined);
  assert.deepEqual(rig.clips.idle.frames[1].rotations.head, [0, 8, 0]);
});

test('multiple appended patches compose in source order', () => {
  const source = loadModelSource('rabbit');
  const patch = createClipKeyframePatch(rabbitInput({
    source,
    jointTransforms: { neck: { move: [0, 0, 0], rot: [0, 10, 0] } },
  }));
  const twice = applyModelPatch(applyModelPatch(source, patch), patch);
  const { rig } = analyze(twice, 'rabbitCandidate');
  assert.deepEqual(rig.clips.attack.frames[1].rotations.neck, [0, 48, 0]);
});

test('patching one repeated gait frame does not mutate its sibling keyframe or source', () => {
  const source = loadModelSource('rabbit');
  const patch = createClipKeyframePatch(rabbitInput({
    source,
    clipId: 'walkA',
    time: 0,
    jointTransforms: { nearFrontHip: { move: [0, 0, 0], rot: [0, 4, 0] } },
  }));
  const candidate = applyModelPatch(source, patch);
  const original = structuredClone(candidate);
  const { rig } = analyze(candidate, 'rabbitCandidate');
  assert.deepEqual(candidate, original);
  assert.deepEqual(rig.clips.walkA.frames[0].rotations.nearFrontHip, [0, -24, 0]);
  assert.deepEqual(rig.clips.walkA.frames[2].rotations.nearFrontHip, [0, -28, 0]);
});

test('source validation rejects hand-authored rigid child translation patches', () => {
  const source = loadModelSource('rabbit');
  source.clipPatches = [{
    clip: 'attack',
    t: 0.62,
    add: { poses: { nearFrontKnee: [0.1, 0, 0] } },
  }];
  const family = loadFamily(source.family);
  const report = validateSourcePair(source, family, { resolvedRig: loadModel('rabbit') });
  assert.ok(report.issues.some((issue) => issue.id === 'model-clip-patch-rigid-child-translation'));
});
