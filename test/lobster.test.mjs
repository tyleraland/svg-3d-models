import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{loadModel}from'@paper-rig/rigs';import{compilePackage,solve,projectScene,core}from'@paper-rig/compiler';import{validateSourcePair}from'@paper-rig/validator/source';import{motionDiagnostics}from'@paper-rig/validator/audit';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{makeLobsterFamily}from'../scripts/lib/lobster-family.mjs';
const baseline=JSON.parse(fs.readFileSync('authoring-data/lobster-original-family.json')),reference=JSON.parse(fs.readFileSync('authoring-data/crustacean-motion.json')),r=loadModel('lobster'),bind=solve(r,{clip:'bind'}),feet=['left','right'].flatMap(s=>[1,2,3,4].map(i=>s+'Leg'+i+'Foot')),dist=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
test('Lobster upgrades the original stable IDs to volumetric body, articulated tail, antennae and hinged chelae',()=>{
 const family=JSON.parse(fs.readFileSync('rigs/families/lobster.json')),model=JSON.parse(fs.readFileSync('rigs/models/lobster.json'));assert.deepEqual(family,makeLobsterFamily(baseline,reference));assert.equal(validateSourcePair(model,family).status,'passed');assert.equal(compilePackage(r).validation.status,'passed');assert.deepEqual(motionDiagnostics(r).filter(d=>!d.pass),[]);
 for(const j of baseline.joints)assert.ok(r.joints.some(q=>q.id===j.id),'removed joint '+j.id);for(const p of baseline.plates)assert.ok(r.plates.some(q=>q.id===p.id),'removed plate '+p.id);for(const a of baseline.anchors)assert.ok(r.anchors.some(q=>q.id===a.id));
 assert.equal(feet.length,8);assert.ok(r.joints.some(j=>j.id==='tailEnd'));assert.ok(r.plates.some(p=>p.id==='telsonPlate'));assert.ok(bind.leftEyeTip[2]>bind.head[2]+.12);assert.ok(bind.leftAntennaTip[0]-bind.head[0]>.6);assert.ok(bind.leftTailFan[1]>0&&bind.rightTailFan[1]<0);assert.ok(bind.tailEnd[0]<bind.tailMid[0]);
 for(const p of r.plates)assert.ok(!p.span,'rigid faces must not rely on stretched endpoint spans');
});
test('Lobster uses source locomotion timing and stride repetition with continuously grounded stance and lifted recovery',()=>{
 const source=reference.models.crustacean;assert.equal(r.clips.walk.duration,source.clips.walk.duration_ms);assert.equal(r.clips.run.duration,source.clips.run.duration_ms);assert.equal(source.measured_stride_cycles.walk,2);assert.equal(source.measured_stride_cycles.run,3);
 for(const clip of ['walk','run']){let minSupport=8,maxGroundError=0,minToe=1;const trace=[];
  for(let i=0;i<=1440;i++){const t=i/1440,p=solve(r,{clip,time:t}),cs=core.contactIds(r,clip,t);minSupport=Math.min(minSupport,cs.length);for(const id of feet){minToe=Math.min(minToe,p[id][2]);if(cs.includes(id))maxGroundError=Math.max(maxGroundError,Math.abs(p[id][2]));}trace.push(p.leftLeg1Foot[2]);}
  assert.ok(minSupport>=4);assert.ok(maxGroundError<.00001,`${clip} stance ${maxGroundError}`);assert.ok(minToe>-.00001);assert.ok(Math.max(...trace)>(clip==='walk'?.044:.064));let peaks=0;for(let i=1;i<trace.length-1;i++)if(trace[i]>trace[i-1]&&trace[i]>=trace[i+1]&&trace[i]>(clip==='walk'?.035:.05))peaks++;assert.equal(peaks,source.measured_stride_cycles[clip]);
 }
});
test('Lobster alternates horizontal extension then pinch, retracting one claw before the other reaches',()=>{
 const start=solve(r,{clip:'attack',time:0});
 for(const [side,offset,other]of [['left',0,'right'],['right',.5,'left']]){
  const windup=solve(r,{clip:'attack',time:.12+offset}),open=solve(r,{clip:'attack',time:.24+offset}),closed=solve(r,{clip:'attack',time:.28+offset});
  const gap=p=>dist(p[side+'ClawFixedTip'],p[side+'ClawMovingTip']);assert.ok(gap(open)>.20);assert.ok(gap(closed)<.015);
  assert.ok(open[side+'Claw'][0]>windup[side+'Claw'][0]+.2,'forward punch travel');
  assert.ok(Math.abs(open[side+'Claw'][2]-start[side+'Claw'][2])<1e-8,'horizontal reach');
  const held=solve(r,{clip:'attack',time:offset});assert.ok(dist(open[other+'Claw'],held[other+'Claw'])<1e-8,'opposite arm holds its posture');
  assert.ok(dist(closed[other+'ClawMovingTip'],held[other+'ClawMovingTip'])<1e-8,'opposite pincer holds its posture');const retract=solve(r,{clip:'attack',time:.42+offset});assert.ok(open[side+'Claw'][0]>retract[side+'Claw'][0]+.2,'visible retraction after pinching');
 }
 for(const clip of ['idle','attack','ko'])for(let i=0;i<=240;i++){const p=solve(r,{clip,time:i/240});for(const id of feet)assert.ok(dist(p[id],bind[id])<.00001,`${clip}/${id} support drift`);}
 for(const t of [0,1]){const p=solve(r,{clip:'attack',time:t}),idle=solve(r,{clip:'idle',time:0});for(const id of Object.keys(p))assert.ok(dist(p[id],idle[id])<1e-8,`${id} recovery at ${t}`);}
});
test('Lobster swimming tail flex stays in place with fixed body and limbs, without takeoff or landing',()=>{
 const start=solve(r,{clip:'tailFlip',time:0}),peak=solve(r,{clip:'tailFlip',time:.5});assert.ok(peak.tailEnd[0]>start.tailEnd[0]+.2);assert.ok(r.clips.tailFlip.loop);assert.ok(!r.clips.tailFlip.events.some(e=>/takeoff|landing/.test(e.name)));
 // This is an aquatic tuck below the body, not a grounded or airborne attack.
 for(let i=0;i<=480;i++){const t=i/480,p=solve(r,{clip:'tailFlip',time:t});assert.equal(core.contactIds(r,'tailFlip',t).length,0);for(const id of ['root','abdomen','thorax','head',...feet,'leftClaw','rightClaw'])assert.ok(dist(p[id],start[id])<.00001,`${t}/${id} must remain fixed`);}
 for(const t of [0,1]){const p=solve(r,{clip:'tailFlip',time:t}),idle=solve(r,{clip:'idle',time:0});for(const id of Object.keys(p))assert.ok(dist(p[id],idle[id])<1e-8);}
});
test('Lobster preserves rigid faces, bone lengths, exact authored loop closure and the fixed ground shadow',()=>{
 for(const clip of ['idle','walk','run'])assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});
 const shadow=(clip,time)=>projectScene(r,{clip,time,elevation:45,heading:225}).compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow'&&!e.generated).vector;
 for(const clip of ['idle','walk','run','attack','tailFlip','ko'])for(let i=0;i<=32;i++){const time=i/32,p=solve(r,{clip,time});for(const j of r.joints.filter(j=>j.parent))assert.ok(Math.abs(dist(p[j.id],p[j.parent])-dist(bind[j.id],bind[j.parent]))<1e-7,j.id);for(const plate of r.plates.filter(p=>p.points))for(let k=0;k<plate.points.length;k++){const a=plate.points[k],b=plate.points[(k+1)%plate.points.length];assert.ok(Math.abs(dist(p[a],p[b])-dist(bind[a],bind[b]))<1e-7,plate.id);}assert.deepEqual(shadow(clip,time),shadow('idle',0));}
});
test('Lobster locomotion, claw strike and tail flick stay framed and correctly ordered across directional views',()=>{
 for(const clip of ['walk','run','attack','tailFlip','ko'])for(const time of [0,.125,.25,.375,.5,.625,.75,.875,1,.24,.28,.74,.78])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=45){const scene=projectScene(r,{clip,time,elevation,heading}),context=`${clip}/${time}/${elevation}/${heading}`;assert.deepEqual(inspectOcclusion(r,scene).violations,[],context);assert.ok(scene.joints.every(j=>j.screenPosition.every(v=>Number.isFinite(v)&&v>.5&&v<99.5)),`${context} framing`);}
});
