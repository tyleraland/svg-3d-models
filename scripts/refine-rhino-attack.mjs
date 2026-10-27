// Author-time horn strike bake. Run from the repository root after shape edits.
// Output is ordinary local keyframes; consumers require no IK implementation.
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
const rig=loadModel('rhino'),bind=bindPositions(rig),legs=quadrupedLegs(rig);
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(9);
function curve(keys,t){const[a,b]=keys.slice(0,-1).map((a,i)=>[a,keys[i+1]]).find(([a,b])=>t>=a[0]&&t<=b[0]);const u=(t-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*u*u*(3-2*u);}
const intervals=legs.flatMap(l=>l.foot.id==='nearFrontPaw'?[{ids:[l.foot.id],from:0,to:.16},{ids:[l.foot.id],from:.54,to:.72},{ids:[l.foot.id],from:.95,to:1}]:[{ids:[l.foot.id],from:0,to:1}]).sort((a,b)=>a.from-b.from||a.to-b.to);
const phases=[{id:'anticipation',from:0,peak:.24,to:.34},{id:'action',from:.34,peak:.54,to:.60},{id:'contact',from:.60,peak:.64,to:.72},{id:'recovery',from:.72,peak:.86,to:.95},{id:'settle',from:.95,peak:1,to:1}];
const times=[...new Set([...Array.from({length:481},(_,i)=>i/480),...intervals.flatMap(i=>[i.from,i.to]),...phases.flatMap(p=>[p.from,p.peak,p.to])])].sort((a,b)=>a-b);
const frames=times.map(t=>{
 const move=[curve([[0,0],[.24,-.01],[.54,.025],[.72,.015],[1,0]],t),0,curve([[0,0],[.24,-.035],[.54,-.015],[.72,-.015],[1,0]],t)];
 const rotations={root:[0,round(curve([[0,0],[.24,1],[.54,-1.5],[.72,-1],[1,0]],t)),0],
  neck:[0,round(curve([[0,0],[.24,12],[.34,12],[.54,-20],[.64,-24],[.80,-5],[1,0]],t)),0],
  head:[0,round(curve([[0,0],[.24,14],[.34,14],[.54,-16],[.64,-10],[1,0]],t)),round(curve([[0,0],[.34,4],[.54,-18],[.64,-16],[1,0]],t))],
  tailBase:[0,0,round(4*Math.sin(Math.PI*t))]};
 const body=sagittalBodyPose(rig,rotations,move);
 for(const leg of legs){
  const target=[...bind[leg.foot.id]];
  if(leg.foot.id==='nearFrontPaw'){
   target[0]+=curve([[0,0],[.16,0],[.36,.035],[.54,.045],[.72,.045],[.95,0],[1,0]],t);
   target[2]=curve([[0,0],[.16,0],[.32,.075],[.54,0],[.72,0],[.84,.035],[.95,0],[1,0]],t);
  }
  const local=solveLeg(leg,body.positions[leg.hip.id],target);local[leg.hip.id][1]=round(local[leg.hip.id][1]-body.angles[leg.hip.id]);Object.assign(rotations,local);
 }
 return{t,poses:{root:move.map(round)},rotations};
});
const modelPath='rigs/models/rhino.json',model=JSON.parse(fs.readFileSync(modelPath));
model.clips={attack:{base:'bind',duration:1400,easing:'linear',loop:false,frames,phases,contactIntervals:intervals,events:[{t:.24,name:'head-lowered',phase:'anticipation'},{t:.54,name:'horn-lift',phase:'action'},{t:.64,name:'impact',phase:'contact'},{t:.80,name:'release',phase:'recovery'},{t:1,name:'settled',phase:'settle'}],boneLengthPolicy:'preserve',motionSemantics:'braced horn lift and left sweep; anticipatory head dip, near forefoot brace-step, planted rear support and recovery; baked local rotations'}};
let text=JSON.stringify(model,null,2);for(const f of frames){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(modelPath,text+'\n');
