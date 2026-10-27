import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { loadModel, loadModelConfigured } from '@paper-rig/rigs';
import { projectScene, compilePackage, core } from '@paper-rig/compiler';
import { inspectOcclusion, inspectHeadOcclusion } from '@paper-rig/validator/occlusion';
import { auditRig, DEFAULT_AUDIT_ELEVATIONS } from '@paper-rig/validator/audit';

const models = readdirSync(new URL('../rigs/models/', import.meta.url)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const elementGroup = (scene, id) => scene.compositingGroups.find(g => g.elements.some(e => e.id === id));

test('default audits include the overhead camera and all models satisfy the independent occlusion oracle', () => {
  assert.ok(DEFAULT_AUDIT_ELEVATIONS.includes(90));
  for (const model of models) {
    const report = auditRig(loadModel(model));
    const check = report.diagnostics.find(d => d.code === 'audit.buried-appendage-order');
    assert.equal(check?.pass, true, `${model}: ${JSON.stringify(report.views.filter(v => v.occlusion.violations.length).map(v=>({id:v.id,violations:v.occlusion.violations})).slice(0,3))}`);
    assert.equal(report.diagnostics.find(d=>d.code==='audit.head-assembly-depth')?.pass,true,model);
    assert.ok(report.views.some(v => v.elevationDegrees === 90));
  }
});

test('rabbit entire hind chain stays below the body from overhead, including interpolated motion', () => {
  const rig = loadModel('rabbit');
  assert.equal(rig.plates.find(p => p.id === 'nearRearPasternPlate').occlusionMode, 'under-core');
  // Remove the specimen override: the generic depth classifier must still work.
  for (const p of rig.plates) { delete p.occlusionMode; delete p.occlusionReference; }
  for (const clip of ['idle', 'walk', 'attack']) for (const heading of [0, 45, 90, 135, 180, 225, 270, 315]) for (let i = 0; i <= 16; i++) {
    const scene = projectScene(rig, { clip, time: i / 16, elevation: 90, heading });
    for (const side of ['near', 'far']) {
      assert.equal(elementGroup(scene, side + 'RearPasternPlate').semanticRole, 'camera-far appendages');
    }
    assert.deepEqual(inspectOcclusion(rig, scene).violations, []);
  }
});

test('occlusion oracle rejects an old-style buried plate or gasket moved in front of the body', () => {
  const rig = loadModel('rabbit');
  for (const id of ['nearRearPasternPlate', 'nearRearKneeGasket']) {
    const scene = projectScene(rig, { elevation: 90, heading: 0, clip: 'idle', time: 0 });
    assert.deepEqual(inspectOcclusion(rig, scene).violations, []);
    const source = elementGroup(scene, id);
    const [element] = source.elements.splice(source.elements.findIndex(e => e.id === id), 1);
    scene.compositingGroups.find(g => g.semanticRole === 'camera-near appendages').elements.push(element);
    assert.ok(inspectOcclusion(rig, scene).violations.some(v => v.elementId === id), id);
  }
});

test('configured scenes also satisfy the oracle; visible side-view near limbs remain in front', () => {
  for (const model of ['rabbit', 'horse', 'humanoid', 'spider']) {
    const rig = loadModelConfigured(model, { motion: true, attachments: true, appearance: true }).rig;
    for (const elevation of [45, 60, 75, 90]) for (const heading of [0, 90, 180, 270]) {
      const scene = projectScene(rig, { elevation, heading, clip: 'idle', time: .375 });
      assert.deepEqual(inspectOcclusion(rig, scene).violations, [], model);
    }
  }
  const horse = loadModel('horse');
  const left = projectScene(horse, { elevation: 0, heading: 90 });
  const right = projectScene(horse, { elevation: 0, heading: 270 });
  assert.notEqual(elementGroup(left, 'nearFrontLowerPlate').semanticRole, elementGroup(right, 'nearFrontLowerPlate').semanticRole);
});


test('all models also pass side, oblique and overhead depth checks between key poses of every clip', () => {
  for (const model of models) {
    const rig = loadModel(model);
    for (const clip of Object.keys(rig.clips)) for (const time of [.125, .375, .625, .875]) {
      for (const elevation of [0, 45, 90]) for (const heading of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const scene = projectScene(rig, { clip, time, elevation, heading });
        assert.deepEqual(inspectOcclusion(rig, scene).violations, [], `${model}/${clip}/${time}/${elevation}/${heading}`);
      }
    }
  }
});

test('custom geometry outside the oracle is explicitly reported as unverified', () => {
  const rig = loadModel('horse');
  const scene = projectScene(rig, { elevation: 90 });
  const tail = scene.compositingGroups.flatMap(g=>g.elements).find(e=>e.id==='tailPlate');
  tail.vector.attributes.transform='matrix(1 0 0 1 0 0)';
  const evidence = inspectOcclusion(rig, scene);
  assert.ok(evidence.unsupportedAppendageElementIds.includes('tailPlate'));
  assert.ok(evidence.supportedCoreElementCount > 0);
});


test('head oracle rejects the old always-front tusk and ear layers independently of compiler parity', () => {
  const rig=loadModel('elephant');
  for(const [id,elevation,heading] of [['nearTuskPlate',90,0],['farTuskPlate',90,0],['farEarPlate',0,180],['trunkUpperPlate',90,0],['nearTuskBaseGasket',0,0]]){
    const scene=projectScene(rig,{clip:'idle',time:0,elevation,heading});
    const evidence=inspectHeadOcclusion(rig,scene);
    assert.deepEqual(evidence.violations,[]);
    assert.ok(evidence.checkedPairCount>0);
    assert.deepEqual(evidence.unsupportedElementIds,[]);
    const group=elementGroup(scene,id);
    const [element]=group.elements.splice(group.elements.findIndex(e=>e.id===id),1);
    scene.compositingGroups.at(-1).elements.push(element);
    assert.ok(inspectHeadOcclusion(rig,scene).violations.some(v=>v.elementId===id),id);
  }
});

test('head polygon depth comes from the ear outline, rather than its mounting joint', () => {
  const rig=loadModel('elephant'),scene=projectScene(rig,{elevation:45,heading:315,clip:'idle',time:.375});
  const order=scene.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated).map(e=>e.id);
  assert.ok(order.indexOf('farEarPlate')<order.indexOf('headPlate'));
  assert.ok(order.indexOf('headPlate')<order.indexOf('nearEarPlate'));
  assert.deepEqual(inspectHeadOcclusion(rig,scene).violations,[]);
});

test('head connectors sit behind coincident surfaces and tapered tusks keep pointed ends', () => {
  const rig=loadModel('elephant');
  const scene=projectScene(rig,{clip:'idle',time:0,elevation:90,heading:0});
  const ids=scene.compositingGroups.flatMap(g=>g.elements).map(e=>e.id);
  assert.ok(ids.indexOf('headGasket')<ids.indexOf('headPlate'));
  assert.ok(!ids.includes('nearTuskTipGasket'));
  assert.ok(!ids.includes('farTuskTipGasket'));
});


test('terminal taper coverage never exempts an ordinary connected joint', () => {
  const pkg=compilePackage(loadModel('elephant'));
  assert.ok(pkg.validation.checks.find(c=>c.id==='joint-coverage').pass);
  const head=pkg.joints.find(j=>j.id==='head');
  delete head.coverageGasketId;
  assert.equal(core.packageValidation(pkg).checks.find(c=>c.id==='joint-coverage').pass,false);
});


test('elephant buried trunk connector and both hip roots stay behind the surface at reported cameras', () => {
  const rig=loadModel('elephant');
  for(const [elevation,heading]of[[45,180],[0,90],[0,270],[45,45],[45,90],[0,180]]){
    const scene=projectScene(rig,{clip:'idle',time:.375,elevation,heading});
    for(const id of ['trunkConnectorPlate','farFrontHipGasket','nearFrontHipGasket']){
      assert.equal(elementGroup(scene,id).semanticRole,'camera-far appendages',`${id}/${elevation}/${heading}`);
    }
    assert.deepEqual(inspectOcclusion(rig,scene).violations,[]);
  }
  for(const id of ['trunkConnectorPlate','farFrontHipGasket','nearFrontHipGasket']){
    const scene=projectScene(rig,{clip:'idle',time:.375,elevation:45,heading:45});
    const group=elementGroup(scene,id),[element]=group.elements.splice(group.elements.findIndex(e=>e.id===id),1);
    scene.compositingGroups.at(-1).elements.push(element);
    assert.ok(inspectOcclusion(rig,scene).violations.some(v=>v.kind==='buried-connector-order'&&v.elementId===id),id);
  }
});
