import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{loadModel}from'@paper-rig/rigs';import{solve,compilePackage,projectScene}from'@paper-rig/compiler';import{validateSourcePair}from'@paper-rig/validator/source';import{motionDiagnostics}from'@paper-rig/validator/audit';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{makeCetaceanFamily}from'../scripts/lib/cetacean-family.mjs';
const reference=JSON.parse(fs.readFileSync('authoring-data/cetacean-motion.json')),samples=Array.from({length:33},(_,i)=>i/32),distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),range=a=>Math.max(...a)-Math.min(...a);
const pitch=(a,b)=>Math.atan2(b[2]-a[2],Math.abs(b[0]-a[0]))*180/Math.PI;
for(const kind of ['dolphin','whale']){
 const rig=loadModel(kind),source=reference.models[kind];
 test(`${kind} has reproducible cetacean anatomy and measured native Swim evidence`,()=>{
  const family=JSON.parse(fs.readFileSync(`rigs/families/${kind}.json`)),model=JSON.parse(fs.readFileSync(`rigs/models/${kind}.json`));assert.deepEqual(family,makeCetaceanFamily(kind,reference));assert.equal(validateSourcePair(model,family).status,'passed');assert.equal(compilePackage(rig).validation.status,'passed');assert.deepEqual(motionDiagnostics(rig).filter(d=>!d.pass),[]);
  assert.deepEqual(source.actions,['Swim']);assert.equal(rig.clips.swim.duration,Math.round(1000*(source.frame_range[1]-source.frame_range[0])/source.fps));
  const p=solve(rig,{clip:'bind'});assert.ok(p.nearFlukeTip[1]-p.farFlukeTip[1]>1);assert.equal(p.nearFlukeTip[2],p.farFlukeTip[2]);assert.ok(p.noseTip[0]>1);assert.ok(!rig.joints.some(j=>/gill|pelvic|analFin/.test(j.id)));
  const dolphin=loadModel('dolphin'),whale=loadModel('whale');assert.ok(whale.joints.find(j=>j.id==='foreBodyFront0').bind[1]>dolphin.joints.find(j=>j.id==='foreBodyFront0').bind[1]);
 });
 test(`${kind} follows native spine/head pitch and moves horizontal flukes vertically`,()=>{
  const poses=samples.map(time=>solve(rig,{clip:'swim',time}));
  const mapping=[['Spine1','body','rearBody'],['Spine2','rearBody','tailBase'],['Spine3','tailBase','tailPeduncle'],['Spine4','tailPeduncle','tailFin'],['Tail','tailFin','tailTip'],['Head','head','headForward']];
  for(const[k,p]of poses.entries()){
   for(const[sourceId,a,b]of mapping)assert.ok(Math.abs(pitch(p[a],p[b])-source.pitch_degrees[sourceId][k*2])<4,`${sourceId}@${samples[k]}`);
   for(const id of ['body','head','rearBody','tailBase','tailPeduncle','tailFin','tailTip'])assert.ok(Math.abs(p[id][1])<1e-8,`${id} must not acquire fish-like lateral sway`);
   assert.ok(Math.abs(p.nearFlukeTip[2]-p.farFlukeTip[2])<1e-7);assert.deepEqual(p.root,[0,0,0]);assert.deepEqual(rig.clips.swim.contacts,[]);
  }
  assert.ok(range(poses.map(p=>p.tailTip[2]))>.40);assert.ok(range(source.pitch_degrees.Tail)>range(source.pitch_degrees.Spine1)*3);
 });
 test(`${kind} keeps rigid geometry, closes loop position/velocity and recovers from its authored surge`,()=>{
  const bind=solve(rig,{clip:'bind'});
  for(const clip of ['idle','swim','fastSwim']){
   const p=solve(rig,{clip,time:0});assert.deepEqual(p,solve(rig,{clip,time:1}));const a=solve(rig,{clip,time:.001}),b=solve(rig,{clip,time:.999});for(const id of ['tailTip','noseTip','nearFlukeTip'])for(let k=0;k<3;k++)assert.ok(Math.abs(a[id][k]-p[id][k]-(p[id][k]-b[id][k]))<.0003,`${clip}/${id} seam`);
  }
  for(const time of [0,1])assert.deepEqual(solve(rig,{clip:'attack',time}),solve(rig,{clip:'idle',time:0}));
  for(const clip of ['swim','fastSwim','attack','ko'])for(const time of samples){const p=solve(rig,{clip,time});for(const j of rig.joints.filter(j=>j.parent))assert.ok(Math.abs(distance(p[j.id],p[j.parent])-distance(bind[j.id],bind[j.parent]))<1e-7,j.id);for(const plate of rig.plates.filter(p=>p.points))for(let i=0;i<plate.points.length;i++){const a=plate.points[i],b=plate.points[(i+1)%plate.points.length];assert.ok(Math.abs(distance(p[a],p[b])-distance(bind[a],bind[b]))<1e-7,plate.id);}if(clip==='swim')assert.deepEqual(p,solve(rig,{clip:'walk',time}));if(clip==='fastSwim')assert.deepEqual(p,solve(rig,{clip:'run',time}));}
 });
 test(`${kind} stays framed and correctly ordered across all directional swimming/action views`,()=>{
  for(const clip of ['swim','fastSwim','attack','ko'])for(const time of [0,.125,.25,.375,.5,.625,.75,.875,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=45){const scene=projectScene(rig,{clip,time,elevation,heading}),context=`${clip}/${time}/${elevation}/${heading}`;assert.deepEqual(inspectOcclusion(rig,scene).violations,[],context);assert.ok(scene.joints.every(j=>j.screenPosition.every(v=>Number.isFinite(v)&&v>.5&&v<99.5)),`${context} framing`);}
 });
}

test('dolphin flukes stay behind the rostrum from the front and in front from the rear throughout swimming',()=>{
 const rig=loadModel('dolphin');
 const order=(r,time,heading)=>{const es=projectScene(r,{clip:'swim',time,elevation:0,heading}).compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated);return ['nearFlukeLowerPlate','rostrumFrontCapPlate'].map(id=>es.findIndex(e=>e.sourceId===id));};
 for(const time of samples){const [f,h]=order(rig,time,180);assert.ok(f<h,`front ${time}: fluke over rostrum`);const [rf,rh]=order(rig,time,0);assert.ok(rf>rh,`rear ${time}: fluke buried behind rostrum`);}
 const broken=structuredClone(rig);for(const p of broken.plates.filter(p=>/Fluke/.test(p.id))){delete p.occlusionMode;delete p.occlusionReference;}assert.ok(samples.some(t=>{const[f,h]=order(broken,t,180);return f>h;}),'mutation reproduces reported overlap');
});
