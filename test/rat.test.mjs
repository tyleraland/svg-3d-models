import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('rat'),clips=['idle','walk','run','attack'],feet=['nearFrontPaw','farFrontPaw','nearRearPaw','farRearPaw'],distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),elements=s=>s.compositingGroups.flatMap(g=>g.elements),actual=(s,id)=>elements(s).find(e=>e.sourceId===id&&!e.generated),rank=(s,id)=>elements(s).findIndex(e=>e.sourceId===id&&!e.generated);
test('Rat has a low arched body, short folded limbs, round ears, pointed muzzle and thin body-length tail',()=>{
 const b=solve(r,{clip:'bind'}),p=id=>r.plates.find(p=>p.id===id);assert.deepEqual(r.archetypes,['rat','rodent']);assert.ok(r.heightMeters<.14);assert.ok(b.spineMid[2]+p('backPlate').size[1]/2>b.head[2]+p('headPlate').size[1]/2+.002);assert.ok(b.nearFrontHip[2]<.05&&b.nearRearHip[2]<.06);assert.ok(b.muzzle[0]-b.head[0]>.05);assert.ok(p('nosePlate').size[0]<p('muzzleConnectorPlate').size[0]*.5);assert.ok(p('nearEarPlate').size[0]>.025&&p('nearEarPlate').size[0]<.035);const body=b.muzzle[0]-b.tailBase[0],tail=distance(b.tailBase,b.tail6);assert.ok(tail/body>.85&&tail/body<1.05);assert.ok(p('tailSegment1Plate').size[0]>p('tailSegment6Plate').size[0]*4);assert.equal(compilePackage(r).validation.status,'passed');
});
function seamsFit(rig){return compilePackage(rig).gaskets.every(g=>{const ps=rig.plates.filter(p=>p.role!=='shadow'&&(p.bone===g.jointId||p.span?.includes(g.jointId)||p.points?.includes(g.jointId)));return g.diameterMeters<=Math.max(...ps.map(p=>p.size[0]))+1e-9;});}
test('Rat seams fit their small incident plates; restoring the legacy minimum-size ear or ankle gasket is caught',()=>{
 assert.ok(seamsFit(r));for(const id of ['nearEarBase','nearFrontCarpus','farRearHock']){const broken=structuredClone(r);delete broken.joints.find(j=>j.id===id).gasket;assert.equal(seamsFit(broken),false,id+' fallback floor');}
});
test('Rat breathes and sniffs above four fixed, actual zero-height contact surfaces',()=>{
 const a=solve(r,{clip:'idle',time:0}),pkg=compilePackage(r);for(const id of feet){assert.ok(Math.abs(a[id][2])<1e-8);assert.equal(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters),0);}for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const id of feet)assert.ok(distance(p[id],a[id])<1e-7);}
});
test('Rat scurry is a supported four-beat cycle with moving upper and lower limbs',()=>{
 for(let i=0;i<=1200;i++)assert.ok(core.contactIds(r,'walk',i/1200).length>=2);
 for(const id of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){const a=r.clips.walk.frames.map(f=>f.rotations[id]?.[1]||0);assert.ok(Math.max(...a)-Math.min(...a)>8,id+' articulation');}
 const a=solve(r,{clip:'walk',time:.75}),b=solve(r,{clip:'walk',time:.25});assert.ok(a.nearRearPaw[2]>.002);assert.ok(b.farRearPaw[2]>.002);
});
test('Rat scurry and fast run use quick alternating feet over a low steady back',()=>{
 assert.ok(r.clips.walk.duration<=450);assert.ok(r.clips.run.duration<r.clips.walk.duration*.6);for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'run',time:t});assert.ok(core.contactIds(r,'run',t).length>=2);assert.ok(p.pelvis[2]<.076);assert.ok(p.spineMid[2]<.080);}const a=solve(r,{clip:'run',time:.25}),b=solve(r,{clip:'run',time:.75});assert.ok(a.nearFrontPaw[2]<.00001&&a.farFrontPaw[2]>.002);assert.ok(b.nearFrontPaw[2]>.002&&b.farFrontPaw[2]<.00001);assert.ok(r.plates.find(p=>p.id==='torsoPlate').span.every(id=>['pelvis','spineMid'].includes(id)));
});
test('Rat bite opens then snaps shut during a forward thrust over four braced paws and returns exactly to idle',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),pre=solve(r,{clip:'attack',time:.22}),hit=solve(r,{clip:'attack',time:.48});assert.deepEqual(a,solve(r,{clip:'idle',time:0}));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));assert.ok(hit.muzzle[0]>pre.muzzle[0]+.012);const angle=t=>c.frames.find(f=>f.t===t).rotations.jaw[1];assert.ok(angle(.42)>29);assert.ok(angle(.48)<2);assert.equal(c.events.find(e=>e.name==='impact').t,.48);for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'attack',time:t});assert.deepEqual(core.contactIds(r,'attack',t),feet);for(const id of feet)assert.ok(distance(p[id],a[id])<1e-6);}
});
test('Rat baked clips preserve rigid spans, limits, loop seams, contact heights and paw/tail clearance between keys',()=>{
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));const c=r.clips[clip];assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<8,clip+'/'+id+' rotation jump');for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const id of [...feet,...r.joints.filter(j=>/Hock$|Carpus$|tail[1-6]$/.test(j.id)).map(j=>j.id)])assert.ok(p[id][2]>-.000005,clip+'/'+t+'/'+id+' clearance');for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.000005,clip+'/'+t+'/'+id+' contact');}}
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
test('Rat head, ears, limbs and tail pass dense directional occlusion and full emitted SVG framing checks',()=>{
 for(const clip of clips)for(const time of [0,.12,.22,.32,.36,.42,.48,.56,.63,.76,.815,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const e of elements(s).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} framing`);}
});
function muzzleCovered(s,id='muzzleConnectorPlate'){const a=actual(s,'headPlate').vector.attributes,b=actual(s,id).vector.attributes,n=b.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi).map(Number);return rank(s,id)<rank(s,'headPlate')&&[[n[0],n[1]],[n.at(-2),n.at(-1)]].every(([x,y])=>((x- +a.cx)/+a.rx)**2+((y- +a.cy)/+a.ry)**2<1);}
test('Rat muzzle base is actually covered by the skull and its internal tail socket stays buried across views',()=>{
 for(const clip of clips)for(const time of [0,.22,.36,.48,.76,1])for(const elevation of [0,45,60,75,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading});assert.ok(muzzleCovered(s));assert.ok(muzzleCovered(s,'jawPlate'));assert.ok(rank(s,'tailSocketPlate')<rank(s,'torsoPlate'));}
 const s=projectScene(r,{clip:'attack',time:.48,elevation:90,heading:0}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='muzzleConnectorPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='muzzleConnectorPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(muzzleCovered(s),false);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId==='muzzleConnectorPlate'));
});
test('Rat tail emerges beyond the rump perimeter and the XY ground/shadow never follows body motion',()=>{
 const b=solve(r,{clip:'bind'});assert.ok(b.tailBase[0]<b.pelvis[0]-.03);for(let i=1;i<=6;i++)assert.ok(b['tail'+i][0]<b.tailBase[0]-.03);const shadow=(clip,time)=>actual(projectScene(r,{clip,time,elevation:45,heading:225}),'castShadow').vector;for(const clip of clips)for(const time of [.22,.36,.48,.76,.815,1])assert.deepEqual(shadow(clip,time),shadow('idle',0));
});
