import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,solvePose,projectScene,core,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('spider'),feet=['left','right'].flatMap(s=>[1,2,3,4].map(i=>s+'Leg'+i+'Foot'));
test('spider has fanned arched legs, a low body, small contacts and articulated palps',()=>{
 const p=solve(r,{clip:'bind'});
 for(const id of feet){const knee=id.replace('Foot','Knee');assert.equal(p[id][2],0);assert.ok(p[knee][2]>p.cephalothorax[2]+.25);assert.ok(r.plates.find(x=>x.id===id+'Plate').size[0]<.04);}
 assert.ok(p.leftLeg1Foot[0]>.7&&p.leftLeg4Foot[0]<-.8);
 assert.ok(p.abdomen[2]>.3&&p.abdomen[2]<.4);
 for(const s of ['left','right'])assert.ok(p[s+'PalpTip'][0]>p.head[0]);
 assert.equal(compilePackage(r).validation.status,'passed');
});
test('spider gait alternates four-leg supports with a distinct faster, higher run',()=>{
 for(const c of ['walk','run']){
  assert.equal(core.contactIds(r,c,.25).length,4);assert.equal(core.contactIds(r,c,.75).length,4);
  assert.notDeepEqual(core.contactIds(r,c,.25),core.contactIds(r,c,.75));
  for(let i=0;i<=1000;i++)assert.ok(core.contactIds(r,c,i/1000).length>=4);
  for(const id of ['leftLeg1Hip','leftLeg1Knee'])assert.notDeepEqual(solvePose(r,{clip:c,time:.1}).joints[id].localToWorldRotation,solvePose(r,{clip:c,time:.75}).joints[id].localToWorldRotation);
 }
 assert.ok(r.clips.run.duration<r.clips.walk.duration);
 assert.ok(solve(r,{clip:'run',time:.775}).leftLeg1Foot[2]>solve(r,{clip:'walk',time:.82}).leftLeg1Foot[2]+.04);
});
test('spider bite raises both front legs, braces six feet, snaps its fangs, and recovers to idle',()=>{
 const neutral=solve(r,{clip:'idle',time:0}),crest=solve(r,{clip:'attack',time:.32}),strike=solve(r,{clip:'attack',time:.46});
 assert.ok(crest.leftLeg1Foot[2]>.49&&crest.rightLeg1Foot[2]>.49);
 assert.ok(crest.head[2]>neutral.head[2]+.2);assert.equal(core.contactIds(r,'attack',.32).length,6);
 assert.ok(strike.head[0]-crest.head[0]>.10);
 assert.ok(Math.abs(r.clips.attack.frames.find(f=>f.t===.46).rotations.leftFangBase[1]-r.clips.attack.frames.find(f=>f.t===.32).rotations.leftFangBase[1])>45);
 for(const t of [0,1]){const p=solve(r,{clip:'attack',time:t});for(const id of Object.keys(neutral))p[id].forEach((v,k)=>assert.ok(Math.abs(v-neutral[id][k])<1e-8));}
});
test('spider clips preserve bone lengths, grounded feet and support footprints between keys',()=>{
 for(const clip of ['idle','walk','run','attack']){
  assert.ok(core.preservedClipLengthsPass(r,clip));
  if(clip!=='attack')assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});
  for(let i=0;i<=1000;i++){
   const t=i/1000,p=solve(r,{clip,time:t});for(const id of feet)assert.ok(p[id][2]>-.00002,`${clip}/${t}/${id}`);
   for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.00002,`${clip}/${t}/${id} contact`);
  }
 }
});
test('spider keeps its legs and face correctly stacked across the camera matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.12,.25,.32,.46,.6,.75,.86,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${j.id} framing`);
 }
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});

test('spider waist is buried beneath the abdomen throughout every clip and camera',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.12,.32,.46,.6,.86,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading}),groups=s.compositingGroups;
  const waist=groups.findIndex(g=>g.elements.some(e=>e.id==='waistPlate'));
  const abdomen=groups.findIndex(g=>g.elements.some(e=>e.id==='abdomenPlate'));
  assert.ok(waist>=0&&waist<abdomen,`${clip}/${time}/${elevation}/${heading}: waist behind abdomen`);
 }
});

test('spider KO replaces the generic tip with a lateral topple, inward curl and settled hold',()=>{
 assert.equal(r.clips.ko.duration,1960);assert.equal(r.clips.ko.loop,false);assert.equal(r.clips.ko.boneLengthPolicy,'preserve');
 const start=solve(r,{clip:'ko',time:0}),idle=solve(r,{clip:'idle',time:0}),end=solve(r,{clip:'ko',time:1});
 for(const id of Object.keys(start))start[id].forEach((v,k)=>assert.ok(Math.abs(v-idle[id][k])<1e-8,'neutral entry'));
 assert.deepEqual(core.contactIds(r,'ko',.02),feet);assert.deepEqual(core.contactIds(r,'ko',.1),[]);
 const final=solvePose(r,{clip:'ko',time:1});assert.ok(final.joints.root.localToWorldRotation[2][1]>.95,'side-lying roll around forward axis');
 assert.ok(end.abdomen[1]<start.abdomen[1]-.3);assert.ok(Math.abs(end.abdomen[2]-.26)<1e-8,'abdomen envelope rests on ground');
 for(const id of feet)assert.ok(Math.abs(end[id][0])<Math.abs(start[id][0])*.4,'feet curl inward longitudinally');
 assert.deepEqual(solve(r,{clip:'ko',time:.9}),end,'settled final hold');
 assert.ok(core.preservedClipLengthsPass(r,'ko'));
 for(let i=0;i<=1000;i++){
  const time=i/1000,p=solve(r,{clip:'ko',time});for(const[id,v]of Object.entries(p))assert.ok(v[2]>-.00003,`${time}/${id} ground clearance`);
 }
});

test('spider KO stays framed and correctly stacked through the full directional fall',()=>{
 for(const time of [0,.04,.13,.25,.34,.48,.72,.85,.9,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip:'ko',time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${time}/${elevation}/${heading}/${j.id} framing`);
 }
});
