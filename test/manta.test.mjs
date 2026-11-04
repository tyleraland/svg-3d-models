import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, solve, projectScene, core } from '@paper-rig/compiler';
import { validateSourcePair } from '@paper-rig/validator/source';
import { motionDiagnostics } from '@paper-rig/validator/audit';
import { inspectOcclusion } from '@paper-rig/validator/occlusion';
import { makeMantaFamily } from '../scripts/lib/manta-family.mjs';

const reference = JSON.parse(fs.readFileSync('authoring-data/manta-motion.json'));
const rig = loadModel('mantaRay');
const samples = Array.from({ length: 33 }, (_, i) => i / 32);
const distance = (a, b) => Math.hypot(...a.map((v, k) => v - b[k]));
const range = a => Math.max(...a) - Math.min(...a);
const degrees = r => r * 180 / Math.PI;
function dihedral(p, side, a, b) {
  const dy = Math.abs(p[side + b][1] - p[side + a][1]);
  return degrees(Math.atan2(p[side + b][2] - p[side + a][2], dy));
}

test('Manta has a reproducible flattened ray body, cephalic lobes, thin tail and measured Swim source', () => {
  const family = JSON.parse(fs.readFileSync('rigs/families/mantaRay.json'));
  const model = JSON.parse(fs.readFileSync('rigs/models/mantaRay.json'));
  assert.deepEqual(family, makeMantaFamily(reference));
  assert.equal(validateSourcePair(model, family).status, 'passed');
  assert.equal(compilePackage(rig).validation.status, 'passed');
  assert.deepEqual(motionDiagnostics(rig).filter(d => !d.pass), []);
  assert.equal(reference.action, 'Swim');
  assert.equal(rig.clips.swim.duration, Math.round(1000 * (reference.frame_range[1] - reference.frame_range[0]) / reference.fps));
  const p = solve(rig, { clip: 'bind' });
  assert.ok(p.nearFinTip[1] - p.farFinTip[1] > 2.6);
  assert.ok(p.mouthCenter[0] - p.tailTip[0] > 2.8);
  assert.ok(p.nearCephalicLobe[1] > 0 && p.farCephalicLobe[1] < 0);
  assert.ok(!rig.joints.some(j => /foot|feather|stinger/i.test(j.id)));
});

test('Manta preserves the reference fin envelope, synchronous sides and spanwise cupping', () => {
  const posed = samples.map(time => solve(rig, { clip: 'swim', time }));
  for (const [i, p] of posed.entries()) {
    const t = samples[i];
    for (const name of ['FinRoot', 'FinMid', 'FinOuter', 'FinTip']) {
      assert.ok(Math.abs(p['near' + name][0] - p['far' + name][0]) < 1e-7);
      assert.ok(Math.abs(p['near' + name][1] + p['far' + name][1]) < 1e-7);
      assert.ok(Math.abs(p['near' + name][2] - p['far' + name][2]) < 1e-7, 'bilateral strokes move up/down together');
    }
    for (const [part, a, b] of [['Top', 'FinRoot', 'FinMid'], ['Mid', 'FinMid', 'FinOuter'], ['Bottom', 'FinOuter', 'FinTip']]) {
      const actual = dihedral(p, 'near', a, b), expected = reference.fin_dihedral_degrees[part][i * 2];
      assert.ok(Math.abs(actual - expected) < 4, `${part}@${t}: ${actual} vs source ${expected}`);
    }
    assert.deepEqual(p.body, [0, 0, 1.35]);
    assert.deepEqual(p.root, [0, 0, 0]);
    assert.deepEqual(core.contactIds(rig, 'swim', t), []);
    assert.deepEqual(solve(rig, { clip: 'walk', time: t }), p);
  }
  assert.ok(range(posed.map(p => dihedral(p, 'near', 'FinMid', 'FinOuter') - dihedral(p, 'near', 'FinRoot', 'FinMid'))) > 30,
    'middle section must bend relative to the root, not form one rigid flapping plate');
  const finSweep = range(posed.map(p => p.nearFinTip[2])), tailSweep = range(posed.map(p => p.tailTip[2]));
  assert.ok(finSweep > 1 && tailSweep < finSweep * .20, 'pectoral fins drive the swim; tail remains a quiet follower');
  assert.ok(range(posed.map(p => p.mouthCenter[2])) < .04);
  assert.ok(rig.clips.fastSwim.duration < rig.clips.swim.duration);
});

test('Manta keeps rigid panel edges and bones, smooth closed loops and compatible action entry/exit', () => {
  const bind = solve(rig, { clip: 'bind' });
  for (const clip of ['idle', 'swim', 'fastSwim']) {
    const seam = solve(rig, { clip, time: 0 });
    assert.deepEqual(seam, solve(rig, { clip, time: 1 }));
    const a = solve(rig, { clip, time: .001 }), b = solve(rig, { clip, time: .999 });
    for (const id of ['nearFinTip', 'farFinTip', 'tailTip']) for (let k = 0; k < 3; k++)
      assert.ok(Math.abs(a[id][k] - seam[id][k] - (seam[id][k] - b[id][k])) < .0002, `${clip}/${id} velocity seam`);
  }
  assert.deepEqual(solve(rig, { clip: 'attack', time: 0 }), solve(rig, { clip: 'idle', time: 0 }));
  assert.deepEqual(solve(rig, { clip: 'attack', time: 1 }), solve(rig, { clip: 'idle', time: 0 }));
  for (const clip of ['swim', 'fastSwim', 'attack', 'ko']) for (const time of samples) {
    const p = solve(rig, { clip, time });
    for (const j of rig.joints.filter(j => j.parent))
      assert.ok(Math.abs(distance(p[j.id], p[j.parent]) - distance(bind[j.id], bind[j.parent])) < 1e-7, j.id);
    for (const plate of rig.plates.filter(p => p.points)) for (let i = 0; i < plate.points.length; i++) {
      const a = plate.points[i], b = plate.points[(i + 1) % plate.points.length];
      assert.ok(Math.abs(distance(p[a], p[b]) - distance(bind[a], bind[b])) < 1e-7, plate.id);
    }
    if (clip === 'fastSwim') assert.deepEqual(solve(rig, { clip: 'run', time }), p);
  }
});

test('Manta passes all eight headings and six elevations through full fin strokes and actions', () => {
  for (const clip of ['swim', 'fastSwim', 'attack', 'ko']) for (const time of [0, .125, .25, .375, .5, .625, .75, .875, 1])
    for (const elevation of [0, 30, 45, 60, 75, 90]) for (let heading = 0; heading < 360; heading += 45) {
      const scene = projectScene(rig, { clip, time, elevation, heading });
      const context = `${clip}/${time}/${elevation}/${heading}`;
      assert.deepEqual(inspectOcclusion(rig, scene).violations, [], context);
      assert.ok(scene.joints.every(j => j.screenPosition.every(v => Number.isFinite(v) && v > .5 && v < 99.5)), `${context} framing`);
    }
});
