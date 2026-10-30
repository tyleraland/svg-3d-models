import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('ostrich'),clips=['idle','walk','run','attack'],feet=['nearToe','farToe'],distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),elements=s=>s.compositingGroups.flatMap(g=>g.elements),actual=(s,id)=>elements(s).find(e=>e.sourceId===id&&!e.generated),rank=(s,id)=>elements(s).findIndex(e=>e.sourceId===id&&!e.generated);
test('Ostrich is a separate long-legged ratite with a thin S-neck, small head, reduced wings and exactly two forward toes per foot',()=>{
 const b=solve(r,{clip:'bind'}),p=id=>r.plates.find(p=>p.id===id);assert.deepEqual(r.archetypes,['ostrich','ratite']);assert.ok(b.pelvis[2]>1.3&&b.pelvis[2]<1.4);assert.ok(b.head[2]>2.1&&b.head[2]<2.3);assert.ok(b.neckLower[0]>b.neckMid[0]&&b.neckMid[0]>b.neckUpper[0]);assert.ok(p('neckUpperPlate').size[0]<p('torsoPlate').size[0]/6);assert.ok(p('headPlate').size[0]<p('torsoPlate').size[0]/3);for(const side of ['near','far']){assert.ok(distance(b[side+'Hock'],b[side+'Ankle'])>distance(b[side+'Hip'],b[side+'Knee'])*1.4);assert.ok(b[side+'Hock'][0]<b[side+'Knee'][0]);assert.ok(b[side+'Ankle'][0]>b[side+'Hock'][0]);assert.equal(r.plates.filter(p=>new RegExp('^'+side+'(Main|Small)ToePlate$').test(p.id)).length,1);assert.ok(b[side+'MainToeTip'][0]>b[side+'Toe'][0]);assert.ok(b[side+'SmallToeTip'][0]>b[side+'Toe'][0]);}assert.ok(!r.clips.fly);assert.ok(!r.joints.some(j=>/comb|wattle/.test(j.id)));assert.equal(compilePackage(r).validation.status,'passed');
});
function seamsFit(rig){return compilePackage(rig).gaskets.every(g=>{const ps=rig.plates.filter(p=>p.role!=='shadow'&&(p.bone===g.jointId||p.span?.includes(g.jointId)||p.points?.includes(g.jointId)));return g.diameterMeters<=Math.min(...ps.map(p=>p.size[0]))+1e-9;});}
test('Ostrich seams fit slender incident segments; oversized inferred hock/head joins are caught',()=>{
 assert.ok(seamsFit(r));for(const id of ['nearHock','nearAnkle','head']){const q=structuredClone(r);delete q.joints.find(j=>j.id===id).gasket;assert.equal(seamsFit(q),false,id);}
});
test('Ostrich idle has two true ground contact surfaces and keeps both two-toed feet fixed',()=>{
 const a=solve(r,{clip:'idle',time:0}),pkg=compilePackage(r);for(const id of feet){assert.ok(Math.abs(a[id][2])<1e-8);assert.equal(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters),0);}for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const side of ['near','far'])for(const suffix of ['Toe','ToeBase','MainToeTip','SmallToeTip']){const id=side+suffix;assert.ok(distance(p[id],a[id])<1e-7);}}
});
test('Ostrich walk alternates with double support and articulates true thigh, knee, backward hock and ankle',()=>{
 for(let i=0;i<=1200;i++)assert.ok(core.contactIds(r,'walk',i/1200).length>=1);assert.equal(core.contactIds(r,'walk',.06).length,2);for(const id of ['nearHip','nearKnee','nearHock','nearAnkle']){const a=r.clips.walk.frames.map(f=>f.rotations[id][1]);assert.ok(Math.max(...a)-Math.min(...a)>10,id);}
 const a=solve(r,{clip:'walk',time:.80}),b=solve(r,{clip:'walk',time:.30});assert.ok(a.nearToe[2]>.15&&a.farToe[2]<.0001);assert.ok(b.farToe[2]>.15&&b.nearToe[2]<.0001);
});
test('Ostrich run is faster with alternating support, long recovery arcs and two brief flight gaps',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);for(const t of [.45,.95]){assert.deepEqual(core.contactIds(r,'run',t),[]);const p=solve(r,{clip:'run',time:t});for(const id of feet)assert.ok(p[id][2]>.01);}assert.deepEqual(core.contactIds(r,'run',.2),['nearToe']);assert.deepEqual(core.contactIds(r,'run',.7),['farToe']);assert.ok(solve(r,{clip:'run',time:.7}).nearToe[2]>.3);
});
test('Ostrich jump kick starts grounded, preloads, raises both feet forward and above the hips, then lands and returns to idle',()=>{
 const a=solve(r,{clip:'attack',time:0}),crouch=solve(r,{clip:'attack',time:.16}),hit=solve(r,{clip:'attack',time:.46}),land=solve(r,{clip:'attack',time:.72});assert.deepEqual(a,solve(r,{clip:'idle',time:0}));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));assert.ok(crouch.pelvis[2]<a.pelvis[2]-.07);assert.deepEqual(core.contactIds(r,'attack',.16),feet);assert.deepEqual(core.contactIds(r,'attack',.46),[]);for(const id of feet){assert.ok(hit[id][0]>.94);assert.ok(hit[id][2]>hit.pelvis[2]);assert.ok(Math.abs(land[id][2])<1e-8);assert.ok(distance(land[id],a[id])<1e-8);}assert.ok(hit.nearMainToeTip[2]>hit.nearToe[2]+.05,'upturned foot presents its sole');assert.equal(r.clips.attack.events.find(e=>e.name==='impact').t,.46);assert.equal(r.clips.attack.events.find(e=>e.name==='landing').t,.72);
});
test('Ostrich kick has a ballistic-shaped body arc and matched takeoff/landing velocity',()=>{
 const T=r.clips.attack.duration/1000,flight=.44*T,g=8*.4/(flight*flight);assert.ok(g>9.5&&g<10);for(const t of [.28,.35,.42,.5,.58,.65,.72]){const u=(t-.28)/.44,p=solve(r,{clip:'attack',time:t});assert.ok(Math.abs(p.pelvis[2]-(1.35+1.6*u*(1-u)))<.00001);}for(const t of [.28,.72]){const dt=.001,left=(solve(r,{clip:'attack',time:t}).pelvis[2]-solve(r,{clip:'attack',time:t-dt}).pelvis[2])/dt,right=(solve(r,{clip:'attack',time:t+dt}).pelvis[2]-solve(r,{clip:'attack',time:t}).pelvis[2])/dt;assert.ok(Math.abs(left-right)<.1,'continuous launch/landing velocity');}
});
test('Ostrich preserves lengths, limits, loop seams, contacts and intermediate foot/hock clearance',()=>{
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));const c=r.clips[clip];assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<4,clip+'/'+id+' jump');for(const f of c.frames)for(const j of r.joints.filter(j=>j.limits)){const a=f.rotations[j.id]?.[1]||0;assert.ok(a>=j.limits[0]&&a<=j.limits[1]);}for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const j of r.joints.filter(j=>/Toe|Hock|Ankle/.test(j.id)))assert.ok(p[j.id][2]>-.00005,clip+'/'+t+'/'+j.id);for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.00005);}}
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
test('Ostrich long neck, legs, wing assist and jump extremes pass dense occlusion and full SVG framing checks',()=>{
 for(const clip of clips)for(const time of [0,.125,.16,.28,.38,.46,.5,.54,.625,.72,.82,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const e of elements(s).filter(e=>!e.generated))for(const p of vectorPoints(e.vector))assert.ok(p.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} framing`);}
});
function covered(s,id){const a=actual(s,'headPlate').vector.attributes,b=actual(s,id).vector.attributes,n=b.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi).map(Number);return rank(s,id)<rank(s,'headPlate')&&[[n[0],n[1]],[n.at(-2),n.at(-1)]].every(([x,y])=>((x- +a.cx)/+a.rx)**2+((y- +a.cy)/+a.ry)**2<1);}
test('Ostrich bill bases remain actually covered by the head; promoted joins fail independently of goldens',()=>{
 for(const clip of clips)for(const time of [0,.16,.38,.46,.72,1])for(const elevation of [0,45,60,75,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading});for(const id of ['beakPlate','lowerBillPlate'])assert.ok(covered(s,id));assert.ok(rank(s,'tailSocketPlate')<rank(s,'torsoPlate'));}
 const s=projectScene(r,{clip:'attack',time:.46,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='beakPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='beakPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(covered(s,'beakPlate'),false);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId==='beakPlate'));
});
test('Ostrich reduced wings remain visible head-on and spread outward during the airborne kick',()=>{
 const a=solve(r,{clip:'idle',time:0}),b=solve(r,{clip:'attack',time:.46});assert.ok(Math.abs(b.nearWingTip[1]-b.farWingTip[1])>Math.abs(a.nearWingTip[1]-a.farWingTip[1])+.2);for(const clip of clips)for(const t of [0,.28,.46,.54,.72,1])for(const heading of [0,180]){const s=projectScene(r,{clip,time:t,elevation:0,heading});for(const side of ['near','far']){const p=vectorPoints(actual(s,side+'WingFeatherPlate').vector),w=Math.max(...p.map(p=>p[0]))-Math.min(...p.map(p=>p[0])),h=Math.max(...p.map(p=>p[1]))-Math.min(...p.map(p=>p[1]));assert.ok(w>.5&&h>.5,'head-on wing does not vanish');}}
});
test('Ostrich ground shadow stays fixed as the body jumps and legs kick',()=>{
 const shadow=(clip,time)=>actual(projectScene(r,{clip,time,elevation:45,heading:225}),'castShadow').vector;for(const clip of clips)for(const t of [.16,.28,.46,.54,.72,.82,1])assert.deepEqual(shadow(clip,t),shadow('idle',0));
});

test('Ostrich rigid wing tips are geometry anchors without exposed terminal joint caps',()=>{
 const clean=rig=>!compilePackage(rig).gaskets.some(g=>/WingTip$/.test(g.jointId));assert.ok(clean(r));for(const side of ['near','far']){const q=structuredClone(r);q.joints.find(j=>j.id===side+'WingTip').helper=false;assert.equal(clean(q),false,'exposed tip-cap regression');}
});

test('Ostrich coplanar toe plates share one sole attachment frame, with the raised instep owned by the ankle',()=>{
 const owners=rig=>['near','far'].every(side=>rig.plates.find(p=>p.id===side+'MainToePlate').bone===side+'Toe'&&rig.plates.find(p=>p.id===side+'MainToePlate').shape==='polygon'&&!rig.plates.some(p=>p.id===side+'SmallToePlate')&&rig.plates.find(p=>p.id===side+'InstepPlate').bone===side+'Ankle');assert.ok(owners(r));const q=structuredClone(r);q.plates.find(p=>p.id==='nearMainToePlate').bone='nearMainToeTip';assert.equal(owners(q),false,'separate coplanar helper owner regression');
});
