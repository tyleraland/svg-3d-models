import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, loadModelSource, loadFamily, resolveModel } from '@paper-rig/rigs';
import { solve, core, useRig } from '@paper-rig/compiler';
import { inspectOcclusion } from '@paper-rig/validator/occlusion';
import { projectScene } from '@paper-rig/compiler';
import { auditRig } from '@paper-rig/validator/audit';
import { validateModelSource, validateSourcePair } from '@paper-rig/validator/source';

const rig = loadModel('horse'), clip = rig.clips.gallop;
test('horse gallop is a separate closed four-beat clip with declared suspension', () => {
  assert.equal(clip.duration, 700);
  assert.equal(clip.loop, true);
  assert.deepEqual(clip.frames[0].poses, clip.frames.at(-1).poses);
  assert.deepEqual(clip.frames[0].rotations, clip.frames.at(-1).rotations);
  assert.deepEqual(clip.contactIntervals.map(c => c.ids[0]), ['farRearHoof', 'nearRearHoof', 'farFrontHoof', 'nearFrontHoof']);
  assert.deepEqual(clip.contactIntervals.map(c => c.from), [0, .12, .32, .44]);
  assert.deepEqual(core.contactIds(rig, 'gallop', .83), []);
  const suspended = solve(rig, { clip: 'gallop', time: .83 });
  for (const id of rig.clips.idle.contacts) assert.ok(suspended[id][2] > .05, id);
  assert.ok(suspended.pelvis[2] > solve(rig, { clip: 'bind' }).pelvis[2]);
  assert.notDeepEqual(clip.frames, rig.clips.walk.frames);
});

test('gallop preserves every bone, joint limit, stance contact and ground clearance between frames', () => {
  assert.ok(core.preservedClipLengthsPass(rig, 'gallop'));
  const joints = new Map(rig.joints.map(j => [j.id, j]));
  for (const frame of clip.frames) for (const [id, r] of Object.entries(frame.rotations)) {
    const j = joints.get(id);
    if (j.limits) assert.ok(r[1] >= j.limits[0] - 1e-8 && r[1] <= j.limits[1] + 1e-8, id);
  }
  for (let i = 0; i <= 800; i++) {
    const t = i / 800, pose = solve(rig, { clip: 'gallop', time: t });
    for (const id of rig.clips.idle.contacts) assert.ok(pose[id][2] >= -.0001, `${id}/${t}: ${pose[id][2]}`);
    for (const id of core.contactIds(rig, 'gallop', t)) assert.ok(Math.abs(pose[id][2]) < .0001, `${id}/${t}`);
  }
});

test('gallop keeps the ground shadow fixed and respects side/oblique/overhead occlusion', () => {
  for (const elevation of [0, 45, 90]) for (const heading of [0, 90, 180, 270]) {
    useRig(rig, { elevation, heading });
    const shadow = core.projectedRenderPlan(rig, 0, 'gallop').groups[0].elements[0].vector;
    for (const time of [0, .125, .375, .625, .83, .975, 1]) {
      useRig(rig, { elevation, heading });
      assert.deepEqual(core.projectedRenderPlan(rig, time, 'gallop').groups[0].elements[0].vector, shadow);
      assert.deepEqual(inspectOcclusion(rig, projectScene(rig, { clip: 'gallop', time, elevation, heading })).violations, []);
    }
  }
});

test('gallop lead is declarative and invalid/conflicting plans are rejected', () => {
  const source = loadModelSource('horse');
  source.groundedQuadruped.gallop.lead = 'right';
  const right = resolveModel(source, loadFamily(source.family));
  assert.deepEqual(right.clips.gallop.contactIntervals.map(c => c.ids[0]), ['nearRearHoof', 'farRearHoof', 'nearFrontHoof', 'farFrontHoof']);
  source.groundedQuadruped.gallop.durationMs = 0;
  assert.equal(validateModelSource(source).status, 'failed');
  const conflicting = loadModelSource('horse');
  conflicting.clips.gallop = structuredClone(clip);
  assert.equal(validateSourcePair(conflicting, loadFamily(conflicting.family)).status, 'failed');
});


test('default horse audit explicitly covers gallop contacts, takeoff and suspension', () => {
  const report = auditRig(rig);
  assert.equal(report.status, 'passed', JSON.stringify(report.issues));
  for (const t of [0, .44, .66, .83]) assert.ok(report.views.some(v => v.clipId === 'gallop' && v.timeNormalized === t));
});
