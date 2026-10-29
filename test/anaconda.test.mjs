import{test}from'node:test';import assert from'node:assert/strict';import{loadModel}from'@paper-rig/rigs';import{solve,solvePose,projectScene,core,compilePackage}from'@paper-rig/compiler';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('serpentine'),chain=r.joints.filter(j=>!['root','jaw','jawTip'].includes(j.id)),clips=['idle','walk','run','rise','idleRaised','lower','attack'];
const close=(a,b,tol=1e-7)=>{for(const id of Object.keys(a))for(let k=0;k<3;k++)assert.ok(Math.abs(a[id][k]-b[id][k])<tol,`${id}/${k}: ${a[id][k]} != ${b[id][k]}`);};
test('Anaconda retains stable spine IDs and gains a long tapered articulated body without a cobra hood',()=>{
 assert.equal(chain.length,24);for(const id of ['tailBase','tailMid','rearSpine','middleSpine','frontSpine','neck','head','snout'])assert.ok(chain.some(j=>j.id===id));
 assert.ok(r.archetypes.includes('anaconda'));assert.ok(!r.plates.some(p=>/hood/i.test(p.id)));assert.ok(r.joints.some(j=>j.id==='jaw'));
 const lengths=chain.slice(1).reduce((n,j)=>n+Math.hypot(...j.bind),0),width=r.plates.find(p=>p.id==='middleBodyPlate').size[0];assert.ok(lengths/width>15);assert.ok(r.plates.find(p=>p.id==='tailBasePlate').size[0]<width*.2);assert.ok(r.plates.find(p=>p.id==='headPlate').size[0]<width*1.2);
 assert.equal(compilePackage(r).validation.status,'passed');
});
test('slow and fast travel propagate curvature toward the tail instead of switching two whole-body poses',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration);for(const clip of ['walk','run']){
  const heading=(i,t)=>{const p=solve(r,{clip,time:t}),a=p[chain[i].id],b=p[chain[i+1].id];return Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;};
  const peak=i=>{let best=-Infinity,time=0;for(let k=0;k<200;k++){const t=k/200,v=heading(i,t);if(v>best){best=v;time=t;}}return time;};
  const rear=peak(6),front=peak(10),lag=(rear-front+1)%1;assert.ok(lag>.15&&lag<.27,`${clip}: front-to-rear lag ${lag}`);
  for(const id of ['rearSpine','middleSpine','frontSpine','neck'])assert.notDeepEqual(solvePose(r,{clip,time:.1}).joints[id].localToWorldRotation,solvePose(r,{clip,time:.35}).joints[id].localToWorldRotation);
 }
});
test('rise, raised idle and lowering share continuous endpoints while keeping the rear belly low',()=>{
 const ground=solve(r,{clip:'idle',time:0}),up=solve(r,{clip:'rise',time:1});assert.ok(up.head[2]>ground.head[2]+.7);
 close(solve(r,{clip:'rise',time:0}),ground);close(up,solve(r,{clip:'idleRaised',time:0}));close(up,solve(r,{clip:'lower',time:0}));close(ground,solve(r,{clip:'lower',time:1}));
 for(const t of [.12,.4,.7,1]){const a=solve(r,{clip:'rise',time:t}),b=solve(r,{clip:'lower',time:1-t});close(a,b,1e-5);}
 for(const clip of ['rise','idleRaised','lower'])for(const t of [0,.25,.5,.75,1])for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(solve(r,{clip,time:t})[id][2]-ground[id][2])<1e-7);
});
test('strike raises then rapidly uncoils the forebody, closes the jaw and returns to ground idle',()=>{
 const a=solve(r,{clip:'attack',time:.42}),b=solve(r,{clip:'attack',time:.50});assert.ok(a.head[2]>.8);assert.ok(b.head[0]>a.head[0]+.5);assert.ok(b.head[2]<a.head[2]-.3);
 assert.equal(r.clips.attack.duration,1450);assert.ok((.50-.42)*1450<120);
 const frame=t=>r.clips.attack.frames.find(f=>f.t===t);assert.ok(frame(.42).rotations.jaw[1]-frame(.50).rotations.jaw[1]>30);
 for(const id of core.contactIds(r,'attack',.42))for(let k=0;k<3;k++)assert.ok(Math.abs(a[id][k]-b[id][k])<1e-8,'rear support braces during strike');
 close(solve(r,{clip:'attack',time:0}),solve(r,{clip:'idle',time:0}));close(solve(r,{clip:'attack',time:1}),solve(r,{clip:'idle',time:0}));
});
test('all Anaconda clips preserve lengths, loop seams and ground support between authored keys',()=>{
 const bind=solve(r,{clip:'bind'});for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));if(r.clips[clip].loop)assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const j of chain)assert.ok(p[j.id][2]>=-.00003,`${clip}/${time}/${j.id} ground`);assert.ok(p.jawTip[2]>=-.00003,`${clip}/${time} jaw ground`);for(const id of core.contactIds(r,clip,time))assert.ok(Math.abs(p[id][2]-bind[id][2])<.00003,`${clip}/${time}/${id} belly contact`);}}
});
test('Anaconda coils, head and jaw retain camera depth order and framing around every critical action',()=>{
 const pkg=compilePackage(r);for(const c of ['rise','idleRaised','lower'])assert.ok(pkg.directionalBake.keyPoses.some(p=>p.clip===c));
 for(const clip of clips)for(const time of [0,.12,.28,.32,.42,.5,.62,.75,.86,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const scene=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,scene).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const j of scene.joints.filter(j=>j.id!=='root'))assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${heading}/${j.id} framing`);}
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});

// Independent capsule overlap/depth checks for self-overlapping body segments.
// These use emitted screen joints and source widths, not compositor classifiers.
function bodyDepthEvidence(scene){
 const joints=new Map(scene.joints.map(j=>[j.id,j])),all=scene.compositingGroups.flatMap(g=>g.elements),order=new Map(all.map((e,i)=>[e.id,i]));
 const records=r.plates.filter(p=>p.span).map(p=>{const a=joints.get(p.span[0]),b=joints.get(p.span[1]);return{id:p.id,a:a.screenPosition,b:b.screenPosition,min:Math.min(a.cameraDepth,b.cameraDepth),max:Math.max(a.cameraDepth,b.cameraDepth),radius:p.size[0]*r.tokenScale/2};});
 const dist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1e-20)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const pairs=[],violations=[];for(let i=0;i<records.length;i++)for(let k=i+1;k<records.length;k++){
  const a=records[i],b=records[k],intersects=cross(a.a,a.b,b.a)*cross(a.a,a.b,b.b)<0&&cross(b.a,b.b,a.a)*cross(b.a,b.b,a.b)<0,d=intersects?0:Math.min(dist(a.a,b.a,b.b),dist(a.b,b.a,b.b),dist(b.a,a.a,a.b),dist(b.b,a.a,a.b));if(d>=a.radius+b.radius)continue;
  const pair=a.min>b.max+.002?[a.id,b.id]:b.min>a.max+.002?[b.id,a.id]:null;if(!pair)continue;pairs.push(pair);if(order.get(pair[0])>order.get(pair[1]))violations.push(pair);
 }
 return{pairs,violations};
}
test('coiled body crossings respect independent depth intervals and detect inverted draw order',()=>{
 let proof;for(const clip of ['walk','run','rise','idleRaised','attack'])for(const time of [.25,.42,.5,.75,1])for(const elevation of [0,45,60,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading}),e=bodyDepthEvidence(s);assert.deepEqual(e.violations,[],`${clip}/${time}/${elevation}/${heading}`);if(e.pairs.length)proof={s,pair:e.pairs[0]};}
 assert.ok(proof,'self-overlap checks exercised non-ambiguous depth pairs');const broken=structuredClone(proof.s),group=broken.compositingGroups.find(g=>g.semanticRole==='core surface plates'),a=group.elements.findIndex(e=>e.id===proof.pair[0]),b=group.elements.findIndex(e=>e.id===proof.pair[1]);assert.ok(a>=0&&b>=0);[group.elements[a],group.elements[b]]=[group.elements[b],group.elements[a]];assert.ok(bodyDepthEvidence(broken).violations.length>0,'mutation of body draw order is detected');
});
