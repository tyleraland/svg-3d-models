import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,solvePose,projectScene,core,compilePackage}from'@paper-rig/compiler';
import{auditRig}from'@paper-rig/validator/audit';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
const rig=loadModel('bear'),feet=rig.clips.idle.contacts;
test('bear has its own broad ursine proportions, raised shoulders, round ears, big paws and short tail',()=>{
 const p=solve(rig,{clip:'bind'}),plate=id=>rig.plates.find(p=>p.id===id);
 assert.equal(rig.id,'bearBase');assert.equal(rig.family,'ursine');
 assert.ok(p.chest[2]>p.pelvis[2]+.09);assert.ok(plate('shoulderPlate').size[1]<plate('chestBarrelPlate').size[0],'shoulder nests within the barrel rather than forming a tall separate oval');
 assert.ok(plate('headPlate').size[0]>.35);assert.ok(plate('muzzlePlate').size[0]>.2);
 assert.ok(p.muzzle[0]-p.head[0]<.21);
 assert.ok(p.head[0]-p.pelvis[0]>1.3&&p.head[0]-p.pelvis[0]<1.6,'reference-like pelvis-to-head reach');
 assert.ok(Math.hypot(...p.tailTip.map((v,k)=>v-p.tailBase[k]))<.12);
 for(const side of ['near','far']){assert.equal(plate(side+'EarPlate').shape,'ellipse');assert.ok(plate(side+'FrontPawPlate').size[0]>.25);}
 assert.equal(compilePackage(rig).validation.status,'passed');
});
test('bear animations preserve bones, contacts, level plantigrade paws, claw clearance and loop seams',()=>{
 const bind=solve(rig,{clip:'bind'});
 for(const clip of ['idle','walk','run'])assert.deepEqual(rig.clips[clip].frames[0],{...rig.clips[clip].frames.at(-1),t:0});
 assert.ok(rig.clips.walk.duration>rig.clips.run.duration);assert.deepEqual(core.contactIds(rig,'run',.83),[]);
 for(const clip of ['idle','walk','run','attack']){
  assert.ok(core.preservedClipLengthsPass(rig,clip),clip);
  for(let i=0;i<=1000;i++){
   const t=i/1000,p=solve(rig,{clip,time:t});
   for(const id of feet)assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id}`);
   for(const id of core.contactIds(rig,clip,t))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} plant`);
   for(const side of ['near','far'])for(const digit of [1,2,3])assert.ok(p[side+`FrontClaw${digit}Tip`][2]>-.0001,`${clip}/${t} claw clearance`);
   if(clip==='idle')for(const id of feet)p[id].forEach((v,k)=>assert.ok(Math.abs(v-bind[id][k])<1e-8));
   if(clip==='attack')for(const id of feet.filter(id=>id!=='nearFrontPaw'))p[id].forEach((v,k)=>assert.ok(Math.abs(v-bind[id][k])<.0001));
   if(clip==='walk'||clip==='run')for(const id of feet){const M=solvePose(rig,{clip,time:t}).joints[id].localToWorldRotation;assert.ok(Math.abs(M[2][0])<1e-8&&Math.abs(M[2][2]-1)<1e-8,`${clip}/${id} level sole`);}
  }
 }
});
test('bear swipe lifts and reaches the whole forelimb while three feet brace and claws remain non-retractile',()=>{
 const wind=solve(rig,{clip:'attack',time:.24}),raised=solve(rig,{clip:'attack',time:.44}),hit=solve(rig,{clip:'attack',time:.5}),bind=solve(rig,{clip:'bind'});
 assert.ok(raised.nearFrontPaw[2]>.4);assert.ok(hit.nearFrontPaw[0]>bind.nearFrontPaw[0]+.25);assert.ok(hit.nearFrontPaw[0]>wind.nearFrontPaw[0]+.3);
 assert.equal(core.contactIds(rig,'attack',.5).length,3);
 const stroke=rig.clips.attack.frames.filter(f=>f.t>=.32&&f.t<=.56);
 for(const id of ['nearFrontHip','nearFrontKnee']){const angles=stroke.map(f=>f.rotations[id][1]);assert.ok(Math.max(...angles)-Math.min(...angles)>25,`${id} articulates through the arc`);}
 for(const c of Object.values(rig.clips))for(const f of c.frames)assert.ok(!Object.keys(f.rotations||{}).some(id=>/Claw/.test(id)),'bear claws do not retract');
});
test('bear passes head/limb stacking and token framing over idle, walk, run and swipe camera matrices',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.12,.24,.38,.5,.62,.83,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(rig,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(rig,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${j.id} token framing`);
 }
 const report=auditRig(rig);assert.equal(report.status,'passed',JSON.stringify(report.issues));
});
