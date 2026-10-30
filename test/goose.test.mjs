import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('goose'),clips=['idle','walk','run','attack'],feet=['nearToe','farToe'],distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),elements=s=>s.compositingGroups.flatMap(g=>g.elements),actual=(s,id)=>elements(s).find(e=>e.sourceId===id&&!e.generated),rank=(s,id)=>elements(s).findIndex(e=>e.sourceId===id&&!e.generated);
test('Goose is a separate heavy waterfowl with a long curved neck, broad flat bill, short four-link legs and folded wings',()=>{
 const b=solve(r,{clip:'bind'}),p=id=>r.plates.find(p=>p.id===id);assert.deepEqual(r.archetypes,['goose','waterfowl']);assert.ok(b.head[2]>.55&&b.head[2]<.57);assert.ok(b.pelvis[2]>.26&&b.pelvis[2]<.28);assert.ok(p('torsoPlate').size[0]>.24);assert.ok(b.head[2]-b.chest[2]>.25);assert.ok(p('neckMidPlate').size[0]<p('torsoPlate').size[0]/3);assert.ok(b.beak[0]-b.head[0]>.10);assert.ok(b.billB[1]-b.billE[1]<-.045);for(const side of ['near','far']){assert.ok(b[side+'Hock'][0]<b[side+'Knee'][0]);assert.ok(b[side+'Ankle'][0]>b[side+'Hock'][0]);assert.ok(distance(b[side+'Hip'],b[side+'Knee'])<.1);assert.ok(b[side+'WingTip'][0]<b[side+'WingRoot'][0]-.3);}assert.ok(!r.clips.fly&&!r.clips.swim);assert.equal(compilePackage(r).validation.status,'passed');
});
function seamsFit(rig){return compilePackage(rig).gaskets.every(g=>{const ps=rig.plates.filter(p=>p.role!=='shadow'&&(p.bone===g.jointId||p.span?.includes(g.jointId)||p.points?.includes(g.jointId)));return g.diameterMeters<=Math.min(...ps.map(p=>p.size[0]))+1e-9;});}
test('Goose tiny leg and bill seams fit incident widths; fallback gasket halos are caught',()=>{
 assert.ok(seamsFit(r));for(const id of ['nearHock','nearAnkle','jaw']){const q=structuredClone(r);delete q.joints.find(j=>j.id===id).gasket;assert.equal(seamsFit(q),false,id);}
});
test('Goose idle keeps two entire flat webbed feet fixed on the actual ground plane',()=>{
 const a=solve(r,{clip:'idle',time:0}),pkg=compilePackage(r);for(const id of feet){assert.ok(Math.abs(a[id][2])<1e-8);assert.equal(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters),0);}for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const j of r.joints.filter(j=>/Toe$|Web\d$/.test(j.id))){assert.ok(distance(p[j.id],a[j.id])<1e-7);assert.ok(Math.abs(p[j.id][2])<1e-8);}}
});
test('Goose walk waddles over alternating support, with double support and movement above and below the knee',()=>{
 for(let i=0;i<=1200;i++)assert.ok(core.contactIds(r,'walk',i/1200).length>=1);assert.equal(core.contactIds(r,'walk',.06).length,2);for(const id of ['nearHip','nearKnee','nearHock','nearAnkle']){const a=r.clips.walk.frames.map(f=>f.rotations[id][1]);assert.ok(Math.max(...a)-Math.min(...a)>8,id);}
 const a=solve(r,{clip:'walk',time:.80}),b=solve(r,{clip:'walk',time:.30});assert.ok(a.nearToe[2]>.03&&Math.abs(a.farToe[2])<.00001);assert.ok(b.farToe[2]>.03&&Math.abs(b.nearToe[2])<.00001);assert.ok(Math.abs(solve(r,{clip:'walk',time:0}).pelvis[1]-solve(r,{clip:'walk',time:.5}).pelvis[1])>.013);
});
test('Goose run lowers the neck, doubles cadence, lengthens strides and briefly leaves the ground',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);for(const t of [.46,.96]){assert.deepEqual(core.contactIds(r,'run',t),[]);const p=solve(r,{clip:'run',time:t});for(const id of feet)assert.ok(p[id][2]>.001);}assert.deepEqual(core.contactIds(r,'run',.2),['nearToe']);assert.deepEqual(core.contactIds(r,'run',.7),['farToe']);assert.ok(solve(r,{clip:'run',time:0}).head[2]<solve(r,{clip:'walk',time:0}).head[2]-.04);const extent=clip=>{const a=r.clips[clip].frames.map(f=>solve(r,{clip,time:f.t}).nearToe[0]);return Math.max(...a)-Math.min(...a);};assert.ok(extent('run')>extent('walk')*1.5);
});
test('Goose bite recoils then rapidly lunges through neck hinges, snaps the jaw and recovers over planted soles',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),pre=solve(r,{clip:'attack',time:.36}),hit=solve(r,{clip:'attack',time:.46});assert.deepEqual(a,solve(r,{clip:'idle',time:0}));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));assert.ok(hit.beak[0]>pre.beak[0]+.13);assert.ok(hit.head[2]<pre.head[2]-.08);const angle=t=>c.frames.find(f=>f.t===t).rotations.jaw[1];assert.equal(angle(.46),22);assert.equal(angle(.51),0);assert.equal(c.events.find(e=>e.name==='impact').t,.46);assert.ok(c.frames.find(f=>f.t===.46).rotations.neckLower[1]>30);for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'attack',time:t});assert.deepEqual(core.contactIds(r,'attack',t),feet);for(const id of feet)assert.ok(distance(p[id],a[id])<1e-6);}
});
test('Goose baked clips preserve lengths, joint limits, continuous rotations, loop seams and web clearance between keys',()=>{
 for(const clip of clips){assert.ok(core.preservedClipLengthsPass(r,clip));const c=r.clips[clip];assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<5,clip+'/'+id+' jump');for(const f of c.frames)for(const j of r.joints.filter(j=>j.limits)){const a=f.rotations[j.id]?.[1]||0;assert.ok(a>=j.limits[0]&&a<=j.limits[1]);}for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const j of r.joints.filter(j=>/Toe|Web\d|Hock|Ankle/.test(j.id)))assert.ok(p[j.id][2]>-.00005,clip+'/'+t+'/'+j.id);for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.00005);for(const side of ['near','far'])for(let n=0;n<9;n++)assert.ok(Math.abs(p[side+'Web'+n][2]-p[side+'Toe'][2])<.00001,'web stays flat');}}
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
test('Goose head, neck, folded wings and webbed feet pass dense directional occlusion and full SVG framing checks',()=>{
 for(const clip of clips)for(const time of [0,.15,.28,.36,.42,.46,.5,.51,.53,.65,.76,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);for(const e of elements(s).filter(e=>!e.generated))for(const p of vectorPoints(e.vector))assert.ok(p.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} framing`);}
});
function covered(s,id){const a=actual(s,'headPlate').vector.attributes,b=actual(s,id).vector.attributes,n=b.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi).map(Number);return rank(s,id)<rank(s,'headPlate')&&[[n[0],n[1]],[n.at(-2),n.at(-1)]].every(([x,y])=>((x- +a.cx)/+a.rx)**2+((y- +a.cy)/+a.ry)**2<1);}
test('Goose bill and jaw roots stay actually buried below the head at every angle; promoted roots are caught',()=>{
 for(const clip of clips)for(const time of [0,.28,.36,.46,.51,1])for(const elevation of [0,45,60,75,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading});for(const id of ['beakPlate','lowerBillPlate','beakWebPlate'])assert.ok(covered(s,id),clip+'/'+time+'/'+elevation+'/'+heading+'/'+id);assert.ok(rank(s,'tailSocketPlate')<rank(s,'torsoPlate'));}
 const s=projectScene(r,{clip:'attack',time:.46,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='beakPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='beakPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(covered(s,'beakPlate'),false);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId==='beakPlate'));
});
test('Goose web outlines have three lobes and one real sole frame; geometry helpers never acquire exposed caps',()=>{
 const good=rig=>['near','far'].every(side=>{const p=rig.plates.find(p=>p.id===side+'WebbedFootPlate'),edge=rig.plates.find(p=>p.id===side+'SoleEdgePlate');return p?.points?.length===9&&p.bone===side+'Toe'&&edge.bone===side+'Toe'&&rig.plates.find(p=>p.id===side+'SoleCrossEdgePlate').bone===side+'Toe'&&rig.plates.find(p=>p.id===side+'InstepPlate').bone===side+'Ankle'&&!compilePackage(rig).gaskets.some(g=>/Web\d|SoleTip|WingTip/.test(g.jointId));});assert.ok(good(r));for(const change of ['owner','web','cap']){const q=structuredClone(r);if(change==='owner')q.plates.find(p=>p.id==='nearSoleEdgePlate').bone='nearSoleTip';if(change==='web')q.plates=q.plates.filter(p=>p.id!=='nearWebbedFootPlate');if(change==='cap')q.joints.find(j=>j.id==='nearWingTip').helper=false;assert.equal(good(q),false,change);}
 const b=solve(r,{clip:'bind'});for(const side of ['near','far']){assert.ok(b[side+'Web4'][0]>b[side+'Web3'][0]+.03);assert.ok(b[side+'Web2'][0]>b[side+'Web3'][0]+.015);assert.ok(b[side+'Web6'][0]>b[side+'Web5'][0]+.015);}
});
test('Goose folded wings and crossed foot edges retain thickness head-on and in profile',()=>{
 for(const clip of clips)for(const t of [0,.28,.46,.51,.76,1])for(const heading of [0,90,180,270]){const s=projectScene(r,{clip,time:t,elevation:0,heading});for(const side of ['near','far'])for(const ids of [[side+'WingFeatherPlate'],[side+'SoleEdgePlate',side+'SoleCrossEdgePlate']]){const p=ids.flatMap(id=>vectorPoints(actual(s,id).vector)),w=Math.max(...p.map(p=>p[0]))-Math.min(...p.map(p=>p[0])),h=Math.max(...p.map(p=>p[1]))-Math.min(...p.map(p=>p[1]));assert.ok(w>.3&&h>.3,ids.join(','));}}
});
test('Goose ground shadow stays fixed through waddle, run and bite',()=>{
 const shadow=(clip,time)=>actual(projectScene(r,{clip,time,elevation:45,heading:225}),'castShadow').vector;for(const clip of clips)for(const t of [.15,.28,.46,.51,.65,.76,1])assert.deepEqual(shadow(clip,t),shadow('idle',0));
});
function topFeetBehindBody(s){return['near','far'].every(side=>['WebbedFootPlate','SoleEdgePlate','SoleCrossEdgePlate','InstepPlate'].every(suffix=>rank(s,side+suffix)<rank(s,'torsoPlate')));}
test('Goose feet never paint over the body from above; promoted web surfaces fail the independent visibility oracle',()=>{
 for(const clip of clips)for(let i=0;i<=20;i++)for(let heading=0;heading<360;heading+=22.5)assert.ok(topFeetBehindBody(projectScene(r,{clip,time:i/20,elevation:90,heading})),clip+'/'+i+'/'+heading);
 const s=projectScene(r,{clip:'idle',time:0,elevation:90,heading:0}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='nearWebbedFootPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='nearWebbedFootPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(topFeetBehindBody(s),false);
});
test('Goose bill tip appears in front of the skull head-on and behind it from the rear; feather-covered thighs stay buried',()=>{
 for(const clip of clips)for(const time of [0,.28,.46,.51,.76,1])for(const elevation of [0,30,45]){const front=projectScene(r,{clip,time,elevation,heading:180}),rear=projectScene(r,{clip,time,elevation,heading:0});assert.ok(rank(front,'billTipPlate')>rank(front,'headPlate'));assert.ok(rank(rear,'billTipPlate')<rank(rear,'headPlate'));for(const s of [front,rear])for(const side of ['near','far'])assert.ok(rank(s,side+'ThighPlate')<rank(s,'torsoPlate'));}
 const clean=rig=>['near','far'].every(side=>rig.plates.find(p=>p.id===side+'ThighPlate').occlusionMode==='under-core');assert.ok(clean(r));const q=structuredClone(r);q.plates.find(p=>p.id==='nearThighPlate').occlusionMode='surface-relative';assert.equal(clean(q),false);
});
