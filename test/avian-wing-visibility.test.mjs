import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{projectScene,solve,core}from'@paper-rig/compiler';
// Independent projected-area measurement catches collapsed paper panels even
// when the renderer/compiler agree and structural/occlusion checks all pass.
function wingArea(rig,scene,side){
 const P=Object.fromEntries(scene.joints.map(j=>[j.id,j.screenPosition]));
 return rig.plates.filter(p=>p.id.startsWith(side)&&/Wing/.test(p.id)).reduce((sum,p)=>{
  if(p.points)return sum+Math.abs(p.points.reduce((s,id,i)=>{const a=P[id],b=P[p.points[(i+1)%p.points.length]];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
  const a=scene.compositingGroups.flatMap(g=>g.elements).find(e=>e.sourceId===p.id&&!e.generated)?.vector;
  if(a?.tag==='rect')return sum+Number(a.attributes.width)*Number(a.attributes.height);
  if(a?.tag==='ellipse')return sum+Math.PI*Number(a.attributes.rx)*Number(a.attributes.ry);
  return sum;
 },0);
}
test('Crow and Eagle folded wings retain filled area from frontal and overhead cameras',()=>{
 for(const id of ['crow','flyingBird']){
  const rig=loadModel(id);
  for(const clip of ['idle','walk','run','hop'])for(const time of [0,.25,.48,.75,1])for(let elevation=0;elevation<=90;elevation+=5)for(const heading of [0,180]){
   const scene=projectScene(rig,{clip,time,elevation,heading});
   for(const side of ['near','far'])assert.ok(wingArea(rig,scene,side)>1,`${id}/${clip}/${time}/${elevation}/${heading}/${side} wing silhouette collapses`);
  }
  const radius=rig.plates.find(p=>p.id==='bodyPlate').size[0]/2;
  for(const clip of ['idle','walk','run','hop'])for(const time of [0,.25,.48,.75,1]){
   const pose=solve(rig,{clip,time});
   for(const side of ['near','far'])assert.ok((side==='near'?1:-1)*(pose[side+'WingTip'][1]-pose.body[1])>radius+.01,`${id}/${clip}/${time} folded tip is buried inside the body silhouette`);
  }
  const broken=structuredClone(rig);
  for(const f of broken.clips.idle.frames)for(const side of ['near','far']){const s=side==='near'?1:-1;f.rotations[side+'WingRoot']=[0,90,s*90];f.rotations[side+'WingWrist']=[0,180,s*180];}
  const scene=projectScene(broken,{clip:'idle',time:0,elevation:45,heading:180});
  assert.ok(wingArea(broken,scene,'near')<1,'old coplanar pose mutation reproduces near-zero wing area');
 }
});
test('Crow hop fans both wings out at the apex and never pulls a tip through the torso',()=>{
 const rig=loadModel('crow'),rest=solve(rig,{clip:'hop',time:0}),apex=solve(rig,{clip:'hop',time:.48});
 for(const side of ['near','far']){
  const sign=side==='near'?1:-1,lateral=p=>sign*(p[side+'WingTip'][1]-p.body[1]);
  assert.ok(lateral(apex)>lateral(rest)*4,'apex is a broad fan rather than a tighter fold');
  assert.ok(lateral(apex)>.7,'distal chain unfolds to nearly its full lateral reach');
 }
 for(let i=0;i<=1200;i++){
  const time=i/1200,p=solve(rig,{clip:'hop',time});
  for(const side of ['near','far']){
   const sign=side==='near'?1:-1;
   assert.ok(sign*(p[side+'WingTip'][1]-p[side+'WingRoot'][1])>.02,`${time}/${side} tip crosses behind its shoulder`);
  }
  for(const [id,v]of Object.entries(p))if(/Wing|Primary/.test(id))assert.ok(v[2]>0,`${time}/${id} wing hits ground`);
 }
 assert.ok(core.preservedClipLengthsPass(rig,'hop'));
 const old=structuredClone(rig);
 for(const f of old.clips.hop.frames){const open=Math.sin(Math.PI*Math.max(0,Math.min(1,(f.t-.18)/.60)))**2;for(const side of ['near','far']){const s=side==='near'?1:-1;f.rotations[side+'WingRoot']=[0,90-35*open,s*(90-18*open)];f.rotations[side+'WingElbow']=[0,0,s*(180-30*open)];f.rotations[side+'WingWrist']=[0,180-20*open,s*(180-25*open)];}}
 const oldApex=solve(old,{clip:'hop',time:.48});assert.ok(oldApex.nearWingTip[1]-oldApex.body[1]<.2,'old assist mutation reproduces inward-folded apex');
});
test('Chicken, Harpy and Angel retain structural wing silhouettes at the same frontal cameras',()=>{
 for(const id of ['walkingBird','harpy','angel']){
  const rig=loadModel(id),sides=id==='walkingBird'?['near','far']:['left','right'];
  for(const clip of ['idle','walk','attack'])for(const time of [0,.5,1])for(const elevation of [0,30,45,60,75,90])for(const heading of [0,180]){
   const scene=projectScene(rig,{clip,time,elevation,heading});for(const side of sides)assert.ok(wingArea(rig,scene,side)>1,`${id}/${clip}/${time}/${elevation}/${heading}/${side}`);
  }
 }
});
