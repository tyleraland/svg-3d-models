import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, solve, projectScene, core } from '@paper-rig/compiler';
import { validateSourcePair } from '@paper-rig/validator/source';
import { motionDiagnostics } from '@paper-rig/validator/audit';
import { inspectOcclusion } from '@paper-rig/validator/occlusion';
import { makeEelFamily } from '../scripts/lib/eel-family.mjs';

const r = loadModel('eel');
const distance = (a, b) => Math.hypot(...a.map((v, k) => v - b[k]));
const range = a => Math.max(...a) - Math.min(...a);
const spine = i => 'spine' + String(i).padStart(2, '0');
const tangent = (pose, i) => {
  const a = pose[spine(i)], b = pose[spine(i + 1)];
  return Math.atan2(-(b[1] - a[1]), -(b[0] - a[0]));
};

test('Eel declarations describe an elongated finned swimmer with anonymous motion controls', () => {
  const f = JSON.parse(fs.readFileSync('rigs/families/eel.json'));
  const m = JSON.parse(fs.readFileSync('rigs/models/eel.json'));
  assert.deepEqual(f, makeEelFamily());
  assert.equal(validateSourcePair(m, f).status, 'passed');
  assert.equal(compilePackage(r).validation.status, 'passed');
  assert.deepEqual(motionDiagnostics(r).filter(d => !d.pass), []);
  const source = JSON.parse(fs.readFileSync('authoring-data/eel-motion.json'));
  assert.equal(source.source_animation_count, 0);
  assert.equal(Object.hasOwn(r.profile, 'reference'), false);
  assert.equal(Object.hasOwn(r.profile, 'motionScope'), false);
  assert.equal(r.joints.filter(j => /^spine\d+$/.test(j.id)).length, 20);
  const bind = solve(r, { clip: 'bind' });
  assert.ok(bind.noseTip[0] - bind.tailTip[0] > 3.6);
  assert.ok(r.plates.some(p => /spine10Dorsal/.test(p.id)));
  assert.ok(r.plates.some(p => /spine10Anal/.test(p.id)));
  assert.ok(!r.joints.some(j => /pectoral|foot|leg/i.test(j.id)));
});

test('Eel swimming has a posteriorly traveling whole-body wave, not rigid wagging or tail-only propulsion', () => {
  const poses = Array.from({ length: 129 }, (_, i) => solve(r, { clip: 'swim', time: i / 128 }));
  const peak = i => {
    const angles = poses.map(p => tangent(p, i));
    return { t: angles.indexOf(Math.max(...angles)) / 128, amplitude: range(angles) };
  };
  const front = peak(4), middle = peak(8), rear = peak(12);
  assert.ok(front.amplitude > .20, 'front quarter participates in the swim');
  assert.ok(middle.amplitude > front.amplitude * 1.4);
  assert.ok(rear.amplitude > middle.amplitude * 1.25);
  assert.ok(middle.t - front.t > .12 && middle.t - front.t < .32, 'crest reaches the middle later');
  assert.ok(rear.t - middle.t > .12 && rear.t - middle.t < .32, 'crest continues toward the tail');
  const vertical = range(poses.map(p => p.tailTip[2]));
  assert.ok(vertical < .001, 'propulsion is lateral, not a dolphin-like vertical stroke');
  assert.ok(range(poses.map(p => p.tailTip[1])) > .2);
  assert.ok(range(poses.map(p => p.noseTip[1])) < .03);
  for (const [i, p] of poses.entries()) {
    assert.deepEqual(p.root, [0, 0, 0]);
    assert.deepEqual(core.contactIds(r, 'swim', i / 128), []);
    if (i % 8 === 0) assert.deepEqual(solve(r, { clip: 'walk', time: i / 128 }), p);
  }
  assert.ok(r.clips.fastSwim.duration < r.clips.swim.duration);
});

test('Eel preserves fixed bones, rigid fins and body faces, loop seams and compatible action entry/exit', () => {
  const bind = solve(r, { clip: 'bind' });
  for (const clip of ['idle', 'swim', 'fastSwim']) {
    const seam = solve(r, { clip, time: 0 });
    assert.deepEqual(seam, solve(r, { clip, time: 1 }));
    const before = solve(r, { clip, time: .999 }), after = solve(r, { clip, time: .001 });
    for (const id of ['noseTip', spine(8), spine(16), 'tailTip']) for (let k = 0; k < 3; k++)
      assert.ok(Math.abs(after[id][k] - seam[id][k] - (seam[id][k] - before[id][k])) < .0002, 'loop velocity seam');
  }
  assert.deepEqual(solve(r, { clip: 'attack', time: 0 }), solve(r, { clip: 'idle', time: 0 }));
  assert.deepEqual(solve(r, { clip: 'attack', time: 1 }), solve(r, { clip: 'idle', time: 0 }));
  for (const clip of ['swim', 'fastSwim', 'attack', 'ko']) for (let i = 0; i <= 32; i++) {
    const p = solve(r, { clip, time: i / 32 });
    for (const j of r.joints.filter(j => j.parent))
      assert.ok(Math.abs(distance(p[j.id], p[j.parent]) - distance(bind[j.id], bind[j.parent])) < 1e-7, j.id);
    for (const plate of r.plates.filter(p => p.points)) for (let k = 0; k < plate.points.length; k++) {
      const a = plate.points[k], b = plate.points[(k + 1) % plate.points.length];
      assert.ok(Math.abs(distance(p[a], p[b]) - distance(bind[a], bind[b])) < 1e-7, plate.id);
    }
    if (clip === 'fastSwim') assert.deepEqual(solve(r, { clip: 'run', time: i / 32 }), p);
  }
});

test('Eel stays framed and correctly occluded through the directional swim/action matrix', () => {
  for (const clip of ['swim', 'fastSwim', 'attack', 'ko']) for (const time of [0, .125, .25, .375, .5, .625, .75, .875, 1])
    for (const elevation of [0, 30, 45, 60, 75, 90]) for (let heading = 0; heading < 360; heading += 45) {
      const s = projectScene(r, { clip, time, elevation, heading });
      const context = `${clip}/${time}/${elevation}/${heading}`;
      assert.deepEqual(inspectOcclusion(r, s).violations, [], context);
      assert.ok(s.joints.every(j => j.screenPosition.every(v => Number.isFinite(v) && v > .5 && v < 99.5)), `${context} framing`);
    }
});
