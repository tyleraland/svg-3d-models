import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {loadModel,loadFamily} from '@paper-rig/rigs';
import {validateFamilySource} from '@paper-rig/validator/source';
import {solve,core,projectScene,compilePackage,useRig} from '@paper-rig/compiler';
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
 for(const clip of ['idle','walk','run','hop','fly','glide','attack','talonStrike'])for(const time of [0,.15,.3,.4,.46,.54,.56,.62,.66,.8,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
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
 assert.deepEqual(rig.clips.hit.contacts,['nearTalon','farTalon']);assert.deepEqual(rig.clips.ko.contactIntervals,[]);
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
 assert.ok((.62-.56)*rig.clips.attack.duration<80);
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

test('eagle has a compact hooked bill, broad secondary chord, short fan and articulated talon silhouette',()=>{
 const j=id=>rig.joints.find(j=>j.id===id),p=id=>rig.plates.find(p=>p.id===id);
 assert.deepEqual(rig.archetypes,['eagle']);assert.ok(Math.hypot(...j('beak').bind)<.14);
 assert.ok(p('bodyPlate').size[0]>=.40);assert.ok(Math.abs(j('nearWingElbowTrailing').bind[0])>.35);
 assert.ok(Math.abs(j('tailFan4').bind[0])<.35);
 for(const side of ['near','far'])for(const toe of ['InnerToe','MiddleToe','OuterToe','Hallux']){
  assert.equal(j(side+toe).parent,side+'Talon');assert.equal(p(side+toe+'Plate').shape,'taperedBone');
 }
 const pose=solve(rig,{clip:'glide',time:0}),span=Math.abs(pose.nearPrimary5[1]-pose.farPrimary5[1]),length=pose.beak[0]-pose.tailFan4[0];
 assert.ok(span/length>2&&span/length<2.7,'broad-winged eagle proportion from the reference');
});

test('standing eagle idle keeps paired feet planted while breathing and looking around',()=>{
 const first=solve(rig,{clip:'idle',time:0});let minBody=Infinity,maxBody=-Infinity;
 for(let i=0;i<=1200;i++){
  const t=i/1200,pose=solve(rig,{clip:'idle',time:t});minBody=Math.min(minBody,pose.body[2]);maxBody=Math.max(maxBody,pose.body[2]);
  assert.deepEqual(new Set(core.contactIds(rig,'idle',t)),new Set(['nearTalon','farTalon']));
  for(const side of ['near','far'])for(let k=0;k<3;k++)assert.ok(Math.abs(pose[side+'Talon'][k]-first[side+'Talon'][k])<2e-6,`${side}/${t}/${k} standing plant`);
 }
 assert.ok(maxBody-minBody>.002&&maxBody-minBody<.004);
 const neck=rig.clips.idle.frames.map(f=>f.rotations.neck[2]);assert.ok(Math.max(...neck)-Math.min(...neck)>10);
 assert.deepEqual(rig.clips.idle.frames[0],{...rig.clips.idle.frames.at(-1),t:0});
});

test('eagle run alternates whole legs with brief flight, stable stance and continuous hip rotations',()=>{
 assert.ok(rig.clips.run.duration<rig.clips.walk.duration*.6);
 for(const t of [.1,.6])assert.equal(core.contactIds(rig,'run',t).length,1);
 for(const t of [.46,.96])assert.deepEqual(core.contactIds(rig,'run',t),[]);
 for(const clip of ['idle','walk','run','hop']){
  const c=rig.clips[clip];assert.ok(core.preservedClipLengthsPass(rig,clip));
  assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=1;i<c.frames.length;i++)for(const side of ['near','far'])for(let k=0;k<3;k++)assert.ok(Math.abs(c.frames[i].rotations[side+'LegHip'][k]-c.frames[i-1].rotations[side+'LegHip'][k])<5,`${clip}/${i} Euler continuity`);
  for(let i=0;i<=1200;i++){
   const t=i/1200,pose=solve(rig,{clip,time:t});
   for(const side of ['near','far']){
    assert.ok(pose[side+'Talon'][2]>-2e-6,`${clip}/${t} clearance`);
    if(core.contactIds(rig,clip,t).includes(side+'Talon'))assert.ok(Math.abs(pose[side+'Talon'][2])<2e-6,`${clip}/${t} contact`);
   }
  }
 }
 const a=rig.clips.run.frames[0].rotations,b=rig.clips.run.frames.find(f=>f.t===.25).rotations;
 for(const part of ['Hip','Knee','Ankle'])assert.ok(Math.abs(a['nearLeg'+part][1]-b['nearLeg'+part][1])>5,part+' participates');
});

test('talon strike reaches forward and down, keeps beating its wings and recovers to flight',()=>{
 const c=rig.clips.talonStrike,attack=solve(rig,{clip:'talonStrike',time:.46}),flight=solve(rig,{clip:'fly',time:.46});
 for(const side of ['near','far']){
  assert.ok(attack[side+'Talon'][0]>flight[side+'Talon'][0]+.25);
  assert.ok(attack[side+'Talon'][2]<flight[side+'Talon'][2]-.1);
 }
 for(let i=0;i<c.frames.length;i++){
  const f=c.frames[i];assert.deepEqual(core.contactIds(rig,'talonStrike',f.t),[]);
  for(const side of ['near','far'])for(const part of ['Root','Elbow','Wrist'])assert.deepEqual(f.rotations[side+'Wing'+part],rig.clips.fly.frames[i].rotations[side+'Wing'+part]);
 }
 for(const index of [0,c.frames.length-1]){
  assert.deepEqual(c.frames[index].poses,rig.clips.fly.frames[index].poses);
  assert.deepEqual(c.frames[index].rotations,rig.clips.fly.frames[index].rotations);
 }
 assert.ok(core.preservedClipLengthsPass(rig,'talonStrike'));
 const shadow=t=>projectScene(rig,{clip:'talonStrike',time:t,elevation:45,heading:315}).compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 assert.deepEqual(shadow(0),shadow(.46),'ground shadow stays fixed during the dive');
});


test('workbench frames densely baked eagle clips without exceeding the argument stack',()=>{
 const fn=readFileSync(new URL('../apps/workbench/ui.js',import.meta.url),'utf8').match(/^function editorViewBox\(.*$/m)[0];
 useRig(rig,{elevation:45,heading:315});
 const box=runInNewContext(`(${fn})`,{state:core.state,frameTimes:c=>[...c.frames.map(f=>f.t),...Array.from({length:1501},(_,i)=>i/1500)],projected:core.projected,worldJoints:core.worldJoints,cameraBasis:core.cameraBasis});
 for(const clip of ['idle','walk','run','hop']){
  const bounds=box(rig,0,clip).split(' ').map(Number);assert.ok(bounds.every(Number.isFinite));assert.ok(bounds[2]>0&&bounds[2]===bounds[3]);
 }
});
