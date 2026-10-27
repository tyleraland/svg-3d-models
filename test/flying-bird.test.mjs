import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadModel,loadFamily} from '@paper-rig/rigs';
import {validateFamilySource} from '@paper-rig/validator/source';
import {solve,core,projectScene,compilePackage} from '@paper-rig/compiler';
import {inspectOcclusion} from '@paper-rig/validator/occlusion';
import {auditRig} from '@paper-rig/validator/audit';
const rig=loadModel('flyingBird');
test('flying bird has broad closed feather panels, a fan tail and a hooked tapered beak',()=>{
 for(const side of ['near','far']){
  const tip=rig.plates.find(p=>p.id===side+'WingTipPlate');assert.equal(tip.shape,'polygon');assert.ok(tip.points.length>=12);
  assert.ok(rig.plates.find(p=>p.id===side+'WingMidPlate').points.length>=4);
 }
 assert.equal(rig.plates.find(p=>p.id==='beakPlate').shape,'taperedBone');
 assert.ok(rig.plates.find(p=>p.id==='tailPlate').points.length>=8);
 assert.equal(compilePackage(rig).validation.status,'passed');
});
test('flight is synchronous and symmetric, preserves every bone, and has a closed loop',()=>{
 for(const clip of ['idle','walk','hop','fly','glide','attack'])assert.ok(core.preservedClipLengthsPass(rig,clip),clip);
 for(const clip of ['fly','glide']){
  const c=rig.clips[clip];assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=0;i<=240;i++){
   const t=i/240,p=solve(rig,{clip,time:t});
   for(const part of ['Root','Elbow','Wrist','Tip']){
    const a=p['nearWing'+part],b=p['farWing'+part];assert.ok(Math.abs(a[0]-b[0])<1e-8);assert.ok(Math.abs(a[2]-b[2])<1e-8);assert.ok(Math.abs(a[1]+b[1])<1e-8);
   }
   assert.ok(Math.min(...Object.values(p).map(v=>v[2]))>=0,`${clip}/${t} ground clearance`);
   assert.deepEqual(core.contactIds(rig,clip,t),[]);
  }
 }
 const raised=solve(rig,{clip:'fly',time:0}),down=solve(rig,{clip:'fly',time:.3});
 assert.ok(raised.nearWingTip[2]>raised.chest[2]+.5);assert.ok(down.nearWingTip[2]<down.chest[2]-.5);
 assert.ok(rig.clips.fly.duration<rig.clips.glide.duration);
});
test('bird flight and glide retain consistent stacking and token framing over the camera matrix',()=>{
 for(const clip of ['walk','hop','fly','glide','attack'])for(const time of [0,.15,.3,.4,.65,.8,1])for(const elevation of [0,30,45,60,75,90])for(const heading of [0,45,90,135,180,225,270,315]){
  const scene=projectScene(rig,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(rig,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of scene.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${j.id} token framing`);
 }
 const audit=auditRig(rig);assert.equal(audit.status,'passed',JSON.stringify(audit.issues));
});

test('airborne peck retains a full wingbeat and tucked feet throughout the strike',()=>{
 const clip=rig.clips.attack;assert.equal(clip.base,'bind');
 for(const t of [0,.15,.3,.4,.62,.8,1]){
  const f=clip.frames.find(f=>Math.abs(f.t-t)<1e-10),flight=rig.clips.fly.frames.find(f=>Math.abs(f.t-t)<1e-10);
  for(const side of ['near','far'])for(const part of ['Root','Elbow','Wrist'])assert.deepEqual(f.rotations[side+'Wing'+part],flight.rotations[side+'Wing'+part]);
  assert.deepEqual(core.contactIds(rig,'attack',t),[]);
  const p=solve(rig,{clip:'attack',time:t});assert.ok(p.nearTalon[2]>.7&&p.farTalon[2]>.7);
 }
 assert.ok(solve(rig,{clip:'attack',time:.62}).beak[2]<solve(rig,{clip:'fly',time:.62}).beak[2]-.12);
 assert.equal(clip.events.find(e=>e.name==='impact').t,.62);
});

test('waddle alternates grounded feet, shifts body weight and keeps the wings folded',()=>{
 assert.deepEqual(new Set(core.contactIds(rig,'walk',.3)),new Set(['nearTalon']));
 assert.deepEqual(new Set(core.contactIds(rig,'walk',.8)),new Set(['farTalon']));
 const a=solve(rig,{clip:'walk',time:0}),b=solve(rig,{clip:'walk',time:.5});assert.ok(Math.abs(a.body[1]-b.body[1])>.04);
 for(const id of ['walk','hop']){
  assert.deepEqual(rig.clips[id].frames[0],{...rig.clips[id].frames.at(-1),t:0});
  for(let i=0;i<=1200;i++){
   const t=i/1200,p=solve(rig,{clip:id,time:t});
   for(const side of ['near','far']){
    const foot=side+'Talon';assert.ok(p[foot][2]>-.00002,`${id}/${t} foot clearance`);
    if(core.contactIds(rig,id,t).includes(foot)){assert.ok(Math.abs(p[foot][2])<.00002,`${id}/${t} contact`);assert.ok(Math.abs(p[foot][1]-(side==='near'?.105:-.105))<.00002,`${id}/${t} lateral plant`);}
   }
  }
  assert.ok(Math.abs(rig.clips[id].frames[0].rotations.nearWingRoot[2])>80);
 }
 assert.deepEqual(rig.clips.hit.contacts,[]);assert.deepEqual(rig.clips.ko.contactIntervals,[]);
});

test('hop has paired crouch, takeoff, airborne arc and paired landing',()=>{
 for(const t of [0,.15,.8,1])assert.deepEqual(new Set(core.contactIds(rig,'hop',t)),new Set(['nearTalon','farTalon']));
 for(const t of [.2,.48,.75])assert.deepEqual(core.contactIds(rig,'hop',t),[]);
 const p=solve(rig,{clip:'hop',time:.48}),rest=solve(rig,{clip:'hop',time:0});assert.ok(p.nearTalon[2]>.14);assert.ok(p.body[2]>rest.body[2]+.11);
 assert.ok(solve(rig,{clip:'hop',time:.09}).body[2]<rest.body[2]-.03);
});

test('peck is a fast neck-only angular jab, with unchanged wingbeat and root trajectory',()=>{
 const attack=rig.clips.attack.frames,flight=rig.clips.fly.frames;
 const delta=t=>attack.find(f=>f.t===t).rotations.neck[1]-flight.find(f=>f.t===t).rotations.neck[1];
 assert.ok(Math.abs(delta(.54)+14)<1e-6);assert.ok(Math.abs(delta(.62)-55)<1e-6);
 assert.ok((.62-.54)*rig.clips.attack.duration<80);
 for(let i=0;i<attack.length;i++){
  assert.deepEqual(attack[i].poses,flight[i].poses,'jab never translates the head or extends the body');
  assert.deepEqual(attack[i].rotations.body,flight[i].rotations.body);
  assert.deepEqual(attack[i].rotations.head,flight[i].rotations.head);
 }
});

test('small beak seam remains beneath its plates at every heading, and the hook is compact',()=>{
 const gasket=compilePackage(rig).gaskets.find(g=>g.id==='beakGasket');assert.equal(gasket.diameterMeters,.035);
 assert.deepEqual(gasket.underIncidentPlateIds,['beakPlate','beakHookPlate']);
 assert.ok(Math.hypot(...rig.joints.find(j=>j.id==='beakHook').bind)<.025);
 for(const clip of ['idle','attack'])for(const time of [0,.54,.62,.66,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const scene=projectScene(rig,{clip,time,elevation,heading}),elements=scene.compositingGroups.flatMap(g=>g.elements);
  const index=id=>elements.findIndex(e=>e.sourceId===id&&!e.generated);
  for(const plate of gasket.underIncidentPlateIds)assert.ok(index('beakGasket')<index(plate),`${clip}/${time}/${elevation}/${heading}`);
  assert.deepEqual(inspectOcclusion(rig,scene).violations,[]);
 }
 const scene=projectScene(rig,{clip:'idle',time:0,elevation:45,heading:135});
 const group=scene.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='beakGasket'&&!e.generated));
 const i=group.elements.findIndex(e=>e.sourceId==='beakGasket'&&!e.generated);group.elements.push(...group.elements.splice(i,1));
 assert.ok(inspectOcclusion(rig,scene).violations.some(v=>v.kind==='head-seam-incident-order'));
});

test('authored beak gasket rejects invalid dimensions and unsupported seam placement',()=>{
 for(const value of [-.1,.6]){const f=loadFamily('flyingBird');f.joints.find(j=>j.id==='beak').gasket.diameterMeters=value;assert.equal(validateFamilySource(f).status,'failed');}
 const f=loadFamily('flyingBird');f.joints.find(j=>j.id==='beak').gasket.diameterMeters=.3;assert.equal(validateFamilySource(f).status,'failed');
 const helper=loadFamily('flyingBird');helper.joints.find(j=>j.id==='beak').helper=true;assert.equal(validateFamilySource(helper).status,'failed');
});
