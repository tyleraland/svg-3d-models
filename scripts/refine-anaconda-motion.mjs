// Author-time snake curvature and lift. The consumer sees only ordinary clips.
import fs from'node:fs';import{loadModel}from'@paper-rig/rigs';import{core}from'@paper-rig/compiler';import{bindPositions}from'../rigs/quadruped-locomotion.js';import{angles,round,curve}from'./lib/spatial-leg-ik.mjs';
const r=loadModel('serpentine'),bind=bindPositions(r),chain=r.joints.filter(j=>!['root','jaw','jawTip'].includes(j.id)),ground=chain.slice(0,20).map(j=>j.id);
const transpose=M=>M[0].map((_,i)=>M.map(row=>row[i])),mm=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((n,v,k)=>n+v*B[k][j],0))),I=()=>[[1,0,0],[0,1,0],[0,0,1]];
const settings={idleA:{duration:4000},walkA:{duration:2600},run:{duration:1350},rise:{duration:1800},idleRaised:{duration:3000},lower:{duration:1600},attack:{duration:1450}};
const pitch=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,-35,-60,-80,-85,-80,-65,-35,-5,0,0];
function raised(mode,t){if(mode==='rise')return curve([[0,0],[.12,0],[.88,1],[1,1]],t);if(mode==='lower')return raised('rise',1-t);if(mode==='idleRaised')return 1;if(mode==='attack')return curve([[0,0],[.12,0],[.32,1],[.42,1],[.50,1],[.62,1],[.86,0],[1,0]],t);return 0;}
function frame(mode,t){const w=2*Math.PI*t,rise=raised(mode,t),rotations={},poses={root:[0,0,0]};let parent=I();
 for(let i=0;i<chain.length;i++){
  const j=chain[i],next=chain[i+1];if(!next)continue;
  const s=i/22,rest=50*Math.sin(s*2*Math.PI*1.15),moving=mode==='walkA'||mode==='run';
  let yaw=moving?(mode==='run'?62:52)*Math.sin(2*Math.PI*(1.15*s+t)):rest+(mode==='idleA'?3*Math.sin(w)*Math.sin(3*s):0);
  // Progressively stabilize the head instead of yawing it as widely as the body.
  if(i>=19)yaw*=Math.max(.12,1-(i-18)*.24);
  const coil=i<14?-351+i*27:0;
  if(rise)yaw=yaw*(1-rise)+coil*rise;
  let lift=pitch[i]*rise;
  if(mode==='idleRaised'){lift+=i>=15&&i<=20?1.2*(1-Math.cos(w)):0;yaw+=i>=15?2*Math.sin(w):0;}
  if(mode==='attack'){
   const thrust=curve([[0,0],[.42,0],[.50,1],[.62,.65],[.86,0],[1,0]],t);
   // Uncoil the front in 116ms while keeping the rear support in place.
   if(i>=14){yaw=yaw*(1-thrust)+8*thrust;lift=lift*(1-thrust)-12*thrust;}
  }
  const v=next.bind,bindYaw=Math.atan2(v[1],v[0])*180/Math.PI,world=mm(core.euler([0,0,yaw]),mm(core.euler([0,lift,0]),core.euler([0,0,-bindYaw])));
  rotations[j.id]=angles(mm(transpose(parent),world));parent=world;
 }
 rotations.head=angles(mm(core.euler(rotations.head),core.euler([0,mode==='attack'?curve([[0,0],[.32,8],[.42,8],[.50,15],[.62,4],[.86,0],[1,0]],t):0,0])));
 rotations.jaw=[0,mode==='attack'?curve([[0,0],[.28,0],[.42,38],[.50,3],[.62,0],[1,0]],t):0,0];
 // Center the projected asset on the middle-body support; the ground stays fixed.
 let p=core.solvePose({...r,clips:{pose:{frames:[{t:0,poses,rotations}]}}},0,'pose');
 poses.root[0]=bind.middleSpine[0]-p.positions.middleSpine[0];poses.root[1]=bind.middleSpine[1]-p.positions.middleSpine[1];
 return{t:round(t),poses:Object.fromEntries(Object.entries(poses).map(([k,v])=>[k,v.map(round)])),rotations};
}
const model=JSON.parse(fs.readFileSync('rigs/models/serpentine.json'));model.clips={};
for(const[mode,c]of Object.entries(settings)){
 const times=[...new Set([...Array.from({length:181},(_,i)=>round(i/180)),.12,.28,.32,.42,.50,.62,.86,.88])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));
 for(let i=1;i<frames.length;i++)for(const[id,v]of Object.entries(frames[i].rotations))for(let k=0;k<3;k++){const old=frames[i-1].rotations[id]?.[k]??v[k];while(v[k]-old>180)v[k]-=360;while(v[k]-old< -180)v[k]+=360;}
 const loop=['idleA','walkA','run','idleRaised'].includes(mode);if(loop)frames[frames.length-1]=structuredClone({...frames[0],t:1});
 model.clips[mode]={base:'bind',duration:c.duration,easing:'linear',loop,frames,contactIntervals:(()=>{const rear={ids:ground.slice(0,14),from:0,to:1},front=ground.slice(14);if(['idleA','walkA','run'].includes(mode))return[{ids:ground,from:0,to:1}];if(mode==='rise')return[rear,{ids:front,from:0,to:.12}];if(mode==='lower')return[rear,{ids:front,from:.88,to:1}];if(mode==='attack')return[rear,{ids:front,from:0,to:.12},{ids:front,from:.86,to:1}];return[rear];})(),events:mode==='attack'?[{t:.12,name:'forebody-rise'},{t:.42,name:'strike-windup'},{t:.50,name:'impact'},{t:.62,name:'release'},{t:.86,name:'recover'}]:mode==='rise'?[{t:.12,name:'forebody-release'},{t:.88,name:'raised-hold'}]:mode==='lower'?[{t:.88,name:'forebody-lowered'}]:[],boneLengthPolicy:'preserve',motionSemantics:mode==='walkA'||mode==='run'?'head-to-tail traveling curvature; supported belly glides along XY; full chain articulated':mode==='attack'?'rear support stays low; forebody rises and uncoils into a sudden jaw-closing strike, then recovers':'joint-local snake posing with grounded rear body and explicit lifted forebody'};
}
// Compact ordinary keyframes for source review.
let text=JSON.stringify(model,null,2);text=text.replace(/      "frames": \[\n[\s\S]*?\n      \]/g,m=>'      "frames": [\n'+JSON.parse('{'+m+'}').frames.map(f=>'        '+JSON.stringify(f)).join(',\n')+'\n      ]');fs.writeFileSync('rigs/models/serpentine.json',text+'\n');
