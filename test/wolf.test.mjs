import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadModel,loadModelSource,loadFamily} from '@paper-rig/rigs';
import {solve,core,projectScene} from '@paper-rig/compiler';
import {auditRig} from '@paper-rig/validator/audit';
import {inspectOcclusion} from '@paper-rig/validator/occlusion';
import {validateModelSource,validateSourcePair} from '@paper-rig/validator/source';
const rig=loadModel('wolf'),feet=rig.clips.idle.contacts;

test('wolf has a compact canine head, deep chest, pointed ears and a low articulated brush tail',()=>{
 const p=solve(rig,{clip:'bind'}),plate=id=>rig.plates.find(p=>p.id===id);
 assert.ok(p.head[2]-p.chest[2]<.15);
 assert.ok(plate('shoulderPlate').size[1]>plate('pelvisPlate').size[1]);
 assert.ok(plate('headPlate').size[0]<plate('shoulderPlate').size[0]);
 assert.ok(p.muzzle[0]-p.head[0]>.18);
 assert.ok(p.tailEnd[2]<p.pelvis[2]*.3);
 assert.ok(p.tailEnd[2]>0);
 for(const side of ['near','far'])assert.equal(plate(side+'EarPlate').points.length,3);
 assert.ok(rig.joints.some(j=>j.id==='jaw'&&j.limits[1]===50));
});

test('wolf walk, diagonal trot and suspended run have distinct support and loop seams',()=>{
 assert.ok(rig.clips.walk.duration>rig.clips.trot.duration&&rig.clips.trot.duration>rig.clips.run.duration);
 for(const id of ['idle','walk','trot','run','sprint'])assert.deepEqual(rig.clips[id].frames[0],{...rig.clips[id].frames.at(-1),t:0},id);
 assert.deepEqual(new Set(core.contactIds(rig,'trot',.25)),new Set(['nearFrontPaw','farRearPaw']));
 assert.deepEqual(new Set(core.contactIds(rig,'trot',.75)),new Set(['farFrontPaw','nearRearPaw']));
 assert.ok(rig.clips.sprint.duration<rig.clips.run.duration);
 assert.ok(rig.clips.sprint.contactIntervals[0].to<rig.clips.run.contactIntervals[0].to);
 assert.deepEqual(core.contactIds(rig,'sprint',.8),[]);
 assert.equal(rig.clips.sprint.events.find(e=>e.name==='suspension-apex').t,.8);
 assert.deepEqual(core.contactIds(rig,'run',.83),[]);
 for(const id of feet)assert.ok(solve(rig,{clip:'run',time:.83})[id][2]>.01);
 const bind=solve(rig,{clip:'bind'}),running=solve(rig,{clip:'run',time:.83});
 assert.ok(running.head[2]-running.chest[2]<bind.head[2]-bind.chest[2]);
 assert.ok(running.tailEnd[2]>bind.tailEnd[2]+.2);
});

test('wolf bite opens its jaw before impact, closes during contact and plants all four paws',()=>{
 const c=rig.clips.attack,bind=solve(rig,{clip:'bind'});
 assert.equal(c.frames.find(f=>f.t===.38).rotations.jaw[1],48);
 assert.equal(c.frames.find(f=>f.t===.64).rotations.jaw[1],0);
 const open=solve(rig,{clip:'attack',time:.38}),closed=solve(rig,{clip:'attack',time:.64});
 assert.ok(open.muzzle[2]-open.jawTip[2]>.13);
 assert.ok(closed.muzzle[2]-closed.jawTip[2]<.05);
 assert.ok(solve(rig,{clip:'attack',time:.56}).head[0]>bind.head[0]+.04);
 assert.deepEqual(c.frames[0].poses,c.frames.at(-1).poses);
 assert.deepEqual(c.frames[0].rotations,c.frames.at(-1).rotations);
});

test('wolf clips preserve bones, limits, planted contacts and clearance between authored samples',()=>{
 const joints=new Map(rig.joints.map(j=>[j.id,j])),bind=solve(rig,{clip:'bind'});
 for(const clip of ['idle','walk','trot','run','sprint','attack']){
  assert.ok(core.preservedClipLengthsPass(rig,clip),clip);
  for(const f of rig.clips[clip].frames)for(const[id,rot]of Object.entries(f.rotations||{})){const j=joints.get(id);if(j.limits)assert.ok(rot[1]>=j.limits[0]-1e-8&&rot[1]<=j.limits[1]+1e-8,`${clip}/${id}`);}
  for(let i=0;i<=800;i++){
   const t=i/800,p=solve(rig,{clip,time:t});
   assert.ok(p.tailEnd[2]>.01,`${clip}/tail clearance/${t}`);
   for(const id of feet)assert.ok(p[id][2]>-.0001,`${clip}/${id}/${t}`);
   for(const id of core.contactIds(rig,clip,t))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${id}/${t}`);
   if(clip==='idle'||clip==='attack')for(const id of feet)p[id].forEach((v,k)=>assert.ok(Math.abs(v-bind[id][k])<.0001,`${clip}/${id}/${t}/${k}`));
  }
 }
});

test('wolf passes head/body stacking at diagonal, side and top cameras through the new animations',()=>{
 for(const clip of ['idle','walk','trot','run','sprint','attack'])for(const time of [0,.2,.38,.56,.64,.83,1])for(const elevation of [0,45,90])for(const heading of [0,45,90,135,180,225,270,315]){
  const scene=projectScene(rig,{clip,time,elevation,heading});
  assert.deepEqual(inspectOcclusion(rig,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of scene.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${j.id} inside token`);
 }
 const audit=auditRig(rig);assert.equal(audit.status,'passed',JSON.stringify(audit.issues));
 assert.ok(audit.views.some(v=>v.clipId==='trot'&&v.timeNormalized===.25));
});

test('canine declarations reject invalid jaws, missing controls and competing clip authors',()=>{
 const m=loadModelSource('wolf');m.canineAttack.jawOpenDegrees=70;assert.equal(validateModelSource(m).status,'failed');
 const source=loadModelSource('wolf');source.clips={attack:structuredClone(rig.clips.attack)};assert.equal(validateSourcePair(source,loadFamily('wolf')).status,'failed');
 const family=loadFamily('wolf');family.joints=family.joints.filter(j=>j.id!=='jaw');assert.equal(validateSourcePair(loadModelSource('wolf'),family).status,'failed');
 const limited=loadFamily('wolf');limited.joints.find(j=>j.id==='jaw').limits=[0,20];assert.equal(validateSourcePair(loadModelSource('wolf'),limited).status,'failed');
 const sprint=loadModelSource('wolf');sprint.clips={sprint:structuredClone(rig.clips.sprint)};assert.equal(validateSourcePair(sprint,loadFamily('wolf')).status,'failed');
 const trot=loadModelSource('wolf');trot.groundedQuadruped.trot.pattern='lateral-sequence';assert.equal(validateModelSource(trot).status,'failed');
});
