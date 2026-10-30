import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('mountainGoat'),feet=r.clips.idle.contacts,distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const area=(s,ids)=>{const P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition]));return Math.abs(ids.reduce((n,id,i)=>{const a=P[id],b=P[ids[(i+1)%ids.length]];return n+a[0]*b[1]-b[0]*a[1];},0))/2;};
test('Mountain Goat has compact deep-chested proportions, short tail and narrow swept-back horns',()=>{
 const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id),b=solve(r,{clip:'bind'});
 assert.deepEqual(r.archetypes,['mountainGoat','goat']);assert.ok(!r.joints.some(j=>/antler|bell|mane|udder|Tuft/i.test(j.id)));
 assert.ok(p('torsoPlate').size[0]>.5&&p('torsoPlate').size[0]<.6);assert.ok(b.pelvis[2]>.9&&b.pelvis[2]<1&&b.chest[2]>b.pelvis[2]);assert.ok(b.head[2]>1.15&&b.head[2]<1.25);assert.ok(distance(j('tailTip').bind,[0,0,0])<.17);
 for(const side of ['near','far']){assert.equal(p(side+'HornPlate').shape,'polygon');assert.equal(p(side+'HornCrossPlate').shape,'polygon');assert.ok(p(side+'HornPlate').points.length>=12);assert.equal(p(side+'HornPlate').semanticDetailTier,'identity');assert.ok(j(side+'EarTip').bind[2]>.1);assert.ok(b[side+'HornCenter5'][0]<b[side+'HornRoot'][0]-.14);}
 assert.ok(b.nearHornCenter5[2]>1.55&&b.nearHornCenter5[2]<1.65);assert.ok(b.nearHornCenter5[1]-b.farHornCenter5[1]<.27);assert.ok(core.rigidPlateSpanLengthsPass(r));assert.equal(compilePackage(r).validation.status,'passed');
});
test('Mountain Goat horn volumes retain projected area and stay rigid to the skull through its head-butt',()=>{
 const hornArea=(rig,elevation,heading)=>{const s=projectScene(rig,{clip:'idle',time:0,elevation,heading});return Math.max(...['HornPlate','HornCrossPlate'].map(id=>area(s,rig.plates.find(p=>p.id==='near'+id).points)));};
 for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5)assert.ok(hornArea(r,elevation,heading)>.4,`${elevation}/${heading} horn silhouette`);
 const flat=structuredClone(r);for(const j of flat.joints.filter(j=>/Horn/.test(j.id)))j.bind[1]=0;assert.ok(hornArea(flat,0,0)<1e-7,'a coplanar horn regression is detected');
 const base=solve(r,{clip:'bind'}),ids=r.joints.filter(j=>/Horn/.test(j.id)).map(j=>j.id);
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.18,.30,.40,.44,.54,.64,.83,1]){const p=solve(r,{clip,time});for(const id of ids)for(const anchor of ['head','muzzle','jawTip'])assert.ok(Math.abs(distance(p[id],p[anchor])-distance(base[id],base[anchor]))<2e-7,`${clip}/${time}/${id}/${anchor}`);}
});
test('Mountain Goat idle breathes over four fixed grounded hooves and a fixed ground shadow',()=>{
 const a=solve(r,{clip:'idle',time:0});let min=Infinity,max=-Infinity;
 const shadow=s=>s.compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 const initial=shadow(projectScene(r,{clip:'idle',time:0,elevation:45,heading:225}));
 for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'idle',time:t});for(const id of feet){assert.ok(Math.abs(p[id][2])<2e-8);assert.ok(distance(p[id],a[id])<2e-8);}min=Math.min(min,p.pelvis[2]);max=Math.max(max,p.pelvis[2]);}
 assert.ok(max-min>.004);for(const clip of ['idle','walk','run','attack'])for(const time of [.25,.5,.75,1])assert.deepEqual(shadow(projectScene(r,{clip,time,elevation:45,heading:225})),initial);
});
test('Mountain Goat locomotion has four walk footfalls, a faster suspended gallop and whole-leg articulation',()=>{
 assert.deepEqual(r.clips.walk.events.map(e=>e.t),[0,.25,.5,.75]);const standing=solve(r,{clip:'idle',time:0}).head[2];for(const clip of ['walk','run']){const mean=Array.from({length:41},(_,i)=>solve(r,{clip,time:i/40}).head[2]).reduce((a,b)=>a+b)/41;assert.ok(mean<standing-.1,clip+' carries its head lower than the alert idle');}assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);assert.deepEqual(core.contactIds(r,'run',.83),[]);
 for(const clip of ['walk','run'])for(const part of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){const v=r.clips[clip].frames.map(f=>f.rotations[part]?.[1]||0);assert.ok(Math.max(...v)-Math.min(...v)>8,`${clip}/${part}`);}
});
test('Mountain Goat idle/walk/run/head-butt preserve lengths, limits, grounded supports and loop closure between keys',()=>{
 for(const clip of ['idle','walk','run','attack']){const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const id of feet){assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id} clearance`);if(core.contactIds(r,clip,t).includes(id))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} contact`);}}
 }
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});
test('Mountain Goat head-butt tucks and thrusts the forehead suddenly, then recoils over four braced feet',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),load=solve(r,{clip:'attack',time:.34}),hit=solve(r,{clip:'attack',time:.48}),recoil=solve(r,{clip:'attack',time:.60});
 assert.ok(hit.foreheadContact[0]>load.foreheadContact[0]+.27);assert.ok(hit.foreheadContact[2]<load.foreheadContact[2]-.4);assert.ok(recoil.foreheadContact[0]<hit.foreheadContact[0]-.06&&recoil.head[2]>hit.head[2]+.1);
 const tilt=t=>['neckBase','neckTip','head'].reduce((n,id)=>n+c.frames.find(f=>f.t===t).rotations[id][1],0);assert.ok(tilt(.48)-tilt(.34)>70);assert.ok((.48-.34)*c.duration<190);assert.ok((.54-.48)*c.duration<80);
 assert.equal(c.events.find(e=>e.name==='impact').t,.48);assert.ok(c.events.every(e=>e.phase));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));
 for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip:'attack',time});assert.deepEqual(core.contactIds(r,'attack',time),feet);for(const id of feet)assert.ok(distance(p[id],a[id])<2e-6);}
});
// Conservative bounds from emitted SVG primitives, independent of joint-only framing.
function vectorPoints(v){const a=v.attributes;let ps=[];
 if(v.tag==='ellipse'||v.tag==='circle'){const x=+a.cx,y=+a.cy,rx=+(a.rx??a.r),ry=+(a.ry??a.r);ps=[[x-rx,y-ry],[x+rx,y-ry],[x+rx,y+ry],[x-rx,y+ry]];}
 else if(v.tag==='rect'){const x=+a.x,y=+a.y,w=+a.width,h=+a.height;ps=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
 else if(v.tag==='path'){const n=(a.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)||[]).map(Number);for(let i=0;i<n.length;i+=2)ps.push([n[i],n[i+1]]);}
 else throw Error('Unverified vector '+v.tag);
 if(a.transform?.startsWith('rotate(')){const [deg,cx=0,cy=0]=a.transform.slice(7,-1).split(/[ ,]+/).map(Number),w=deg*Math.PI/180;ps=ps.map(([x,y])=>[cx+(x-cx)*Math.cos(w)-(y-cy)*Math.sin(w),cy+(x-cx)*Math.sin(w)+(y-cy)*Math.cos(w)]);}
 else if(a.transform?.startsWith('matrix(')){const [m,n,o,p,x,y]=a.transform.slice(7,-1).split(/[ ,]+/).map(Number);ps=ps.map(([u,v])=>[m*u+o*v+x,n*u+p*v+y]);}
 else assert.ok(!a.transform,'unverified transform '+a.transform);
 return ps;
}
test('Mountain Goat horns, head, limb seams and framing pass the dense directional matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.20,.28,.34,.40,.48,.54,.60,.75,.83,.92,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=1&&v<=99),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
  for(const e of s.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} vector framing`);
 }
});
test('Mountain Goat buried jaw seam mutation is detected independently of golden/browser parity',()=>{
 const s=projectScene(r,{clip:'attack',time:.48,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='jawGasket'&&!e.generated));
 const i=g.elements.findIndex(e=>e.sourceId==='jawGasket'&&!e.generated);g.elements.push(...g.elements.splice(i,1));assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-seam-incident-order'));
});
test('Mountain Goat far horn cross-section cannot be promoted over the nearer skull during the strike',()=>{
 const s=projectScene(r,{clip:'attack',time:.48,elevation:0,heading:315});assert.deepEqual(inspectOcclusion(r,s).violations,[]);
 const g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='farHornCrossPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='farHornCrossPlate'&&!e.generated);g.elements.push(...g.elements.splice(i,1));
 assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-depth-order'&&v.elementId==='farHornCrossPlate'));
});
