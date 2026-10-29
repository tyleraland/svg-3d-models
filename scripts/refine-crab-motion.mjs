// Reference-informed crab motion, baked at author time. No runtime IK.
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {core} from '@paper-rig/compiler';
import {bindPositions} from '../rigs/quadruped-locomotion.js';
import {ik,round,curve} from './lib/spatial-leg-ik.mjs';
const r=loadModel('crab'),bind=bindPositions(r),byId=new Map(r.joints.map(j=>[j.id,j]));
const legs=['left','right'].flatMap(side=>[1,2,3,4].map(i=>{const id=side+'Leg'+i;return{side,i,hip:byId.get(id+'Hip'),knee:byId.get(id+'Knee'),foot:byId.get(id+'Foot'),phase:((i-1+(side==='right'?1:0))%2)*.5};}));
const settings={idleA:{duration:3200},walkA:{duration:1200,duty:.68,stride:.16,lift:.055,axis:0},run:{duration:650,duty:.56,stride:.18,lift:.085,axis:0},sidewalk:{duration:1150,duty:.68,stride:.10,lift:.055,axis:1},siderun:{duration:620,duty:.56,stride:.14,lift:.085,axis:1},attack:{duration:1250}};
function intervals(mode){const c=settings[mode];if(!c.duty)return[{ids:legs.map(l=>l.foot.id),from:0,to:1}];return legs.flatMap(l=>{const cuts=[...new Set([0,1,...[0,c.duty].map(p=>round((p-l.phase+1)%1))])].sort((a,b)=>a-b),rows=[];for(let i=0;i<cuts.length-1;i++)if(((cuts[i]+cuts[i+1])/2+l.phase)%1<c.duty)rows.push({ids:[l.foot.id],from:cuts[i],to:cuts[i+1]});if(l.phase===0)rows.push({ids:[l.foot.id],from:1,to:1});return rows;});}
function frame(mode,t){const c=settings[mode],w=2*Math.PI*t,poses={root:[0,0,0]},rotations={};
 if(mode==='idleA')poses.root[2]=-.007*(1-Math.cos(w))/2;
 if(c.duty)poses.root[2]=-.01*(1-Math.cos(2*w))/2;
 const strike=mode==='attack';
 if(strike)poses.root=[curve([[0,0],[.28,-.035],[.43,.045],[.58,.045],[.86,0],[1,0]],t),0,curve([[0,0],[.28,-.025],[.43,-.008],[.86,0],[1,0]],t)];
 const body=core.solvePose({...r,clips:{pose:{frames:[{t:0,poses,rotations}]}}},0,'pose');
 for(const l of legs){const target=[...bind[l.foot.id]];
  if(c.duty){const p=(t+l.phase)%1;if(p<=c.duty)target[c.axis]+=c.stride*(.5-p/c.duty);else{const u=(p-c.duty)/(1-c.duty);target[c.axis]+=c.stride*(-.5+u*u*(3-2*u));target[2]=c.lift*Math.sin(Math.PI*u)**2;}}
  try{Object.assign(rotations,ik(l,body.positions[l.hip.id],target,body.rotations.body));}catch(e){throw Error(mode+'/'+t+': '+e.message)}
 }
 for(const [side,s]of[['left',1],['right',-1]]){
  const major=side==='right',n=side+'Claw';
  rotations[n+'Shoulder']=[0,strike?curve([[0,0],[.28,-32],[.43,9],[.58,5],[.86,0],[1,0]],t):Math.sin(w)*(c.duty?2:4),s*(strike?curve([[0,0],[.28,24],[.43,-22],[.58,-18],[.86,0],[1,0]],t):Math.sin(w)*2)*(major?1:.5)];
  rotations[n+'Elbow']=[0,strike?curve([[0,0],[.28,-18],[.43,10],[.58,5],[.86,0],[1,0]],t):0,s*(strike?curve([[0,0],[.28,-15],[.43,24],[.58,16],[.86,0],[1,0]],t):0)];
  rotations[n+'MovingBase']=[0,0,s*(strike?curve([[0,0],[.23,-32],[.39,-38],[.46,16],[.58,16],[.78,-8],[1,0]],t):(-5+5*Math.cos(w)))];
  rotations[side+'EyeBase']=[2*Math.sin(w),0,s*2*Math.sin(w)];
 }
 return{t:round(t),poses:Object.fromEntries(Object.entries(poses).map(([k,v])=>[k,v.map(round)])),rotations};
}
const model=JSON.parse(fs.readFileSync('rigs/models/crab.json'));
for(const mode of Object.keys(settings)){
 const times=[...new Set([...Array.from({length:321},(_,i)=>round(i/320)),...intervals(mode).flatMap(x=>[x.from,x.to]),.23,.28,.39,.43,.46,.58,.78,.86])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));
 for(let i=1;i<frames.length;i++)for(const[id,v]of Object.entries(frames[i].rotations))for(let k=0;k<3;k++){const old=frames[i-1].rotations[id]?.[k]??v[k];while(v[k]-old>180)v[k]-=360;while(v[k]-old< -180)v[k]+=360;}
 if(mode!=='attack')frames[frames.length-1]=structuredClone({...frames[0],t:1});
 model.clips[mode]={base:'bind',duration:settings[mode].duration,easing:'linear',loop:mode!=='attack',frames,contactIntervals:intervals(mode).sort((a,b)=>a.from-b.from||a.to-b.to),events:mode==='attack'?[{t:.28,name:'claw-windup'},{t:.43,name:'claw-strike'},{t:.46,name:'pincer-snap'},{t:.86,name:'recover'}]:settings[mode].duty?[{t:0,name:'tetrapod-a'},{t:.5,name:'tetrapod-b'}]:[],boneLengthPolicy:'preserve',motionSemantics:mode==='attack'?'eight planted supports; major claw windup, rapid arcing strike and hinged pincer snap':settings[mode].duty?`alternating tetrapod supports; ${settings[mode].axis?'lateral':'forward'} travel; whole-leg local rotations`:'quiet breathing and claw/eye motion over eight planted feet'};
}
// Compact frames keep authored clips reviewable without changing their data.
let text=JSON.stringify(model,null,2);text=text.replace(/      "frames": \[\n[\s\S]*?\n      \]/g,match=>{const frames=JSON.parse('{'+match+'}').frames;return '      "frames": [\n'+frames.map(f=>'        '+JSON.stringify(f)).join(',\n')+'\n      ]';});
fs.writeFileSync('rigs/models/crab.json',text+'\n');
