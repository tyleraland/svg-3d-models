import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('tortoise'),clips=['idle','walk','run','attack'],feet=['nearFrontPaw','nearRearPaw','farFrontPaw','farRearPaw'],distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),elements=s=>s.compositingGroups.flatMap(g=>g.elements),actual=(s,id)=>elements(s).find(e=>e.sourceId===id&&!e.generated),rank=(s,id)=>elements(s).findIndex(e=>e.sourceId===id&&!e.generated),shell=r.plates.filter(p=>p.role==='core');
test('Tortoise has its own domed shell, low plastron, splayed short limbs, articulated neck, beak and tiny tail',()=>{
 const b=solve(r,{clip:'bind'}),ps=r.joints.filter(j=>/Vertex\d+$/.test(j.id)).map(j=>b[j.id]);assert.deepEqual(r.archetypes,['tortoise','chelonian']);assert.equal(shell.length,50);const extent=k=>Math.max(...ps.map(p=>p[k]))-Math.min(...ps.map(p=>p[k]));assert.ok(extent(0)>.64&&extent(0)<.66);assert.ok(extent(1)>.48&&extent(1)<.50);assert.ok(extent(2)>.30&&extent(2)<.31);assert.ok(b.head[0]>.44&&b.head[0]<.46);assert.ok(b.head[2]<.23);assert.ok(distance(b.tailBase,b.tailTip)<.1);for(const side of ['near','far'])for(const part of ['Front','Rear']){const id=side+part;assert.ok(Math.abs(b[id+'Knee'][1])>Math.abs(b[id+'Hip'][1])+.05);assert.ok(b[id+'Hip'][2]<.15);assert.ok(Math.abs(b[id+'Paw'][1])<.22,'feet fit the shell perimeter');assert.ok(distance(b[id+'Hip'],b[id+'Knee'])<.125);}assert.equal(r.plates.filter(p=>/Claw\dPlate$/.test(p.id)).length,0);for(const id of feet)assert.equal(r.plates.find(p=>p.id===id.replace('Paw','FootPlate')).points.length,10);assert.equal(compilePackage(r).validation.status,'passed');
});
function closedShell(rig){const faces=rig.plates.filter(p=>p.role==='core'),edges=new Map();for(const p of faces)for(let i=0;i<p.points.length;i++){const a=p.points[i],b=p.points[(i+1)%p.points.length],key=[a,b].sort().join('|');if(!edges.has(key))edges.set(key,[]);edges.get(key).push(a+'>'+b);}return faces.length===50&&[...edges.values()].every(v=>v.length===2&&v[0]!==v[1]);}
test('Tortoise shell is a closed shared-vertex surface; holes and detached faces are caught without golden images',()=>{
 assert.ok(closedShell(r));for(const kind of ['hole','detached']){const q=structuredClone(r);if(kind==='hole')q.plates=q.plates.filter(p=>p.id!=='shellLowerScute0Plate');else q.plates.find(p=>p.id==='shellLowerScute0Plate').points[0]='root';assert.equal(closedShell(q),false,kind);}
});
test('Tortoise shell vertices stay rigid and each face depth frame is its actual surface centroid',()=>{
 const b=solve(r,{clip:'bind'}),vertices=r.joints.filter(j=>/Vertex\d+$/.test(j.id));for(const p of shell){const c=p.points.reduce((a,id)=>a.map((v,k)=>v+b[id][k]/p.points.length),[0,0,0]);assert.ok(distance(c,b[p.bone])<2e-9);assert.equal(r.joints.find(j=>j.id===p.bone).helper,true);}for(const clip of clips)for(let i=0;i<=40;i++){const p=solve(r,{clip,time:i/40});for(const j of vertices)assert.ok(Math.abs(distance(p.shell,p[j.id])-distance(b.shell,b[j.id]))<1e-9);for(const f of r.clips[clip].frames)for(const j of vertices)assert.ok(!f.rotations[j.id]&&!f.poses?.[j.id]);}
});
function seamsFit(rig){return compilePackage(rig).gaskets.every(g=>{const ps=rig.plates.filter(p=>p.role!=='shadow'&&(p.bone===g.jointId||p.span?.includes(g.jointId)||p.points?.includes(g.jointId)));return g.diameterMeters<=Math.min(...ps.map(p=>p.size[0]))+1e-9;});}
test('Tortoise small seams fit incident widths and shell geometry helpers do not acquire joint caps',()=>{
 assert.ok(seamsFit(r));const pkg=compilePackage(r);assert.ok(!pkg.gaskets.some(g=>/Vertex|Frame|Claw|Pad\d/.test(g.jointId)));for(const id of ['nearFrontAnkle','jaw']){const q=structuredClone(r);delete q.joints.find(j=>j.id===id).gasket;assert.equal(seamsFit(q),false,id);}
});
test('Tortoise idle and bite keep four true ground contacts fixed, including the whole foot pad',()=>{
 const a=solve(r,{clip:'idle',time:0}),pkg=compilePackage(r);for(const id of feet){assert.ok(Math.abs(a[id][2])<1e-8);assert.equal(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters),0);}for(const clip of ['idle','attack'])for(let i=0;i<=1200;i++){const p=solve(r,{clip,time:i/1200});for(const id of feet)assert.ok(distance(p[id],a[id])<.00001);for(const j of r.joints.filter(j=>/Pad\d$/.test(j.id)))assert.ok(distance(p[j.id],a[j.id])<.00001);}
});
test('Tortoise slow and fast travel both retain at least three supports and articulate the entire splayed leg',()=>{
 for(const clip of ['walk','run']){for(let i=0;i<=1200;i++)assert.ok(core.contactIds(r,clip,i/1200).length>=3);assert.equal(r.clips[clip].events.length,4);for(const id of ['nearFrontHip','nearFrontKnee','nearFrontAnkle','nearRearHip','nearRearKnee']){const a=r.clips[clip].frames.map(f=>f.rotations[id]);assert.ok([0,1,2].some(k=>Math.max(...a.map(v=>v[k]))-Math.min(...a.map(v=>v[k]))>5),clip+'/'+id);}}
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.55);assert.ok(solve(r,{clip:'run',time:.9}).nearRearPaw[2]>.03);assert.ok(solve(r,{clip:'walk',time:.9}).nearRearPaw[2]>.02);const extent=clip=>{const ps=r.clips[clip].frames.map(f=>solve(r,{clip,time:f.t}).nearRearPaw[0]);return Math.max(...ps)-Math.min(...ps);};assert.ok(extent('run')>extent('walk')*1.6);
});
test('Tortoise bite has a clear angular neck recoil, forward/down snap, jaw closure and complete return',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),pre=solve(r,{clip:'attack',time:.35}),hit=solve(r,{clip:'attack',time:.46});assert.deepEqual(a,solve(r,{clip:'idle',time:0}));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));assert.ok(pre.beak[0]<a.beak[0]-.06);assert.ok(hit.beak[0]>pre.beak[0]+.07);assert.ok(hit.head[2]<pre.head[2]-.10);assert.equal(c.frames.find(f=>f.t===.46).rotations.jaw[1],30);assert.equal(c.frames.find(f=>f.t===.51).rotations.jaw[1],0);assert.equal(c.events.find(e=>e.name==='impact').t,.46);assert.ok(c.frames.find(f=>f.t===.35).rotations.neckBase[1]<-60);
});
test('Tortoise clips preserve lengths, limits, continuous rotations, loop seams, contact heights and intermediate foot clearance',()=>{
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));const c=r.clips[clip];assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<6,clip+'/'+id+' rotation jump');for(const f of c.frames)for(const j of r.joints.filter(j=>j.limits)){const a=f.rotations[j.id]?.[1]||0;assert.ok(a>=j.limits[0]&&a<=j.limits[1]);}for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const j of r.joints.filter(j=>/Paw$|Ankle$|Pad\d|Claw.*Tip$/.test(j.id)))assert.ok(p[j.id][2]>-.00005,clip+'/'+t+'/'+j.id);for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.00005,clip+'/'+t+'/'+id);for(const id of feet)for(let n=0;n<6;n++)assert.ok(Math.abs(p[id.replace('Paw','Pad'+n)][2]-p[id][2]-.012)<.00002,'level rigid pad');}}
 assert.equal(auditRig(r).status,'passed');
});
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
test('Tortoise shell, rim, neck and splayed feet pass dense directional occlusion and complete SVG framing checks',()=>{
 for(const clip of clips)for(const time of [0,.05,.25,.35,.40,.46,.5,.51,.52,.75,.80,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const e of elements(s).filter(e=>!e.generated))for(const p of vectorPoints(e.vector))assert.ok(p.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} framing`);}
});
function covered(s,id){const a=actual(s,'headPlate').vector.attributes,b=actual(s,id).vector.attributes,n=b.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi).map(Number);return rank(s,id)<rank(s,'headPlate')&&[[n[0],n[1]],[n.at(-2),n.at(-1)]].every(([x,y])=>((x- +a.cx)/+a.rx)**2+((y- +a.cy)/+a.ry)**2<1);}
test('Tortoise beak/jaw roots remain actually covered by the skull across angles; promoted connectors fail',()=>{
 for(const clip of clips)for(const time of [0,.25,.35,.46,.51,1])for(const elevation of [0,45,60,75,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading});for(const id of ['beakConnectorPlate','jawPlate'])assert.ok(covered(s,id),clip+'/'+time+'/'+elevation+'/'+heading+'/'+id);}
 const s=projectScene(r,{clip:'attack',time:.46,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='beakConnectorPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='beakConnectorPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(covered(s,'beakConnectorPlate'),false);
});
function topFeetUnderShell(s){const lowest=Math.min(...shell.map(p=>rank(s,p.id)));return r.plates.filter(p=>/UpperPlate$|LowerPlate$|FootPlate$|Sole.*Plate$|InstepPlate$|Claw\dPlate$/.test(p.id)).every(p=>rank(s,p.id)<lowest);}
test('Tortoise limb roots and feet stay below the shell from above; promoted foot surfaces are caught',()=>{
 for(const clip of clips)for(const time of [0,.25,.35,.46,.51,.75,.9,1])for(let heading=0;heading<360;heading+=22.5)assert.ok(topFeetUnderShell(projectScene(r,{clip,time,elevation:90,heading})),clip+'/'+time+'/'+heading);
 const s=projectScene(r,{elevation:90,heading:0}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='nearRearFootPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='nearRearFootPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(topFeetUnderShell(s),false);
});
test('Tortoise coplanar foot surfaces use one sole owner; raised insteps and helper-only claw tips retain their proper frames',()=>{
 const good=rig=>feet.every(id=>{const prefix=id.slice(0,-3);return ['FootPlate'].every(s=>rig.plates.find(p=>p.id===prefix+s)?.bone===id)&&rig.plates.find(p=>p.id===prefix+'InstepPlate').bone===prefix+'Ankle';});assert.ok(good(r));const q=structuredClone(r);q.plates.find(p=>p.id==='nearFrontFootPlate').bone='nearFrontPad0';assert.equal(good(q),false);
});
test('Tortoise shadow stays fixed while the rigid shell and articulated limbs move',()=>{
 const shadow=(clip,time)=>actual(projectScene(r,{clip,time,elevation:45,heading:225}),'castShadow').vector;for(const clip of clips)for(const time of [.05,.25,.35,.46,.51,.75,.9,1])assert.deepEqual(shadow(clip,time),shadow('idle',0));
});
// Independent geometric oracle: compare the last painted shell polygon at
// interior samples with the nearest surface obtained by screen barycentrics.
function surfaceOrderErrors(s){
 const joints=new Map(s.joints.map(j=>[j.id,j])),ordered=elements(s).filter(e=>!e.generated&&shell.some(p=>p.id===e.sourceId)),faces=ordered.map(e=>({id:e.sourceId,ps:r.plates.find(p=>p.id===e.sourceId).points.map(id=>{const j=joints.get(id);return[...j.screenPosition,j.cameraDepth];})}));
 const at=(p,[a,b,c])=>{const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-8)return null;const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/d,v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/d,w=1-u-v;return Math.min(u,v,w)>1e-7?u*a[2]+v*b[2]+w*c[2]:null;},errors=[];
 for(const f of faces){const p=f.ps.reduce((a,v)=>[a[0]+v[0]/f.ps.length,a[1]+v[1]/f.ps.length],[0,0]),hits=[];for(const g of faces){for(let i=1;i<g.ps.length-1;i++){const d=at(p,[g.ps[0],g.ps[i],g.ps[i+1]]);if(d!==null){hits.push({id:g.id,d});break;}}}if(hits.length<2)continue;const near=Math.min(...hits.map(h=>h.d)),last=hits.at(-1);if(last.d>near+.00001)errors.push({point:p,painted:last.id,near:hits.find(h=>h.d===near).id,error:last.d-near});}
 return errors;
}
test('Tortoise shell facets paint the nearest physical surface across cameras; a face-order mutation fails the geometric oracle',()=>{
 for(const elevation of [0,30,45,60,75,90])for(let heading=11.25;heading<360;heading+=22.5){const s=projectScene(r,{clip:'attack',time:.46,elevation,heading});assert.deepEqual(surfaceOrderErrors(s),[],elevation+'/'+heading);}
 const s=projectScene(r,{clip:'idle',time:0,elevation:60,heading:33.75}),g=s.compositingGroups.find(g=>g.id==='coreSurfaceGroup'),i=g.elements.findIndex(e=>e.sourceId==='plastronPlate'&&!e.generated),[p]=g.elements.splice(i,1);g.elements.push(p);assert.ok(surfaceOrderErrors(s).length>0);
});
