import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{loadModel}from'@paper-rig/rigs';import{solve,projectScene,compilePackage,core}from'@paper-rig/compiler';import{validateSourcePair}from'@paper-rig/validator/source';import{motionDiagnostics}from'@paper-rig/validator/audit';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{makeSegmentedCrawlerFamily}from'../scripts/lib/segmented-crawler-family.mjs';
const reference=JSON.parse(fs.readFileSync('authoring-data/segmented-crawler-motion.json')),dist=(a,b)=>Math.hypot(...a.map((x,k)=>x-b[k])),range=a=>Math.max(...a)-Math.min(...a);
for(const kind of ['centipede','segmentedCrawler']){
 const r=loadModel(kind),broad=kind==='segmentedCrawler',feet=r.joints.filter(j=>/Leg\d+Foot$/.test(j.id)).map(j=>j.id),bind=solve(r,{clip:'bind'});
 test(`${kind} has distinct grounded many-legged anatomy and reproducible reference evidence`,()=>{
  const family=JSON.parse(fs.readFileSync(`rigs/families/${kind}.json`)),model=JSON.parse(fs.readFileSync(`rigs/models/${kind}.json`));assert.deepEqual(family,makeSegmentedCrawlerFamily(kind,reference));assert.equal(validateSourcePair(model,family).status,'passed');const pkg=compilePackage(r);assert.equal(pkg.validation.status,'passed');assert.deepEqual(motionDiagnostics(r).filter(d=>!d.pass),[]);
  assert.equal(feet.length,24);assert.equal(r.joints.filter(j=>/^segment\d+$/.test(j.id)).length,broad?6:12);assert.equal(r.clips.walk.duration,broad?2440:900);assert.equal(r.clips.run.duration,broad?1240:600);assert.equal(reference.centipede.measured_stride_cycles.walk,3);assert.equal(reference.centipede.measured_stride_cycles.run,3);
  for(const id of feet){assert.ok(Math.abs(bind[id][2])<1e-8);assert.ok(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters)<1e-9);}
  for(const hip of r.joints.filter(j=>/Leg\d+Hip$/.test(j.id))){const index=Number(hip.parent.slice(7))-1,taper=broad?1-.12*index/5:1-.18*index/11,x=Math.abs(hip.bind[0]),w=(broad?.31*taper*(1-.17*x/.155):.125*taper*.955),h=broad?.20*(1-.20*x/.155):.065*.95;assert.ok(Math.abs(hip.bind[1])/w+Math.abs(hip.bind[2])/(Math.sqrt(3)*h)<1,'leg root must enter its actual hexagonal shell');}
  assert.equal(r.joints.some(j=>j.id==='nearTerminalLeg'),!broad);if(broad)assert.equal(r.joints.filter(j=>j.id.endsWith('Hip')&&j.parent==='segment01').length,4);
 });
 test(`${kind} carries a supported traveling leg wave with grounded stance, lifted swing and the intended left/right coordination`,()=>{
  const heights=[],near=[],far=[];let minimum=24,maxError=0,minLimb=Infinity;
  for(let i=0;i<=1440;i++){const t=i/1440,p=solve(r,{clip:'walk',time:t}),contacts=core.contactIds(r,'walk',t);minimum=Math.min(minimum,contacts.length);for(const id of feet){minLimb=Math.min(minLimb,p[id][2]);if(contacts.includes(id))maxError=Math.max(maxError,Math.abs(p[id][2]));}heights.push(p.nearLeg01Foot[2]);near.push(p.nearLeg01Foot[2]);far.push(p.farLeg01Foot[2]);const stance=contacts.map(id=>p[id]);assert.ok(Math.min(...stance.map(p=>p[0]))<0&&Math.max(...stance.map(p=>p[0]))>0,'support spans the trunk');assert.ok(stance.some(p=>p[1]>0)&&stance.some(p=>p[1]<0));}
  assert.ok(minimum>=12);assert.ok(maxError<.00001,`stance interpolation error ${maxError}`);assert.ok(minLimb>-.00001,`toe penetration ${minLimb}`);assert.ok(Math.max(...heights)>(broad?.021:.049));
  let peaks=0;for(let i=1;i<heights.length-1;i++)if(heights[i]>heights[i-1]&&heights[i]>=heights[i+1]&&heights[i]>(broad?.015:.04))peaks++;assert.equal(peaks,broad?1:3);
  const difference=Math.max(...near.map((v,i)=>Math.abs(v-far[i])));assert.ok(broad?difference<1e-6:difference>.035,'paired crawler steps and opposite centipede steps must differ');
  if(!broad){const peak=heights.indexOf(Math.max(...heights))/1440;const sourcePeak=reference.centipede.phase_peaks.walk.L01.lift_peak_phase;assert.ok(Math.min(...[-2,-1,0,1,2].map(k=>Math.abs(peak+k/3-sourcePeak)))<.02,'first support wave retains native lift phase');}
 });
 test(`${kind} keeps all feet fixed during idle/bracing/KO and preserves bone lengths during locomotion`,()=>{
  for(const clip of ['idle','attack','ko'])for(let i=0;i<=160;i++){const p=solve(r,{clip,time:i/160});for(const id of feet)assert.ok(dist(p[id],bind[id])<.00001,`${clip}/${id} support drift`);}
  for(const clip of ['walk','run'])for(let i=0;i<=480;i++){const t=i/480,p=solve(r,{clip,time:t});for(const id of feet){assert.ok(p[id][2]>-.00001,`${clip}/${id} below ground`);if(core.contactIds(r,clip,t).includes(id))assert.ok(Math.abs(p[id][2])<.00001);}for(const j of r.joints.filter(j=>!j.helper&&j.parent))assert.ok(Math.abs(dist(p[j.id],p[j.parent])-dist(bind[j.id],bind[j.parent]))<1e-7,j.id);}
  for(const clip of ['idle','walk','run']){assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});const a=solve(r,{clip,time:0}),b=solve(r,{clip,time:1});for(const id of Object.keys(a))assert.ok(dist(a[id],b[id])<1e-8,`${clip}/${id} loop closure`);}
  for(const time of [0,1]){const a=solve(r,{clip:'attack',time}),b=solve(r,{clip:'idle',time:0});for(const id of Object.keys(a))assert.ok(dist(a[id],b[id])<1e-8,`${id} action recovery`);}
  assert.ok(solve(r,{clip:'ko',time:1}).head[2]<bind.head[2]-.035);
 });
 test(`${kind} has rigid leg/shell faces and remains framed and correctly ordered through the directional motion matrix`,()=>{
  for(const clip of ['walk','run','attack','ko'])for(const time of [0,.125,.25,.375,.5,.625,.75,.875,1]){
   const p=solve(r,{clip,time});for(const plate of r.plates.filter(p=>p.points))for(let i=0;i<plate.points.length;i++){const a=plate.points[i],b=plate.points[(i+1)%plate.points.length];assert.ok(Math.abs(dist(p[a],p[b])-dist(bind[a],bind[b]))<1e-7,plate.id);}
   for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=45){const scene=projectScene(r,{clip,time,elevation,heading}),context=`${clip}/${time}/${elevation}/${heading}`;assert.deepEqual(inspectOcclusion(r,scene).violations,[],context);assert.ok(scene.joints.every(j=>j.screenPosition.every(v=>Number.isFinite(v)&&v>.5&&v<99.5)),`${context} framing`);}
  }
 });
}
test('Many-legged far upper legs use body occlusion; a head-parent mutation exposes the regression',()=>{
 for(const kind of ['centipede','segmentedCrawler']){const rig=loadModel(kind),group=r=>projectScene(r,{clip:'walk',time:.25,elevation:60,heading:270}).compositingGroups.find(g=>g.elements.some(e=>!e.generated&&e.sourceId==='farLeg06UpperFacet0Plate'))?.id;assert.equal(group(rig),'cameraFarAppendagesGroup');const bad=structuredClone(rig);bad.joints.find(j=>j.id==='segment01').parent='head';assert.notEqual(group(bad),'cameraFarAppendagesGroup');}
});
