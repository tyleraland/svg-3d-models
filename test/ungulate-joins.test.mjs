import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{projectScene,solve}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
const models=['bull','boar','mountainGoat','cow'],clips=['idle','walk','run','attack'];
const elements=s=>s.compositingGroups.flatMap(g=>g.elements),actual=(s,id)=>elements(s).find(e=>e.sourceId===id&&!e.generated),rank=(s,id)=>elements(s).findIndex(e=>e.sourceId===id&&!e.generated);
function baseBuried(s){
 const head=actual(s,'headPlate').vector.attributes,connector=actual(s,'muzzleConnectorPlate').vector.attributes,n=connector.d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi).map(Number);
 const corners=[[n[0],n[1]],[n.at(-2),n.at(-1)]];
 return rank(s,'muzzleConnectorPlate')<rank(s,'headPlate')&&corners.every(([x,y])=>((x- +head.cx)/+head.rx)**2+((y- +head.cy)/+head.ry)**2<1);
}
test('Bovine, boar and goat muzzle bases are actually covered by the opaque head across poses and cameras',()=>{
 for(const id of models){const r=loadModel(id);for(const clip of clips)for(const time of [0,.25,.5,.75,1])for(const elevation of [0,45,75,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading});assert.ok(baseBuried(s),`${id}/${clip}/${time}/${elevation}/${heading}`);}}
});
test('Restoring exposed muzzle sorting or promoting the triangle is caught independently of golden parity',()=>{
 for(const id of models){const r=loadModel(id),camera={clip:'idle',time:0,elevation:45,heading:180},exposed=structuredClone(r);delete exposed.plates.find(p=>p.id==='muzzleConnectorPlate').occlusionMode;assert.equal(baseBuried(projectScene(exposed,camera)),false,id+' old exposed base');
 const s=projectScene(r,camera),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='muzzleConnectorPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='muzzleConnectorPlate'&&!e.generated),[p]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(p);assert.equal(baseBuried(s),false);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId==='muzzleConnectorPlate'&&v.kind==='buried-connector-order'));}
});
function ellipseRadius(s,id,point){const a=actual(s,id).vector.attributes;return((point[0]- +a.cx)/+a.rx)**2+((point[1]- +a.cy)/+a.ry)**2;}
test('Bull and cow tails mount on the rump perimeter and remain outside its side silhouette throughout motion',()=>{
 for(const id of ['bull','cow']){const r=loadModel(id),connector=r.plates.find(p=>p.id==='tailConnectorPlate');assert.deepEqual(connector.span,['tailSocket','tailBase']);
 for(const clip of clips)for(let i=0;i<=60;i++)for(const heading of [90,270]){const s=projectScene(r,{clip,time:i/60,elevation:0,heading}),p=Object.fromEntries(s.joints.map(j=>[j.id,j.screenPosition])),radius=ellipseRadius(s,'pelvisPlate',p.tailBase);assert.ok(radius>.9&&radius<1.16,`${id}/${clip}/${i}/${heading} root on perimeter`);assert.ok(ellipseRadius(s,'pelvisPlate',p.tailSocket)<.95);
 for(const u of [.25,.5,.75,1]){const q=p.tailBase.map((v,k)=>v+(p.tailTip[k]-v)*u);assert.ok(ellipseRadius(s,'pelvisPlate',q)>1,`${id}/${clip}/${i}/${heading} external shaft`);}}
 }
});
test('An internal tail-root regression fails the perimeter check',()=>{
 const r=loadModel('bull');r.joints.find(j=>j.id==='tailBase').bind=[-.16,0,.04];const s=projectScene(r,{clip:'idle',time:0,elevation:0,heading:90}),p=s.joints.find(j=>j.id==='tailBase').screenPosition;assert.ok(ellipseRadius(s,'pelvisPlate',p)<.5);
});
test('Bull horns curve slightly farther forward as one continuous paired-ribbon volume',()=>{
 const r=loadModel('bull'),j=id=>r.joints.find(j=>j.id===id);for(const side of ['near','far']){assert.ok(j(side+'HornCenter6').bind[0]>.19&&j(side+'HornCenter6').bind[0]<.22);assert.ok(j(side+'HornCenter5').bind[0]>.12);assert.deepEqual(j(side+'HornRim0_6').bind,j(side+'HornCross0_6').bind);assert.equal(j(side+'HornCenter6').bind[2],.43);}
});
test('Cow keeps a deeper stout barrel and a buried rump cap rather than a foreground pelvis oval',()=>{
 const r=loadModel('cow'),p=id=>r.plates.find(p=>p.id===id),b=solve(r,{clip:'bind'});assert.ok(p('torsoPlate').size[0]/b.pelvis[2]>.73);assert.ok(b.pelvis[2]<1.2);assert.ok(p('torsoPlate').size[0]>.85);assert.ok(Math.abs(b.chest[2]-b.pelvis[2])<.03);
 const buried=s=>rank(s,'pelvisPlate')<rank(s,'torsoPlate');for(const clip of clips)for(const time of [0,.25,.5,.75,1])for(const elevation of [0,45,75,90])for(let heading=0;heading<360;heading+=45)assert.ok(buried(projectScene(r,{clip,time,elevation,heading})));
 const s=projectScene(r,{clip:'idle',time:0,elevation:45,heading:225}),g=s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId==='pelvisPlate'&&!e.generated)),i=g.elements.findIndex(e=>e.sourceId==='pelvisPlate'&&!e.generated),[pelvis]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='coreSurfaceGroup').elements.push(pelvis);assert.equal(buried(s),false,'foreground rump mutation');assert.ok(inspectOcclusion(r,s).violations.some(v=>v.elementId==='pelvisPlate'));
});
