// Author-time Eagle refinement from the WildMesh studies. Emits ordinary clips.
// Run from the repository root; reference mesh data never enters the renderer.
import fs from 'node:fs';
import {core} from '@paper-rig/compiler';
import {solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
const familyPath='rigs/families/flyingBird.json',modelPath='rigs/models/flyingBird.json';
const r=JSON.parse(fs.readFileSync(familyPath)),m=JSON.parse(fs.readFileSync(modelPath));
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(10),clone=structuredClone;
const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
const bind=(id,value)=>j(id).bind=value;
Object.assign(r.profile,{stance:'folded-wing standing idle; grounded walk/run/hop and separate powered flight/glide',wings:'eagle: broad secondary chord, slotted outer primaries, delayed wrist recovery',feet:'articulated ankles and three forward toes with rear hallux'});
r.archetypes=['eagle'];r.tokenScale=22;
bind('chest',[.32,0,.045]);bind('neck',[.12,0,.065]);bind('head',[.095,0,.045]);bind('beak',[.13,0,-.025]);
p('bodyPlate').size=[.40];p('neckPlate').size=[.23];p('headConnectorPlate').size=[.22];p('headPlate').size=[.245,.255];p('headPlate').material='paperLight';p('beakPlate').size=[.12];
bind('tailBase',[-.22,0,-.03]);bind('tailTip',[-.32,0,-.025]);
const tail=[[0,.10,0],[-.29,.19,-.025],[-.32,.135,-.025],[-.325,.065,-.025],[-.33,0,-.025],[-.325,-.065,-.025],[-.32,-.135,-.025],[-.29,-.19,-.025],[0,-.10,0]];
tail.forEach((v,i)=>bind('tailFan'+i,v));
for(const side of ['near','far']){
 const s=side==='near'?1:-1;
 bind(side+'WingRootTrailing',[-.28,0,0]);bind(side+'WingElbowTrailing',[-.37,0,0]);bind(side+'WingWristTrailing',[-.39,0,0]);
 const primary=[[.065,0,0],[.055,.19,0],[-.045,.48,-.008],[-.10,.50,-.008],[-.12,.33,0],[-.19,.51,-.008],[-.25,.49,-.008],[-.235,.31,0],[-.345,.44,-.008],[-.40,.39,-.008],[-.32,.22,0],[-.46,.28,0],[-.475,.21,0],[-.39,0,0]];
 primary.forEach((v,i)=>bind(side+'Primary'+i,[v[0],s*v[1],v[2]]));
 p(side+'TalonPlate').size=[.09,.08];
 for(const [name,v]of [['InnerToe',[.085,-.04,0]],['MiddleToe',[.105,0,0]],['OuterToe',[.08,.04,0]],['Hallux',[-.065,0,0]]]){
  const id=side+name;
  if(!j(id))r.joints.push({id,parent:side+'Talon',bind:[v[0],s*v[1],v[2]],role:'accessoryAnchor',helper:true});
  if(!p(id+'Plate'))r.plates.push({id:id+'Plate',bone:id,span:[side+'Talon',id],shape:'taperedBone',size:[.018],role:'limb',bodyRegion:'limb',attachment:'rigid',material:'paperShade',zBias:2.5,semanticDetailTier:'identity'});
 }
}
const folded=()=>Object.fromEntries(['near','far'].flatMap(side=>{const s=side==='near'?1:-1;return[[side+'WingRoot',[0,90,s*90]],[side+'WingElbow',[0,0,s*180]],[side+'WingWrist',[0,180,s*180]]];}));
const curve=(keys,t)=>{const i=keys.findIndex((k,i)=>i<keys.length-1&&t>=k[0]&&t<=keys[i+1][0]);const a=keys[Math.max(0,i)],b=keys[Math.max(0,i)+1],u=(t-a[0])/(b[0]-a[0]),v=u*u*(3-2*u);return a[1]+(b[1]-a[1])*v;};
function flight(glide=false){
 const frames=Array.from({length:101},(_,i)=>{const t=i===100?0:i/100,w=t*2*Math.PI,rotations={body:[0,round(1.8*Math.sin(w)),0],neck:[0,round(-1.8*Math.sin(w)),0],head:[0,0,0],tailBase:[0,round(3*Math.sin(w-.4)),0]};
  for(const side of ['near','far']){const s=side==='near'?1:-1;
   rotations[side+'WingRoot']=[round(s*(glide?4+2*Math.sin(w):curve([[0,52],[.30,-42],[.40,-39],[.76,42],[1,52]],t))),0,0];
   rotations[side+'WingElbow']=[round(s*(glide?-3:curve([[0,3],[.30,-5],[.44,9],[.68,18],[1,3]],t))),0,round(s*(glide?0:curve([[0,0],[.30,0],[.47,24],[.68,32],[1,0]],t)))];
   rotations[side+'WingWrist']=[round(s*(glide?Math.sin(w):curve([[0,10],[.30,16],[.43,-14],[.63,-36],[.83,-6],[1,10]],t))),0,round(s*(glide?0:curve([[0,0],[.30,0],[.47,14],[.68,20],[1,0]],t)))];
   Object.assign(rotations,{[side+'LegHip']:[0,95,0],[side+'LegKnee']:[0,-140,0],[side+'LegAnkle']:[0,45,0]});
  }
  return{t:i/100,poses:{root:[0,0,round(.57+(glide?.006:.03)*(1-Math.cos(w)))]},rotations};
 });
 return{base:'bind',duration:glide?2800:1160,easing:'linear',loop:true,frames,contacts:[],events:glide?[]:[{t:0,name:'power-stroke-start'},{t:.30,name:'power-stroke-bottom'},{t:.44,name:'folded-recovery'}],boneLengthPolicy:'preserve',motionSemantics:glide?'broad eagle wings held open with small symmetric trim':'synchronous eagle power stroke; delayed elbow/wrist fold on recovery, stable head and tucked talons'};
}
r.clips.fly=flight();r.clips.glide=flight(true);
const jab=t=>curve([[0,0],[.30,-6],[.54,-14],[.56,-14],[.62,55],[.66,55],[.86,0],[1,0]],t);
m.clips.attack={...clone(r.clips.fly),loop:false,frames:r.clips.fly.frames.map(f=>{const q=clone(f);q.rotations.neck[1]=round(q.rotations.neck[1]+jab(f.t));return q;}),events:[{t:.56,name:'jab-start',phase:'action'},{t:.62,name:'impact',phase:'contact'},{t:.66,name:'release',phase:'recovery'},{t:.86,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.54,to:.56},{id:'action',from:.56,peak:.60,to:.615},{id:'contact',from:.615,peak:.62,to:.66},{id:'recovery',from:.66,peak:.76,to:.86},{id:'settle',from:.86,peak:1,to:1}],motionSemantics:'airborne peck: 70 ms neck-pivot jab over uninterrupted eagle wingbeat; no head translation'};
const byId=Object.fromEntries(r.joints.map(j=>[j.id,j]));
const legs=['near','far'].map(side=>({hip:byId[side+'LegHip'],knee:byId[side+'LegKnee'],hock:byId[side+'LegAnkle'],foot:byId[side+'Talon'],rear:false}));
const rootZ=.49-j('body').bind[2],pitch=-22,neutral=sagittalBodyPose(r,{body:[0,pitch,0]},[0,0,rootZ]);
const targets=Object.fromEntries(legs.map(l=>[l.foot.id,[neutral.positions[l.hip.id][0]+.08,neutral.positions[l.hip.id][1],0]]));
function groundClip(mode){
 const hop=mode==='hop',run=mode==='run',idle=mode==='idle',duty=run?.42:.64,frames=[],samples=hop?480:240,previousHip={};
 const intervals=[];
 if(idle)intervals.push({ids:legs.map(l=>l.foot.id),from:0,to:1});
 else if(hop)intervals.push({ids:legs.map(l=>l.foot.id),from:0,to:.18},{ids:legs.map(l=>l.foot.id),from:.78,to:1});
 else for(const [index,l]of legs.entries())for(const cycle of [0,1]){const from=Math.max(0,cycle-index*.5),to=Math.min(1,round(cycle-index*.5+duty));if(from<=to)intervals.push({ids:[l.foot.id],from,to});}
 const times=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),.14,.18,.42,.48,.64,.78,.92])].sort((a,b)=>a-b);
 for(const time of times){const t=time===1?0:time,w=2*Math.PI*t;
  let dz=idle?-.003*(1-Math.cos(w))/2:run?.018*(1-Math.cos(2*w))/2:-.009*(1-Math.cos(2*w))/2;
  if(hop){if(t<.18)dz=-.035*Math.sin(Math.PI*t/.18)**2;else if(t<.78)dz=.12*Math.sin(Math.PI*(t-.18)/.60);else dz=-.025*Math.sin(Math.PI*(t-.78)/.22)**2;}
  const nod=idle?1.5*Math.sin(w):run?4*Math.sin(2*w):3*Math.sin(w),rotations={...folded(),body:[0,pitch+(run?4:0),0],neck:[0,round(nod-(run?3:0)),idle?round(6*Math.sin(w)**3):0],head:[0,round(-nod),0],tailBase:[0,round((idle?1:3)*Math.sin(w)),0]};
  const root=[0,idle||hop?0:round((run?.014:.025)*Math.cos(w)),round(rootZ+dz)],body=sagittalBodyPose(r,rotations,root);
  for(const [index,l]of legs.entries()){
   const phase=(t+index*.5)%1,stance=idle||(hop?(t<=.18||t>=.78):phase<=duty);let x=0,z=0;
   if(!idle&&!hop){const u=stance?phase/duty:(phase-duty)/(1-duty),stride=run?.15:.085;x=stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2);z=stance?0:(run?.085:.05)*Math.sin(Math.PI*u)**2;}
   else if(hop&&!stance)z=.15*Math.sin(Math.PI*(t-.18)/.60);
   const origin=body.positions[l.hip.id],dy=targets[l.foot.id][1]-origin[1],dz=z-origin[2],abduction=Math.atan2(dy,-dz)*180/Math.PI,target=[targets[l.foot.id][0]+x,origin[1],origin[2]-Math.hypot(dy,dz)],local=solveLeg(l,origin,target);
   const mm=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0))),matrix=mm(core.euler([0,-body.angles[l.hip.id],0]),mm(core.euler([abduction,0,0]),core.euler(local[l.hip.id])));
   const euler=[Math.atan2(matrix[2][1],matrix[2][2]),Math.asin(-matrix[2][0]),Math.atan2(matrix[1][0],matrix[0][0])].map(v=>v*180/Math.PI);
   // Select a continuous Euler branch through the hip's 90-degree crossing.
   // Equivalent matrices can otherwise jump by 180 degrees between IK samples.
   const previous=previousHip[l.hip.id]||euler,candidates=[euler,[euler[0]+180,180-euler[1],euler[2]+180]].map(v=>v.map((n,k)=>previous[k]+((n-previous[k]+540)%360)-180));
   candidates.sort((a,b)=>a.reduce((sum,n,k)=>sum+(n-previous[k])**2,0)-b.reduce((sum,n,k)=>sum+(n-previous[k])**2,0));
   local[l.hip.id]=candidates[0].map(round);previousHip[l.hip.id]=local[l.hip.id];Object.assign(rotations,local);
  }
  frames.push({t:time,poses:{root},rotations});
 }
 frames[frames.length-1]={...clone(frames[0]),t:1};
 return{base:'bind',duration:idle?3200:hop?800:run?620:1200,easing:'linear',loop:true,frames,contactIntervals:intervals.sort((a,b)=>a.from-b.from),contacts:[],events:idle?[]:hop?[{t:.18,name:'paired-takeoff'},{t:.48,name:'hop-apex'},{t:.78,name:'paired-landing'}]:[{t:0,name:'near-footfall'},{t:.5,name:'far-footfall'}],boneLengthPolicy:'preserve',motionSemantics:idle?'standing eagle: folded wings, planted talons, quiet breathing and alert head scan':hop?'paired-foot ground hop with crouch, suspension and landing':run?'quick alternating biped run, whole-leg articulation and short aerial support gaps; wings folded':'alternating grounded eagle walk; folded wings, head stabilization and lateral weight transfer'};
}
r.clips.idleA=groundClip('idle');r.clips.walkA=groundClip('walk');m.clips.walkA=clone(r.clips.walkA);m.clips.run=groundClip('run');m.clips.hop=groundClip('hop');
// A separate, short talon reach derived from the diving pickup posture.
m.clips.talonStrike={...clone(r.clips.fly),duration:1450,loop:false,frames:r.clips.fly.frames.map(f=>{const q=clone(f),t=f.t,e=curve([[0,0],[.22,0],[.46,1],[.58,1],[.86,0],[1,0]],t);q.poses.root[2]=round(q.poses.root[2]-.13*e);q.rotations.body[1]=round(q.rotations.body[1]+12*e);q.rotations.neck[1]=round(q.rotations.neck[1]-10*e);for(const side of ['near','far']){q.rotations[side+'LegHip']=[0,round(95-125*e),0];q.rotations[side+'LegKnee']=[0,round(-140+120*e),0];q.rotations[side+'LegAnkle']=[0,round(45-65*e),0];}return q;}),events:[{t:.22,name:'talons-open',phase:'anticipation'},{t:.46,name:'impact',phase:'contact'},{t:.58,name:'release',phase:'recovery'},{t:.86,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.22,to:.26},{id:'action',from:.26,peak:.42,to:.455},{id:'contact',from:.455,peak:.46,to:.58},{id:'recovery',from:.58,peak:.72,to:.86},{id:'settle',from:.86,peak:1,to:1}],motionSemantics:'airborne talon reach: pitch into the strike, extend both articulated legs, then tuck and recover while wingbeats continue'};
// Grounded idle changes inherited contact defaults; KO starts in that same pose.
const rest=clone(r.clips.idleA.frames[0]);
m.clips.ko={base:'bind',duration:900,easing:'linear',loop:false,frames:[rest,{...clone(rest),t:1,poses:{root:[0,.08,rootZ-.16]},rotations:{...rest.rotations,root:[35,55,0]}}],contacts:[],contactIntervals:[],events:[{t:.5,name:'fall'},{t:1,name:'down'}]};
function save(path,obj){let s=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');s=s.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,s+'\n');}
save(familyPath,r);save(modelPath,m);
