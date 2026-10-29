import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{loadModel}from'@paper-rig/rigs';import{solve,solvePose,projectScene,core,compilePackage}from'@paper-rig/compiler';import{inspectOcclusion}from'@paper-rig/validator/occlusion';import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('kingCobra'),chain=r.joints.filter(j=>!j.helper&&!['root','jaw','jawTip'].includes(j.id)),clips=['idle','idleLow','walk','run','rise','idleRaised','lower','attack'];
const near=(a,b,tol=1e-7)=>{for(const id of Object.keys(a))for(let k=0;k<3;k++)assert.ok(Math.abs(a[id][k]-b[id][k])<tol,`${id}/${k}`);},distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
test('King Cobra is separate from unchanged Anaconda and has a broad articulated hood',()=>{
 assert.equal(r.id,'kingCobraBase');assert.equal(chain.length,24);assert.ok(r.archetypes.includes('king cobra'));
 assert.deepEqual(loadModel('serpentine'),JSON.parse(fs.readFileSync(new URL('../fixtures/rigs/serpentine.json',import.meta.url))));
 for(const side of ['left','right']){const p=r.plates.find(p=>p.id===side+'HoodPlate');assert.equal(p.shape,'polygon');assert.equal(p.points.length,6);assert.equal(p.bodyRegion,'neck');}
 const p=solve(r,{clip:'idle',time:0}),q=solve(r,{clip:'idleLow',time:0});assert.ok(p.head[2]>q.head[2]+.7);assert.ok(distance(p.leftHoodVertex2,p.rightHoodVertex2)>.5);assert.ok(distance(q.leftHoodVertex2,q.rightHoodVertex2)<.3);assert.equal(compilePackage(r).validation.status,'passed');
});
test('ground travel uses coordinated front-to-tail waves, with distinct slower and faster speeds',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration);for(const clip of ['walk','run']){
  const peak=i=>{let best=-Infinity,time=0;for(let k=0;k<200;k++){const t=k/200,p=solve(r,{clip,time:t}),a=p[chain[i].id],b=p[chain[i+1].id],v=Math.atan2(b[1]-a[1],b[0]-a[0]);if(v>best){best=v;time=t;}}return time;};
  const lag=(peak(6)-peak(10)+1)%1;assert.ok(lag>.15&&lag<.27);
  for(const id of ['rearSpine','middleSpine','frontSpine','neck'])assert.notDeepEqual(solvePose(r,{clip,time:.1}).joints[id].localToWorldRotation,solvePose(r,{clip,time:.35}).joints[id].localToWorldRotation);
 }
});
test('rise spreads the hood into raised idle and lower folds it into the same low pose',()=>{
 const low=solve(r,{clip:'idleLow',time:0}),raised=solve(r,{clip:'idle',time:0});near(solve(r,{clip:'rise',time:0}),low);near(solve(r,{clip:'rise',time:1}),raised);near(solve(r,{clip:'idleRaised',time:0}),raised);near(solve(r,{clip:'lower',time:0}),raised);near(solve(r,{clip:'lower',time:1}),low);
 assert.equal(core.contactIds(r,'rise',.5).length,14);assert.equal(core.contactIds(r,'rise',0).length,20);assert.equal(core.contactIds(r,'lower',1).length,20);
 for(const t of [.12,.4,.7,1])near(solve(r,{clip:'rise',time:t}),solve(r,{clip:'lower',time:1-t}),2e-5);
});
test('raised strike is a rapid whole-forebody bite with jaw closure and braced rear support',()=>{
 const a=solve(r,{clip:'attack',time:.28}),b=solve(r,{clip:'attack',time:.36});assert.ok(a.head[2]>.8);assert.ok(b.head[0]>a.head[0]+.4);assert.ok(b.head[2]<a.head[2]-.3);assert.ok((.36-.28)*r.clips.attack.duration<100);
 const gape=p=>{const u=p.snout.map((v,k)=>v-p.head[k]),l=p.jawTip.map((v,k)=>v-p.jaw[k]);return Math.acos(Math.max(-1,Math.min(1,u.reduce((n,v,k)=>n+v*l[k],0)/Math.hypot(...u)/Math.hypot(...l))))*180/Math.PI;};assert.ok(gape(a)-gape(b)>35);
 const idle=solve(r,{clip:'idle',time:0});assert.ok(Math.abs(idle.jawTip[1]-idle.jaw[1])<1e-8,'neutral jaw aligns with head forward axis');
 for(const id of core.contactIds(r,'attack',.28))assert.ok(distance(a[id],b[id])<1e-8);near(solve(r,{clip:'attack',time:0}),solve(r,{clip:'idle',time:0}));near(solve(r,{clip:'attack',time:1}),solve(r,{clip:'idle',time:0}));
});
test('body and hood preserve lengths, ground clearance, support heights and loop seams between keys',()=>{
 const base=solve(r,{clip:'bind'}),panels=r.plates.filter(p=>p.points);
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));if(r.clips[clip].loop)assert.deepEqual(r.clips[clip].frames[0],{...r.clips[clip].frames.at(-1),t:0});for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const j of r.joints.filter(j=>j.id!=='root'))assert.ok(p[j.id][2]>-.00003,`${clip}/${time}/${j.id} penetration`);for(const id of core.contactIds(r,clip,time))assert.ok(Math.abs(p[id][2]-base[id][2])<.00003,`${clip}/${time}/${id} contact`);
  for(const panel of panels)for(let k=0;k<panel.points.length;k++){const a=panel.points[k],b=panel.points[(k+1)%panel.points.length];assert.ok(Math.abs(distance(p[a],p[b])-distance(base[a],base[b]))<1e-9,'hood panel remains rigid');}
 }}
});
// Independent hood/core ordering evidence using projected bounds and joint depths.
function hoodDepth(scene){const joints=new Map(scene.joints.map(j=>[j.id,j])),all=scene.compositingGroups.flatMap(g=>g.elements),order=new Map(all.map((e,i)=>[e.id,i]));
 const parts=r.plates.filter(p=>p.role!=='shadow').map(p=>{const ids=p.points||p.span||[p.bone],ps=ids.map(id=>joints.get(id)),radius=p.points?0:p.size[0]*r.tokenScale/2;return{id:p.id,min:Math.min(...ps.map(j=>j.cameraDepth)),max:Math.max(...ps.map(j=>j.cameraDepth)),box:[0,1].map(k=>[Math.min(...ps.map(j=>j.screenPosition[k]))-radius,Math.max(...ps.map(j=>j.screenPosition[k]))+radius])};});const pairs=[],violations=[];
 for(const a of parts.filter(p=>/HoodPlate/.test(p.id)))for(const b of parts.filter(p=>!/HoodPlate/.test(p.id))){if(a.box.some((v,k)=>v[1]<b.box[k][0]||v[0]>b.box[k][1]))continue;const pair=a.min>b.max+.002?[a.id,b.id]:b.min>a.max+.002?[b.id,a.id]:null;if(pair){pairs.push(pair);if(order.get(pair[0])>order.get(pair[1]))violations.push(pair);}}
 return{pairs,violations};}
test('hood, neck and head remain ordered across the full camera matrix, with a mutation check',()=>{
 const pkg=compilePackage(r);for(const c of ['idleLow','rise','idleRaised','lower'])assert.ok(pkg.directionalBake.keyPoses.some(p=>p.clip===c));let proof;
 for(const clip of clips)for(const time of [0,.12,.28,.32,.36,.47,.62,.75,.88,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);const h=hoodDepth(s);assert.deepEqual(h.violations,[],`${clip}/${time}/${elevation}/${heading} hood order`);if(h.pairs.length)proof={s,pair:h.pairs[0]};for(const j of s.joints.filter(j=>j.id!=='root'))assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${clip}/${time}/${heading}/${j.id} framing`);}
 assert.ok(proof);const broken=structuredClone(proof.s),g=broken.compositingGroups.find(g=>g.semanticRole==='core surface plates'),a=g.elements.findIndex(e=>e.id===proof.pair[0]),b=g.elements.findIndex(e=>e.id===proof.pair[1]);assert.ok(a>=0&&b>=0);[g.elements[a],g.elements[b]]=[g.elements[b],g.elements[a]];assert.ok(hoodDepth(broken).violations.length>0);
 const report=auditRig(r);assert.equal(report.status,'passed',JSON.stringify(report.issues));
});
