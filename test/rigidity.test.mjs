import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, core, projectScene } from '@paper-rig/compiler';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = readdirSync(join(ROOT, 'rigs/models'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();

const distance = (positions, from, to) => Math.hypot(
  ...positions[to].map((value, index) => value - positions[from][index]),
);

test('every rigid joint-span plate preserves its bind length across every clip', () => {
  for (const model of MODELS) {
    const rig = loadModel(model);
    assert.equal(core.rigidPlateSpanLengthsPass(rig), true, model);
    const check = compilePackage(rig).validation.checks.find((candidate) => candidate.id === 'rigid-plate-span-lengths');
    assert.deepEqual(check?.pass, true, `${model}: missing or failing rigidity diagnostic`);
  }
});

test('humanoid walk swings rigid forearms without extending them', () => {
  const rig = loadModel('humanoid');
  const bind = core.solveWorld(rig, 0, 'bind');
  const pairs = [
    ['nearElbow', 'nearHand'],
    ['farElbow', 'farHand'],
  ];

  for (const time of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]) {
    const posed = core.solveWorld(rig, time, 'walk');
    for (const [from, to] of pairs) {
      assert.ok(
        Math.abs(distance(posed, from, to) - distance(bind, from, to)) < 1e-10,
        `${from} -> ${to} changed length at ${time}`,
      );
    }
  }

  const start = core.solveWorld(rig, 0, 'walk');
  const oppositeStep = core.solveWorld(rig, 0.5, 'walk');
  assert.notDeepEqual(start.nearHand, oppositeStep.nearHand, 'the normalized control must still swing the hand');
  assert.notDeepEqual(start.farHand, oppositeStep.farHand, 'the mirrored hand must still swing');
});

test('harpy shoulder mass stays on the core surface behind head details', () => {
  const rig = loadModel('harpy');
  const shoulder = rig.plates.find((plate) => plate.id === 'shoulderPlate');
  assert.equal(shoulder.bodyRegion, 'core');

  const scene = projectScene(rig, { clip: 'idle', time: 0, elevation: 75, heading: 315 });
  const coreGroup = scene.compositingGroups.find((group) => group.semanticRole === 'core surface plates');
  const nearGroup = scene.compositingGroups.find((group) => group.semanticRole === 'camera-near appendages');
  assert.ok(coreGroup.elements.some((element) => element.id === 'shoulderPlate'));
  assert.ok(coreGroup.elements.some((element) => element.id === 'headPlate'));
  assert.ok(!nearGroup.elements.some((element) => element.id === 'shoulderPlate'));
});
