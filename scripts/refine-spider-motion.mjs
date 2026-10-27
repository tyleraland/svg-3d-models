// Author-time two-link spatial IK for the arched spider. Only ordinary clips ship.
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {core} from '@paper-rig/compiler';
import {bindPositions} from '../rigs/quadruped-locomotion.js';
const rig=loadModel('spider'),bind=bindPositions(rig),byId=new Map(rig.joints.map(j=>[j.id,j]));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),norm=a=>mul(a,1/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],mv=(M,v)=>M.map(r=>dot(r,v)),tr=M=>M[0].map((_,i)=>M.map(r=>r[i]));
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(9),smooth=u=>u*u*(3-2*u);
function curve(keys,t){const i=Math.max(0,keys.findIndex((k,i)=>i<keys.length-1&&t>=k[0]&&t<=keys[i+1][0]));const a=keys[i],b=keys[i+1];return a[1]+(b[1]-a[1])*smooth((t-a[0])/(b[0]-a[0]));}
function between(a,b){a=norm(a);b=norm(b);const c=dot(a,b),v=cross(a,b),s=dot(v,v);if(s<1e-14){if(c<0)throw Error('antipodal IK frame');return [[1,0,0],[0,1,0],[0,0,1]];}const[x,y,z]=v,k=(1-c)/s;return[[c+x*x*k,x*y*k-z,x*z*k+y],[y*x*k+z,c+y*y*k,y*z*k-x],[z*x*k-y,z*y*k+x,c+z*z*k]];}
function angles(M){const y=Math.asin(Math.max(-1,Math.min(1,-M[2][0])));if(Math.abs(Math.cos(y))<1e-7)throw Error('IK Euler singularity');return[Math.atan2(M[2][1],M[2][2]),y,Math.atan2(M[1][0],M[0][0])].map(v=>round(v*180/Math.PI));}
const legs=['left','right'].flatMap(side=>[1,2,3,4].map(i=>{const id=side+'Leg'+i;return{side,i,hip:byId.get(id+'Hip'),knee:byId.get(id+'Knee'),foot:byId.get(id+'Foot'),phase:((i-1)%2+(side==='right'?1:0))%2*.5};}));
function ik(leg,origin,target,parent){const a=Math.hypot(...leg.knee.bind),b=Math.hypot(...leg.foot.bind),v=sub(target,origin),d=Math.hypot(...v);if(d>a+b||d<Math.abs(a-b))throw Error(`unreachable ${leg.foot.id}: ${d}`);const u=norm(v),along=(a*a-b*b+d*d)/(2*d),h=Math.sqrt(Math.max(0,a*a-along*along)),up=norm(sub([0,0,1],mul(u,u[2]))),upper=add(mul(u,along),mul(up,h)),lower=sub(v,upper),H=between(leg.knee.bind,mv(tr(parent),upper)),K=between(leg.foot.bind,mv(tr(H),mv(tr(parent),lower)));return{[leg.hip.id]:angles(H),[leg.knee.id]:angles(K)};}
function intervals(mode){if(mode==='idleA')return[{ids:legs.map(l=>l.foot.id),from:0,to:1}];if(mode==='attack')return legs.flatMap(l=>l.i===1?[{ids:[l.foot.id],from:0,to:.12},{ids:[l.foot.id],from:.86,to:1}]:[{ids:[l.foot.id],from:0,to:1}]);const duty=mode==='run'?.55:.64;return legs.flatMap(l=>{const cuts=[0,1,...[0,duty].map(p=>(p-l.phase+1)%1)].sort((a,b)=>a-b),rows=[];for(let i=0;i<cuts.length-1;i++)if(((cuts[i]+cuts[i+1])/2+l.phase)%1<duty)rows.push({ids:[l.foot.id],from:round(cuts[i]),to:round(cuts[i+1])});if(l.phase===0)rows.push({ids:[l.foot.id],from:1,to:1});return rows;});}
function frame(mode,t){const w=2*Math.PI*t,poses={root:[0,0,0]},rotations={};
 if(mode==='idleA'){poses.root[2]=-.014*(1-Math.cos(w))/2;rotations.head=[0,Math.sin(w)*1.5,0];}
 if(mode==='walkA'||mode==='run'){poses.root[2]=-.012*(1-Math.cos(2*w))/2;rotations.abdomen=[0,0,(mode==='run'?1.5:1)*Math.sin(w)];}
 if(mode==='attack'){
  poses.root=[curve([[0,0],[.32,-.055],[.46,.10],[.60,.13],[.86,0],[1,0]],t),0,curve([[0,0],[.32,.09],[.46,.055],[.60,.02],[.86,0],[1,0]],t)];
  rotations.abdomen=[0,curve([[0,0],[.32,-22],[.46,-13],[.60,5],[.86,0],[1,0]],t),0];
  rotations.head=[0,curve([[0,0],[.32,-10],[.46,22],[.60,8],[.86,0],[1,0]],t),0];
 }
 const bodyRig={...rig,clips:{pose:{frames:[{t:0,poses,rotations}]}}},body=core.solvePose(bodyRig,0,'pose');
 for(const l of legs){let target=[...bind[l.foot.id]];
  if(mode==='walkA'||mode==='run'){
   const duty=mode==='run'?.55:.64,stride=mode==='run'?.28:.20,lift=mode==='run'?.16:.10,p=(t+l.phase)%1;
   if(p<=duty)target[0]+=stride*(.5-p/duty);else{const u=(p-duty)/(1-duty);target[0]+=stride*(-.5+smooth(u));target[2]=lift*Math.sin(Math.PI*u)**2;}
  }
  if(mode==='attack'&&l.i===1){target[0]+=curve([[0,0],[.32,-.15],[.46,.12],[.60,.18],[.86,0],[1,0]],t);target[2]=curve([[0,0],[.12,0],[.32,.50],[.46,.47],[.60,.20],[.86,0],[1,0]],t);}
  Object.assign(rotations,ik(l,body.positions[l.hip.id],target,body.rotations.cephalothorax));
 }
 const palp=mode==='attack'?curve([[0,0],[.32,-25],[.46,20],[.60,8],[.86,0],[1,0]],t):3*Math.sin(w);
 for(const side of ['left','right']){const sign=side==='left'?1:-1;rotations[side+'PalpBase']=[0,palp,sign*2*Math.sin(w)];rotations[side+'FangBase']=[0,mode==='attack'?curve([[0,0],[.32,-22],[.46,28],[.60,12],[.86,0],[1,0]],t):Math.sin(w),0];}
 return{t:round(t),poses:Object.fromEntries(Object.entries(poses).map(([k,v])=>[k,v.map(round)])),rotations};
}
function koFrame(t){
 const curl=curve([[0,0],[.04,0],[.25,.55],[.48,.85],[.85,1],[1,1]],t);
 const poses={root:[0,0,0]},rotations={head:[0,8*curl,0]};
 const body=core.solvePose({...rig,clips:{pose:{frames:[{t:0,poses,rotations}]}}},0,'pose');
 for(const l of legs){
  const side=l.side==='left'?1:-1,rest=[bind[l.foot.id][0]*.36,side*.16,.77+(l.i%2)*.035];
  const target=add(mul(bind[l.foot.id],1-curl),mul(rest,curl));
  // A small dying shudder fades before the settled hold.
  target[2]+=.018*Math.sin(10*Math.PI*t)*Math.sin(Math.PI*curl)*(t<.85?1:0);
  Object.assign(rotations,ik(l,body.positions[l.hip.id],target,body.rotations.cephalothorax));
 }
 for(const side of ['left','right']){rotations[side+'PalpBase']=[0,-38*curl,0];rotations[side+'FangBase']=[0,22*curl,0];}
 const roll=curve([[0,0],[.04,0],[.13,8],[.34,78],[.48,104],[.72,96],[.9,100],[1,100]],t);
 rotations.root=[roll,0,0];
 const R=core.euler(rotations.root),pivot=bind.abdomen;
 poses.root=sub(pivot,mv(R,pivot));poses.root[1]+=curve([[0,0],[.04,0],[.34,-.36],[.48,-.40],[.9,-.34],[1,-.34]],t);
 const posed=core.solvePose({...rig,clips:{pose:{frames:[{t:0,poses,rotations}]}}},0,'pose');
 const targetHeight=curve([[0,pivot[2]],[.04,pivot[2]],[.25,.40],[.48,.28],[.9,.26],[1,.26]],t);
 poses.root[2]+=Math.max(targetHeight-posed.positions.abdomen[2],-Math.min(...Object.values(posed.positions).map(p=>p[2]))+.008*curl);
 return{t:round(t),poses:Object.fromEntries(Object.entries(poses).map(([k,v])=>[k,v.map(round)])),rotations};
}
const model=JSON.parse(fs.readFileSync('rigs/models/spider.json','utf8'));
for(const mode of ['idleA','walkA','run','attack']){
 const times=[...new Set([...Array.from({length:241},(_,i)=>round(i/240)),...intervals(mode).flatMap(x=>[x.from,x.to]),.12,.32,.46,.60,.86])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));
 // Equivalent Euler frames must stay continuous through interpolation.
 for(let i=1;i<frames.length;i++)for(const[id,v]of Object.entries(frames[i].rotations))for(let k=0;k<3;k++){const old=frames[i-1].rotations[id]?.[k]??v[k];while(v[k]-old>180)v[k]-=360;while(v[k]-old< -180)v[k]+=360;}
 model.clips[mode]={base:'bind',duration:mode==='idleA'?2400:mode==='walkA'?1100:mode==='run'?550:1000,easing:'linear',loop:mode!=='attack',frames,contactIntervals:intervals(mode).sort((a,b)=>a.from-b.from||a.to-b.to),events:mode==='attack'?[{t:.12,name:'front-feet-release'},{t:.32,name:'threat-crest'},{t:.46,name:'bite-impact'},{t:.86,name:'front-feet-plant'}]:mode==='idleA'?[]:[{t:0,name:'tetrapod-a'},{t:.5,name:'tetrapod-b'}],boneLengthPolicy:'preserve',motionSemantics:mode==='attack'?'six planted supports; raised front-leg threat, fast forward bite and fang closure, recovery':mode==='idleA'?'quiet body breathing over eight planted feet':'alternating four-leg support sets; whole-leg spatial IK baked into local rotations'};
 if(mode!=='attack')frames[frames.length-1]=structuredClone({...frames[0],t:1});
}
model.clips.ko={base:'bind',duration:1960,easing:'linear',loop:false,frames:[...new Set([...Array.from({length:241},(_,i)=>round(i/240)),.04,.13,.25,.34,.48,.72,.85,.9])].sort((a,b)=>a-b).map(koFrame),contactIntervals:[{ids:legs.map(l=>l.foot.id),from:0,to:.04}],events:[{t:.04,name:'support-release'},{t:.34,name:'side-fall'},{t:.48,name:'body-impact'},{t:.9,name:'settled'}],boneLengthPolicy:'preserve',motionSemantics:'reference-inspired lateral topple, inward leg curl, brief settling shudder and held side-lying collapse'};
for(let i=1;i<model.clips.ko.frames.length;i++)for(const[id,v]of Object.entries(model.clips.ko.frames[i].rotations))for(let k=0;k<3;k++){const old=model.clips.ko.frames[i-1].rotations[id]?.[k]??v[k];while(v[k]-old>180)v[k]-=360;while(v[k]-old< -180)v[k]+=360;}
fs.writeFileSync('rigs/models/spider.json',JSON.stringify(model,null,2)+'\n');
