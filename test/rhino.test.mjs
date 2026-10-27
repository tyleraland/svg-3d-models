import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{auditRig}from'@paper-rig/validator/audit';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
const rig=loadModel('rhino'),feet=rig.clips.idle.contacts;
test('rhino has a low head, deep barrel, short legs, pointed ears and two centerline nasal horns',()=>{
 const p=solve(rig,{clip:'bind'}),plate=id=>rig.plates.find(p=>p.id===id);
 assert.ok(p.head[2]<p.chest[2]-.15);assert.ok(p.snout[2]<p.head[2]-.1);
 assert.ok(plate('torsoPlate').size[0]>p.pelvis[2]);assert.ok(plate('shoulderPlate').size[1]>plate('headPlate').size[1]*1.6);
 assert.ok(p.nasalHornTip[2]>p.nasalHornBase[2]+.4);assert.ok(Math.hypot(...p.nasalHornTip.map((v,k)=>v-p.nasalHornBase[k]))>2*Math.hypot(...p.rearNasalHornTip.map((v,k)=>v-p.rearNasalHornBase[k])));
 for(const id of ['nasalHornBase','nasalHornMid','nasalHornTip','rearNasalHornBase','rearNasalHornTip'])assert.equal(p[id][1],0);
 for(const side of ['near','far'])assert.equal(plate(side+'EarPlate').points.length,3);
 for(const id of feet)assert.ok(Math.abs(p[id][2])<1e-9);
 assert.equal(compilePackage(rig).validation.status,'passed');
});
test('rhino idle, heavy walk and suspended run have distinct timing, support and loop seams',()=>{
 assert.ok(rig.clips.idle.duration>rig.clips.walk.duration&&rig.clips.walk.duration>rig.clips.run.duration);
 for(const clip of ['idle','walk','run'])assert.deepEqual(rig.clips[clip].frames[0],{...rig.clips[clip].frames.at(-1),t:0});
 for(let i=0;i<=40;i++)assert.ok(core.contactIds(rig,'walk',i/40).length>=2);
 assert.deepEqual(core.contactIds(rig,'run',.83),[]);
 const p=solve(rig,{clip:'run',time:.83});for(const id of feet)assert.ok(p[id][2]>.01);
 assert.ok(Math.abs(rig.clips.walk.frames[30].rotations.nearFrontHip[1])>1);
});
test('horn attack dips, braces, lifts and sweeps without extending the head or horns',()=>{
 const bind=solve(rig,{clip:'bind'}),dip=solve(rig,{clip:'attack',time:.24}),hit=solve(rig,{clip:'attack',time:.64});
 assert.ok(dip.nasalHornTip[2]<bind.nasalHornTip[2]-.15);assert.ok(hit.nasalHornTip[2]>dip.nasalHornTip[2]+.4);
 assert.ok(Math.abs(hit.nasalHornTip[1])>.05);
 assert.equal(rig.clips.attack.events.find(e=>e.name==='impact').t,.64);
 assert.ok(!core.contactIds(rig,'attack',.32).includes('nearFrontPaw'));
 assert.ok(core.contactIds(rig,'attack',.64).includes('nearFrontPaw'));
 for(const f of rig.clips.attack.frames)assert.deepEqual(Object.keys(f.poses),['root']);
 assert.deepEqual(rig.clips.attack.frames[0],{...rig.clips.attack.frames.at(-1),t:0});
});
test('rhino bones and planted support hold through interpolated motion, with no foot penetration',()=>{
 const bind=solve(rig,{clip:'bind'});
 for(const clip of ['idle','walk','run','attack']){
  assert.ok(core.preservedClipLengthsPass(rig,clip),clip);
  for(let i=0;i<=1000;i++){
   const t=i/1000,p=solve(rig,{clip,time:t});
   for(const id of feet)assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id}`);
   for(const id of core.contactIds(rig,clip,t))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} planted`);
   if(clip==='idle')for(const id of feet)p[id].forEach((v,k)=>assert.ok(Math.abs(v-bind[id][k])<1e-8));
   if(clip==='attack')for(const id of feet.filter(id=>id!=='nearFrontPaw'))p[id].forEach((v,k)=>assert.ok(Math.abs(v-bind[id][k])<.0001,`${id} brace`));
   assert.ok(p.tailTip[2]>.05);
  }
 }
});
test('rhino horns, ears and limb roots obey the independent occlusion oracle across the camera matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.16,.24,.32,.54,.64,.83,.95,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(rig,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(rig,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${j.id} token framing`);
 }
 const a=auditRig(rig);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});
