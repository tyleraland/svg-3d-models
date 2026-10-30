import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('cow'),feet=r.clips.idle.contacts,distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
test('Cow has hornless female cattle proportions, a lighter neck, long face, low udder and tufted tail',()=>{
 const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id),b=solve(r,{clip:'bind'}),bull=loadModel('bull'),bp=id=>bull.plates.find(p=>p.id===id);
 assert.deepEqual(r.archetypes,['cow','cattle']);assert.ok(!r.joints.some(j=>/horn|antler|bell|mane/i.test(j.id)));assert.ok(!r.plates.some(p=>/horn|antler/i.test(p.id)));
 assert.ok(p('neckPlate').size[0]<bp('neckPlate').size[0]*.7&&p('shoulderPlate').size[0]<bp('shoulderPlate').size[0]*.8);assert.ok(j('muzzle').bind[0]>.3);assert.ok(Math.abs(b.chest[2]-b.pelvis[2])<.03);
 assert.ok(b.udder[2]>.5&&b.udder[2]<.6);assert.equal(r.plates.filter(p=>/TeatPlate$/.test(p.id)).length,4);assert.ok(b.tailTuft[2]<.55&&b.tailTuft[2]>.35);
 for(const side of ['near','far'])assert.ok(Math.abs(j(side+'EarTip').bind[1])>.2&&j(side+'EarTip').bind[2]<.06);
 assert.ok(core.rigidPlateSpanLengthsPass(r));assert.equal(compilePackage(r).validation.status,'passed');
});
const undersideIds=['udderPlate','nearFrontTeatPlate','nearRearTeatPlate','farFrontTeatPlate','farRearTeatPlate'];
function undersideBuried(scene){
 const es=scene.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated),rank=new Map(es.map((e,i)=>[e.sourceId,i]));
 return undersideIds.every(id=>rank.has(id)&&rank.get(id)<rank.get('torsoPlate'));
}
test('Cow underside stays below its overlapping barrel in overhead views; foreground mutation is caught',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.25,.34,.56,.68,.83,1])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation:90,heading});assert.ok(undersideBuried(s),`${clip}/${time}/${heading}`);
  const P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition])),a=P.barrelRear,b=P.barrelFront,d=b.map((v,k)=>v-a[k]),length=d[0]**2+d[1]**2;
  const q=P.udder,u=Math.max(0,Math.min(1,d.reduce((n,v,k)=>n+v*(q[k]-a[k]),0)/length));
  const fromAxis=Math.hypot(...q.map((v,k)=>v-a[k]-u*d[k]));assert.ok(fromAxis+.15*r.tokenScale<.38*r.tokenScale,'udder footprint fits inside the actual barrel coverage');
 }
 const s=projectScene(r,{clip:'idle',time:0,elevation:90,heading:0}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='udderPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='udderPlate'&&!e.generated);s.compositingGroups.at(-1).elements.push(...g.elements.splice(i,1));assert.equal(undersideBuried(s),false);
});
test('Cow idle breathes over four fixed grounded hooves and a fixed ground shadow',()=>{
 const a=solve(r,{clip:'idle',time:0});let min=Infinity,max=-Infinity;
 const shadow=s=>s.compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 const initial=shadow(projectScene(r,{clip:'idle',time:0,elevation:45,heading:225}));
 for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'idle',time:t});for(const id of feet){assert.ok(Math.abs(p[id][2])<2e-8);assert.ok(distance(p[id],a[id])<2e-8);}min=Math.min(min,p.pelvis[2]);max=Math.max(max,p.pelvis[2]);}
 assert.ok(max-min>.007);assert.ok(r.clips.idle.frames.some(f=>f.rotations.jaw?.[1]>2.9),'gentle idle chewing');for(const clip of ['idle','walk','run','attack'])for(const time of [.25,.5,.75,1])assert.deepEqual(shadow(projectScene(r,{clip,time,elevation:45,heading:225})),initial);
});
test('Cow locomotion has four walk footfalls, a faster suspended gallop and whole-leg articulation',()=>{
 assert.deepEqual(r.clips.walk.events.map(e=>e.t),[0,.25,.5,.75]);assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);assert.deepEqual(core.contactIds(r,'run',.83),[]);
 for(const clip of ['walk','run'])for(const part of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){const v=r.clips[clip].frames.map(f=>f.rotations[part]?.[1]||0);assert.ok(Math.max(...v)-Math.min(...v)>8,`${clip}/${part}`);}
});
test('Cow idle/walk/run/shove preserve lengths, limits, grounded supports and loop closure between keys',()=>{
 for(const clip of ['idle','walk','run','attack']){const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const id of feet){assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id} clearance`);if(core.contactIds(r,clip,t).includes(id))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} contact`);}}
 }
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});
test('Cow shove presses the chest/head forward and holds contact without an upward horn toss',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),gather=solve(r,{clip:'attack',time:.34}),hit=solve(r,{clip:'attack',time:.56});
 assert.ok(hit.chest[0]>a.chest[0]+.19&&hit.head[0]>a.head[0]+.19&&hit.muzzle[0]>gather.muzzle[0]+.22);assert.ok(hit.head[2]<a.head[2]-.1&&hit.head[2]>a.head[2]-.2);
 for(const time of [.56,.60,.64,.68]){const p=solve(r,{clip:'attack',time});for(const id of ['chest','head','muzzle'])assert.ok(distance(p[id],hit[id])<2e-8,'sustained level press, no goring lift');}
 assert.equal(c.events.find(e=>e.name==='impact').t,.56);assert.equal(c.events.find(e=>e.name==='release').t,.68);assert.ok(c.events.every(e=>e.phase));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));
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
test('Cow underside, head, limb seams and full SVG geometry framing pass the dense directional matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.20,.25,.34,.44,.56,.64,.68,.75,.83,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=1&&v<=99),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
  for(const e of s.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} vector framing`);
 }
});
test('Cow buried jaw seam mutation is detected independently of golden/browser parity',()=>{
 const s=projectScene(r,{clip:'attack',time:.34,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='jawGasket'&&!e.generated));
 const i=g.elements.findIndex(e=>e.sourceId==='jawGasket'&&!e.generated);g.elements.push(...g.elements.splice(i,1));assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-seam-incident-order'));
});
