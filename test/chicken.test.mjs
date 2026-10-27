import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadModel} from '@paper-rig/rigs';
import {solve,core,projectScene,compilePackage} from '@paper-rig/compiler';
import {inspectOcclusion} from '@paper-rig/validator/occlusion';
const rig=loadModel('walkingBird');
test('chicken proportions have a small head, compact folded wings, raised tail and short articulated legs',()=>{
 const j=id=>rig.joints.find(j=>j.id===id),p=id=>rig.plates.find(p=>p.id===id);
 assert.deepEqual(rig.archetypes,['chicken']);assert.ok(p('headPlate').size[0]<p('bodyPlate').size[0]*.4);assert.ok(j('tailTip').bind[2]>.2);
 assert.ok(Math.abs(j('nearKnee').bind[2])<.15);assert.ok(j('nearFoot').bind[0]<0);assert.ok(j('nearToeOuter'));assert.ok(p('combPlate'));assert.equal(compilePackage(rig).validation.status,'passed');
});
test('chicken gait preserves bones, loops exactly and plants declared feet throughout interpolated frames',()=>{
 for(const clip of ['idle','walk','run','attack']){
  assert.ok(core.preservedClipLengthsPass(rig,clip),clip);
  const c=rig.clips[clip];if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=0;i<=1000;i++){
   const t=i/1000,p=solve(rig,{clip,time:t});
   for(const side of ['near','far']){const id=side+'Toe';assert.ok(p[id][2]>-.00002,`${clip}/${t} clearance`);if(core.contactIds(rig,clip,t).includes(id))assert.ok(Math.abs(p[id][2])<.00002,`${clip}/${t} contact`);}
  }
 }
 assert.ok(rig.clips.run.duration<rig.clips.walk.duration*.5);
 assert.deepEqual(core.contactIds(rig,'run',.48),[]);
 assert.ok(Math.max(...rig.clips.walk.frames.map(f=>f.rotations.nearHip[1]))-Math.min(...rig.clips.walk.frames.map(f=>f.rotations.nearHip[1]))>15);
});
test('planted peck rapidly lowers the head by angular neck and chest articulation and recovers',()=>{
 const a=solve(rig,{clip:'attack',time:0}),b=solve(rig,{clip:'attack',time:.60}),c=solve(rig,{clip:'attack',time:1});
 assert.ok(b.head[2]<a.head[2]-.35);for(const id of ['nearToe','farToe'])assert.deepEqual(a[id],b[id]);assert.deepEqual(a,c);
 assert.ok((.60-.38)*rig.clips.attack.duration<250);
 for(const f of rig.clips.attack.frames)assert.deepEqual(Object.keys(f.poses),['root']);
});
test('chicken stacking and framing stay valid across all headings, elevations and motion phases',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.14,.25,.38,.48,.60,.75,.9,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(rig,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(rig,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
 }
});
