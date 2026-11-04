import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {solve,compilePackage,projectScene} from '@paper-rig/compiler';
import {validateSourcePair} from '@paper-rig/validator/source';
import {motionDiagnostics} from '@paper-rig/validator/audit';
import {inspectOcclusion} from '@paper-rig/validator/occlusion';
import {makeOctopusFamily} from '../scripts/lib/octopus-family.mjs';
const reference=JSON.parse(fs.readFileSync('authoring-data/octopus-motion.json')),rig=loadModel('octopus');
const arms=Object.entries(reference.adaptation.armMap),distance=(a,b)=>Math.hypot(...a.map((x,k)=>x-b[k]));
const samples=Array.from({length:33},(_,i)=>i/32);
const pitch=(a,b)=>Math.atan2(b[2]-a[2],Math.hypot(b[0]-a[0],b[1]-a[1]))*180/Math.PI;
test('Octopus resolves reproducibly with eight distinct four-section arms and honest native-clip evidence',()=>{
 const family=JSON.parse(fs.readFileSync('rigs/families/octopus.json')),model=JSON.parse(fs.readFileSync('rigs/models/octopus.json'));
 assert.deepEqual(family,makeOctopusFamily(reference));assert.equal(validateSourcePair(model,family).status,'passed');
 assert.equal(compilePackage(rig).validation.status,'passed');assert.deepEqual(motionDiagnostics(rig).filter(d=>!d.pass),[]);
 assert.equal(arms.length,8);assert.equal(rig.joints.filter(j=>/Segment\d$/.test(j.id)).length,32);
 assert.equal(reference.actions.some(a=>/swim/i.test(a.name)),false);
 assert.equal(rig.clips.swim.duration,reference.clips.walk.duration_ms);
 assert.equal(rig.clips.fastSwim.duration,reference.clips.run.duration_ms);
 const bind=solve(rig,{clip:'bind'}),tips=arms.map(([name])=>bind[name+'Tip']);
 for(let i=0;i<tips.length;i++)for(let j=0;j<i;j++)assert.ok(distance(tips[i],tips[j])>.7,'bind arms must already fan radially, without clip-only mounting rotations');
 assert.ok(bind.crown[2]-bind.body[2]>.9);
 for(const side of ['near','far'])assert.ok(distance(bind[side+'Eye'],bind.body)<.4,'eyes must remain embedded in the head/body surface');
 assert.ok(!rig.joints.some(j=>/wing|cannon|jaw|foot/i.test(j.id)));
});
test('Octopus arm bends track the separate native arm patterns without a synchronous umbrella flap',()=>{
 const traces=[];
 for(const [clip,key,gain]of [['swim','walk',.75],['fastSwim','run',.75],['idle','idle',.8]]){
  for(const [k,t]of samples.entries()){
   const p=solve(rig,{clip,time:t});
   for(const [name,source]of arms)for(let i=0;i<4;i++){
    const a=reference.clips[key].samples[k*2].arms[source].angles,expected=gain*a[i===3?a.length-1:i].pitch-10;
    const actual=pitch(p[name+'Segment'+i],p[name+(i===3?'Tip':'Segment'+(i+1))]);
    assert.ok(Math.abs(actual-expected)<2.5,`${clip}/${name}/${i}@${t}: ${actual} vs ${expected}`);
   }
   assert.deepEqual(p.body.slice(0,2),[0,0]);assert.deepEqual(rig.clips[clip].contacts,[]);
   if(clip==='swim')traces.push(p.nearFrontTip[2]-p.farFrontTip[2]);
  }
 }
 assert.ok(Math.max(...traces)-Math.min(...traces)>.20,'left and right arms need independent curl phases');
 const p=samples.map(time=>solve(rig,{clip:'swim',time}));
 assert.ok(Math.max(...p.map(p=>p.nearSideTip[2]))-Math.min(...p.map(p=>p.nearSideTip[2]))>.4);
});
test('Octopus preserves rigid segments, closed loop velocity, and attack entry and recovery',()=>{
 const bind=solve(rig,{clip:'bind'});
 for(const clip of ['idle','swim','fastSwim']){
  const p=solve(rig,{clip,time:0});assert.deepEqual(p,solve(rig,{clip,time:1}));
  const a=solve(rig,{clip,time:.001}),b=solve(rig,{clip,time:.999});
  for(const [name]of arms)for(let k=0;k<3;k++)assert.ok(Math.abs(a[name+'Tip'][k]-p[name+'Tip'][k]-(p[name+'Tip'][k]-b[name+'Tip'][k]))<.0003,`${clip}/${name} seam`);
 }
 for(const time of [0,1])assert.deepEqual(solve(rig,{clip:'attack',time}),solve(rig,{clip:'idle',time:0}));
 assert.ok(distance(solve(rig,{clip:'attack',time:.52}).farFrontTip,solve(rig,{clip:'idle',time:0}).farFrontTip)>.1);
 for(const clip of ['swim','fastSwim','attack','ko'])for(const time of samples){
  const p=solve(rig,{clip,time});
  for(const j of rig.joints.filter(j=>j.parent))assert.ok(Math.abs(distance(p[j.id],p[j.parent])-distance(bind[j.id],bind[j.parent]))<1e-7,j.id);
  for(const plate of rig.plates.filter(p=>p.points))for(let i=0;i<plate.points.length;i++){
   const a=plate.points[i],b=plate.points[(i+1)%plate.points.length];assert.ok(Math.abs(distance(p[a],p[b])-distance(bind[a],bind[b]))<1e-7,plate.id);
  }
  if(clip==='swim')assert.deepEqual(p,solve(rig,{clip:'walk',time}));
  if(clip==='fastSwim')assert.deepEqual(p,solve(rig,{clip:'run',time}));
 }
});
test('Octopus keeps eight-arm geometry framed and correctly ordered over the directional motion matrix',()=>{
 for(const clip of ['swim','fastSwim','attack','ko'])for(const time of [0,.125,.25,.375,.5,.625,.75,.875,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=45){
  const scene=projectScene(rig,{clip,time,elevation,heading}),context=`${clip}/${time}/${elevation}/${heading}`;
  assert.deepEqual(inspectOcclusion(rig,scene).violations,[],context);
  assert.ok(scene.joints.every(j=>j.screenPosition.every(v=>Number.isFinite(v)&&v>.5&&v<99.5)),`${context} framing`);
 }
});
