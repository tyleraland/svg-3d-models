import{test}from'node:test';import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';import{solve,solvePose,core,projectScene,compilePackage}from'@paper-rig/compiler';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('crab'),feet=['left','right'].flatMap(s=>[1,2,3,4].map(i=>s+'Leg'+i+'Foot')),clips=['idle','walk','run','sidewalk','siderun','attack'];
test('crab has a broad shell, fanned ground contacts, eye stalks and an explicitly larger right pincer',()=>{
 const p=solve(r,{clip:'bind'}),shell=r.plates.find(p=>p.id==='shellCapPlate');assert.ok(shell.size[0]>shell.size[1]*1.4);
 for(const id of feet){assert.ok(Math.abs(p[id][2])<1e-10);assert.ok(p[id.replace('Foot','Knee')][2]>p.body[2]);}
 assert.ok(p.leftLeg1Foot[0]>p.leftLeg4Foot[0]+.8);for(const s of ['left','right'])assert.ok(p[s+'EyeTip'][2]>p.head[2]+.1);
 const size=s=>r.plates.find(p=>p.id===s+'ClawPlate').size;assert.ok(size('right')[0]>size('left')[0]*1.4);assert.equal(compilePackage(r).validation.status,'passed');
});
test('crab forward and sideways gaits coordinate alternating tetrapods and distinct travel axes',()=>{
 for(const clip of ['walk','run','sidewalk','siderun']){
  const a=core.contactIds(r,clip,.25),b=core.contactIds(r,clip,.75);assert.equal(a.length,4);assert.equal(b.length,4);assert.equal(new Set([...a,...b]).size,8);
  for(let i=0;i<=500;i++)assert.ok(core.contactIds(r,clip,i/500).length>=4);
  const axis=clip.startsWith('side')?1:0,other=1-axis,p=solve(r,{clip,time:0}),q=solve(r,{clip,time:.3});
  assert.ok(Math.abs(p.leftLeg1Foot[axis]-q.leftLeg1Foot[axis])>.03);assert.ok(Math.abs(p.leftLeg1Foot[other]-q.leftLeg1Foot[other])<1e-7);
  const u=solvePose(r,{clip,time:.2}),v=solvePose(r,{clip,time:.7});for(const id of ['leftLeg1Hip','leftLeg1Knee'])assert.notDeepEqual(u.joints[id].localToWorldRotation,v.joints[id].localToWorldRotation);
 }
 assert.ok(r.clips.run.duration<r.clips.walk.duration);assert.ok(r.clips.siderun.duration<r.clips.sidewalk.duration);
});
test('crab attack arcs its major claw, snaps its pincer suddenly, braces eight feet and returns to neutral',()=>{
 const start=solve(r,{clip:'attack',time:0}),windup=solve(r,{clip:'attack',time:.28}),impact=solve(r,{clip:'attack',time:.43});assert.ok(windup.rightClaw[2]>start.rightClaw[2]+.13);assert.ok(impact.rightClaw[0]>windup.rightClaw[0]+.1);
 const f=t=>r.clips.attack.frames.find(f=>f.t===t);assert.ok(Math.abs(f(.46).rotations.rightClawMovingBase[2]-f(.39).rotations.rightClawMovingBase[2])>50);
 assert.deepEqual(core.contactIds(r,'attack',.43),feet);const end=solve(r,{clip:'attack',time:1});for(const id of Object.keys(start))for(let k=0;k<3;k++)assert.ok(Math.abs(start[id][k]-end[id][k])<1e-8);
});
test('crab clips preserve bones, limits, grounded stance and fixed shadows between keyframes',()=>{
 const limited=r.joints.filter(j=>j.limits);
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));if(r.clips[clip].loop)assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});
  for(const f of r.clips[clip].frames)for(const j of limited){const v=f.rotations[j.id]||[0,0,0],bend=v.reduce((n,v,k)=>n+v*j.bendAxis[k],0);assert.ok(bend>=j.limits[0]-1e-7&&bend<=j.limits[1]+1e-7,`${clip}/${f.t}/${j.id} limit ${bend}`);}
  for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const id of feet)assert.ok(p[id][2]>-.00002,`${clip}/${time}/${id} penetration`);for(const id of core.contactIds(r,clip,time))assert.ok(Math.abs(p[id][2])<.00002,`${clip}/${time}/${id} planted`);}
 }
 const shadow=(clip,time)=>projectScene(r,{clip,time,elevation:45,heading:315}).compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;assert.deepEqual(shadow('attack',.28),shadow('attack',0));
});
test('crab optional gaits enter the audit and the full camera matrix preserves occlusion and framing',()=>{
 const pkg=compilePackage(r);for(const clip of ['sidewalk','siderun'])assert.ok(pkg.directionalBake.keyPoses.some(p=>p.clip===clip));
 for(const clip of clips)for(const time of [0,.12,.25,.28,.39,.43,.46,.58,.75,.86,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const scene=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const j of scene.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${heading}/${j.id} framing`);}
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});

test('overhead shell hides upper legs on both sides, and lowering their occlusion reference is detected',()=>{
 const buried=rig=>{const groups=projectScene(rig,{clip:'idle',time:0,elevation:90,heading:0}).compositingGroups,cap=groups.findIndex(g=>g.semanticRole==='core surface plates'&&g.elements.some(e=>e.sourceId==='shellCapPlate'));return ['left','right'].every(side=>[1,2,3,4].every(i=>groups.findIndex(g=>g.elements.some(e=>e.sourceId===side+'Leg'+i+'UpperPlate'))<cap));};
 assert.ok(buried(r));const broken=structuredClone(r);for(const p of broken.plates)if(/Leg.*UpperPlate/.test(p.id))p.occlusionReference='root';assert.equal(buried(broken),false,'mutation reproduces upper legs painting over the shell');
});

test('idle and attack do not slide support feet, and gait stance speed matches in-place travel',()=>{
 for(const clip of ['idle','attack']){const base=solve(r,{clip,time:0});for(const time of [.12,.28,.43,.46,.75,1]){const p=solve(r,{clip,time});for(const id of feet)for(let k=0;k<3;k++)assert.ok(Math.abs(p[id][k]-base[id][k])<.000003);}}
 for(const [clip,axis]of[['walk',0],['run',0],['sidewalk',1],['siderun',1]]){const a=solve(r,{clip,time:.1}),b=solve(r,{clip,time:.2}),c=solve(r,{clip,time:.3});for(const id of core.contactIds(r,clip,.2)){if(!core.contactIds(r,clip,.1).includes(id)||!core.contactIds(r,clip,.3).includes(id))continue;assert.ok(b[id][axis]<a[id][axis]);assert.ok(Math.abs((c[id][axis]-b[id][axis])-(b[id][axis]-a[id][axis]))<2e-7);}}
});
