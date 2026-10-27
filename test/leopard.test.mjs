import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, loadFamily, loadModelSource, resolveModel } from '@paper-rig/rigs';
import { solve, core, projectScene } from '@paper-rig/compiler';
import { phaseContractChecks } from '@paper-rig/motion';
import { inspectOcclusion } from '@paper-rig/validator/occlusion';
import { auditRig } from '@paper-rig/validator/audit';
import { validateModelSource, validateSourcePair } from '@paper-rig/validator/source';
const rig = loadModel('leopard'), paws = rig.clips.idle.contacts;

test('leopard has feline proportions, separate rigid spine segments and a curved multi-joint tail', () => {
  const pose = solve(rig, { clip: 'bind' }), plate = id => rig.plates.find(p => p.id === id);
  assert.ok(Math.abs(pose.head[2] - pose.chest[2]) < .03);
  assert.ok(plate('headPlate').size[0] < plate('shoulderPlate').size[0]);
  assert.ok(plate('muzzlePlate').size[0] < plate('headPlate').size[0] * .6);
  assert.deepEqual(plate('torsoPlate').span, ['pelvis', 'spineMid']);
  assert.deepEqual(plate('chestBarrelPlate').span, ['spineMid', 'chest']);
  assert.ok(pose.tailEnd[0] < pose.tailMid[0]);
  assert.ok(pose.tailEnd[2] > pose.tailTip[2]);
  assert.equal(rig.plates.filter(p => p.role === 'claw').length, 6);
});

test('feline walk and run have different support patterns, speeds, spine motion and suspension', () => {
  assert.equal(rig.clips.walk.duration, 1500);
  assert.equal(rig.clips.run.duration, 620);
  assert.deepEqual(rig.clips.walk.events.map(e => e.t), [0, .25, .5, .75]);
  assert.deepEqual(rig.clips.run.contactIntervals.map(c => c.from), [0, .12, .32, .44]);
  assert.deepEqual(core.contactIds(rig, 'run', .83), []);
  const airborne = solve(rig, { clip: 'run', time: .83 });
  for (const id of paws) assert.ok(airborne[id][2] > .02, id);
  assert.ok(rig.clips.run.frames.some(f => Math.abs(f.rotations.spineMid[1]) > 7));
  assert.deepEqual(rig.clips.run.frames[0], { ...rig.clips.run.frames.at(-1), t: 0 });
});

test('claw swipe plants three paws, raises the attacking paw, extends claws and recovers', () => {
  const clip = rig.clips.attack, base = solve(rig, { clip: 'bind' });
  assert.ok(phaseContractChecks(clip.phases).every(c => c.pass));
  const peak = clip.frames.find(f => f.t === .48);
  assert.equal(peak.rotations.nearFrontClaw1Base[1], 0);
  assert.equal(peak.rotations.farFrontClaw1Base[1], -150);
  const impact = solve(rig, { clip: 'attack', time: .48 });
  assert.ok(impact.nearFrontPaw[0] > base.nearFrontPaw[0] + .2);
  assert.ok(impact.nearFrontPaw[2] > .2);
  for (let i = 0; i <= 200; i++) {
    const t = i / 200, pose = solve(rig, { clip: 'attack', time: t });
    for (const id of paws.filter(id => id !== 'nearFrontPaw')) pose[id].forEach((v, axis) => assert.ok(Math.abs(v - base[id][axis]) < .0001, `${id}/${t}`));
  }
  assert.deepEqual(clip.frames[0].poses, clip.frames.at(-1).poses);
  assert.deepEqual(clip.frames[0].rotations, clip.frames.at(-1).rotations);
});

test('pounce has an actual flight phase followed by two-paw contact and recovery', () => {
  assert.ok(phaseContractChecks(rig.clips.pounce.phases).every(c => c.pass));
  const air = solve(rig, { clip: 'pounce', time: .52 });
  assert.deepEqual(core.contactIds(rig, 'pounce', .52), []);
  for (const id of paws) assert.ok(air[id][2] > .05, id);
  assert.deepEqual(new Set(core.contactIds(rig, 'pounce', .68)), new Set(['nearFrontPaw', 'farFrontPaw']));
  assert.notDeepEqual(rig.clips.attack.frames, rig.clips.pounce.frames);
});

test('all feline clips preserve bones, limits, contacts and paw/claw clearance between samples', () => {
  const byId = new Map(rig.joints.map(j => [j.id, j]));
  for (const clipId of ['idle', 'walk', 'run', 'attack', 'pounce']) {
    const clip = rig.clips[clipId];
    assert.ok(core.preservedClipLengthsPass(rig, clipId), clipId);
    for (const f of clip.frames) for (const [id, rotation] of Object.entries(f.rotations || {})) {
      const j = byId.get(id);
      if (j.limits) assert.ok(rotation[1] >= j.limits[0] - 1e-8 && rotation[1] <= j.limits[1] + 1e-8, `${clipId}/${id}`);
    }
    for (let i = 0; i <= 800; i++) {
      const t = i / 800, pose = solve(rig, { clip: clipId, time: t });
      for (const id of core.contactIds(rig, clipId, t)) assert.ok(Math.abs(pose[id][2]) < .0001, `${clipId}/${id}/${t}`);
      for (const [id, p] of Object.entries(pose)) if (/Paw$|Claw.*Tip$/.test(id)) assert.ok(p[2] > -.0001, `${clipId}/${id}/${t}: ${p[2]}`);
    }
  }
});

test('new feline actions retain side/oblique/top occlusion and are included in default audits', () => {
  for (const clip of ['walk', 'run', 'attack', 'pounce']) for (const time of [.18, .40, .48, .52, .68, .83]) {
    for (const elevation of [0, 45, 90]) for (const heading of [0, 90, 180, 270]) {
      assert.deepEqual(inspectOcclusion(rig, projectScene(rig, { clip, time, elevation, heading })).violations, [], `${clip}/${time}/${elevation}/${heading}`);
    }
  }
  const report = auditRig(rig);
  assert.equal(report.status, 'passed', JSON.stringify(report.issues));
  assert.ok(report.views.some(v => v.clipId === 'run' && v.timeNormalized === .83));
  assert.ok(report.views.some(v => v.clipId === 'pounce' && v.timeNormalized === .68));
});

test('feline declarations reject invalid amplitudes, missing claw controls and conflicting attack sources', () => {
  const source = loadModelSource('leopard');
  source.felineAttacks.swipe.lift = -1;
  assert.equal(validateModelSource(source).status, 'failed');
  const competing = loadModelSource('leopard');
  competing.clips = { attack: structuredClone(rig.clips.attack) };
  assert.equal(validateSourcePair(competing, loadFamily('leopard')).status, 'failed');
  const family = loadFamily('leopard');
  family.joints = family.joints.filter(j => j.id !== 'nearFrontClaw1Base');
  assert.equal(validateSourcePair(loadModelSource('leopard'), family).status, 'failed');
});
