// Author-time rear and alternating foreleg stomp. Consumers receive ordinary clips.
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
const familyPath='rigs/families/horse.json',family=JSON.parse(fs.readFileSync(familyPath));family.tokenScale=23;family.tokenGroundY=72;fs.writeFileSync(familyPath,JSON.stringify(family,null,2)+'\n');
const rig=loadModel('horse'),bind=bindPositions(rig),legs=quadrupedLegs(rig);
const smooth=u=>u*u*(3-2*u),round=n=>Math.abs(n)<1e-10?0:+n.toFixed(9);
function curve(t,keys){for(let i=0;i<keys.length-1;i++){const[a,x]=keys[i],[b,y]=keys[i+1];if(t<=b)return x+(y-x)*smooth(Math.max(0,(t-a)/(b-a)));}return keys.at(-1)[1];}
function frame(t){
 const rise=curve(t,[[0,0],[.12,0],[.34,1],[.70,1],[.92,0],[1,0]]);
 const root=[-.10*rise,0,curve(t,[[0,0],[.08,-.04],[.12,-.04],[.34,-.12],[.70,-.12],[.92,0],[1,0]])];
 const rotations={pelvis:[0,-58*rise,0],neckBase:[0,18*rise,0],neckTip:[0,10*rise,0],head:[0,14*rise,0],tailBase:[0,15*rise,0]};
 const body=sagittalBodyPose(rig,rotations,root);
 for(const leg of legs){
  let target=[...bind[leg.foot.id]];
  if(!leg.rear){
   const near=leg.foot.id.startsWith('near');
   const paw=curve(t,near?[[0,0],[.28,0],[.42,1],[.58,0],[.72,0],[1,0]]:[[0,0],[.42,0],[.58,1],[.72,0],[1,0]]);
   // Fold through the actual elbow and carpus, rather than shortening bones.
   const grounded=solveLeg(leg,bind[leg.hip.id].map((v,i)=>v+root[i]),bind[leg.foot.id]);
   const folded={[leg.hip.id]:30-35*paw,[leg.knee.id]:-75+30*paw,[leg.hock.id]:60-30*paw};
   for(const [id,angle] of Object.entries(folded))rotations[id]=[0,grounded[id][1]*(1-rise)+angle*rise,0];
   continue;
  }
  try{const local=solveLeg(leg,body.positions[leg.hip.id],target);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}catch(e){throw new Error(`${t}/${leg.foot.id}: ${e.message}`);}
 }
 return{t,poses:{root:root.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([k,v])=>[k,v.map(round)]))};
}
const times=[...new Set([...Array.from({length:481},(_,i)=>i/480),.08,.12,.28,.34,.42,.58,.70,.72,.92])].sort((a,b)=>a-b);
const modelPath='rigs/models/horse.json',m=JSON.parse(fs.readFileSync(modelPath));
m.clips.stomp={base:'bind',duration:2600,easing:'linear',loop:false,frames:times.map(frame),contactIntervals:[{ids:legs.map(l=>l.foot.id),from:0,to:.12},{ids:legs.filter(l=>l.rear).map(l=>l.foot.id),from:0,to:1},{ids:legs.filter(l=>!l.rear).map(l=>l.foot.id),from:.92,to:1}],events:[{t:.12,name:'rear-start'},{t:.34,name:'upright'},{t:.42,name:'near-foreleg-raised'},{t:.58,name:'far-foreleg-raised'},{t:.72,name:'return'},{t:.92,name:'forehooves-land'},{t:1,name:'settled'}],boneLengthPolicy:'preserve',motionSemantics:'hind-hoof-planted rear; alternating raised foreleg strikes and controlled four-hoof landing'};
let text=JSON.stringify(m,null,2);for(const c of Object.values(m.clips))for(const f of c.frames){const block=JSON.stringify(f,null,2).split('\n').map(l=>'        '+l).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(modelPath,text+'\n');
