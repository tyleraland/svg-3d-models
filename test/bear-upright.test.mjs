import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,solvePose,projectScene,core}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('bear'),hind=['nearRearPaw','farRearPaw'],fore=['nearFrontPaw','farFrontPaw'],clips=['idleHind','walkHind','attackHind','standUp','standDown'];
function samePose(a,b,label){for(const id of Object.keys(a.joints)){const A=a.joints[id],B=b.joints[id];for(let i=0;i<3;i++){assert.ok(Math.abs(A.positionMeters[i]-B.positionMeters[i])<1e-8,`${label}/${id}/${i}`);for(let j=0;j<3;j++)assert.ok(Math.abs(A.localToWorldRotation[i][j]-B.localToWorldRotation[i][j])<1e-8,`${label}/${id}/rotation`);}}}

test('upright bear holds its chest and head above its planted hind paws with forepaws in guard',()=>{
 const p=solve(r,{clip:'idleHind',time:0});assert.ok(p.chest[2]>1.5);assert.ok(p.head[2]>2);assert.ok(p.nearFrontPaw[2]>1);
 for(const t of [0,.25,.5,.75,1])assert.deepEqual(new Set(core.contactIds(r,'idleHind',t)),new Set(hind));
 for(const c of ['idleHind','walkHind'])assert.deepEqual(r.clips[c].frames[0],{...r.clips[c].frames.at(-1),t:0});
});

test('up/down transitions and the upright swipe share exact neutral endpoint poses',()=>{
 const neutral=solvePose(r,{clip:'idle',time:0}),standing=solvePose(r,{clip:'idleHind',time:0});
 samePose(solvePose(r,{clip:'standUp',time:0}),neutral,'up begins on all fours');samePose(solvePose(r,{clip:'standUp',time:1}),standing,'up ends upright');
 samePose(solvePose(r,{clip:'standDown',time:0}),standing,'down begins upright');samePose(solvePose(r,{clip:'standDown',time:1}),neutral,'down ends on all fours');
 for(const t of [0,1])samePose(solvePose(r,{clip:'attackHind',time:t}),standing,'upright swipe endpoint');
 for(const t of [.12,.3,.55,.8])samePose(solvePose(r,{clip:'standUp',time:t}),solvePose(r,{clip:'standDown',time:1-t}),'inverse transition');
 assert.deepEqual(new Set(core.contactIds(r,'standUp',.1)),new Set([...fore,...hind]));assert.deepEqual(new Set(core.contactIds(r,'standUp',.2)),new Set(hind));
 assert.deepEqual(new Set(core.contactIds(r,'standDown',.8)),new Set(hind));assert.deepEqual(new Set(core.contactIds(r,'standDown',.9)),new Set([...fore,...hind]));
});

test('hind walking alternates steps, supports the body continuously and swings its forepaws',()=>{
 assert.deepEqual(core.contactIds(r,'walkHind',.3),['nearRearPaw']);assert.deepEqual(core.contactIds(r,'walkHind',.8),['farRearPaw']);
 for(let i=0;i<=100;i++)assert.ok(core.contactIds(r,'walkHind',i/100).length>=1);
 assert.ok(solve(r,{clip:'walkHind',time:.85}).nearRearPaw[2]>.04);
 assert.ok(Math.abs(solve(r,{clip:'walkHind',time:.25}).nearFrontPaw[0]-solve(r,{clip:'walkHind',time:.75}).nearFrontPaw[0])>.1);
});

test('both swipes follow a lifted curved arc with a fast forward stroke and recovery',()=>{
 for(const clip of ['attack','attackHind']){
  const a=solve(r,{clip,time:.32}).nearFrontPaw,b=solve(r,{clip,time:.44}).nearFrontPaw,c=solve(r,{clip,time:.56}).nearFrontPaw;
  assert.ok(b[2]>(a[2]+c[2])/2+.15,`${clip} curved arc`);
  assert.ok(c[0]-a[0]>.35,`${clip} forward rake`);
  assert.ok((.56-.32)*r.clips[clip].duration<260,`${clip} fast stroke`);
  if(clip==='attackHind')assert.deepEqual(new Set(core.contactIds(r,clip,.5)),new Set(hind));
 }
});

test('upright clips preserve bones, grounded supports, claw clearance and level hind soles between keys',()=>{
 const bind=solve(r,{clip:'bind'});
 for(const clip of clips){
  assert.ok(core.preservedClipLengthsPass(r,clip),clip);
  for(let i=0;i<=1000;i++){
   const t=i/1000,p=solve(r,{clip,time:t});
   for(const id of [...fore,...hind])assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id} clearance`);
   for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} contact`);
   if(clip!=='walkHind')for(const id of hind)p[id].forEach((v,k)=>assert.ok(Math.abs(v-bind[id][k])<.0001,`${clip}/${id} planted`));
   for(const side of ['near','far'])for(const d of [1,2,3])assert.ok(p[side+`FrontClaw${d}Tip`][2]>-.0001,`${clip}/${t} claws`);
   const pose=solvePose(r,{clip,time:t});for(const id of hind)assert.ok(Math.abs(pose.joints[id].localToWorldRotation[2][0])<1e-8,`${clip} sole`);
  }
 }
});

test('upright postures and transitions retain camera stacking and token framing from all sides',()=>{
 for(const clip of clips)for(const time of [0,.12,.16,.32,.44,.56,.68,.84,.9,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const scene=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of scene.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${j.id} framing`);
 }
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));for(const clip of clips)assert.ok(a.views.some(v=>v.clipId===clip),`${clip} audited`);
});

 test('bear near arm remains exposed throughout upright motion at the reported oblique camera',()=>{
 for(const clip of ['idleHind','walkHind','attackHind'])for(let i=0;i<=40;i++){
  const scene=projectScene(r,{clip,time:i/40,elevation:45,heading:225});
  const near=scene.compositingGroups.find(g=>g.id==='cameraNearAppendagesGroup');
  for(const id of ['nearFrontUpperPlate','nearFrontLowerPlate','nearFrontPawPlate'])assert.ok(near.elements.some(e=>e.id===id),`${clip}/${i}/${id} exposed`);
 }
});
