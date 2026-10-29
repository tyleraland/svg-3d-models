import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
import{auditRig}from'@paper-rig/validator/audit';
const r=loadModel('moose'),feet=r.clips.idle.contacts,distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const area=(s,ids)=>{const P=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition]));return Math.abs(ids.reduce((n,id,i)=>{const a=P[id],b=P[ids[(i+1)%ids.length]];return n+a[0]*b[1]-b[0]*a[1];},0))/2;};
test('Moose has high shoulders, long legs/muzzle, bell and broad swept palmate antlers',()=>{
 const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id),b=solve(r,{clip:'bind'});
 assert.deepEqual(r.archetypes,['moose']);assert.ok(b.pelvis[2]>1.5&&b.chest[2]>b.pelvis[2]+.09);assert.ok(b.withersHump[2]>b.chest[2]+.17);
 assert.ok(p('torsoPlate').size[0]>.7&&j('muzzle').bind[0]>.35&&j('muzzle').bind[2]<-.2);assert.ok(b.bellTip[2]<b.head[2]-.35);assert.ok(distance(j('tailTip').bind,[0,0,0])<.18);
 for(const side of ['near','far']){assert.equal(p(side+'AntlerPalmPlate').shape,'polygon');assert.equal(p(side+'AntlerPalmPlate').semanticDetailTier,'identity');assert.ok(p(side+'AntlerPalmPlate').points.length>=8);assert.equal(r.plates.filter(p=>p.id.startsWith(side+'AntlerTine')).length,6);}
 assert.ok(b.nearAntlerTine4Tip[2]>2.8);assert.ok(b.nearAntlerPalm4[0]<b.head[0]-.6);assert.ok(b.nearAntlerPalm4[1]-b.farAntlerPalm4[1]>1.5);
 assert.ok(core.rigidPlateSpanLengthsPass(r));assert.equal(compilePackage(r).validation.status,'passed');
});
test('Moose palm surfaces retain area in top/front/profile and the complete rack stays rigid to its skull',()=>{
 for(const elevation of [0,45,90])for(const heading of [0,90,180,270]){const s=projectScene(r,{clip:'idle',time:0,elevation,heading});for(const side of ['near','far'])assert.ok(area(s,r.plates.find(p=>p.id===side+'AntlerPalmPlate').points)>8,`${elevation}/${heading}/${side}`);}
 const base=solve(r,{clip:'bind'}),ids=r.joints.filter(j=>/Antler/.test(j.id)).map(j=>j.id);
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.18,.32,.44,.5,.58,.66,.83,1]){const p=solve(r,{clip,time});for(const id of ids)for(const anchor of ['head','muzzle','bellTip'])assert.ok(Math.abs(distance(p[id],p[anchor])-distance(base[id],base[anchor]))<2e-7,`${clip}/${time}/${id}/${anchor}`);}
});
test('Moose idle breathes over four fixed grounded hooves and a fixed ground shadow',()=>{
 const a=solve(r,{clip:'idle',time:0});let min=Infinity,max=-Infinity;
 const shadow=s=>s.compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId==='castShadow').vector;
 const initial=shadow(projectScene(r,{clip:'idle',time:0,elevation:45,heading:225}));
 for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip:'idle',time:t});for(const id of feet){assert.ok(Math.abs(p[id][2])<2e-8);assert.ok(distance(p[id],a[id])<2e-8);}min=Math.min(min,p.pelvis[2]);max=Math.max(max,p.pelvis[2]);}
 assert.ok(max-min>.007);for(const time of [.25,.5,.75,1])assert.deepEqual(shadow(projectScene(r,{clip:'idle',time,elevation:45,heading:225})),initial);
});
test('Moose locomotion has four walk footfalls, a faster suspended gallop and whole-leg articulation',()=>{
 assert.deepEqual(r.clips.walk.events.map(e=>e.t),[0,.25,.5,.75]);assert.ok(r.clips.run.duration<r.clips.walk.duration*.5);assert.deepEqual(core.contactIds(r,'run',.83),[]);
 for(const clip of ['walk','run'])for(const part of ['nearFrontHip','nearFrontKnee','nearFrontCarpus','nearRearHip','nearRearKnee','nearRearHock']){const v=r.clips[clip].frames.map(f=>f.rotations[part]?.[1]||0);assert.ok(Math.max(...v)-Math.min(...v)>8,`${clip}/${part}`);}
});
test('Moose idle/walk/run/gore preserve lengths, limits, grounded supports and loop closure between keys',()=>{
 for(const clip of ['idle','walk','run','attack']){const c=r.clips[clip];assert.ok(core.preservedClipLengthsPass(r,clip));if(c.loop)assert.deepEqual(c.frames[0],{...c.frames.at(-1),t:0});
  for(let i=0;i<=1200;i++){const t=i/1200,p=solve(r,{clip,time:t});for(const id of feet){assert.ok(p[id][2]>-.0001,`${clip}/${t}/${id} clearance`);if(core.contactIds(r,clip,t).includes(id))assert.ok(Math.abs(p[id][2])<.0001,`${clip}/${t}/${id} contact`);}}
 }
 const a=auditRig(r);assert.equal(a.status,'passed',JSON.stringify(a.issues));
});
test('Moose gore lowers/aims the rack then rapidly drives and lifts it over a planted brace',()=>{
 const c=r.clips.attack,a=solve(r,{clip:'attack',time:0}),low=solve(r,{clip:'attack',time:.44}),hit=solve(r,{clip:'attack',time:.58}),lift=solve(r,{clip:'attack',time:.66});
 assert.ok(low.head[2]<a.head[2]-.35);assert.ok(hit.nearAntlerTine5Tip[0]>low.nearAntlerTine5Tip[0]+.06);assert.ok(lift.nearAntlerTine5Tip[2]>hit.nearAntlerTine5Tip[2]+.7);
 assert.ok((.58-.44)*c.duration<250);assert.equal(c.events.find(e=>e.name==='impact').t,.58);assert.ok(c.events.every(e=>e.phase));assert.deepEqual(a,solve(r,{clip:'attack',time:1}));
 for(let i=0;i<=1200;i++){const time=i/1200,p=solve(r,{clip:'attack',time});assert.deepEqual(core.contactIds(r,'attack',time),feet);for(const id of feet)assert.ok(distance(p[id],a[id])<2e-6);}
});
test('Moose rack, bell, head, limb seams and framing pass the dense directional matrix',()=>{
 for(const clip of ['idle','walk','run','attack'])for(const time of [0,.18,.25,.32,.44,.5,.58,.66,.75,.83,.94,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){
  const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);
  for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=1&&v<=99),`${clip}/${time}/${elevation}/${heading}/${j.id}`);
 }
});
test('Moose buried jaw seam mutation is detected independently of golden/browser parity',()=>{
 const s=projectScene(r,{clip:'attack',time:.32,elevation:45,heading:135}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='jawGasket'&&!e.generated));
 const i=g.elements.findIndex(e=>e.sourceId==='jawGasket'&&!e.generated);g.elements.push(...g.elements.splice(i,1));assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-seam-incident-order'));
});
test('Moose far antler stem cannot be promoted over a nearer ear at head-on strike',()=>{
 const s=projectScene(r,{clip:'attack',time:.58,elevation:0,heading:0});assert.deepEqual(inspectOcclusion(r,s).violations,[]);
 const g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='farAntlerStemPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='farAntlerStemPlate'&&!e.generated);g.elements.push(...g.elements.splice(i,1));
 assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='head-depth-order'&&v.elementId==='farAntlerStemPlate'));
});
