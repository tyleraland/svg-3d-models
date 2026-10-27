import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel, loadModelSource } from '@paper-rig/rigs';
import { solve, core, projectScene } from '@paper-rig/compiler';
import { inspectOcclusion } from '@paper-rig/validator/occlusion';
import { auditRig } from '@paper-rig/validator/audit';
import { validateModelSource } from '@paper-rig/validator/source';
const rig = loadModel('elephant'), feet = rig.clips.idle.contacts;

test('elephant has a deep barrel, broad rigid fan ears, hanging trunk and curved tusks', () => {
  const p = solve(rig, { clip: 'bind' });
  assert.ok(p.head[2] > p.chest[2]);
  assert.ok(p.trunkTip[2] < .4 && p.trunkTip[2] > .1);
  assert.ok(p.trunkCurl[2] > p.trunkTip[2]);
  for (const side of ['near', 'far']) {
    const ear = rig.plates.find(p => p.id === side + 'EarPlate');
    assert.equal(ear.points.length, 6);
    assert.ok(ear.points.every(id => rig.joints.find(j => j.id === id).parent === side + 'EarBase'));
    assert.ok(p[side + 'TuskTip'][0] > p[side + 'TuskMid'][0]);
    assert.ok(p[side + 'TuskTip'][2] > p[side + 'TuskMid'][2]);
  }
});

test('elephant walk and faster run keep continuous support and move both leg segments', () => {
  assert.ok(rig.clips.run.duration < rig.clips.walk.duration);
  for (const clip of ['walk', 'run']) {
    const c = rig.clips[clip];
    assert.deepEqual(c.frames[0], { ...c.frames.at(-1), t: 0 });
    assert.ok(c.frames.some(f => Math.abs(f.rotations.nearFrontHip[1]) > 5));
    assert.ok(c.frames.some(f => Math.abs(f.rotations.nearFrontKnee[1]) > 5));
    for (let i = 0; i <= 800; i++) assert.ok(core.contactIds(rig, clip, i / 800).length >= 2, `${clip}/${i}`);
  }
});

test('elephant clips preserve bones, planted feet and trunk clearance between keys', () => {
  const base = solve(rig, { clip: 'bind' });
  for (const clip of ['idle', 'walk', 'run', 'attack']) {
    assert.ok(core.preservedClipLengthsPass(rig, clip), clip);
    for (let i = 0; i <= 800; i++) {
      const t = i / 800, p = solve(rig, { clip, time: t });
      for (const id of feet) assert.ok(p[id][2] > -.0001, `${clip}/${id}/${t}`);
      for (const id of core.contactIds(rig, clip, t)) assert.ok(Math.abs(p[id][2]) < .0001, `${clip}/${id}/${t}`);
      for (const id of ['trunkBase','trunkMid','trunkLower','trunkTip','trunkCurl']) assert.ok(p[id][2] > .1, `${clip}/${id}/${t}: ${p[id][2]}`);
      if (clip === 'attack' || clip === 'idle') for (const id of feet) p[id].forEach((v,axis) => assert.ok(Math.abs(v-base[id][axis]) < 1e-8));
    }
  }
  const attack = solve(rig, { clip: 'attack', time: .52 });
  assert.ok(attack.trunkTip[2] > base.trunkTip[2] + .8);
  assert.deepEqual(rig.clips.attack.frames[0].rotations, rig.clips.attack.frames.at(-1).rotations);
});

test('elephant top, side and oblique views retain limb occlusion throughout actions', () => {
  for (const clip of ['idle','walk','run','attack']) for (const time of [0,.22,.25,.52,.68,.75,1]) {
    for (const elevation of [0,45,90]) for (const heading of [0,45,90,135,180,225,270,315]) {
      const scene = projectScene(rig,{clip,time,elevation,heading});
      assert.deepEqual(inspectOcclusion(rig,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);
      for (const joint of scene.joints) assert.ok(joint.screenPosition.every(v => v >= 0 && v <= 100), `${clip}/${joint.id} stays inside exported token`);
    }
  }
  assert.equal(auditRig(rig).status,'passed');
});

test('grounded run authoring rejects unsupported gait patterns and unsafe duty factors', () => {
  const source = loadModelSource('elephant');
  source.groundedQuadruped.run.pattern = 'gallop';
  assert.equal(validateModelSource(source).status,'failed');
  source.groundedQuadruped.run.pattern = 'lateral-sequence';
  source.groundedQuadruped.run.dutyFactor = .2;
  assert.equal(validateModelSource(source).status,'failed');
});
