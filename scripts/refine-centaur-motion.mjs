// Author-time equine gait reuse plus independent humanoid balance/strike curves.
import fs from'node:fs';import{loadFamily}from'@paper-rig/rigs';import{core}from'@paper-rig/compiler';import{applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';import{round,curve}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('centaur');applyGroundedQuadruped(r,{walk:{durationMs:1450,pattern:'lateral-sequence',stride:.42,lift:.14,dutyFactor:.68,bodyBounce:.018,tailSwingDegrees:5},run:{durationMs:760,stride:.49,lift:.25,bodyRise:.065,bodyDip:.025,pitchDegrees:2,tailPitchDegrees:-8}});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
function arms(t,mode){const w=2*Math.PI*t,run=mode==='run';return{upperPelvis:[0,run?7:0,0],upperSpine:[0,run?3+Math.sin(w)*1.2:Math.sin(w)*1.2,run?1.5*Math.sin(w):1*Math.sin(w)],upperNeck:[0,run?-10:-1*Math.sin(w),0],upperHead:[0,run?0:-.2*Math.sin(w),0],leftShoulder:[0,(run?-15:-3)+(run?7:10)*Math.sin(w),0],rightShoulder:[0,(run?-15:-3)-(run?7:10)*Math.sin(w),0],leftElbow:[0,run?-65:-12,0],rightElbow:[0,run?-65:-12,0]};}
for(const mode of ['walkA','run'])for(const f of r.clips[mode].frames)Object.assign(f.rotations,arms(f.t,mode));
const times=[...new Set([...Array.from({length:241},(_,i)=>round(i/240)),.16,.30,.32,.40,.415,.42,.50,.72,.84])].sort((a,b)=>a-b);
function frame(mode,t){const w=2*Math.PI*t,attack=mode==='attack',move=[0,0,attack?curve([[0,0],[.30,-.035],[.42,-.015],[.72,-.005],[.84,0],[1,0]],t):-.01*(1-Math.cos(w))/2],rotations={};
 if(attack){
  move[0]=curve([[0,0],[.30,-.035],[.42,.06],[.50,.06],[.84,0],[1,0]],t);
  rotations.pelvis=[0,curve([[0,0],[.30,-.8],[.42,.8],[.84,0],[1,0]],t),0];
  rotations.upperPelvis=[0,curve([[0,0],[.30,-4],[.42,6],[.72,2],[.84,0],[1,0]],t),0];
  rotations.upperSpine=[0,curve([[0,0],[.30,-4],[.42,8],[.72,2],[.84,0],[1,0]],t),curve([[0,0],[.30,12],[.42,-10],[.72,-3],[.84,0],[1,0]],t)];
  rotations.upperNeck=[0,curve([[0,0],[.30,7],[.42,-12],[.72,-3],[.84,0],[1,0]],t),0];
  rotations.leftShoulder=[0,curve([[0,0],[.30,25],[.42,-85],[.50,-80],[.72,-20],[.84,0],[1,0]],t),0];
  rotations.leftElbow=[0,curve([[0,0],[.16,-25],[.30,-80],[.42,-8],[.50,-8],[.72,-35],[.84,0],[1,0]],t),0];
  rotations.rightShoulder=[0,curve([[0,0],[.30,-20],[.42,-25],[.72,-10],[.84,0],[1,0]],t),0];
  rotations.rightElbow=[0,curve([[0,0],[.30,-65],[.42,-70],[.72,-30],[.84,0],[1,0]],t),0];
 }else{rotations.upperSpine=[0,.8*Math.sin(w),0];rotations.upperNeck=[0,-.6*Math.sin(w),0];rotations.leftShoulder=[0,1.2*Math.sin(w),0];rotations.rightShoulder=[0,-1.2*Math.sin(w),0];rotations.tailBase=[0,0,2*Math.sin(w)];}
 const body=sagittalBodyPose(r,rotations,move);
 for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([k,v])=>[k,v.map(round)]))};
}
for(const mode of ['idleA','attack'])r.clips[mode]={base:'bind',duration:mode==='idleA'?3200:1300,easing:'linear',loop:mode==='idleA',frames:(mode==='idleA'?Array.from({length:481},(_,i)=>round(i/480)):times).map(t=>frame(mode,t)),contacts:feet,events:mode==='attack'?[{t:.30,name:'windup'},{t:.42,name:'impact'},{t:.50,name:'release'},{t:.84,name:'settled'}]:[],boneLengthPolicy:'preserve',motionSemantics:mode==='attack'?'four planted hooves; weight preload, torso twist and fast left-hand strike with right-hand guard, then recovery':'quiet torso breathing and tail motion over four fixed hooves'};
r.clips.attack.phases=[{id:'anticipation',from:0,peak:.30,to:.32},{id:'action',from:.32,peak:.40,to:.415},{id:'contact',from:.415,peak:.42,to:.50},{id:'recovery',from:.50,peak:.72,to:.84},{id:'settle',from:.84,peak:1,to:1}];
for(const e of r.clips.attack.events)e.phase=e.name==='windup'?'anticipation':e.name==='settled'?'settle':'contact';
for(const mode of ['idleA','walkA','run'])r.clips[mode].frames[r.clips[mode].frames.length-1]=structuredClone({...r.clips[mode].frames[0],t:1});
const path='rigs/models/centaur.json',model=JSON.parse(fs.readFileSync(path));model.groundedQuadruped={};model.clips=Object.fromEntries(['idleA','walkA','run','attack'].map(k=>[k,r.clips[k]]));
let text=JSON.stringify(model,null,2);text=text.replace(/      "frames": \[\n[\s\S]*?\n      \]/g,m=>'      "frames": [\n'+JSON.parse('{'+m+'}').frames.map(f=>'        '+JSON.stringify(f)).join(',\n')+'\n      ]');fs.writeFileSync(path,text+'\n');
