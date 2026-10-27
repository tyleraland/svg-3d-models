// Author-time bear postures, transitions and springy paw arcs. Run from repo root.
// Output is ordinary local keyframes; consumers do not evaluate these solvers.
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
const rig=loadModel('bear'),bind=bindPositions(rig),legs=quadrupedLegs(rig),rear=legs.filter(l=>l.rear).map(l=>l.foot.id),front=legs.filter(l=>!l.rear).map(l=>l.foot.id);
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(9),smooth=u=>u*u*(3-2*u);
function curve(keys,t){const[a,b]=keys.slice(0,-1).map((a,i)=>[a,keys[i+1]]).find(([a,b])=>t>=a[0]&&t<=b[0]);return a[1]+(b[1]-a[1])*smooth((t-a[0])/(b[0]-a[0]));}
const mix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
function bezier(points,u){const v=1-u;return[0,1].map(k=>v*v*v*points[0][k]+3*v*v*u*points[1][k]+3*v*u*u*points[2][k]+u*u*u*points[3][k]);}
function swipe(t,upright){
 const high=upright?.55:.56,reach=upright?.40:.50,finish=upright?.26:.29;
 if(t<=.32)return[curve([[0,0],[.12,0],[.32,-.10]],t),curve([[0,0],[.12,0],[.32,upright?.10:.20]],t)];
 if(t<=.56){const u=smooth((t-.32)/.24);return bezier([[-.10,upright?.10:.20],[-.10,high],[reach,high-.04],[finish,upright?-.03:.20]],u);}
 return[curve([[.56,finish],[.64,.15],[.82,-.02],[.96,0],[1,0]],t),curve([[.56,upright?-.03:.20],[.64,upright?-.08:.11],[.82,upright?.02:.06],[.96,0],[1,0]],t)];
}
const sorted=a=>a.sort((a,b)=>a.from-b.from||a.to-b.to);
function intervals(mode){
 if(mode==='attack')return sorted(legs.flatMap(l=>l.foot.id==='nearFrontPaw'?[{ids:[l.foot.id],from:0,to:.12},{ids:[l.foot.id],from:.96,to:1}]:[{ids:[l.foot.id],from:0,to:1}]));
 if(mode==='standUp')return[{ids:front,from:0,to:.16},{ids:rear,from:0,to:1}];
 if(mode==='walkHind')return sorted([{ids:['nearRearPaw'],from:0,to:.68},{ids:['farRearPaw'],from:0,to:.18},{ids:['farRearPaw'],from:.5,to:1},{ids:['nearRearPaw'],from:1,to:1}]);
 return[{ids:rear,from:0,to:1}];
}
function frame(mode,time){
 const looping=mode==='idleHind'||mode==='walkHind',t=looping&&time===1?0:time,w=2*Math.PI*t;
 const rising=mode==='standUp',upright=mode!=='attack',walking=mode==='walkHind',attacking=mode==='attack'||mode==='attackHind';
 const progress=rising?curve([[0,0],[.16,0],[.9,1],[1,1]],t):upright?1:0;
 const root=[-.10*progress,0,rising?curve([[0,0],[.12,-.035],[.9,-.07],[1,-.07]],t):-.07*progress];
 const rotations={pelvis:[0,-70*progress,0],neck:[0,10*progress,0],head:[0,60*progress,0],tailBase:[0,0,0],nearEarBase:[0,0,0],farEarBase:[0,0,0]};
 if(mode==='idleHind'){rotations.pelvis[1]+=Math.sin(w);rotations.neck[1]+=Math.sin(w);rotations.head[1]-=Math.sin(w);}
 if(walking){root[2]-=.012*(1-Math.cos(2*w))/2;rotations.pelvis[1]+=1.5*Math.sin(w);}
 if(attacking){
  root[0]+=curve([[0,0],[.28,-.025],[.48,.045],[.64,-.005],[1,0]],t);
  root[2]+=curve([[0,0],[.28,-.045],[.44,.012],[.52,.006],[.64,-.025],[1,0]],t);
  rotations.neck[1]+=curve([[0,0],[.28,-5],[.5,6],[.8,2],[1,0]],t);
  rotations.head[2]=-5*Math.sin(Math.PI*t);
 }
 const body=sagittalBodyPose(rig,rotations,root);
 for(const leg of legs){const id=leg.foot.id,side=id.startsWith('near')?1:-1;
  let target=[...bind[id]],pawPitch=0;
  if(!leg.rear&&upright){
   target=mix(bind[id],[.20,bind[id][1],1.13],progress);pawPitch=15*progress;
   if(mode==='idleHind')target[2]+=.008*(1-Math.cos(w));
   if(walking){target[0]-=side*.06*Math.sin(w);target[2]+=side*.025*Math.sin(w);pawPitch+=side*5*Math.sin(w);}
  }
  if(leg.rear&&walking){
   const phase=(t+(side===1?0:.5))%1,stance=phase<=.68,u=stance?phase/.68:(phase-.68)/.32;
   target[0]+=.12*(stance?.5-u:-.5+(1-Math.cos(Math.PI*u))/2);
   target[2]=stance?0:.055*Math.sin(Math.PI*u)**2;
  }
  if(attacking&&id==='nearFrontPaw'){
   const [x,z]=swipe(t,upright);target[0]+=x;target[2]+=z;
   pawPitch+=curve([[0,0],[.32,-20],[.5,15],[.64,32],[.96,0],[1,0]],t);
  }
  try{const local=solveLeg(leg,body.positions[leg.hip.id],target);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
  catch(error){throw new Error(`${mode}/${time}: ${error.message}`);}
  rotations[id]=[0,pawPitch,0];
 }
 const desired=Object.fromEntries(legs.map(l=>[l.foot.id,rotations[l.foot.id][1]]));
 for(const l of legs)rotations[l.foot.id]=[0,0,0];
 const angles=sagittalBodyPose(rig,rotations).angles;
 for(const l of legs)rotations[l.foot.id]=[0,desired[l.foot.id]-angles[l.foot.id],0];
 return{t:time,poses:{root:root.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
const durations={attack:1000,idleHind:3000,walkHind:1450,attackHind:1050,standUp:1600};
const events={attack:[{t:.32,name:'wind-up'},{t:.44,name:'arc-apex'},{t:.5,name:'impact'},{t:.64,name:'rake'},{t:.82,name:'release'},{t:1,name:'settled'}],attackHind:[{t:.32,name:'wind-up'},{t:.44,name:'arc-apex'},{t:.5,name:'impact'},{t:.64,name:'rake'},{t:.82,name:'release'},{t:1,name:'settled'}],walkHind:[{t:0,name:'near-hind-plant'},{t:.5,name:'far-hind-plant'}],standUp:[{t:.12,name:'crouch'},{t:.16,name:'forepaws-release'},{t:.9,name:'upright'},{t:1,name:'settled'}]};
const clips={};
for(const mode of Object.keys(durations)){
 const contactIntervals=intervals(mode),times=[...new Set([...Array.from({length:241},(_,i)=>i/240),.12,.16,.18,.28,.32,.38,.44,.48,.5,.52,.56,.64,.68,.82,.9,.94,.96,...contactIntervals.flatMap(c=>[c.from,c.to])])].sort((a,b)=>a-b);
 clips[mode]={base:'bind',duration:durations[mode],loop:mode==='idleHind'||mode==='walkHind',easing:'linear',frames:times.map(t=>frame(mode,t)),contactIntervals,events:events[mode]||[],boneLengthPolicy:'preserve',motionSemantics:mode==='attack'?'spring-loaded three-foot-supported forepaw arc; wind-up, fast curved swipe, recoil and recovery':mode==='attackHind'?'upright hind-paw-supported springy forepaw arc; returns to neutral upright guard':mode==='standUp'?'four-foot crouch, forepaw release, pelvis rise and neutral hind-leg stance':mode==='walkHind'?'alternating hind-leg shuffle; planted sole intervals, raised swing, counter-swinging forepaws':'neutral upright guard; planted hind paws, quiet breathing'};
}
const up=clips.standUp;
clips.standDown={...structuredClone(up),duration:1400,frames:up.frames.toReversed().map(f=>({...structuredClone(f),t:round(1-f.t)})),contactIntervals:[{ids:rear,from:0,to:1},{ids:front,from:.84,to:1}],events:[{t:0,name:'upright'},{t:.84,name:'forepaws-plant'},{t:1,name:'settled'}],motionSemantics:'controlled return from upright guard to four-foot neutral; exact inverse pose path of standUp'};
const path='rigs/models/bear.json',model=JSON.parse(fs.readFileSync(path));model.clips={...model.clips,...clips};
let text=JSON.stringify(model,null,2);for(const c of Object.values(model.clips))for(const f of c.frames){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');
