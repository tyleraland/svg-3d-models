// Author-time WildMesh chicken study: emit ordinary rigid joint-local clips.
import fs from 'node:fs';
import {solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
const fp='rigs/families/walkingBird.json',mp='rigs/models/walkingBird.json';
const r=JSON.parse(fs.readFileSync(fp)),m=JSON.parse(fs.readFileSync(mp));
const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id),round=n=>+n.toFixed(9);
r.archetypes=['chicken'];r.heightMeters=.85;r.tokenScale=45;r.tokenGroundY=65;
j('pelvis').bind=[-.10,0,.47];j('chest').bind=[.22,0,.035];j('neck').bind=[.14,0,.12];j('head').bind=[.105,0,.12];j('beak').bind=[.09,0,-.025];
j('tailBase').bind=[-.18,0,.05];j('tailTip').bind=[-.20,0,.22];
p('bodyPlate').size=[.46];p('pelvisPlate').size=[.46,.42];p('neckPlate').size=[.22];p('headConnectorPlate').size=[.15];p('headPlate').size=[.17,.19];p('beakPlate').shape='taperedBone';p('beakPlate').size=[.085];p('tailPlate').size=[.26];p('castShadow').size=[.85,.50];p('castShadow').surfaceNormal=[0,0,1];
for(const side of ['near','far']){
 const s=side==='near'?1:-1;
 j(side+'Hip').bind=[0,s*.105,-.02];j(side+'Knee').bind=[.12,0,-.12];j(side+'Knee').limits=[-30,150];j(side+'Foot').bind=[-.09,0,-.23];j(side+'Toe').bind=[.12,0,-.10];
 j(side+'Wing').bind=[-.03,s*.20,0];j(side+'WingTip').bind=[-.22,s*.025,-.08];
 p(side+'ThighPlate').size=[.16];p(side+'ShinPlate').size=[.055];p(side+'ToePlate').size=[.04];p(side+'WingPlate').size=[.22];p(side+'WingPlate').bodyRegion='wing';p(side+'WingPlate').occlusionMode='surface-relative';p(side+'WingPlate').occlusionReference='chest';
 for(const [suffix,offset]of [['Inner',[.06,-s*.045,0]],['Outer',[.06,s*.045,0]]]){
  const id=side+'Toe'+suffix;
  if(!j(id)){r.joints.push({id,parent:side+'Toe',bind:offset,role:'limb'});r.plates.push({id:id+'Plate',bone:id,span:[side+'Toe',id],shape:'bone',size:[.025],role:'accent',bodyRegion:'limb',attachment:'rigid',material:'paperShade',semanticDetailTier:'identity'});}
 }
}
for(const [id,parent,bind,size]of [['comb','head',[0,0,.105],[.14,.08]],['wattle','head',[.025,0,-.09],[.06,.10]]])if(!j(id)){
 r.joints.push({id,parent,bind,role:'head',gasket:{diameterMeters:.025,underIncidentPlates:true}});
 r.plates.push({id:id+'Plate',bone:id,shape:'ellipse',size,role:'accent',bodyRegion:'head',attachment:'rigid',material:'paperShade',semanticDetailTier:'identity'});
}
for(const plate of r.plates)plate.zBias ??= 2;
const legs=['near','far'].map(s=>({hip:j(s+'Hip'),knee:j(s+'Knee'),hock:j(s+'Foot'),foot:j(s+'Toe'),rear:true}));
const curve=(t,keys)=>{for(let i=0;i<keys.length-1;i++){const[a,x]=keys[i],[b,y]=keys[i+1];if(t<=b){const u=Math.max(0,(t-a)/(b-a));return x+(y-x)*u*u*(3-2*u);}}return keys.at(-1)[1];};
function frame(t,kind){
 const run=kind==='run',gait=kind==='walk'||run,w=t*2*Math.PI;
 const jab=kind==='attack'?curve(t,[[0,0],[.25,-8],[.38,-8],[.60,83],[.66,83],[1,0]]):0;
 const rotations={chest:[0,round(jab*55/83),0],pelvis:[0,run?8:0,0],neck:[0,round(run?24+3*Math.sin(w):gait?8*Math.sin(w):jab),0],head:[0,round(gait?-4*Math.sin(w):jab*.35),0],tailBase:[0,round(gait?3*Math.sin(w):0),0]};
 const root=[0,0,round(gait?(run?.022:-.012)*(1-Math.cos(2*w))/2:kind==='idle'?.003*(1-Math.cos(w)):0)];
 const body=sagittalBodyPose(r,rotations,root);
 for(const [i,l]of legs.entries()){
  const phase=(t+i*.5)%1,duty=run?.46:.64,stance=!gait||phase<=duty;
  const u=stance?phase/duty:(phase-duty)/(1-duty),stride=run?.25:.15;
  const x=gait?(stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2)):0;
  const z=gait&&!stance?(run?.11:.065)*Math.sin(Math.PI*u)**2:0;
  const origin=body.positions[l.hip.id],target=[.05+x,origin[1],z];
  const local=solveLeg(l,origin,target);local[l.hip.id][1]-=body.angles[l.hip.id];Object.assign(rotations,local);
 }
 return{t,poses:{root},rotations};
}
function clip(kind,duration){
 const frames=Array.from({length:481},(_,i)=>frame(i/480,kind));const loop=kind!=='attack';if(loop)frames[480]={...structuredClone(frames[0]),t:1};
 const duty=kind==='run'?.46:.64;
 const contactIntervals=kind==='walk'||kind==='run'?[{ids:['nearToe'],from:0,to:duty},...(duty>.5?[{ids:['farToe'],from:0,to:duty-.5}]:[]),{ids:['farToe'],from:.5,to:Math.min(1,.5+duty)}]:[{ids:['nearToe','farToe'],from:0,to:1}];
 return{base:'bind',duration,easing:'linear',loop,frames,contactIntervals,events:kind==='attack'?[{t:.38,name:'peck-start'},{t:.60,name:'impact'},{t:.66,name:'release'}]:[],boneLengthPolicy:'preserve',motionSemantics:kind==='attack'?'planted-foot angular neck peck, referenced from WildMesh Chicken Idle2':'grounded alternating chicken gait with folded wings, head bob, articulated hip/knee/ankle'};
}
m.clips={...m.clips,idleA:clip('idle',2400),walkA:clip('walk',1250),run:clip('run',500),attack:clip('attack',1100)};
for(const id of ['idleA','walkA','attack'])r.clips[id]=structuredClone(m.clips[id]);
function save(path,obj){let s=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');s=s.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,s+'\n');}
save(fp,r);save(mp,m);
