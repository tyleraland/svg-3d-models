import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('monkey'),clips=['idle','walk','run','attack'],feet=['nearFoot','farFoot'],hands=['nearHand','farHand'],contacts=[...feet,...hands],distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),elements=s=>s.compositingGroups.flatMap(g=>g.elements),rank=(s,id)=>elements(s).findIndex(e=>e.sourceId===id&&!e.generated);
test('Monkey has lean primate proportions, long articulated forearms, broad palms, round ears and an elevated hooked tail',()=>{
 const b=solve(r,{clip:'bind'}),p=id=>r.plates.find(p=>p.id===id);assert.deepEqual(r.archetypes,['monkey','primate']);assert.ok(distance(b.nearShoulder,b.nearElbow)+distance(b.nearElbow,b.nearWrist)>.32);assert.ok(distance(b.nearHip,b.nearKnee)+distance(b.nearKnee,b.nearAnkle)>.35);assert.ok(p('nearHandPlate').size[0]>p('nearForearmPlate').size[0]);assert.ok(p('headPlate').size[0]<p('torsoPlate').size[0]);assert.ok(p('nearEarPlate').size[0]>.07);assert.ok(b.tail6[2]>.90&&b.tail8[2]<b.tail6[2]-.04);assert.ok(b.tail8[0]<b.pelvis[0]-.5);assert.ok(p('tailSegment1Plate').size[0]>p('tailSegment8Plate').size[0]*2);assert.equal(compilePackage(r).validation.status,'passed');
});
test('Monkey bind and breathing have four actual grounded palm/foot surfaces',()=>{
 const b=solve(r,{clip:'bind'}),pkg=compilePackage(r);for(const id of contacts){assert.ok(Math.abs(b[id][2])<1e-8);assert.equal(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters,0);}
 for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const id of contacts)assert.ok(distance(p[id],b[id])<1e-7);}
});
test('Monkey walk keeps support while arms and legs articulate through a staggered four-beat cycle',()=>{
 for(let i=0;i<=1200;i++){const t=i/1200;assert.ok(core.contactIds(r,'walk',t).length>=2);}
 for(const id of ['nearShoulder','nearElbow','nearWrist','nearHip','nearKnee','nearAnkle']){const angles=r.clips.walk.frames.map(f=>f.rotations[id]?.[1]||0);assert.ok(Math.max(...angles)-Math.min(...angles)>10,id+' must articulate');}
 const a=solve(r,{clip:'walk',time:.14}),b=solve(r,{clip:'walk',time:.64});assert.ok(a.nearHand[2]>.04&&a.farHand[2]<.0001);assert.ok(b.farHand[2]>.04&&b.nearHand[2]<.0001);
});
test('Monkey run has faster staggered supports, a raised recovery arc and suspension',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);assert.deepEqual(core.contactIds(r,'run',.86),[]);const p=solve(r,{clip:'run',time:.86});for(const id of contacts)assert.ok(p[id][2]>.02);assert.ok(p.tail8[2]>.75);assert.ok(solve(r,{clip:'run',time:.13}).farFoot[2]<.0001);assert.ok(solve(r,{clip:'run',time:.60}).farHand[2]<.0001);
});
test('Monkey slam rises over fixed hind feet, lifts both hands overhead, strikes rapidly, braces and recovers',()=>{
 const a=solve(r,{clip:'attack',time:0}),up=solve(r,{clip:'attack',time:.42}),hit=solve(r,{clip:'attack',time:.62});assert.ok(up.head[2]>a.head[2]+.12);for(const id of hands){assert.ok(up[id][2]>up.head[2]+.1);assert.ok(up[id][2]>.75);assert.ok(Math.abs(hit[id][2])<1e-8);assert.ok(hit[id][0]>.269);}assert.deepEqual(solve(r,{clip:'attack',time:1}),a);
 for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'attack',time:t});for(const id of feet)assert.ok(distance(p[id],a[id])<1e-6);if(t>=.62&&t<=.74)for(const id of hands){assert.ok(Math.abs(p[id][2])<1e-7);assert.ok(Math.abs(p[id][0]-.27)<1e-7);}}
 assert.equal(r.clips.attack.events.find(e=>e.name==='impact').t,.62);assert.deepEqual(core.contactIds(r,'attack',.42),feet);assert.equal(core.contactIds(r,'attack',.68).length,4);assert.ok(solve(r,{clip:'attack',time:.86}).nearHand[2]>.03);
});
test('Monkey clips preserve lengths, limits, planted heights, clearance and continuous local rotations',()=>{
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));const c=r.clips[clip];assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<4,clip+'/'+id+' rotation jump');
 for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const id of [...contacts,'nearWrist','farWrist','nearAnkle','farAnkle',...Array.from({length:8},(_,i)=>'tail'+(i+1))])assert.ok(p[id][2]>-.00001,clip+'/'+t+'/'+id+' penetration');for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.00001,clip+'/'+t+'/'+id+' contact');}}
 assert.equal(auditRig(r).status,'passed');
});
test('Monkey stance translation has the same in-place ground speed on every planted limb',()=>{
 for(const clip of ['walk','run']){const expected=clip==='walk'?-.115/.72:-.17/.22;for(const id of contacts){const intervals=r.clips[clip].contactIntervals.filter(x=>x.ids.includes(id)&&x.to-x.from>.02);for(const q of intervals){const a=q.from+(q.to-q.from)*.3,b=q.from+(q.to-q.from)*.7,A=solve(r,{clip,time:a})[id],B=solve(r,{clip,time:b})[id];assert.ok(Math.abs((B[0]-A[0])/(b-a)-expected)<.0001);}}}
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
test('Monkey tail, head, limbs and full SVG bounds pass the dense camera and extreme-pose matrix',()=>{
 for(const clip of clips)for(const time of [0,.12,.22,.32,.42,.50,.56,.62,.74,.86,.97,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const e of elements(s).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} framing`);}
});
test('Monkey muzzle base and tail socket stay behind their opaque owners; promoted-connector mutations fail',()=>{
 const buried=s=>rank(s,'muzzleConnectorPlate')<rank(s,'headPlate')&&rank(s,'tailSocketPlate')<rank(s,'torsoPlate');
 for(const clip of clips)for(const time of [0,.32,.42,.62,.86,1])for(const elevation of [0,45,60,75,90])for(let heading=0;heading<360;heading+=45)assert.ok(buried(projectScene(r,{clip,time,elevation,heading})));
 for(const id of ['muzzleConnectorPlate','tailSocketPlate']){const s=projectScene(r,{clip:'attack',time:.42,elevation:90,heading:0}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId===id&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId===id&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(buried(s),false);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId===id));}
});
test('Monkey ground shadow is stationary through all body, tail and attack motion',()=>{
 const shadow=(clip,time)=>elements(projectScene(r,{clip,time,elevation:45,heading:225})).find(e=>e.sourceId==='castShadow').vector;for(const clip of clips)for(const time of [.16,.42,.62,.86,1])assert.deepEqual(shadow(clip,time),shadow('idle',0));
});
