import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{loadModel}from'@paper-rig/rigs';import{solve,compilePackage,projectScene}from'@paper-rig/compiler';import{validateSourcePair}from'@paper-rig/validator/source';import{motionDiagnostics}from'@paper-rig/validator/audit';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{makeJellyfishFamily}from'../scripts/lib/jellyfish-family.mjs';
const reference=JSON.parse(fs.readFileSync('authoring-data/jellyfish-motion.json')),source=reference.models.jellyfish,rig=loadModel('jellyfish'),chains=Object.entries(reference.adaptation.chainMap),samples=Array.from({length:33},(_,i)=>i/32),distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),range=a=>Math.max(...a)-Math.min(...a);
const angles={nearFront:22.5,nearSide:67.5,nearRear:112.5,nearBack:157.5,farFront:-22.5,farSide:-67.5,farRear:-112.5,farBack:-157.5};
const radialAngle=(a,b,az)=>Math.atan2((b[0]-a[0])*Math.cos(az*Math.PI/180)+(b[1]-a[1])*Math.sin(az*Math.PI/180),a[2]-b[2])*180/Math.PI;
test('Jellyfish has reproducible medusa geometry and distinguishes native chain motion from an authored bell pulse',()=>{
 const family=JSON.parse(fs.readFileSync('rigs/families/jellyfish.json')),model=JSON.parse(fs.readFileSync('rigs/models/jellyfish.json'));assert.deepEqual(family,makeJellyfishFamily(reference));assert.equal(validateSourcePair(model,family).status,'passed');assert.equal(compilePackage(rig).validation.status,'passed');assert.deepEqual(motionDiagnostics(rig).filter(d=>!d.pass),[]);
 assert.equal(chains.length,8);assert.equal(rig.joints.filter(j=>/Filament[0-3]$/.test(j.id)).length,32);assert.equal(rig.joints.filter(j=>/^oralArm\dSegment\d$/.test(j.id)).length,12);
 assert.ok(!rig.joints.some(j=>/eye|gem|beak|jaw|pincer|foot|wing/i.test(j.id)));assert.equal(source.actions.some(a=>/swim/i.test(a.name)),false);assert.equal(reference.static_comparison.animation_count,0);assert.equal(rig.clips.swim.duration,source.clips.walk.duration_ms);assert.equal(rig.clips.fastSwim.duration,source.clips.run.duration_ms);
 const widths=source.clips.walk.samples.map(s=>s.bell_bounds.max[0]-s.bell_bounds.min[0]);assert.ok(range(widths)<.01,'source bell stays nearly rigid; the paper bell pulse is authored');
});
test('Jellyfish bell contracts while canopy edges overlap, and marginal chains follow independent source curls and bob',()=>{
 const poses=samples.map(time=>solve(rig,{clip:'swim',time}));const radii=poses.map(p=>Math.hypot(p.nearFrontBellRim[0]-p.body[0],p.nearFrontBellRim[1]-p.body[1]));assert.ok(range(radii)>.17,'pulse must visibly narrow and reopen the bell');
 for(const p of poses)for(const[name]of chains){const az=angles[name];for(const[i,sign]of [[0,-1],[1,1]]){const id=name+'Upper3'+i,theta=Math.atan2(p[id][1]-p.body[1],p[id][0]-p.body[0])*180/Math.PI;const relative=((theta-az+540)%360)-180;assert.ok(sign*relative>=22.5,'adjacent canopy sectors must keep overlap through contraction');}assert.ok(Math.abs(p.crown[2]-p.body[2]-.1)<1e-7);}
 const phaseDiff=[];
 for(const[clip,key]of [['idle','idle'],['swim','walk'],['fastSwim','run']])for(const[k,t]of samples.entries()){
  const p=solve(rig,{clip,time:t});for(const[name,src]of chains)for(let i=0;i<4;i++){const expected=.65*source.clips[key].samples[k*2].chains[src].radial_pitch_degrees[i],actual=radialAngle(p[name+'Filament'+i],p[name+(i===3?'FilamentTip':'Filament'+(i+1))],angles[name]);assert.ok(Math.abs(actual-expected)<2.5,`${clip}/${name}/${i}@${t}: ${actual} vs ${expected}`);}
  const native=source.clips[key].samples[k*2].waist[2]-source.clips[key].samples[0].waist[2];assert.ok(Math.abs(p.root[2]-native*.5)<.005);assert.deepEqual(rig.clips[clip].contacts,[]);if(clip==='swim')phaseDiff.push(p.nearFrontFilamentTip[0]-p.nearSideFilamentTip[0]);
 }
 assert.ok(range(phaseDiff)>.08,'appendages must not move as one rigid synchronized skirt');
});
test('Jellyfish preserves plates and bone lengths, closes loop velocity and returns from its pulse burst',()=>{
 const bind=solve(rig,{clip:'bind'});
 for(const clip of ['idle','swim','fastSwim']){const p=solve(rig,{clip,time:0});assert.deepEqual(p,solve(rig,{clip,time:1}));const a=solve(rig,{clip,time:.001}),b=solve(rig,{clip,time:.999});for(const id of ['nearFrontBellRim','nearFrontFilamentTip','oralArm0Tip'])for(let k=0;k<3;k++)assert.ok(Math.abs(a[id][k]-p[id][k]-(p[id][k]-b[id][k]))<.0004,`${clip}/${id} seam`);}
 for(const time of [0,1])assert.deepEqual(solve(rig,{clip:'attack',time}),solve(rig,{clip:'idle',time:0}));
 for(const clip of ['swim','fastSwim','attack','ko'])for(const time of samples){const p=solve(rig,{clip,time});for(const j of rig.joints.filter(j=>j.parent))assert.ok(Math.abs(distance(p[j.id],p[j.parent])-distance(bind[j.id],bind[j.parent]))<1e-7,j.id);for(const plate of rig.plates.filter(p=>p.points))for(let i=0;i<plate.points.length;i++){const a=plate.points[i],b=plate.points[(i+1)%plate.points.length];assert.ok(Math.abs(distance(p[a],p[b])-distance(bind[a],bind[b]))<1e-7,plate.id);}if(clip==='swim')assert.deepEqual(p,solve(rig,{clip:'walk',time}));if(clip==='fastSwim')assert.deepEqual(p,solve(rig,{clip:'run',time}));}
});
test('Jellyfish stays framed and correctly ordered through its full bell pulse across the directional matrix',()=>{
 for(const clip of ['swim','fastSwim','attack','ko'])for(const time of [0,.125,.25,.375,.5,.625,.75,.875,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=45){const scene=projectScene(rig,{clip,time,elevation,heading}),context=`${clip}/${time}/${elevation}/${heading}`;assert.deepEqual(inspectOcclusion(rig,scene).violations,[],context);assert.ok(scene.joints.every(j=>j.screenPosition.every(v=>Number.isFinite(v)&&v>.5&&v<99.5)),`${context} framing`);}
});
