import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('camel'),feet=r.clips.idle.contacts,distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const area=(s,ids)=>{const P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition]));return Math.abs(ids.reduce((n,id,i)=>{const a=P[id],b=P[ids[(i+1)%ids.length]];return n+a[0]*b[1]-b[0]*a[1];},0))/2;};
test('Camel has two rigid back humps, tall slender legs, padded feet and a long rising neck',()=>{
 const b=solve(r,{clip:'bind'}),p=id=>r.plates.find(p=>p.id===id);
 assert.deepEqual(r.archetypes,['camel','bactrian']);assert.equal(r.joints.filter(j=>/^(rear|front)Hump$/.test(j.id)).length,2);assert.ok(b.head[2]>1.9&&b.head[2]<2.1);assert.ok(b.neckBase[2]<b.chest[2]);assert.ok(b.neckTip[2]>b.neckBase[2]+.25);assert.ok(b.head[2]>b.neckTip[2]+.3);assert.ok(b.nearFrontHip[2]>1.3);assert.ok(p('nearFrontHoofPlate').size[0]>.18);assert.ok(p('nearFrontPasternPlate').size[0]<.06);assert.ok(!r.joints.some(j=>/horn|antler|tusk|udder/i.test(j.id)));
 assert.ok(b.frontHump[2]>b.chest[2]+.25&&b.rearHump[2]>b.pelvis[2]+.25);assert.ok(b.frontHump[0]-b.rearHump[0]>.6);assert.ok(core.rigidPlateSpanLengthsPass(r));assert.equal(compilePackage(r).validation.status,'passed');
});
test('Camel humps remain rigid to the torso through pacing, gallop and the neck-driven bite',()=>{
 const b=solve(r,{clip:'bind'});const rigid=rig=>{for(const clip of ['idle','walk','run','attack'])for(const time of [0,.18,.28,.44,.48,.62,.8,1]){const p=solve(rig,{clip,time});for(const id of ['rearHump','frontHump'])for(const anchor of ['pelvis','chest'])if(Math.abs(distance(p[id],p[anchor])-distance(b[id],b[anchor]))>2e-7)return false;}return true;};assert.ok(rigid(r));
 const detached=structuredClone(r);detached.joints.find(j=>j.id==='frontHump').parent='head';assert.equal(rigid(detached),false,'a neck-owned hump must fail');
});
test('Camel idle breathes and chews over four fixed feet and a fixed ground shadow',()=>{
 const a=solve(r,{clip:'idle',time:0});for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const id of feet){assert.ok(Math.abs(p[id][2])<2e-8);assert.ok(distance(p[id],a[id])<2e-8);}}
 // Pad connectors must fit within the flattened pads; oversized circular gaskets
 // previously made the head-on feet asymmetrical through compositing.
 const front=projectScene(r,{clip:'idle',time:0,elevation:0,heading:180}).compositingGroups.flatMap(g=>g.elements);
 for(const id of feet){const gasket=front.find(e=>e.sourceId===id+'Gasket'&&!e.generated).vector.attributes,pad=front.find(e=>e.sourceId===id+'Plate'&&!e.generated).vector.attributes;assert.ok(+gasket.r<=Math.min(+pad.rx,+pad.ry),id+' pad connector');}
 assert.ok(Math.max(...r.clips.idle.frames.map(f=>f.rotations.jaw[1]))>1);const shadow=(clip,time)=>projectScene(r,{clip,time,elevation:45,heading:225}).compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 for(const clip of ['idle','walk','run','attack'])for(const time of [.25,.48,.75,1])assert.deepEqual(shadow(clip,time),shadow('idle',0));
});
test('Camel walk pairs same-side hind and fore steps, rather than diagonal trotting',()=>{
 const events=r.clips.walk.events;assert.deepEqual(events.map(e=>e.t),[0,.12,.5,.62]);assert.deepEqual(events.map(e=>e.name),['nearRearHoof-contact','nearFrontHoof-contact','farRearHoof-contact','farFrontHoof-contact']);
 // Independent trajectory evidence: same-side swing peaks lag by .12, opposite by .5.
 const peaks=Object.fromEntries(feet.map(id=>{let best=[-Infinity,0];for(let i=0;i<1000;i++){const z=solve(r,{clip:'walk',time:i/1000})[id][2];if(z>best[0])best=[z,i/1000];}return[id,best[1]];}));
 const phase=(a,b)=>(b-a+1)%1;assert.ok(Math.abs(phase(peaks.nearRearHoof,peaks.nearFrontHoof)-.12)<.003);assert.ok(Math.abs(phase(peaks.nearRearHoof,peaks.farRearHoof)-.5)<.003);
 for(const clip of ['walk','run'])for(const id of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){const a=r.clips[clip].frames.map(f=>f.rotations[id]?.[1]||0);assert.ok(Math.max(...a)-Math.min(...a)>6,clip+'/'+id);}
});
test('Camel gallop is faster, suspended and carries the long neck lower',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.45);assert.deepEqual(core.contactIds(r,'run',.83),[]);const mean=clip=>Array.from({length:41},(_,i)=>solve(r,{clip,time:i/40}).head[2]).reduce((a,b)=>a+b)/41;assert.ok(mean('run')<mean('idle')-.2);
});
test('Camel lengths, limits, contacts, clearance and loops hold between authored keys',()=>{
 for(const clip of ['idle','walk','run','attack']){const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const id of feet){assert.ok(p[id][2]>-.0001,`${clip}/${time}/${id}`);if(core.contactIds(r,clip,time).includes(id))assert.ok(Math.abs(p[id][2])<.0001);}}}
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});
test('Camel bite preloads then snaps the neck forward/down and closes its jaw over four braced feet',()=>{
 const a=solve(r,{clip:'attack',time:0}),load=solve(r,{clip:'attack',time:.28}),hit=solve(r,{clip:'attack',time:.48});assert.ok(hit.head[0]>load.head[0]+.4);assert.ok(hit.head[2]<load.head[2]-.4);const frame=t=>r.clips.attack.frames.find(f=>f.t===t);assert.equal(frame(.44).rotations.jaw[1],28);assert.equal(frame(.48).rotations.jaw[1],2);assert.ok((.48-.44)*r.clips.attack.duration<60);assert.deepEqual(a,solve(r,{clip:'attack',time:1}));assert.ok(r.clips.attack.events.every(e=>e.phase));
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
test('Camel humps, neck, limb seams and framing pass the dense directional matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.12,.18,.28,.36,.44,.48,.54,.62,.80,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=1&&v<=99),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
  for(const e of s.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} vector framing`);
 }
});
test('Camel frontmost jaw seam regression is detected independently of golden parity',()=>{
 const s=projectScene(r,{clip:'attack',time:.44,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='jawGasket'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='jawGasket'&&!e.generated);g.elements.push(...g.elements.splice(i,1));assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-seam-incident-order'));
});
