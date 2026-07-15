import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AttachmentAssemblyError,
  attachmentSlots,
  resolveAttachmentAssembly,
  validateAttachmentConfiguration,
} from '@paper-rig/attachments';
import { compilePackage, solvePose } from '@paper-rig/compiler';
import {
  loadAttachmentModule,
  loadAttachmentModulesForModel,
  loadModel,
  loadModelAssembly,
  loadModelSource,
} from '@paper-rig/rigs';
import { validate } from '@paper-rig/validator';
import {
  validateAttachmentManifest,
  validateAttachmentModuleSource,
  validateModelAttachmentConfiguration,
} from '@paper-rig/validator/attachments';

const close = (actual, expected, epsilon = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
};
const multiply = (matrix, vector) => matrix.map((row) =>
  row.reduce((sum, value, index) => sum + value * vector[index], 0));
const add = (left, right) => left.map((value, index) => value + right[index]);
const distance = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));

test('legacy anchor module types normalize to versioned hierarchical slot types', () => {
  const rig = loadModel('humanoid');
  const slots = Object.fromEntries(attachmentSlots(rig).map((slot) => [slot.id, slot]));
  assert.equal(slots.nearGripAnchor.type, 'hand.grip');
  assert.equal(slots.headgearAnchor.type, 'head.hat');
  assert.equal(slots.backAnchor.type, 'back.mount');
  assert.deepEqual(slots.backAnchor.owner, { kind: 'joint', id: 'shoulders' });
  assert.deepEqual(slots.backAnchor.localFrame.positionMeters, [-0.04, 0, 0.08]);
});

test('one source-native travel pack assembles on humanoid and quadruped slots', () => {
  const expected = {
    humanoid: { owner: 'shoulders', scale: 1, topBind: 0.18 },
    rabbit: { owner: 'chest', scale: 0.45, topBind: 0.081 },
  };
  for (const [name, proof] of Object.entries(expected)) {
    const { rig, manifest } = loadModelAssembly(name);
    assert.equal(validate(rig).status, 'passed', name);
    assert.equal(validateAttachmentManifest(manifest).status, 'passed', name);
    assert.equal(manifest.sourceModelId, name);
    assert.equal(manifest.instances.length, 1);
    assert.equal(manifest.instances[0].moduleId, 'travelPack');
    assert.equal(manifest.instances[0].slotType, 'back.mount');
    assert.equal(manifest.instances[0].scale, proof.scale);
    assert.deepEqual(manifest.instances[0].geometryIds, {
      joints: ['travelPack__root', 'travelPack__top'],
      plates: ['travelPack__body'],
    });

    const root = rig.joints.find((joint) => joint.id === 'travelPack__root');
    const top = rig.joints.find((joint) => joint.id === 'travelPack__top');
    assert.equal(root.parent, proof.owner);
    close(top.bind[2], proof.topBind);

    const compiled = compilePackage(rig);
    const plate = compiled.plates.find((candidate) => candidate.id === 'travelPack__body');
    assert.equal(plate.paletteRole, 'equipment');
    assert.deepEqual(plate.attachment.jointIds, ['travelPack__root', 'travelPack__top']);
  }
});

test('attachment roots track the complete posed owner frame and module spans remain rigid', () => {
  for (const name of ['humanoid', 'rabbit']) {
    const { rig, manifest } = loadModelAssembly(name);
    const instance = manifest.instances[0];
    const rootJoint = rig.joints.find((joint) => joint.id === instance.geometryIds.joints[0]);
    const samples = [
      { clip: 'idle', time: 0 },
      { clip: 'walk', time: 0.25 },
      { clip: 'attack', time: 0.62 },
    ];
    const lengths = [];
    for (const sample of samples) {
      const pose = solvePose(rig, sample).joints;
      const owner = pose[instance.owner.id];
      const expectedRoot = add(owner.positionMeters, multiply(owner.localToWorldRotation, rootJoint.bind));
      pose[instance.geometryIds.joints[0]].positionMeters.forEach((value, axis) => close(value, expectedRoot[axis]));
      lengths.push(distance(
        pose[instance.geometryIds.joints[0]].positionMeters,
        pose[instance.geometryIds.joints[1]].positionMeters,
      ));
    }
    lengths.forEach((length) => close(length, lengths[0]));
  }
});

test('assembly is opt-in and never mutates the base rig, model source, or module source', () => {
  const rig = loadModel('rabbit');
  const model = loadModelSource('rabbit');
  const modules = loadAttachmentModulesForModel(model);
  const snapshots = [structuredClone(rig), structuredClone(model), structuredClone(modules)];
  const assembly = resolveAttachmentAssembly({ rig, sourceModelId: 'rabbit', instances: model.attachments, modules });

  assert.deepEqual(rig, snapshots[0]);
  assert.deepEqual(model, snapshots[1]);
  assert.deepEqual(modules, snapshots[2]);
  assert.equal(rig.joints.some((joint) => joint.id.startsWith('travelPack__')), false);
  assert.equal(assembly.rig.joints.some((joint) => joint.id === 'travelPack__root'), true);
});

test('module and model attachment validation reject only explicit contract violations', () => {
  const rig = loadModel('humanoid');
  const model = loadModelSource('humanoid');
  const module = loadAttachmentModule('travelPack');
  assert.equal(validateAttachmentModuleSource(module).status, 'passed');
  assert.equal(validateModelAttachmentConfiguration(model, rig, { travelPack: module }).status, 'passed');

  const cases = [
    {
      issue: 'attachment-slot-compatible',
      instances: [{ id: 'pack', moduleId: 'travelPack', slotId: 'nearGripAnchor' }],
      modules: { travelPack: module },
    },
    {
      issue: 'attachment-slot-reference',
      instances: [{ id: 'pack', moduleId: 'travelPack', slotId: 'missingAnchor' }],
      modules: { travelPack: module },
    },
    {
      issue: 'attachment-slot-cardinality',
      instances: [
        { id: 'packA', moduleId: 'travelPack', slotId: 'backAnchor' },
        { id: 'packB', moduleId: 'travelPack', slotId: 'backAnchor' },
      ],
      modules: { travelPack: module },
    },
    {
      issue: 'attachment-instance-scale',
      instances: [{ id: 'pack', moduleId: 'travelPack', slotId: 'backAnchor', scale: 0 }],
      modules: { travelPack: module },
    },
    {
      issue: 'attachment-module-material-references',
      instances: [{ id: 'pack', moduleId: 'travelPack', slotId: 'backAnchor' }],
      modules: { travelPack: { ...structuredClone(module), geometry: {
        ...structuredClone(module.geometry),
        plates: module.geometry.plates.map((plate) => ({ ...plate, material: 'missingMaterial' })),
      } } },
    },
    {
      issue: 'attachment-module-attachment-frame',
      instances: [{ id: 'pack', moduleId: 'travelPack', slotId: 'backAnchor' }],
      modules: { travelPack: { ...structuredClone(module), attachmentFrame: undefined } },
    },
  ];
  for (const candidate of cases) {
    const report = validateAttachmentConfiguration({ rig, ...candidate });
    assert.equal(report.status, 'failed');
    assert.ok(report.issues.some((issue) => issue.id === candidate.issue), candidate.issue);
    assert.throws(
      () => resolveAttachmentAssembly({ rig, ...candidate }),
      (error) => error instanceof AttachmentAssemblyError,
    );
  }
});

test('module-local geometry references, palette roles, and stable IDs are validated', () => {
  const module = loadAttachmentModule('travelPack');
  const invalid = [
    ['attachment-module-plate-references', (candidate) => { candidate.geometry.plates[0].bone = 'missing'; }],
    ['attachment-module-palette-references', (candidate) => { candidate.geometry.plates[0].paletteRole = 'undeclared'; }],
    ['attachment-module-stable-ids', (candidate) => { candidate.geometry.plates[0].id = 'root'; }],
  ];
  for (const [issueId, mutate] of invalid) {
    const candidate = structuredClone(module);
    mutate(candidate);
    const report = validateAttachmentModuleSource(candidate);
    assert.equal(report.status, 'failed');
    assert.ok(report.issues.some((issue) => issue.id === issueId), issueId);
  }
});
