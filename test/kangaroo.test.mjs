import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('kangaroo'),feet=['nearFoot','farFoot'],distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const area=(s,ids)=>{const P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition]));return Math.abs(ids.reduce((n,id,i)=>{const a=P[id],b=P[ids[(i+1)%ids.length]];return n+a[0]*b[1]-b[0]*a[1];},0))/2;};
test('Kangaroo has an upright narrow chest, heavy haunches, small forearms, long feet and a substantial tapering tail',()=>{
 const p=solve(r,{clip:'idle',time:0}),plate=id=>r.plates.find(p=>p.id===id);assert.deepEqual(r.archetypes,['kangaroo','macropod']);assert.ok(p.head[2]>1.35&&p.head[2]<1.45);assert.ok(p.chest[2]>p.pelvis[2]+.45);assert.ok(p.nearKnee[2]>p.nearHip[2]+.1);assert.ok(distance(p.nearKnee,p.nearHock)>distance(p.nearHip,p.nearKnee)*2);assert.ok(distance(p.nearHock,p.nearFoot)>.24);assert.ok(plate('nearHaunchPlate').size[0]>plate('chestPlate').size[0]*1.3);assert.ok(plate('tailUpperPlate').size[0]>plate('tailTipPlate').size[0]*2);assert.ok(p.tailTip[0]<-1.1);assert.ok(p.nearEarTip[2]>1.65);const pkg=compilePackage(r);assert.equal(pkg.validation.status,'passed');for(const side of ['near','far'])assert.ok(pkg.gaskets.find(g=>g.jointId===side+'Knee').diameterMeters<=plate(side+'ShinPlate').size[0],'knee connectors fit the slender shins');
});
test('Kangaroo supported bind gives all five limb/tail contact surfaces true zero offsets',()=>{
 const p=solve(r,{clip:'bind'}),pkg=compilePackage(r);for(const id of [...feet,'nearHand','farHand','tailContact']){assert.ok(Math.abs(p[id][2])<2e-8);assert.equal(Math.abs(pkg.joints.find(j=>j.id===id).contactSurfaceOffsetMeters),0);}assert.ok(solve(r,{clip:'idle',time:0}).nearHand[2]>.6,'upright idle raises the hands from supported bind');
});
test('Kangaroo idle keeps feet and tail anchored while the ground shadow stays fixed through every action',()=>{
 const a=solve(r,{clip:'idle',time:0});for(let i=0;i<=1200;i++){const p=solve(r,{clip:'idle',time:i/1200});for(const id of [...feet,'tailContact'])assert.ok(distance(p[id],a[id])<2e-8);}
 const shadow=(clip,time)=>projectScene(r,{clip,time,elevation:45,heading:225}).compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 for(const clip of ['idle','walk','run','attack','kick','hop'])for(const time of [.25,.44,.75,1])assert.deepEqual(shadow(clip,time),shadow('idle',0));
});
test('Kangaroo slow walk advances paired hind feet over hands and tail, then resets those supports over the feet',()=>{
 const low=solve(r,{clip:'walk',time:.26}),reset=solve(r,{clip:'walk',time:.66});assert.ok(low.head[2]<1);assert.ok(low.nearFoot[2]>.15&&low.farFoot[2]>.15);assert.deepEqual(new Set(core.contactIds(r,'walk',.26)),new Set(['nearHand','farHand','tailContact']));assert.deepEqual(new Set(core.contactIds(r,'walk',.66)),new Set(feet));assert.ok(reset.nearHand[2]>.1&&reset.tailContact[2]>.04);
});
test('Kangaroo fast travel is a paired airborne hop with a raised counterbalance tail',()=>{
 assert.ok(r.clips.run.duration<r.clips.walk.duration*.4);const p=solve(r,{clip:'run',time:.62});assert.deepEqual(core.contactIds(r,'run',.62),[]);assert.ok(p.nearFoot[2]>.3&&p.tailContact[2]>.5);assert.ok(p.head[2]<solve(r,{clip:'idle',time:0}).head[2]);
 for(let i=0;i<=1200;i++){const p=solve(r,{clip:'run',time:i/1200});assert.ok(Math.abs(p.nearFoot[0]-p.farFoot[0])<1e-8);assert.ok(Math.abs(p.nearFoot[2]-p.farFoot[2])<1e-8);}
});
test('Kangaroo punch extends one arm from guard while the other guards and the feet/tail brace',()=>{
 const a=solve(r,{clip:'attack',time:0}),guard=solve(r,{clip:'attack',time:.20}),hit=solve(r,{clip:'attack',time:.42});assert.ok(guard.nearHand[2]>.95);assert.ok(hit.nearHand[0]>guard.nearHand[0]+.35);assert.ok(hit.nearHand[0]>hit.farHand[0]+.24);assert.ok(hit.farHand[2]>1);assert.deepEqual(a,solve(r,{clip:'attack',time:1}));for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip:'attack',time});for(const id of [...feet,'tailContact'])assert.ok(distance(p[id],a[id])<2e-6);}
});
test('Kangaroo kick anchors the tail before lift, leans back, kicks both feet and lands before recovery',()=>{
 const a=solve(r,{clip:'kick',time:0}),hit=solve(r,{clip:'kick',time:.44});assert.ok(hit.pelvis[0]<a.pelvis[0]-.29);assert.ok(hit.chest[0]<a.chest[0]-.2);assert.ok(hit.nearFoot[2]>.74&&hit.nearFoot[0]>.79);assert.ok(hit.nearHand[2]>.9);assert.ok(hit.nearFoot[2]-hit.nearHock[2]>.14,'toes turn up to present the sole');assert.deepEqual(core.contactIds(r,'kick',.44),['tailContact']);assert.equal(core.contactIds(r,'kick',.18).length,3);assert.equal(core.contactIds(r,'kick',.80).length,3);assert.deepEqual(a,solve(r,{clip:'kick',time:1}));
 for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip:'kick',time});assert.ok(core.contactIds(r,'kick',time).includes('tailContact'));assert.ok(distance(p.tailContact,a.tailContact)<2e-6);assert.ok(Math.abs(p.nearFoot[2]-p.farFoot[2])<1e-8);assert.ok(Math.abs(p.tailTip[2]-.025)<2e-6);}
});
test('Kangaroo bakes preserve lengths, limits, contact clearance and continuous angles across upward thigh branch cuts',()=>{
 for(const clip of ['idle','walk','run','attack','kick','hop']){const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});for(let i=1;i<c.frames.length;i++)for(const[id,v]of Object.entries(c.frames[i].rotations))for(let k=0;k<3;k++)assert.ok(Math.abs(v[k]-(c.frames[i-1].rotations[id]?.[k]||0))<4,`${clip}/${id} branch discontinuity`);
 for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip,time});for(const id of [...feet,'nearHand','farHand','nearHock','farHock','tailMid','tailContact','tailTip'])assert.ok(p[id][2]>-.0001,`${clip}/${time}/${id} clearance`);for(const id of core.contactIds(r,clip,time))assert.ok(Math.abs(p[id][2])<.0001);}}
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
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
test('Kangaroo haunches, arms and tail, limb seams and framing pass the dense directional matrix',()=>{
 for(const clip of ['idle','walk','run','attack','kick','hop'])for(const time of [0,.12,.20,.28,.32,.44,.52,.64,.76,.80,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=1&&v<=99),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
  for(const e of s.compositingGroups.flatMap(g=>g.elements).filter(e=>!e.generated))for(const point of vectorPoints(e.vector))assert.ok(point.every(v=>v>=.6&&v<=99.4),`${clip}/${time}/${elevation}/${heading}/${e.sourceId} vector framing`);
 }
});
test('Kangaroo buried head connector promotion is detected independently of parity',()=>{
 const s=projectScene(r,{clip:'kick',time:.44,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='headGasket'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='headGasket'&&!e.generated);assert.ok(s.compositingGroups.flatMap(g=>g.elements).findIndex(e=>e.sourceId==='headGasket'&&!e.generated)<s.compositingGroups.flatMap(g=>g.elements).findIndex(e=>e.sourceId==='headPlate'&&!e.generated));s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(...g.elements.splice(i,1));const es=s.compositingGroups.flatMap(g=>g.elements),rank=id=>es.findIndex(e=>e.sourceId===id&&!e.generated);assert.ok(rank('headGasket')>rank('headPlate'),'promoted seam is visibly above its skull');
});
test('Kangaroo hands keep the declared foreground layer, even where the rear view overlaps its haunches',()=>{
 const s=projectScene(r,{clip:'idle',time:0,elevation:0,heading:0});
 const foreground=scene=>['near','far'].every(side=>scene.compositingGroups.find(g=>g.id==='cameraNearAppendagesGroup').elements.some(e=>e.sourceId===side+'HandPlate'&&!e.generated));
 assert.ok(foreground(s));const g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='farHandPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='farHandPlate'&&!e.generated),[hand]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='cameraFarAppendagesGroup').elements.push(hand);assert.equal(foreground(s),false,'a single buried hand is detected');
});
test('Kangaroo upright guard bends at low elbows with forearms reaching forward instead of dangling down',()=>{
 for(const clip of ['idle','hop','run'])for(let i=0;i<=100;i++){const p=solve(r,{clip,time:i/100});for(const side of ['near','far']){const a=p[side+'Shoulder'],b=p[side+'Elbow'],c=p[side+'Hand'];assert.ok(b[2]<a[2]-.10,`${clip}: elbow below shoulder`);assert.ok(c[0]>b[0]+.20,`${clip}: forearm reaches forward`);assert.ok(Math.abs(c[2]-b[2])<(c[0]-b[0])*.6,`${clip}: forearm is predominantly forward`);}}
 // The previous opposite IK branch put the elbow ahead of the hand, making
 // its lower segment a near-vertical hanging stick despite passing visibility.
 const p=solve(r,{clip:'idle',time:0});assert.ok(p.nearElbow[0]<p.nearShoulder[0]);
});
