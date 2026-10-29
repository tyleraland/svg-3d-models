import{test}from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{loadModel,loadFamily}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
import{bakeAvianMotion}from'../scripts/lib/avian-motion.mjs';
const r=loadModel('crow'),eagle=loadModel('flyingBird'),distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
test('Crow has its own slimmer body, straight bill, long narrow tail and shared articulated avian structure',()=>{
 const j=(rig,id)=>rig.joints.find(j=>j.id===id),p=(rig,id)=>rig.plates.find(p=>p.id===id),normalized=(rig,id)=>Math.hypot(...j(rig,id).bind)/p(rig,'bodyPlate').size[0];
 assert.equal(r.id,'crowBase');assert.deepEqual(r.archetypes,['crow']);assert.equal(r.family,eagle.family);
 assert.ok(normalized(r,'beak')>normalized(eagle,'beak')*1.7);
 assert.ok(normalized(r,'tailFan4')>normalized(eagle,'tailFan4')*1.8);
 assert.ok(Math.abs(j(r,'tailFan1').bind[1]/j(r,'tailFan1').bind[0])<.3);
 assert.ok(Math.abs(j(r,'beakHook').bind[2])<.003);
 assert.ok(Math.abs(j(r,'nearWingElbowTrailing').bind[0])/Math.hypot(...j(r,'nearWingWrist').bind)<Math.abs(j(eagle,'nearWingElbowTrailing').bind[0])/Math.hypot(...j(eagle,'nearWingWrist').bind));
 for(const side of ['near','far'])for(const part of ['LegHip','LegKnee','LegAnkle','Talon','InnerToe','MiddleToe','OuterToe','Hallux'])assert.ok(j(r,side+part));
 assert.equal(p(r,'tailQuillPlate').shape,'taperedBone');assert.equal(compilePackage(r).validation.status,'passed');
 assert.deepEqual(eagle,JSON.parse(readFileSync(new URL('../fixtures/rigs/flyingBird.json',import.meta.url))),'Eagle output is unchanged');
});
test('Crow ground clips preserve plants, clearance, rigid bones, smooth hip rotations and loop seams',()=>{
 for(const clip of ['idle','walk','run','hop']){
  const c=r.clips[clip],first=solve(r,{clip,time:0});assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});assert.ok(core.preservedClipLengthsPass(r,clip));
  for(let i=1;i<c.frames.length;i++)for(const side of ['near','far'])for(let k=0;k<3;k++)assert.ok(Math.abs(c.frames[i].rotations[side+'LegHip'][k]-c.frames[i-1].rotations[side+'LegHip'][k])<10,`${clip}/${i} Euler continuity`);
  for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const side of ['near','far']){
   const foot=side+'Talon';assert.ok(p[foot][2]>-2e-6,`${clip}/${t} clearance`);
   if(core.contactIds(r,clip,t).includes(foot)){assert.ok(Math.abs(p[foot][2])<2e-6,`${clip}/${t} plant`);assert.ok(Math.abs(p[foot][1]-first[foot][1])<2e-6,`${clip}/${t} lateral plant`);}
   if(clip==='idle')assert.ok(distance(p[foot],first[foot])<2e-6,'idle holds both feet fixed');
  }}
 }
 assert.deepEqual(core.contactIds(r,'walk',.3),['nearTalon']);assert.deepEqual(core.contactIds(r,'walk',.8),['farTalon']);
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.7);assert.deepEqual(core.contactIds(r,'run',.46),[]);
 for(const part of ['Hip','Knee','Ankle'])assert.ok(Math.abs(r.clips.run.frames[0].rotations['nearLeg'+part][1]-r.clips.run.frames.find(f=>f.t===.25).rotations['nearLeg'+part][1])>5);
});
test('Crow hop uses paired support, a wing assist in suspension and exact folded-wing recovery',()=>{
 for(const t of [0,.15,.8,1])assert.deepEqual(new Set(core.contactIds(r,'hop',t)),new Set(['nearTalon','farTalon']));
 for(const t of [.2,.48,.75])assert.deepEqual(core.contactIds(r,'hop',t),[]);
 const start=r.clips.hop.frames[0],apex=r.clips.hop.frames.find(f=>f.t===.48);
 assert.ok(apex.rotations.nearWingRoot[1]<start.rotations.nearWingRoot[1]-30);
 assert.ok(solve(r,{clip:'hop',time:.48}).nearTalon[2]>.08);
});
test('Crow flight is symmetric, articulated and airborne; peck is a quick angular jab over a continuous wingbeat',()=>{
 for(const clip of ['fly','glide','attack']){
  assert.ok(core.preservedClipLengthsPass(r,clip));
  for(let i=0;i<=240;i++){const t=i/240,p=solve(r,{clip,time:t});assert.deepEqual(core.contactIds(r,clip,t),[]);
   for(const part of ['Root','Elbow','Wrist','Tip']){const a=p['nearWing'+part],b=p['farWing'+part];assert.ok(Math.abs(a[0]-b[0])<1e-8&&Math.abs(a[2]-b[2])<1e-8&&Math.abs(a[1]+b[1])<1e-8);}
   assert.ok(Math.min(...Object.values(p).map(v=>v[2]))>=0);
  }
 }
 for(const clip of ['fly','glide'])assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});
 const a=solve(r,{clip:'fly',time:0}),b=solve(r,{clip:'fly',time:.42});assert.ok(a.nearWingTip[2]-b.nearWingTip[2]>.5);
 const attack=r.clips.attack.frames,flight=r.clips.fly.frames;
 for(let i=0;i<attack.length;i++){
  assert.deepEqual(attack[i].poses,flight[i].poses);
  for(const side of ['near','far'])for(const part of ['Root','Elbow','Wrist'])assert.deepEqual(attack[i].rotations[side+'Wing'+part],flight[i].rotations[side+'Wing'+part]);
 }
 const delta=t=>attack.find(f=>f.t===t).rotations.neck[1]-flight.find(f=>f.t===t).rotations.neck[1];
 assert.ok(delta(.62)-delta(.56)>65);assert.ok((.62-.56)*r.clips.attack.duration<80);
});
test('Crow stacking and framing hold across all critical clips, poses and camera angles',()=>{
 for(const clip of ['idle','walk','run','hop','fly','glide','attack'])for(const time of [0,.15,.3,.42,.48,.54,.56,.62,.66,.8,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const scene=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of scene.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
 }
 const audit=auditRig(r);assert.equal(audit.status,'passed',JSON.stringify(audit.issues));
});
test('Crow bill seam remains buried and the independent oracle catches a frontmost-gasket mutation',()=>{
 const scene=projectScene(r,{clip:'attack',time:.62,elevation:45,heading:135}),group=scene.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='beakGasket'&&!e.generated));
 const index=group.elements.findIndex(e=>e.sourceId==='beakGasket'&&!e.generated);group.elements.push(...group.elements.splice(index,1));
 assert.ok(inspectOcclusion(r,scene).violations.some(v=>v.kind==='head-seam-incident-order'));
});
test('shared avian baker is pure and its Eagle defaults preserve the golden clips',()=>{
 const family=loadFamily('flyingBird'),before=JSON.stringify(family),a=bakeAvianMotion(family),b=bakeAvianMotion(family);
 assert.equal(JSON.stringify(family),before);assert.deepEqual(a,b);
 for(const id of ['idleA','walkA','fly','glide'])assert.deepEqual(a.familyClips[id],family.clips[id]);
 assert.deepEqual(a.modelClips.attack,eagle.clips.attack);
});
