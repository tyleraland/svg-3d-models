import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('boar'),feet=r.clips.idle.contacts,distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const area=(s,ids)=>{const P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition]));return Math.abs(ids.reduce((n,id,i)=>{const a=P[id],b=P[ids[(i+1)%ids.length]];return n+a[0]*b[1]-b[0]*a[1];},0))/2;};
test('Boar has compact high shoulders, short legs, long snout and jaw-owned lower tusks',()=>{
 const b=solve(r,{clip:'bind'}),j=id=>r.joints.find(j=>j.id===id);
 assert.deepEqual(r.archetypes,['boar','wildBoar']);assert.ok(b.chest[2]>b.pelvis[2]);assert.ok(b.head[2]<b.chest[2]);assert.ok(b.muzzle[0]-b.head[0]>.3);assert.ok(!r.joints.some(j=>/horn|antler|udder|wart/i.test(j.id)));
 for(const side of ['near','far']){assert.equal(j(side+'LowerTuskRoot').parent,'jaw');assert.equal(j(side+'UpperTuskRoot').parent,'head');}
 assert.ok(core.rigidPlateSpanLengthsPass(r));assert.equal(compilePackage(r).validation.status,'passed');
});
test('Boar tusks keep volume in every direction and lower cutters move rigidly with the jaw',()=>{
 const base=solve(r,{clip:'bind'}),ids=r.joints.filter(j=>/LowerTusk/.test(j.id)).map(j=>j.id);
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.18,.34,.48,.62,.8,1]){const p=solve(r,{clip,time});for(const id of ids)for(const anchor of ['jaw','jawTip'])assert.ok(Math.abs(distance(p[id],p[anchor])-distance(base[id],base[anchor]))<2e-7);}
 const volume=(rig,e,h)=>{const s=projectScene(rig,{clip:'idle',time:0,elevation:e,heading:h});return Math.max(...['Plate','CrossPlate'].map(suffix=>area(s,rig.plates.find(p=>p.id==='nearLowerTusk'+suffix).points)));};
 for(const e of [0,30,45,60,75,90])for(let h=0;h<360;h+=22.5)assert.ok(volume(r,e,h)>.2,`${e}/${h}`);
 const flat=structuredClone(r);for(const j of flat.joints.filter(j=>/Tusk/.test(j.id)))j.bind[1]=0;assert.ok(volume(flat,0,0)<1e-7);
});
test('Boar idle keeps four feet and the ground shadow fixed',()=>{
 const base=solve(r,{clip:'idle',time:0});for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const id of feet)assert.ok(distance(p[id],base[id])<2e-8);}
 const shadow=(clip,time)=>projectScene(r,{clip,time,elevation:45,heading:225}).compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 for(const clip of ['idle','walk','run','attack'])for(const t of [0,.25,.48,.75,1])assert.deepEqual(shadow(clip,t),shadow('idle',0));
});
test('Boar walk is four beat, run suspends, and both animate the whole leg',()=>{
 assert.deepEqual(r.clips.walk.events.map(e=>e.t),[0,.25,.5,.75]);assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);assert.deepEqual(core.contactIds(r,'run',.83),[]);
 for(const clip of ['walk','run'])for(const id of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){const a=r.clips[clip].frames.map(f=>f.rotations[id]?.[1]||0);assert.ok(Math.max(...a)-Math.min(...a)>8,clip+'/'+id);}
});
test('Boar lengths, supports and clearance hold between authored keys',()=>{
 for(const clip of ['idle','walk','run','attack']){assert.ok(core.preservedClipLengthsPass(r,clip));for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const id of feet){assert.ok(p[id][2]>-.0001,`${clip}/${time}/${id}`);if(core.contactIds(r,clip,time).includes(id))assert.ok(Math.abs(p[id][2])<.0001);}}}
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});
test('Boar lunge crouches, opens its jaw and flicks upward in flight, then lands forefeet first',()=>{
 const a=solve(r,{clip:'attack',time:0}),load=solve(r,{clip:'attack',time:.18}),hit=solve(r,{clip:'attack',time:.48});assert.ok(load.head[2]<a.head[2]-.1);assert.ok(hit.head[2]>load.head[2]+.3);assert.equal(r.clips.attack.frames.find(f=>f.t===.48).rotations.jaw[1],26);
 assert.deepEqual(core.contactIds(r,'attack',.48),[]);assert.equal(core.contactIds(r,'attack',.65).length,2);assert.equal(core.contactIds(r,'attack',.75).length,4);assert.deepEqual(a,solve(r,{clip:'attack',time:1}));
 for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip:'attack',time});for(const id of core.contactIds(r,'attack',time))assert.ok(distance(p[id],a[id])<1e-5);}
 assert.ok(r.clips.attack.events.every(e=>e.phase));
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
test('Boar tusks, head, limb seams and framing pass the dense directional matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.18,.28,.34,.42,.48,.54,.62,.70,.80,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=1&&v<=99),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
  for(const e of s.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} vector framing`);
 }
});
test('Boar far tusk promotion is caught independently of parity',()=>{
 const s=projectScene(r,{clip:'attack',time:0,elevation:0,heading:180}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='farLowerTuskCrossPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='farLowerTuskCrossPlate'&&!e.generated);g.elements.push(...g.elements.splice(i,1));assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-depth-order'));
});
