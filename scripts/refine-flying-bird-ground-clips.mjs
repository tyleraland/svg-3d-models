// Author-time source regeneration; run from the repository root.
// Emits ordinary declarative clips; no runtime solver is added to consumers.
import fs from 'node:fs';
import {core} from '@paper-rig/compiler';
import {solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
const familyPath='rigs/families/flyingBird.json', modelPath='rigs/models/flyingBird.json';
const r=JSON.parse(fs.readFileSync(familyPath)),m=JSON.parse(fs.readFileSync(modelPath));
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(9);
// Replace the single floating talon with a rigid thigh, reversed ankle and foot chain.
for(const side of ['near','far']){
 const sign=side==='near'?1:-1,other=side==='near'?'far':'near';
 const foot=r.joints.find(j=>j.id===side+'Talon');
 if(!r.joints.some(j=>j.id===side+'LegHip')){
  const index=r.joints.indexOf(foot);
  r.joints.splice(index,0,
   {id:side+'LegHip',parent:'body',bind:[.02,sign*.105,-.08],role:'limb',mirror:other+'LegHip'},
   {id:side+'LegKnee',parent:side+'LegHip',bind:[.07,0,-.18],role:'limb',mirror:other+'LegKnee'},
   {id:side+'LegAnkle',parent:side+'LegKnee',bind:[-.06,0,-.19],role:'limb',mirror:other+'LegAnkle'});
  foot.parent=side+'LegAnkle';foot.bind=[.08,0,-.07];
  for(const [name,a,b,size] of [['Thigh','LegHip','LegKnee',.10],['Shin','LegKnee','LegAnkle',.055],['Foot','LegAnkle','Talon',.045]])r.plates.push({id:side+name+'Plate',bone:side+b,span:[side+a,side+b],shape:'bone',size:[size],role:'limb',bodyRegion:'limb',attachment:'rigid',material:'paperShade',zBias:2,semanticDetailTier:'silhouette'});
 }
}
r.joints.find(j=>j.id==='body').bind[2]=.52;
r.joints.find(j=>j.id==='beak').gasket={diameterMeters:.035,underIncidentPlates:true};
r.joints.find(j=>j.id==='beakHook').bind=[.005,0,-.022];
r.plates.find(p=>p.id==='beakHookPlate').size=[.035];
const byId=Object.fromEntries(r.joints.map(j=>[j.id,j]));
const legs=['near','far'].map(side=>({hip:byId[side+'LegHip'],knee:byId[side+'LegKnee'],hock:byId[side+'LegAnkle'],foot:byId[side+'Talon'],rear:false}));
const folded=()=>Object.fromEntries(['near','far'].flatMap(side=>{const s=side==='near'?1:-1;return[[side+'WingRoot',[0,90,s*90]],[side+'WingElbow',[0,0,s*180]],[side+'WingWrist',[0,180,s*180]]];}));
// Flight keeps the legs tucked against the belly, through joint rotations.
for(const [id,c] of Object.entries(r.clips))if(['idleA','fly','glide'].includes(id))for(const f of c.frames){
 f.poses.root=[0,0,round(.53+(id==='fly'?.025:.008)*(1-Math.cos(2*Math.PI*f.t)))];
 for(const side of ['near','far'])Object.assign(f.rotations,{[side+'LegHip']:[0,-65,0],[side+'LegKnee']:[0,100,0],[side+'LegAnkle']:[0,-45,0]});
}
const flight=r.clips.fly;
const attackFrames=flight.frames.map(f=>{
 const t=f.t;
 const keys=[[0,0],[.30,-6],[.54,-14],[.62,55],[.66,55],[.86,0],[1,0]];
 const [a,b]=keys.slice(0,-1).map((a,i)=>[a,keys[i+1]]).find(([a,b])=>t>=a[0]&&t<=b[0]);
 const u=(t-a[0])/(b[0]-a[0]),peck=a[1]+(b[1]-a[1])*u*u*(3-2*u);
 const q=structuredClone(f);q.rotations.neck=[0,round((q.rotations.neck?.[1]||0)+peck),0];q.rotations.head=structuredClone(f.rotations.head);return q;
});
m.clips.attack={base:'bind',duration:920,easing:'linear',loop:false,frames:attackFrames,contacts:[],events:[{t:0,name:'wing-downstroke'},{t:.4,name:'wing-recovery'},{t:.62,name:'impact'},{t:.84,name:'release'}],boneLengthPolicy:'preserve',motionSemantics:'sudden neck-pivot peck (74 ms jab) layered over synchronous continuous wingbeat; tucked legs; no ground contacts'};
const bodyGround=.49,rootZ=bodyGround-byId.body.bind[2];
const neutralBody=sagittalBodyPose(r,{body:[0,-12,0]},[0,0,rootZ]);
const targets=Object.fromEntries(legs.map(l=>[l.foot.id,[neutralBody.positions[l.hip.id][0]+.08,neutralBody.positions[l.hip.id][1],0]]));
function groundClip(hop){
 const duty=.64,frames=[],samples=480;
 const times=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),.14,.18,.48,.64,.78])].sort((a,b)=>a-b);
 for(const time of times){
  const t=time===1?0:time,w=2*Math.PI*t;
  // Hop: crouch, paired push-off, ballistic-looking arc, paired landing.
  let dz=0;
  if(hop){if(t<.18)dz=-.035*Math.sin(Math.PI*t/.18)**2;else if(t<.78)dz=.12*Math.sin(Math.PI*(t-.18)/.60);else dz=-.025*Math.sin(Math.PI*(t-.78)/.22)**2;}
  else dz=-.009*(1-Math.cos(2*w))/2;
  const rotations={...folded(),body:[0,-12,0],neck:[0,round(3*Math.sin(w)),0],head:[0,round(-3*Math.sin(w)),0],tailBase:[0,round(2*Math.sin(w)),0]};
  // Translate laterally over the supporting foot instead of rotating the IK plane.
  const root=[0,hop?0:round(.025*Math.cos(w)),round(rootZ+dz)];
  const body=sagittalBodyPose(r,rotations,root);
  for(const [index,l]of legs.entries()){
   const p=(t+index*.5)%1,stance=hop?(t<=.18||t>=.78):p<=duty;
   let x=0,z=0;
   if(!hop){const u=stance?p/duty:(p-duty)/(1-duty);x=stance?.075*(.5-u):.075*(-.5+(1-Math.cos(Math.PI*u))/2);z=stance?0:.045*Math.sin(Math.PI*u)**2;}
   else if(!stance)z=.15*Math.sin(Math.PI*(t-.18)/.60);
   const origin=body.positions[l.hip.id],dy=targets[l.foot.id][1]-origin[1],dz=z-origin[2],abduction=Math.atan2(dy,-dz)*180/Math.PI;
   const target=[targets[l.foot.id][0]+x,origin[1],origin[2]-Math.hypot(dy,dz)];
   const local=solveLeg(l,origin,target);
   const mm=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0)));
   const matrix=mm(core.euler([0,-body.angles[l.hip.id],0]),mm(core.euler([abduction,0,0]),core.euler(local[l.hip.id])));
   local[l.hip.id]=[Math.atan2(matrix[2][1],matrix[2][2]),Math.asin(-matrix[2][0]),Math.atan2(matrix[1][0],matrix[0][0])].map(v=>round(v*180/Math.PI));Object.assign(rotations,local);
  }
  frames.push({t:time,poses:{root},rotations});
 }
 return{base:'bind',duration:hop?800:1200,easing:'linear',loop:true,frames,contactIntervals:hop?[{ids:legs.map(l=>l.foot.id),from:0,to:.18},{ids:legs.map(l=>l.foot.id),from:.78,to:1}]:[{ids:['nearTalon'],from:0,to:.64},{ids:['farTalon'],from:0,to:.14},{ids:['farTalon'],from:.5,to:1}],events:hop?[{t:.18,name:'paired-takeoff'},{t:.48,name:'hop-apex'},{t:.78,name:'paired-landing'}]:[{t:0,name:'near-footfall'},{t:.5,name:'far-footfall'}],boneLengthPolicy:'preserve',motionSemantics:hop?'paired-foot grounded hop with crouch, takeoff, suspension and landing; folded wings':'alternating grounded waddle; folded wings, hip/knee/ankle articulation and lateral weight shift'};
}
m.clips.walkA=groundClip(false);m.clips.hop=groundClip(true);
r.clips.walkA=structuredClone(m.clips.walkA);
function save(path,obj){let s=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');s=s.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,s+'\n');}
save(familyPath,r);save(modelPath,m);
