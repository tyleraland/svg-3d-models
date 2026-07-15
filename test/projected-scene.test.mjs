import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import projectedSceneSchema from '@paper-rig/schema/schemas/projected-scene-1.schema.json' with { type: 'json' };
import { loadModel } from '@paper-rig/rigs';
import { core, markup, projectScene, solve, solvePose, useRig } from '@paper-rig/compiler';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = readdirSync(join(ROOT, 'rigs/models'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();
const validateScene = new Ajv2020({ allErrors: true, strict: true }).compile(projectedSceneSchema);

function assertClose(actual, expected, message) {
  assert.equal(actual.length, expected.length, message);
  for (let index = 0; index < actual.length; index++) {
    if (Array.isArray(actual[index])) assertClose(actual[index], expected[index], message);
    else assert.ok(Math.abs(actual[index] - expected[index]) < 1e-10, `${message}: ${actual[index]} != ${expected[index]}`);
  }
}

test('full pose solving preserves the positions-only compatibility API', () => {
  const rig = loadModel('rabbit');
  const opts = { clip: 'walk', time: 0.25, elevation: 60, heading: 45 };
  const positions = solve(rig, opts);
  const pose = solvePose(rig, opts);

  assert.equal(pose.space, 'posed-world');
  assert.equal(pose.units, 'meters');
  assert.deepEqual(Object.keys(pose.joints), rig.joints.map((joint) => joint.id));
  for (const joint of rig.joints) {
    assertClose(pose.joints[joint.id].positionMeters, positions[joint.id], joint.id);
    assert.equal(pose.joints[joint.id].localToWorldRotation.length, 3);
    assert.ok(pose.joints[joint.id].localToWorldRotation.flat().every(Number.isFinite));
  }
});

test('global model transforms rotate joint frames as well as positions', () => {
  const rig = loadModel('rabbit');
  const pose = solvePose(rig, {
    clip: 'bind',
    time: 0,
    modelTransform: { move: [1, 2, 3], rot: [0, 0, 90] },
  });

  assertClose(pose.joints.root.positionMeters, [1, 2, 3], 'translated root');
  assertClose(pose.joints.root.localToWorldRotation, [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
  ], 'rotated root frame');
});

test('every model emits a schema-valid, traceable projected scene', () => {
  for (const model of MODELS) {
    const scene = projectScene(loadModel(model), { clip: 'idle', time: 0.5, elevation: 60, heading: 45 });
    assert.equal(validateScene(scene), true, `${model}: ${JSON.stringify(validateScene.errors)}`);
    assert.deepEqual(scene.compositingGroups.map((group) => group.order), scene.compositingGroups.map((_, index) => index));
    const elements = scene.compositingGroups.flatMap((group) => group.elements);
    assert.equal(new Set(elements.map((element) => element.id)).size, elements.length, `${model}: projected IDs must be unique`);
    assert.ok(elements.every((element) => element.vector.attributes.id === element.id));
  }
});

test('projected vector order matches the parity-protected SVG renderer', () => {
  const rig = loadModel('horse');
  const opts = { clip: 'attack', time: 0.62, elevation: 45, heading: 135 };
  const sceneIds = projectScene(rig, opts).compositingGroups.flatMap((group) => group.elements.map((element) => element.id));
  const markupIds = [...markup(rig, opts).matchAll(/<(?:circle|ellipse|path|rect)\b[^>]*\bid="([^"]+)"[^>]*\/>/g)].map((match) => match[1]);
  assert.deepEqual(sceneIds, markupIds);
});

test('SVG markup is a lossless serialization of the structured render plan', () => {
  const rig = loadModel('harpy');
  const opts = { clip: 'attack', time: 0.62, elevation: 75, heading: 315 };
  useRig(rig, opts);
  const plan = core.projectedRenderPlan(rig, opts.time, opts.clip);
  const attributes = (values) => Object.entries(values).map(([name, value]) => `${name}="${value}"`).join(' ');
  const expected = plan.groups.map((group) => {
    const elements = group.elements.map((element) => `<${element.vector.tag} ${attributes(element.vector.attributes)}/>`).join('');
    const content = group.wrapper
      ? `<${group.wrapper.tag} ${attributes(group.wrapper.attributes)}>${elements}</${group.wrapper.tag}>`
      : elements;
    return `<g id="${group.id}" data-compositing-group="${group.semanticRole}">${content}</g>`;
  }).join('');

  assert.equal(markup(rig, opts), expected);
});

test('explicit plate surface frames are transformed into posed-world space', () => {
  const rig = structuredClone(loadModel('rabbit'));
  const plate = rig.plates.find((candidate) => candidate.role !== 'shadow');
  plate.surfaceFrame = {
    normal: [0, 0, 1],
    tangent: [1, 0, 0],
    bitangent: [0, 1, 0],
  };
  const scene = projectScene(rig, {
    clip: 'bind',
    time: 0,
    modelTransform: { move: [0, 0, 0], rot: [0, 0, 90] },
  });
  const projectedPlate = scene.compositingGroups
    .flatMap((group) => group.elements)
    .find((element) => element.sourceId === plate.id && !element.generated);

  assertClose(projectedPlate.surfaceFrame.normal, [0, 0, 1], 'surface normal');
  assertClose(projectedPlate.surfaceFrame.tangent, [0, 1, 0], 'surface tangent');
  assertClose(projectedPlate.surfaceFrame.bitangent, [-1, 0, 0], 'surface bitangent');
  const toCamera = (vector) => [
    scene.camera.basis.right.reduce((sum, value, index) => sum + value * vector[index], 0),
    scene.camera.basis.up.reduce((sum, value, index) => sum + value * vector[index], 0),
    scene.camera.basis.forward.reduce((sum, value, index) => sum + value * vector[index], 0),
  ];
  assertClose(projectedPlate.surfaceFrame.camera.normal, toCamera(projectedPlate.surfaceFrame.normal), 'camera normal');
  assertClose(projectedPlate.surfaceFrame.camera.tangent, toCamera(projectedPlate.surfaceFrame.tangent), 'camera tangent');
  assertClose(projectedPlate.surfaceFrame.camera.bitangent, toCamera(projectedPlate.surfaceFrame.bitangent), 'camera bitangent');
});
