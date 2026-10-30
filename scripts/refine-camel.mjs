// Author-time Camel: realistic two-hump proportions, native pacing and stylized Bite.
// Emits ordinary joint-local clips; no reference mesh or runtime IK is shipped.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
import {curve,round} from './lib/spatial-leg-ik.mjs';
const r=loadFamily('deer'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
Object.assign(r,{id:'camelBase',archetypes:['camel','bactrian'],heightMeters:2.15,tokenScale:21,tokenGroundY:58,profile:{silhouette:'two-humped camel: tall long legs, padded broad feet, deep barrel, two back humps, low neck root rising into a long S-neck, small head and mobile lips',locomotion:'same-side hind/fore pacing walk, fast four-beat gallop with lower neck carriage',attack:'native Stylized Bite-informed neck preload, lowered forward snap, jaw closure and complete recovery over four braced pads'}});
r.camera.framing='fixed scale with ground origin at token [50,58]';
j('pelvis').bind=[-.54,0,1.46];j('chest').bind=[1.08,0,.02];
j('neckBase').bind=[.30,0,-.12];j('neckTip').bind=[.26,0,.27];j('head').bind=[.20,0,.35];j('muzzle').bind=[.27,0,-.08];
j('barrelRear').bind=[.06,0,-.10];j('barrelFront').bind=[-.06,0,-.14];
j('tailBase').bind=[-.15,0,.03];j('tailTip').bind=[-.06,0,-.55];
p('torsoPlate').size=[.66];p('pelvisPlate').size=[.47,.61];p('shoulderPlate').size=[.46,.64];p('withersPlate').size=[.36];p('neckPlate').size=[.31];p('headConnectorPlate').size=[.24];p('headPlate').size=[.23,.29];p('muzzleConnectorPlate').size=[.19];p('muzzlePlate').size=[.20,.135];p('tailConnectorPlate').size=[.065];p('tailPlate').size=[.11,.16];p('castShadow').size=[2.8,.86];
j('jaw').bind=[.035,0,-.075];j('jawTip').bind=[.235,0,-.025];p('jawPlate').size=[.095];
for(const [id,parent,bind]of [['rearHump','pelvis',[.18,0,.29]],['frontHump','chest',[-.28,0,.29]]]){
 r.joints.push({id,parent,bind,role:'body',helper:true});r.plates.push({id:id+'Plate',bone:id,shape:'ellipse',size:[.57,.70],role:'core',bodyRegion:'core',attachment:'rigid',material:'paperMain',zBias:2.2,semanticDetailTier:'silhouette'});
}
for(const side of ['near','far']){
 const sign=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.025,sign*.18,-.16];j(side+'FrontKnee').bind=[-.18,0,-.29];j(side+'FrontCarpus').bind=[.03,0,-.52];j(side+'FrontHoof').bind=[.15,0,-.51];
 j(side+'RearHip').bind=[-.025,sign*.18,-.14];j(side+'RearKnee').bind=[.12,0,-.30];j(side+'RearHock').bind=[-.18,0,-.48];j(side+'RearHoof').bind=[.06,0,-.54];
 for(const part of ['Front','Rear']){p(side+part+'UpperPlate').size=[part==='Front' ? .16 : .20];p(side+part+'LowerPlate').size=[.085];p(side+part+'PasternPlate').size=[.055];p(side+part+'HoofPlate').size=[.19,.11];j(side+part+'Hoof').gasket={diameterMeters:.09};}
 j(side+'EarBase').bind=[-.055,sign*.075,.075];j(side+'EarTip').bind=[-.065,sign*.09,.07];
 const leaf=[[0,0,0],[-.055,sign*.025,.025],[-.085,sign*.065,.075],[-.055,sign*.095,.10],[.015,sign*.05,.075],[.025,0,.025]];
 leaf.forEach((v,i)=>j(side+'EarLeaf'+i).bind=v);p(side+'EarSpinePlate').size=[.025];
}
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
const blank={base:'bind',duration:5000,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
// Existing audited gallop baker, with restrained rise for the long straight legs.
applyGroundedQuadruped(r,{run:{durationMs:585,stride:.30,lift:.29,bodyRise:.02,bodyDip:.035,pitchDegrees:.5,neckPitchDegrees:20,headPitchDegrees:-12,tailPitchDegrees:-4}});
for(const f of r.clips.run.frames)f.rotations.neckTip=[0,round(8+2*Math.sin(2*Math.PI*f.t)),0];
// Camel-specific ipsilateral pace: hind foot leads the same-side forefoot by .12.
const duty=.68,settings=legs.map(leg=>({leg,start:(leg.foot.id.startsWith('near')?0:.5)+(leg.rear?0:.12)}));
const intervals=[];for(const {leg,start}of settings)for(const cycle of [-1,0]){const from=Math.max(0,start+cycle),to=Math.min(1,start+cycle+duty);if(from<=to)intervals.push({ids:[leg.foot.id],from:round(from),to:round(to)});}
const walkTimes=[...new Set([...Array.from({length:321},(_,i)=>i/320),...intervals.flatMap(i=>[i.from,i.to])])].sort((a,b)=>a-b);
const walkFrames=walkTimes.map(t=>{
 const move=[0,0,-.015*(1-Math.cos(4*Math.PI*t))/2],rotations={neckBase:[0,4+2*Math.sin(2*Math.PI*t),0],neckTip:[0,-1.5*Math.sin(2*Math.PI*t),0],head:[0,-3-.5*Math.sin(2*Math.PI*t),0],tailBase:[0,0,4*Math.sin(2*Math.PI*t)]},body=sagittalBodyPose(r,rotations,move);
 for(const {leg,start}of settings){const phase=((t===1?0:t)-start+1)%1,stance=phase<=duty,u=stance?phase/duty:(phase-duty)/(1-duty),stride=.24*bind[leg.hip.id][2],x=stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2),z=stance?0:.08*bind[leg.hip.id][2]*Math.sin(Math.PI*u)**2;
  const q=bind[leg.foot.id],local=solveLeg(leg,body.positions[leg.hip.id],[q[0]+x,q[1],z]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
});
walkFrames[walkFrames.length-1]={...structuredClone(walkFrames[0]),t:1};
r.clips.walkA={base:'bind',duration:1500,easing:'linear',loop:true,frames:walkFrames,contactIntervals:intervals.sort((a,b)=>a.from-b.from||a.to-b.to),events:settings.map(({leg,start})=>({t:start,name:leg.foot.id+'-contact'})).sort((a,b)=>a.t-b.t),boneLengthPolicy:'preserve',motionSemantics:'ipsilateral camel pacing; same-side hind contact leads fore by .12 cycle, opposite side offset .5; planted stance and raised swing'};
const times=[...new Set([...Array.from({length:481},(_,i)=>i/480),.18,.28,.36,.44,.48,.54,.62,.80,.94])].sort((a,b)=>a-b);
function frame(attack,t){
 const w=2*Math.PI*t,move=attack?[curve([[0,0],[.18,-.025],[.44,.055],[.54,.055],[.80,.01],[1,0]],t),0,curve([[0,0],[.28,-.02],[.48,-.045],[.80,-.01],[1,0]],t)]:[0,0,-.006*(1-Math.cos(w))/2];
 const rotations=attack?{
  neckBase:[0,curve([[0,0],[.18,-7],[.28,-9],[.44,23],[.54,25],[.80,4],[1,0]],t),0],
  neckTip:[0,curve([[0,0],[.18,-5],[.28,-4],[.44,17],[.54,16],[.80,3],[1,0]],t),0],
  head:[0,curve([[0,0],[.28,8],[.44,-10],[.54,-8],[.80,-2],[1,0]],t),0],
  jaw:[0,curve([[0,0],[.18,4],[.36,28],[.44,28],[.48,2],[.54,0],[1,0]],t),0],tailBase:[0,0,3*Math.sin(w)]
 }:{neckBase:[0,.6*Math.sin(w),0],neckTip:[0,-.35*Math.sin(w),0],head:[0,-.25*Math.sin(w),0],jaw:[0,1.4*(1-Math.cos(4*w))/2,0],tailBase:[0,0,3*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.5)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:241},(_,i)=>frame(false,i/240)),events:[],boneLengthPolicy:'preserve',motionSemantics:'quiet camel breathing and lip chewing, small ear/tail movements over four planted padded feet'};
r.clips.idleA.frames[r.clips.idleA.frames.length-1]={...structuredClone(r.clips.idleA.frames[0]),t:1};
r.clips.attack={base:'bind',duration:1400,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contacts:feet,events:[{t:.18,name:'windup',phase:'anticipation'},{t:.36,name:'jaw-open',phase:'action'},{t:.48,name:'impact',phase:'contact'},{t:.62,name:'release',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.18,to:.28},{id:'action',from:.28,peak:.36,to:.44},{id:'contact',from:.44,peak:.48,to:.62},{id:'recovery',from:.62,peak:.80,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'stylized native Bite-informed preload, lowered forward neck snap, fast jaw closure, four-pad brace and full isolated recovery'};
r.clips.attack.frames[r.clips.attack.frames.length-1]={...structuredClone(r.clips.attack.frames[0]),t:1};
const model={$schema:'paper-rig/model-1',family:'camel',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
for(const[path,obj]of[['rigs/families/camel.json',r],['rigs/models/camel.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
