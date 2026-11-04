import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, solve, projectScene, core } from '@paper-rig/compiler';
import { validateSourcePair } from '@paper-rig/validator/source';
import { motionDiagnostics } from '@paper-rig/validator/audit';
import { inspectOcclusion } from '@paper-rig/validator/occlusion';
import { makeFishFamily } from '../scripts/lib/fish-family.mjs';

const models = ['fish', 'shark'];
const distance = (a, b) => Math.hypot(...a.map((v, k) => v - b[k]));
const span = values => Math.max(...values) - Math.min(...values);
const samples = Array.from({ length: 33 }, (_, i) => i / 32);
const elements = scene => scene.compositingGroups.flatMap(g => g.elements);
const references = JSON.parse(fs.readFileSync(new URL('../authoring-data/fish-swim-motion.json', import.meta.url))).records;

for (const id of models) {
  const rig = loadModel(id);
  test(`${id}: source contract, reproducible family bake and motion diagnostics pass`, () => {
    const family = JSON.parse(fs.readFileSync(`rigs/families/${id}.json`));
    const model = JSON.parse(fs.readFileSync(`rigs/models/${id}.json`));
    assert.deepEqual(family, makeFishFamily(id));
    assert.equal(validateSourcePair(model, family).status, 'passed');
    assert.equal(compilePackage(rig).validation.status, 'passed');
    assert.deepEqual(motionDiagnostics(rig).filter(d => !d.pass), []);
  });
  test(`${id}: swimming is lateral, posterior-driven and suspended, not a bobbing terrestrial gait`, () => {
    const poses = samples.map(time => solve(rig, { clip: 'swim', time }));
    const headMotion = span(poses.map(p => p.noseTip[1]));
    const tailMotion = span(poses.map(p => p.tailTip[1]));
    assert.ok(tailMotion > .30 && tailMotion < 1.2, `tail sweep ${tailMotion}`);
    assert.ok(tailMotion > headMotion * 5, 'head stays stable relative to the propulsive tail');
    assert.ok(span(poses.map(p => p.tailTip[2])) < .001, 'vertical caudal fin sweeps sideways rather than dolphin-like up/down');
    assert.ok(span(poses.map(p => p.noseTip[0])) < .02, 'in-place preview has a quiet forebody');
    for (const [i, p] of poses.entries()) {
      assert.deepEqual(p.root, [0, 0, 0]);
      assert.deepEqual(core.contactIds(rig, 'swim', samples[i]), []);
      assert.deepEqual(solve(rig, { clip: 'walk', time: samples[i] }), p,
        'canonical locomotion must preserve the explicit Swim cycle');
    }
    // Compare global tail orientation to measured source bone orientation,
    // rather than asserting the baker's own local sine coefficients.
    const source = references.find(r => r.name === (id === 'shark' ? 'Shark' : 'Fish1'));
    const sourceYaw = source.samples.map(s => { const b = s.bones.Tail;
      return Math.atan2(-(b.tail[0] - b.head[0]), b.tail[1] - b.head[1]); });
    const paperYaw = poses.map(p => Math.atan2(-(p.tailTip[1] - p.tailFin[1]), -(p.tailTip[0] - p.tailFin[0])));
    assert.ok(span(paperYaw) / span(sourceYaw) > .75 && span(paperYaw) / span(sourceYaw) < 1.30,
      'posterior sweep stays near the observed reference envelope');
    const fast = samples.map(time => solve(rig, { clip: 'fastSwim', time }));
    for (const [i, p] of fast.entries()) assert.deepEqual(solve(rig, { clip: 'run', time: samples[i] }), p);
    assert.ok(span(fast.map(p => p.tailTip[1])) > tailMotion);
    assert.ok(rig.clips.fastSwim.duration < rig.clips.swim.duration);
  });
  test(`${id}: loops close, bones and every rigid polygon keep their dimensions`, () => {
    const bind = solve(rig, { clip: 'bind', time: 0 });
    for (const clip of ['idle', 'swim', 'fastSwim']) {
      assert.deepEqual(solve(rig, { clip, time: 0 }), solve(rig, { clip, time: 1 }));
      const first = solve(rig, { clip, time: .001 }), last = solve(rig, { clip, time: .999 }), seam = solve(rig, { clip, time: 0 });
      for (const key of ['noseTip', 'tailTip']) for (let k = 0; k < 3; k++)
        assert.ok(Math.abs((first[key][k] - seam[key][k]) - (seam[key][k] - last[key][k])) < .00015, 'seam velocity is continuous');
    }
    for (const clip of ['swim', 'fastSwim', 'attack', 'ko']) for (const time of samples) {
      const p = solve(rig, { clip, time });
      for (const j of rig.joints.filter(j => j.parent))
        assert.ok(Math.abs(distance(p[j.id], p[j.parent]) - distance(bind[j.id], bind[j.parent])) < 1e-7, `${clip}/${time}/${j.id} bone length`);
      for (const plate of rig.plates.filter(p => p.points)) for (let i = 0; i < plate.points.length; i++) {
        const a = plate.points[i], b = plate.points[(i + 1) % plate.points.length];
        assert.ok(Math.abs(distance(p[a], p[b]) - distance(bind[a], bind[b])) < 1e-7, `${plate.id} must remain a rigid paper face`);
      }
    }
  });
  test(`${id}: fin and body geometry survives the complete heading/elevation sweep`, () => {
    for (const clip of ['swim', 'fastSwim', 'attack', 'ko']) for (const time of [0, .125, .25, .375, .5, .625, .75, .875, 1])
      for (const elevation of [0, 30, 60, 75, 90]) for (let heading = 0; heading < 360; heading += 45) {
        const scene = projectScene(rig, { clip, time, elevation, heading });
        const context = `${id}/${clip}/${time}/${elevation}/${heading}`;
        assert.deepEqual(inspectOcclusion(rig, scene).violations, [], context);
        const p = scene.joints;
        assert.ok(p.every(j => j.screenPosition.every(v => Number.isFinite(v) && v > .5 && v < 99.5)), `${context} framing`);
        assert.ok(elements(scene).some(e => !e.generated && e.sourceId.startsWith('tailFin')), `${context} caudal fin`);
      }
  });
}

test('shark attack opens two rigid jaws and snaps closed at the lunge peak; swimming keeps its bite closed',()=>{
 const r=loadModel('shark'),gap=t=>{const p=solve(r,{clip:'attack',time:t});return distance(p.upperJawTip,p.lowerJawTip);};
 assert.ok(gap(.32)>.43,'wide readable gape');assert.ok(Math.abs(gap(.46)-.06)<1e-7,'tips return to closed bite');assert.ok(gap(.43)>gap(.46)+.15,'rapid closing stroke');
 for(const clip of ['swim','fastSwim','idle'])for(const time of samples){const p=solve(r,{clip,time});assert.ok(Math.abs(distance(p.upperJawTip,p.lowerJawTip)-.06)<1e-7);}
 const open=r.clips.attack.frames.find(f=>f.t===.32);assert.equal(open.rotations.upperJaw[1],-8);assert.equal(open.rotations.lowerJaw[1],38);assert.ok(r.clips.attack.events.some(e=>e.t===.46&&e.name==='bite-snap'));
 assert.ok(r.plates.some(p=>p.id==='upperJawPalatePlate'));assert.ok(r.plates.some(p=>p.id==='lowerJawPalatePlate'));assert.equal(r.plates.filter(p=>/Tooth\dFace0Plate/.test(p.id)).length,20);
 for(const time of [0,1])assert.deepEqual(solve(r,{clip:'attack',time}),solve(r,{clip:'attack',time:0}));
});
