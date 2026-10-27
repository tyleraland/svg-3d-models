import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateModelSource, validateSourcePair } from '@paper-rig/validator/source';
import { runInNewContext } from 'node:vm';
import { loadModel, loadModelSource, loadFamily, resolveModel } from '@paper-rig/rigs';
import { solve, core, useRig } from '@paper-rig/compiler';

const rig = loadModel('horse');
test('horse idle keeps all four hooves on Z=0 while the torso breathes', () => {
  const initial = solve(rig, { time: 0 });
  for (const clip of ['idle', 'idleA']) for (let i = 0; i <= 32; i++) {
    const posed = solve(rig, { clip, time: i / 32 });
    for (const id of rig.clips[clip].contacts) {
      posed[id].forEach((value, axis) => assert.ok(Math.abs(value - initial[id][axis]) < 1e-12));
      assert.ok(Math.abs(posed[id][2]) < 1e-12, id);
    }
    assert.deepEqual(posed.root, [0, 0, 0]);
  }
  assert.ok(solve(rig, { time: .5 }).pelvis[2] > initial.pelvis[2]);
  assert.ok(core.rigidPlateSpanLengthsPass(rig));
});

test('workbench framing and projected horse shadow stay fixed throughout idle', () => {
  const source = readFileSync(new URL('../apps/workbench/ui.js', import.meta.url), 'utf8');
  const fn = source.match(/^function editorViewBox\(.*$/m)[0];
  for (const [elevation, heading] of [[45, 0], [0, 90], [0, -90]]) {
    useRig(rig, { elevation, heading });
    const editorViewBox = runInNewContext(`(${fn})`, {
      state: core.state,
      frameTimes: clip => clip.frames.map(f => f.t),
      projected: core.projected, worldJoints: core.worldJoints,
    });
    const bounds = editorViewBox(rig, 0, 'idle');
    const shadow = () => core.projectedRenderPlan(rig, core.state.t, 'idle').groups[0];
    const initial = shadow();
    const transform = initial.elements[0].vector.attributes.transform;
    const matrix = transform.match(/matrix\((.*)\)/)[1].split(' ').map(Number);
    assert.ok(Math.abs(Math.abs(matrix[0] * matrix[3] - matrix[1] * matrix[2]) - Math.sin(elevation * Math.PI / 180)) < 1e-12);
    for (let i = 0; i <= 16; i++) {
      core.state.t = i / 16;
      assert.equal(editorViewBox(rig, i / 16, 'idle'), bounds);
      assert.deepEqual(shadow(), initial);
    }
  }
});

const quadrupeds = ['horse', 'centaur', 'quadruped', 'rabbit', 'rhino', 'elephant', 'greyhound', 'leopard', 'wolf', 'lizard', 'dragon'];
test('every four-legged creature has four planted idle contacts throughout the loop', () => {
  for (const model of quadrupeds) {
    const rig = loadModel(model);
    const bind = solve(rig, { clip: 'bind' });
    for (const clip of ['idle', 'idleA']) for (let i = 0; i <= 32; i++) {
      const pose = solve(rig, { clip, time: i / 32 });
      assert.equal(rig.clips[clip].contacts.length, 4);
      for (const id of rig.clips[clip].contacts) {
        assert.ok(Math.abs(pose[id][2]) < 1e-8, `${model}/${clip}/${id} at ${i / 32}`);
        pose[id].forEach((v, axis) => assert.ok(Math.abs(v - bind[id][axis]) < 1e-8));
      }
    }
  }
});

test('horse torso is level and longer hind legs have forward stifles and rearward hocks', () => {
  const pose = solve(rig, { clip: 'bind' });
  assert.ok(Math.abs(pose.chest[2] - pose.pelvis[2]) < 1e-10);
  for (const side of ['near', 'far']) {
    assert.ok(pose[side + 'RearKnee'][0] > pose[side + 'RearHip'][0]);
    assert.ok(pose[side + 'RearHock'][0] < pose[side + 'RearKnee'][0]);
    assert.ok(pose[side + 'RearHoof'][0] > pose[side + 'RearHock'][0]);
    assert.ok(pose[side + 'RearHip'][2] > 1);
  }
});

test('mammal gait moves upper and lower legs, respects limits and contacts, and preserves lengths', () => {
  for (const model of quadrupeds.filter(id => !['lizard', 'dragon'].includes(id))) {
    const rig = loadModel(model), byId = new Map(rig.joints.map(j => [j.id, j]));
    const clip = rig.clips.walk;
    for (const frame of clip.frames) for (const [id, r] of Object.entries(frame.rotations)) {
      const j = byId.get(id);
      if (j.limits) assert.ok(r[1] >= j.limits[0] - 1e-8 && r[1] <= j.limits[1] + 1e-8, `${model}/${id} limits`);
    }
    for (const side of ['near', 'far']) for (const end of ['Front', 'Rear']) {
      for (const suffix of ['Hip', 'Knee']) {
        const angles = clip.frames.map(f => f.rotations[side + end + suffix][1]);
        assert.ok(Math.max(...angles) - Math.min(...angles) > 5, `${model}/${side}${end}${suffix} must articulate`);
      }
    }
    let raised = false;
    for (let i = 0; i <= 320; i++) {
      const t = i / 320, pose = solve(rig, { clip: 'walk', time: t });
      const contacts = clip.contactIntervals.filter(c => t >= c.from && t <= c.to).flatMap(c => c.ids);
      for (const id of rig.clips.idle.contacts) {
        assert.ok(pose[id][2] > -1e-4, `${model}/${id} penetrates ground`);
        if (contacts.includes(id)) assert.ok(Math.abs(pose[id][2]) < 1e-4, `${model}/${id} loses stance contact`);
        raised ||= pose[id][2] > .005;
      }
    }
    assert.ok(raised, `${model} needs a raised swing phase`);
    assert.ok(core.rigidPlateSpanLengthsPass(rig), model);
    assert.deepEqual(clip.frames[0].rotations, clip.frames.at(-1).rotations);
  }
});


test('grounded locomotion declarations reject invalid dimensions, chains and competing gait sources', () => {
  const model = loadModelSource('horse');
  model.groundedQuadruped.walk.lift = -1;
  assert.equal(validateModelSource(model).status, 'failed');
  const splayed = loadModelSource('lizard');
  splayed.groundedQuadruped.walk = { stride: .28, lift: .13 };
  assert.equal(validateSourcePair(splayed, loadFamily(splayed.family)).status, 'failed');
  const family = loadFamily('horse');
  family.clips.idleA.contacts.pop();
  assert.throws(() => resolveModel(loadModelSource('horse'), family), /four contact chains/);
  const competing = loadModelSource('horse');
  competing.gait = { a: {}, b: {} };
  assert.equal(validateSourcePair(competing, loadFamily('horse')).status, 'failed');
});

test('reference-guided horse has a long body, sloping face, mane, ears and articulated forelegs', () => {
  const horse = loadModel('horse'), bind = solve(horse, { clip: 'bind' });
  assert.ok(bind.chest[0] - bind.pelvis[0] >= .95);
  assert.ok(bind.muzzle[2] < bind.head[2] - .2);
  for (const id of ['nearEarTip', 'farEarTip', 'maneTip', 'nearFrontCarpus', 'farFrontCarpus']) assert.ok(bind[id], id);
  assert.ok(bind.tailTip[2] < bind.tailBase[2] - .5);
});

test('horse body dip, head nod and tail sway preserve bones and a stationary ground shadow', () => {
  const horse = loadModel('horse');
  const a = solve(horse, { clip: 'walk', time: 0 }), b = solve(horse, { clip: 'walk', time: .25 });
  assert.ok(a.pelvis[2] - b.pelvis[2] > .02);
  const frames = horse.clips.walk.frames;
  assert.ok(frames.some(f => Math.abs(f.rotations.neckBase[1]) > 2));
  assert.ok(frames.some(f => Math.abs(f.rotations.tailBase[2]) > 4));
  const shadow = t => {
    useRig(horse, { elevation: 45, heading: 0 });
    return core.projectedRenderPlan(horse, t, 'walk').groups[0].elements[0].vector;
  };
  const fixed = shadow(0);
  for (let i = 0; i <= 16; i++) assert.deepEqual(shadow(i / 16), fixed);
  assert.ok(core.preservedClipLengthsPass(horse, 'walk'));
});

test('reference-guided rabbit is crouched with upright ears, strong haunches and a short tail', () => {
  const rabbit = loadModel('rabbit'), bind = solve(rabbit, { clip: 'bind' });
  assert.ok(bind.pelvis[2] > bind.chest[2]);
  assert.ok(bind.nearEarTip[2] > bind.head[2] + .18);
  assert.ok(Math.abs(bind.nearEarTip[1]) < .08);
  assert.ok(bind.nearFrontHip[2] < bind.nearRearHip[2]);
  assert.ok(Math.hypot(...rabbit.joints.find(j => j.id === 'tailTip').bind) < .05);
  const size = id => rabbit.plates.find(p => p.id === id).size[0];
  assert.ok(size('nearRearUpperPlate') > size('nearFrontUpperPlate'));
  assert.ok(size('nearRearPawPlate') > size('nearFrontPawPlate'));
});

test('rabbit bounds in fore/hind pairs with ear motion while preserving stance and bones', () => {
  const rabbit = loadModel('rabbit'), clip = rabbit.clips.walk;
  for (const frame of clip.frames) for (const end of ['Front', 'Rear']) for (const joint of ['Hip', 'Knee']) {
    assert.deepEqual(frame.rotations['near' + end + joint], frame.rotations['far' + end + joint]);
  }
  const active = t => clip.contactIntervals.filter(c => t >= c.from && t <= c.to).flatMap(c => c.ids);
  assert.deepEqual(new Set(active(.25)), new Set(['nearFrontPaw', 'farFrontPaw']));
  assert.deepEqual(new Set(active(.75)), new Set(['nearRearPaw', 'farRearPaw']));
  assert.ok(clip.frames.some(f => Math.abs(f.rotations.nearEarBase[1]) > 4));
  assert.ok(core.preservedClipLengthsPass(rabbit, 'walk'));
  const bind = solve(rabbit, { clip: 'idle' });
  for (let i = 0; i <= 32; i++) {
    const pose = solve(rabbit, { clip: 'idle', time: i / 32 });
    for (const id of rabbit.clips.idle.contacts) assert.ok(Math.abs(pose[id][2]) < 1e-8);
    assert.deepEqual(pose.root, bind.root);
  }
});
