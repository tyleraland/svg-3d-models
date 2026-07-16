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
    humanoid: { owner: 'shoulders', scale: 1, topBind: 0.18, instanceCount: 3 },
    rabbit: { owner: 'chest', scale: 0.45, topBind: 0.081, instanceCount: 2 },
  };
  for (const [name, proof] of Object.entries(expected)) {
    const { rig, manifest } = loadModelAssembly(name);
    assert.equal(validate(rig).status, 'passed', name);
    assert.equal(validateAttachmentManifest(manifest).status, 'passed', name);
    assert.equal(manifest.sourceModelId, name);
    assert.equal(manifest.instances.length, proof.instanceCount);
    const instance = manifest.instances.find((candidate) => candidate.id === 'travelPack');
    assert.equal(instance.moduleId, 'travelPack');
    assert.equal(instance.slotType, 'back.mount');
    assert.equal(instance.scale, proof.scale);
    assert.deepEqual(instance.geometryIds, {
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
    const samples = [
      { clip: 'idle', time: 0 },
      { clip: 'walk', time: 0.25 },
      { clip: 'attack', time: 0.62 },
    ];
    for (const instance of manifest.instances) {
      const rootJoint = rig.joints.find((joint) => joint.id === instance.geometryIds.joints[0]);
      const lengths = [];
      for (const sample of samples) {
        const pose = solvePose(rig, sample).joints;
        const parent = pose[rootJoint.parent];
        const expectedRoot = add(parent.positionMeters, multiply(parent.localToWorldRotation, rootJoint.bind));
        pose[rootJoint.id].positionMeters.forEach((value, axis) => close(value, expectedRoot[axis]));
        if (instance.geometryIds.joints.length > 1) lengths.push(distance(
          pose[instance.geometryIds.joints[0]].positionMeters,
          pose[instance.geometryIds.joints[1]].positionMeters,
        ));
      }
      lengths.forEach((length) => close(length, lengths[0]));
    }
  }
});

test('authored joint and plate slots assemble shared hats and surface-oriented details', () => {
  const humanoidModel = loadModelSource('humanoid');
  const humanoidSlots = attachmentSlots(loadModel('humanoid'), humanoidModel.slots);
  const headgear = humanoidSlots.find((slot) => slot.id === 'headgearSlot');
  const eyeDetail = humanoidSlots.find((slot) => slot.id === 'leftEyeDetailSlot');
  assert.deepEqual(headgear.owner, { kind: 'joint', id: 'head' });
  assert.deepEqual(eyeDetail.owner, { kind: 'plate', id: 'leftEyePlate' });
  assert.equal(eyeDetail.resolvedParentJointId, 'leftEye');
  assert.deepEqual(eyeDetail.resolvedJointFrame.positionMeters, [0.005, 0.012, 0.012]);
  assert.equal(eyeDetail.region.kind, 'box');

  const humanoid = loadModelAssembly('humanoid');
  const rabbit = loadModelAssembly('rabbit');
  assert.equal(humanoid.manifest.instances.find((instance) => instance.id === 'simpleHat').slotType, 'head.hat');
  assert.equal(rabbit.manifest.instances.find((instance) => instance.id === 'simpleHat').slotType, 'head.hat');
  assert.equal(humanoid.rig.plates.find((plate) => plate.id === 'leftEyeGlint__disc').paletteRole, 'eye.highlight');
  assert.deepEqual(humanoid.rig.plates.find((plate) => plate.id === 'leftEyeGlint__disc').surfaceNormal, [1, 0, 0]);
});

test('assembly is opt-in and never mutates the base rig, model source, or module source', () => {
  const rig = loadModel('rabbit');
  const model = loadModelSource('rabbit');
  const modules = loadAttachmentModulesForModel(model);
  const snapshots = [structuredClone(rig), structuredClone(model), structuredClone(modules)];
  const assembly = resolveAttachmentAssembly({ rig, sourceModelId: 'rabbit', slots: model.slots, instances: model.attachments, modules });

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
  const modules = loadAttachmentModulesForModel(model);
  assert.equal(validateAttachmentModuleSource(module).status, 'passed');
  assert.equal(validateModelAttachmentConfiguration(model, rig, modules).status, 'passed');

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

test('bounded surface slots reject modules outside their declared plate-local region', () => {
  const rig = loadModel('humanoid');
  const model = loadModelSource('humanoid');
  const eyeGlint = loadAttachmentModule('eyeGlint');
  const oversized = structuredClone(eyeGlint);
  oversized.bounds.sizeMeters = [1, 1, 1];
  const candidate = {
    rig,
    slots: model.slots,
    instances: model.attachments.filter((instance) => instance.id === 'leftEyeGlint'),
    modules: { eyeGlint: oversized },
  };
  const report = validateAttachmentConfiguration(candidate);
  assert.equal(report.status, 'failed');
  assert.ok(report.issues.some((issue) => issue.id === 'attachment-region-containment'));
  assert.throws(
    () => resolveAttachmentAssembly(candidate),
    (error) => error instanceof AttachmentAssemblyError,
  );

  const invalidSurfaceSlot = {
    id: 'unsupportedSurface',
    type: 'surface.detail',
    owner: { kind: 'plate', id: 'headPlate' },
    localFrame: { positionMeters: [0, 0, 0], rotationXYZDegrees: [0, 0, 0] },
    scaleBehavior: 'preserve-local-aspect',
    cardinality: 1,
    region: { kind: 'box', centerMeters: [0, 0, 0], sizeMeters: [1, 1, 1] },
  };
  const badFrame = validateAttachmentConfiguration({ rig, slots: [invalidSurfaceSlot] });
  assert.ok(badFrame.issues.some((issue) => issue.id === 'attachment-plate-slot-surface-frames'));
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
