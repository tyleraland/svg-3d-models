import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('deer'),feet=r.clips.idle.contacts,distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
test('Deer has antlerless proportions, large leaf ears, long articulated legs and a short tail',()=>{
 const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
 assert.deepEqual(r.archetypes,['deer','doe']);assert.ok(!r.joints.some(j=>/antler|horn|mane/i.test(j.id)));
 assert.ok(j('pelvis').bind[2]>1&&p('torsoPlate').size[0]<.5);assert.ok(distance(j('tailTip').bind,[0,0,0])<.18);
 assert.ok(j('muzzle').bind[0]>.2&&p('muzzlePlate').size[0]<.15);assert.ok(j('nearRearHock').bind[0]<0&&j('nearRearKnee').bind[0]>0);
 for(const side of ['near','far']){assert.equal(p(side+'EarPlate').shape,'polygon');assert.ok(p(side+'EarPlate').points.length>=6);assert.ok(j(side+'EarTip').bind[2]>.2);assert.ok(p(side+'EarSpinePlate').size[0]>0);}
 const bind=solve(r,{clip:'bind'});assert.ok(Math.abs(bind.pelvis[2]-bind.chest[2])<.03);assert.ok(bind.head[2]>1.4&&bind.head[2]<1.6);
 for(const heading of [0,90,180,270]){
  const s=projectScene(r,{clip:'idle',time:0,elevation:0,heading}),P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition]));
  for(const side of ['near','far']){const leaf=p(side+'EarPlate'),area=Math.abs(leaf.points.reduce((sum,id,i)=>{const a=P[id],b=P[leaf.points[(i+1)%leaf.points.length]];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;assert.ok(area>6,`${heading}/${side} ear leaf reads in profile and front views`);}
 }
 assert.ok(core.rigidPlateSpanLengthsPass(r));assert.equal(compilePackage(r).validation.status,'passed');
});
test('Deer idle plants all four hooves while breathing and moving the ears',()=>{
 const first=solve(r,{clip:'idle',time:0});let min=1,max=0;
 for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'idle',time:t});assert.deepEqual(core.contactIds(r,'idle',t),feet);for(const id of feet){assert.ok(Math.abs(p[id][2])<2e-8,`${t}/${id}`);assert.ok(distance(p[id],first[id])<2e-8);}min=Math.min(min,p.pelvis[2]);max=Math.max(max,p.pelvis[2]);}
 assert.ok(max-min>.005);assert.ok(Math.max(...r.clips.idle.frames.map(f=>f.rotations.nearEarBase[1]))>1.9);
});
test('Deer walk has four staggered footfalls and the faster run includes suspension',()=>{
 assert.deepEqual(r.clips.walk.events.map(e=>e.t),[0,.25,.5,.75]);assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);assert.deepEqual(core.contactIds(r,'run',.83),[]);
 for(const clip of ['walk','run'])for(const part of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){
  const values=r.clips[clip].frames.map(f=>f.rotations[part]?.[1]||0);assert.ok(Math.max(...values)-Math.min(...values)>8,`${clip}/${part} whole-leg participation`);
 }
});
test('Deer clips preserve lengths, joint limits, support contacts and loop seams between authored keys',()=>{
 for(const clip of ['idle','walk','run','attack']){
  const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const id of feet){assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id} clearance`);if(core.contactIds(r,clip,t).includes(id))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} contact`);}}
 }
 const audit=auditRig(r);assert.equal(audit.status,'passed',JSON.stringify(audit.issues));
});
test('Deer bite reaches with the neck and closes its jaw quickly over a four-hoof brace',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),b=solve(r,{clip:'attack',time:.56}),end=solve(r,{clip:'attack',time:1});
 assert.ok(b.head[0]>a.head[0]+.08);assert.deepEqual(a,end);
 const angle=t=>c.frames.find(f=>f.t===t).rotations.jaw[1];assert.ok(angle(.48)>25&&angle(.56)<3);assert.ok((.56-.48)*c.duration<100);
 for(const t of [0,.2,.38,.48,.56,.64,.8,1]){assert.deepEqual(core.contactIds(r,'attack',t),feet);const p=solve(r,{clip:'attack',time:t});for(const id of feet)assert.ok(distance(p[id],a[id])<2e-6);}
 assert.equal(c.events.find(e=>e.name==='impact').t,.56);assert.ok(c.events.every(e=>e.phase));
});
test('Deer anatomy, ears and jaw stack and frame correctly across the pose/camera matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.15,.25,.38,.48,.56,.64,.75,.83,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
 }
});
test('Deer jaw seam stays buried and a frontmost seam mutation is detected independently',()=>{
 const s=projectScene(r,{clip:'attack',time:.38,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='jawGasket'&&!e.generated));
 const i=g.elements.findIndex(e=>e.sourceId==='jawGasket'&&!e.generated);g.elements.push(...g.elements.splice(i,1));assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-seam-incident-order'));
});
