import{test}from'node:test';import assert from'node:assert/strict';import{loadModel,loadFamily}from'@paper-rig/rigs';import{solve,solvePose,core,projectScene,compilePackage}from'@paper-rig/compiler';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{auditRig}from'@paper-rig/validator/audit';import{applyGroundedQuadruped}from'../rigs/quadruped-locomotion.js';
const r=loadModel('centaur'),horse=loadModel('horse'),feet=['nearFrontHoof','farFrontHoof','nearRearHoof','farRearHoof'],clips=['idle','walk','run','attack'];
const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
test('Centaur reuses refined Horse anatomy with a level barrel and integrated humanoid waist',()=>{
 const p=solve(r,{clip:'bind'}),h=solve(horse,{clip:'bind'});assert.ok(Math.abs(p.pelvis[2]-p.chest[2])<1e-10);assert.ok(Math.abs(p.chest[0]-p.pelvis[0]-1)<1e-10);
 for(const j of r.joints.filter(j=>/^(near|far)(Front|Rear)/.test(j.id)))assert.ok(distance(p[j.id],h[j.id])<1e-10,`${j.id} shares Horse geometry`);
 for(const side of ['near','far']){assert.equal(r.joints.find(j=>j.id===side+'FrontHoof').parent,side+'FrontCarpus');assert.equal(r.joints.find(j=>j.id===side+'RearHoof').parent,side+'RearHock');}
 const bridge=r.plates.find(p=>p.id==='withersBridgePlate');assert.deepEqual(bridge.span,['chest','upperPelvis']);assert.ok(p.upperPelvis[2]>p.chest[2]+.2);assert.ok(p.upperHead[2]>2.2&&p.upperHead[2]<2.4);assert.equal(compilePackage(r).validation.status,'passed');
});
test('walk uses four staggered support exchanges and run has a separate faster suspension gait',()=>{
 assert.equal(r.clips.walk.duration,1450);assert.equal(r.clips.run.duration,760);
 assert.deepEqual([...new Set(r.clips.walk.contactIntervals.map(i=>i.from))].filter(t=>t<1).sort((a,b)=>a-b),[0,.25,.5,.75]);
 for(let i=0;i<=1000;i++)assert.ok(core.contactIds(r,'walk',i/1000).length>=2);
 assert.deepEqual(r.clips.run.contactIntervals.map(i=>i.ids[0]),['farRearHoof','nearRearHoof','farFrontHoof','nearFrontHoof']);assert.deepEqual(core.contactIds(r,'run',.83),[]);for(const id of feet)assert.ok(solve(r,{clip:'run',time:.83})[id][2]>.04);
 for(const clip of ['walk','run'])for(const id of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock','leftShoulder','rightShoulder'])assert.notDeepEqual(solvePose(r,{clip,time:.1}).joints[id].localToWorldRotation,solvePose(r,{clip,time:.7}).joints[id].localToWorldRotation,`${clip}/${id} articulates`);
});
test('braced attack drives a rapid articulated hand strike and recovers to idle with four planted hooves',()=>{
 const neutral=solve(r,{clip:'idle',time:0}),a=solve(r,{clip:'attack',time:.30}),b=solve(r,{clip:'attack',time:.42});assert.ok(b.leftHand[0]-a.leftHand[0]>.45);assert.ok(b.leftHand[0]>neutral.leftHand[0]+.3);assert.ok((.42-.30)*r.clips.attack.duration<160);assert.deepEqual(core.contactIds(r,'attack',.42),feet);
 assert.ok(Math.abs(r.clips.attack.frames.find(f=>f.t===.42).rotations.upperSpine[2])>5);
 for(const t of [0,1]){const p=solve(r,{clip:'attack',time:t});for(const id of Object.keys(neutral))assert.ok(distance(p[id],neutral[id])<1e-8);}
 const audit=auditRig(r);assert.ok(audit.views.some(v=>v.clipId==='attack'&&v.timeNormalized===.42),'default audit samples actual authored impact');
});
test('clips preserve bone lengths, limits, support heights, idle/attack planting and loop seams between keys',()=>{
 const neutral=solve(r,{clip:'idle',time:0}),limited=r.joints.filter(j=>j.limits);
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));if(r.clips[clip].loop)assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});for(const f of r.clips[clip].frames)for(const j of limited){const bend=(f.rotations[j.id]||[0,0,0]).reduce((n,v,k)=>n+v*j.bendAxis[k],0);assert.ok(bend>=j.limits[0]-1e-7&&bend<=j.limits[1]+1e-7,`${clip}/${j.id} limit ${bend}`);}
  for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const id of feet)assert.ok(p[id][2]>-.00004,`${clip}/${time}/${id} ground`);for(const id of core.contactIds(r,clip,time))assert.ok(Math.abs(p[id][2])<.00004,`${clip}/${time}/${id} stance`);if(['idle','attack'].includes(clip))for(const id of feet)assert.ok(distance(p[id],neutral[id])<.00004,`${clip}/${time}/${id} slides`);}
 }
});
test('the reusable quadruped baker targets existing Centaur head controls without inventing horse joints',()=>{
 const candidate=loadFamily('centaur');applyGroundedQuadruped(candidate,{walk:{stride:.35,lift:.1,headNodDegrees:2},run:{durationMs:760,stride:.45,lift:.2,bodyRise:.06,bodyDip:.02,pitchDegrees:2}});const ids=new Set(candidate.joints.map(j=>j.id));for(const clip of [candidate.clips.walkA,candidate.clips.run])for(const f of clip.frames){for(const id of Object.keys(f.rotations))assert.ok(ids.has(id),id);assert.ok('upperNeck'in f.rotations);assert.ok('upperHead'in f.rotations);}
});
test('Centaur junction, shoulders and limbs remain correctly stacked and framed through the camera matrix',()=>{
 for(const clip of clips)for(const time of [0,.12,.25,.30,.32,.42,.44,.50,.62,.66,.75,.83,.84,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${heading}/${j.id} framing`);}
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});

test('camera-facing arms stay in front of the torso at 45/225, and an under-body regression is detected',()=>{
 const visible=rig=>['idle','run','attack'].every(clip=>{const s=projectScene(rig,{clip,time:clip==='attack'?.42:0,elevation:45,heading:225}),near=s.compositingGroups.find(g=>g.semanticRole==='camera-near appendages');return['leftBicepPlate','leftForearmPlate','leftHandPlate'].every(id=>near.elements.some(e=>e.sourceId===id));});
 assert.ok(visible(r));const broken=structuredClone(r);broken.plates.find(p=>p.id==='leftForearmPlate').occlusionMode='under-core';assert.equal(visible(broken),false);
});
