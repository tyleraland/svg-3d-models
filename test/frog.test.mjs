import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,projectScene,compilePackage,core}from'@paper-rig/compiler';
import{inspectOcclusion,inspectHeadOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
import{ik}from'../scripts/lib/spatial-leg-ik.mjs';
const r=loadModel('frog'),clips=['idle','walk','run','attack','ko'],feet=['nearFrontPaw','farFrontPaw','nearRearPaw','farRearPaw'],dist=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k])),els=s=>s.compositingGroups.flatMap(g=>g.elements),actual=(s,id)=>els(s).find(e=>e.sourceId===id&&!e.generated);
const sub=(a,b)=>a.map((v,k)=>v-b[k]),angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,a.reduce((n,v,k)=>n+v*b[k],0)/Math.hypot(...a)/Math.hypot(...b))))*180/Math.PI;
test('Frog has a low broad body, raised eyes, splayed toes and the reference three-part zigzag hind leg',()=>{
 const p=solve(r,{clip:'bind'});assert.deepEqual(r.archetypes,['frog','amphibian']);assert.ok(r.plates.length<35);assert.equal(r.joints.some(j=>/tail/i.test(j.id)),false);assert.ok(p.head[0]>p.chest[0]+.1);assert.ok(p.head[2]>.28&&p.head[2]<.32);for(const side of ['near','far']){assert.ok(p[side+'EyeBulge'][2]>p.head[2]+.045);assert.ok(p[side+'RearKnee'][0]>p[side+'RearHip'][0]+.15);assert.ok(p[side+'RearAnkle'][0]<p[side+'RearKnee'][0]-.25);assert.ok(p[side+'RearPaw'][0]>p[side+'RearAnkle'][0]+.24);assert.ok(p[side+'RearKnee'][2]<p[side+'RearHip'][2]);assert.ok(Math.abs(p[side+'RearPaw'][1])>.30);const front=dist(p[side+'FrontHip'],p[side+'FrontKnee'])+dist(p[side+'FrontKnee'],p[side+'FrontPaw']),rear=dist(p[side+'RearHip'],p[side+'RearKnee'])+dist(p[side+'RearKnee'],p[side+'RearAnkle'])+dist(p[side+'RearAnkle'],p[side+'RearPaw']);assert.ok(rear>front*1.6);}
 assert.equal(compilePackage(r).validation.status,'passed');
});
test('Frog idle breathes above four fixed grounded contacts',()=>{
 const a=solve(r,{clip:'idle',time:0}),b=solve(r,{clip:'idle',time:.5});assert.ok(dist(a.pelvis,b.pelvis)>.0015);for(let i=0;i<=600;i++){const p=solve(r,{clip:'idle',time:i/600});assert.deepEqual(new Set(core.contactIds(r,'idle',i/600)),new Set(feet));for(const id of feet)assert.ok(dist(p[id],a[id])<3e-6);}
 const pkg=compilePackage(r);for(const id of feet)assert.equal(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters),0);
});
test('Frog crawl uses slow coordinated supported steps with low foot recovery',()=>{
 assert.ok(r.clips.walk.duration>r.clips.run.duration*1.8);const heights=Object.fromEntries(feet.map(id=>[id,0]));for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'walk',time:t});assert.ok(new Set(core.contactIds(r,'walk',t)).size>=3);for(const id of feet)heights[id]=Math.max(heights[id],p[id][2]);}for(const h of Object.values(heights))assert.ok(h>.020&&h<.024);
});
test('Frog paired hop changes upper/lower/distal hind-leg angles and trails the feet during flight',()=>{
 const a=solve(r,{clip:'run',time:0}),p=solve(r,{clip:'run',time:.52});assert.deepEqual(core.contactIds(r,'run',.52),[]);assert.ok(p.pelvis[2]>a.pelvis[2]+.33);for(const side of ['near','far']){assert.ok(p[side+'RearPaw'][0]<a[side+'RearPaw'][0]-.45);assert.ok(p[side+'RearPaw'][2]>.22);for(const [x,y,minimum]of [['RearHip','RearKnee',25],['RearKnee','RearAnkle',25],['RearAnkle','RearPaw',80]])assert.ok(angle(sub(a[side+y],a[side+x]),sub(p[side+y],p[side+x]))>minimum,side+x);}
 assert.equal(r.clips.run.events.find(e=>e.name==='paired-takeoff').t,.30);assert.equal(r.clips.run.events.find(e=>e.name==='landing').t,.80);assert.ok(p.nearFrontPaw[0]>a.nearFrontPaw[0]+.07);assert.ok(Math.abs(p.nearRearPaw[2]-p.farRearPaw[2])<1e-8);
});
test('Frog attacks with sequenced reaching forelimbs while both hind feet brace',()=>{
 const a=solve(r,{clip:'attack',time:0}),lead=solve(r,{clip:'attack',time:.4}),hit=solve(r,{clip:'attack',time:.62});assert.ok(lead.nearFrontPaw[2]>.015);assert.ok(Math.abs(lead.farFrontPaw[2])<2e-6);assert.ok(hit.nearFrontPaw[0]>a.nearFrontPaw[0]+.23);assert.ok(hit.nearFrontPaw[2]>.17);assert.equal(r.clips.attack.events.find(e=>e.name==='impact').t,.62);assert.deepEqual(a,solve(r,{clip:'attack',time:1}));for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'attack',time:t});for(const id of feet.filter(id=>id.includes('Rear'))){assert.ok(core.contactIds(r,'attack',t).includes(id));assert.ok(dist(p[id],a[id])<3e-6);}}
});
test('Frog KO rises, rolls onto its back and leaves a distinct terminal pose with feet raised',()=>{
 const a=solve(r,{clip:'ko',time:0}),up=solve(r,{clip:'ko',time:.30}),p=solve(r,{clip:'ko',time:1});assert.equal(r.clips.ko.loop,false);assert.ok(up.pelvis[2]>a.pelvis[2]+.35);assert.ok(p.head[2]<a.head[2]-.15);assert.deepEqual(core.contactIds(r,'ko',1),[]);for(const id of feet)assert.ok(p[id][2]>p.pelvis[2]+.15);assert.equal(r.clips.ko.frames.at(-1).rotations.pelvis[0],180);
});
test('Frog baked clips preserve bone lengths, continuous rotations, contact height and intermediate toe clearance',()=>{
 for(const clip of clips){const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<3,clip+'/'+id);for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const j of r.joints.filter(j=>j.role==='limb'))assert.ok(p[j.id][2]>-.000005,`${clip}/${t}/${j.id}`);for(const id of core.contactIds(r,clip,t))assert.ok(Math.abs(p[id][2])<.000005);}}
 assert.equal(auditRig(r).status,'passed');
});
function points(v){const a=v.attributes;let ps=[];if(v.tag==='ellipse'||v.tag==='circle'){const x=+a.cx,y=+a.cy,rx=+(a.rx??a.r),ry=+(a.ry??a.r);ps=[[x-rx,y-ry],[x+rx,y-ry],[x+rx,y+ry],[x-rx,y+ry]];}else if(v.tag==='rect'){const x=+a.x,y=+a.y,w=+a.width,h=+a.height;ps=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}else if(v.tag==='path'){const ns=(a.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)||[]).map(Number);for(let i=0;i<ns.length;i+=2)ps.push([ns[i],ns[i+1]]);}else throw Error(v.tag);if(a.transform?.startsWith('rotate(')){const[d,x=0,y=0]=a.transform.slice(7,-1).split(/[ ,]+/).map(Number),w=d*Math.PI/180;ps=ps.map(([u,v])=>[x+(u-x)*Math.cos(w)-(v-y)*Math.sin(w),y+(u-x)*Math.sin(w)+(v-y)*Math.cos(w)]);}else if(a.transform?.startsWith('matrix(')){const[m,n,o,p,x,y]=a.transform.slice(7,-1).split(/[ ,]+/).map(Number);ps=ps.map(([u,v])=>[m*u+o*v+x,n*u+p*v+y]);}else assert.ok(!a.transform);return ps;}
test('Frog actual SVG framing, head/root layering and fixed shadow hold across poses, side/oblique/top cameras',()=>{
 for(const clip of clips)for(const time of [0,.12,.20,.30,.42,.52,.62,.72,.80,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);assert.deepEqual(inspectHeadOcclusion(r,s).violations,[]);for(const e of els(s).filter(e=>!e.generated))for(const p of points(e.vector))assert.ok(p.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId}: ${p}`);}
 for(const clip of clips)for(const time of [.2,.52,.62,1])assert.deepEqual(actual(projectScene(r,{clip,time,elevation:45,heading:135}),'castShadow').vector,actual(projectScene(r,{clip:'idle',time:0,elevation:45,heading:135}),'castShadow').vector);
 const s=projectScene(r,{clip:'idle',time:0,elevation:90,heading:0}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='headConnectorPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='headConnectorPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId==='headConnectorPlate'));
});
test('Frog outward IK pole preserves its native low knee; the default upward pole is rejected by the anatomy check',()=>{
 const a=solve(r,{clip:'bind'}),hip=r.joints.find(j=>j.id==='nearRearHip'),knee=r.joints.find(j=>j.id==='nearRearKnee'),foot=r.joints.find(j=>j.id==='nearRearAnkle'),chain={hip,knee,foot},good=ik(chain,a[hip.id],a[foot.id],core.euler([0,0,0]),knee.bind),up=ik(chain,a[hip.id],a[foot.id],core.euler([0,0,0]));const q=structuredClone(r);q.clips.idle.frames[0].rotations={...q.clips.idle.frames[0].rotations,...up};assert.ok(solve(q,{clip:'idle',time:0}).nearRearKnee[2]>a.nearRearHip[2]+.1);for(const v of Object.values(good))assert.ok(v.every(n=>Math.abs(n)<1e-6));
});
test('Frog blunt snout remains visibly ahead of the planted forefeet in both overhead and profile views',()=>{
 for(const[elevation,heading,axis]of[[90,0,1],[0,90,0]]){const s=projectScene(r,{clip:'idle',time:0,elevation,heading}),nose=Math.min(...['headPlate','chinPlate'].map(id=>{const a=actual(s,id).vector.attributes;return axis===0?+a.cx- +a.rx:+a.cy- +a.ry;})),toes=Math.min(...s.joints.filter(j=>/FrontToe\d+$/.test(j.id)).map(j=>j.screenPosition[axis]));assert.ok(toes-nose>r.tokenScale*.07,`${elevation}/${heading}: snout must project beyond the toes`);}
});
