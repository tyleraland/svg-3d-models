// Author-time hornless Cow: proportions and motion informed by the native animal study.
// Reuses ungulate geometry/grounding tools; emits independent declarative sources.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
import {curve,round} from './lib/spatial-leg-ik.mjs';
const r=loadFamily('deer'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
Object.assign(r,{id:'cowBase',archetypes:['cow','cattle'],heightMeters:1.55,tokenScale:22,tokenGroundY:57,profile:{silhouette:'hornless cow: deep stout barrel, rounded hindquarters and lighter neck, long muzzle, sideways ears, low udder and long tufted tail',locomotion:'four-beat cattle walk and quick gallop with articulated carpi, stifles and hocks',attack:'authored shove: gather weight, lower forehead slightly, press forward with shoulder/head, hold and recover'}});
r.camera.framing='fixed scale with ground origin at token [50,57]';
j('pelvis').bind=[-.58,0,1.16];j('chest').bind=[1.16,0,-.02];
j('neckBase').bind=[.12,0,-.06];j('neckTip').bind=[.29,0,.035];j('head').bind=[.17,0,.015];j('muzzle').bind=[.32,0,-.15];
j('tailBase').bind=[-.305,0,.075];j('tailBase').gasket={diameterMeters:.055};j('tailTip').bind=[-.15,0,-.67];
j('barrelRear').bind=[.08,0,-.12];j('barrelFront').bind=[-.06,0,-.12];
p('muzzleConnectorPlate').occlusionMode='under-core';
p('torsoPlate').size=[.88];p('pelvisPlate').size=[.61,.66];p('pelvisPlate').occlusionMode='under-core';p('shoulderPlate').size=[.54,.72];p('withersPlate').size=[.38];p('neckPlate').size=[.32];p('headConnectorPlate').size=[.25];p('headPlate').size=[.28,.36];p('muzzleConnectorPlate').size=[.23];p('muzzlePlate').size=[.28,.21];p('tailConnectorPlate').size=[.075];p('tailPlate').size=[.055];p('castShadow').size=[2.65,1.08];
// Shallow dewlap, long tufted tail and low rear udder distinguish the female cattle silhouette.
r.joints.push({id:'dewlapRear',parent:'neckBase',bind:[-.07,0,-.19],role:'neck',helper:true},{id:'dewlapFront',parent:'neckBase',bind:[.24,0,-.20],role:'neck',helper:true},{id:'tailTuft',parent:'tailTip',bind:[-.01,0,-.10],role:'tail',helper:true});
r.plates.push({id:'dewlapPlate',bone:'dewlapFront',span:['dewlapRear','dewlapFront'],shape:'bone',size:[.16],role:'body',bodyRegion:'neck',attachment:'rigid',material:'paperMain',zBias:3.9},{id:'tailTuftPlate',bone:'tailTuft',span:['tailTip','tailTuft'],shape:'taperedBone',size:[.13],role:'tail',bodyRegion:'tail',attachment:'rigid',material:'paperShade',zBias:2});
j('jaw').bind=[.05,0,-.085];j('jawTip').bind=[.27,0,-.085];p('jawPlate').size=[.10];
for(const side of ['near','far']){
 const sign=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.04,sign*.205,-.19];j(side+'FrontKnee').bind=[-.16,0,-.32];j(side+'FrontCarpus').bind=[.11,0,-.36];j(side+'FrontHoof').bind=[.05,0,-.35];
 j(side+'RearHip').bind=[-.035,sign*.205,-.035];j(side+'RearKnee').bind=[.16,0,-.38];j(side+'RearHock').bind=[-.25,0,-.39];j(side+'RearHoof').bind=[.07,0,-.435];
 for(const part of ['Front','Rear']){p(side+part+'UpperPlate').size=[part==='Front'?.18:.21];p(side+part+'LowerPlate').size=[.09];p(side+part+'PasternPlate').size=[.065];p(side+part+'HoofPlate').size=[.17,.12];}
 j(side+'EarBase').bind=[-.04,sign*.125,.07];j(side+'EarTip').bind=[-.045,sign*.22,.05];
 const leaf=[[0,0,0],[-.04,sign*.11,-.045],[-.065,sign*.24,.015],[-.035,sign*.22,.075],[.035,sign*.11,.085],[.04,0,.04]];
 leaf.forEach((v,i)=>j(side+'EarLeaf'+i).bind=v);p(side+'EarSpinePlate').size=[.045];
}
// Real 3-D underside mass: body-region ordering buries it from overhead views.
r.joints.push({id:'udder',parent:'pelvis',bind:[.15,0,-.60],role:'body',helper:true});
r.plates.push({id:'udderPlate',bone:'udder',shape:'ellipse',size:[.30,.25],role:'body',bodyRegion:'core',attachment:'rigid',material:'paperMain',zBias:2.8,semanticDetailTier:'identity'});
for(const side of ['near','far'])for(const end of ['Front','Rear']){
 const id=side+end+'Teat',sign=side==='near'?1:-1;
 r.joints.push({id:id+'Root',parent:'udder',bind:[end==='Front'?.07:-.07,sign*.075,-.07],role:'body',helper:true},{id,parent:id+'Root',bind:[0,0,-.09],role:'body',helper:true});
 r.plates.push({id:id+'Plate',bone:id,span:[id+'Root',id],shape:'taperedBone',size:[.04],role:'body',bodyRegion:'core',attachment:'rigid',material:'paperMain',zBias:2.7,semanticDetailTier:'identity'});
}

r.joints.push({id:'tailSocket',parent:'pelvis',bind:[j('tailBase').bind[0]+.045,0,j('tailBase').bind[2]],role:'tail',helper:true});
Object.assign(p('tailConnectorPlate'),{span:['tailSocket','tailBase'],occlusionMode:'under-core'});
for(const id of ['tailPlate','tailTuftPlate'])Object.assign(p(id),{occlusionMode:'surface-relative',occlusionReference:'pelvis'});
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
const blank={base:'bind',duration:4000,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
applyGroundedQuadruped(r,{walk:{durationMs:1875,pattern:'lateral-sequence',stride:.34,lift:.12,dutyFactor:.65,bodyBounce:.018,headNodDegrees:3,tailSwingDegrees:6,earSwingDegrees:1.5},run:{durationMs:600,stride:.40,lift:.27,bodyRise:.07,bodyDip:.03,pitchDegrees:1.2,neckPitchDegrees:4,headPitchDegrees:-2,tailPitchDegrees:-7}});
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
const times=[...new Set([...Array.from({length:961},(_,i)=>i/960),.20,.34,.44,.56,.68,.80,.88,.94])].sort((a,b)=>a-b);
function frame(attack,t){
 const w=2*Math.PI*t,push=attack?curve([[0,0],[.20,0],[.34,.25],[.56,1],[.68,1],[.88,.1],[1,0]],t):0,
 move=attack?[curve([[0,0],[.20,-.035],[.34,-.025],[.56,.14],[.68,.14],[.88,.01],[1,0]],t),0,curve([[0,0],[.20,-.025],[.34,-.035],[.56,-.04],[.68,-.04],[.88,-.004],[1,0]],t)]:[0,0,-.008*(1-Math.cos(w))/2];
 // An authored forward press, not a horn toss: head stays low/level through the hold.
 const rotations=attack?{
  root:[0,3*push,0],
  neckBase:[0,curve([[0,0],[.20,5],[.34,10],[.56,6],[.68,6],[.88,0],[1,0]],t),0],
  neckTip:[0,curve([[0,0],[.34,5],[.56,4],[.68,4],[.88,0],[1,0]],t),0],
  head:[0,curve([[0,0],[.34,-3],[.56,-7],[.68,-7],[.88,0],[1,0]],t),0],
  tailBase:[3*Math.sin(w),0,3*Math.sin(w)]
 }:{neckBase:[0,.8*Math.sin(w),0],neckTip:[0,-.5*Math.sin(w),0],head:[0,-.3*Math.sin(w),0],jaw:[0,3*Math.sin(Math.PI*t)**2,0],tailBase:[5*Math.sin(w),0,2*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.4)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return {t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:241},(_,i)=>frame(false,i/240)),events:[],boneLengthPolicy:'preserve',motionSemantics:'quiet cow breathing and gentle chewing, neck counter-motion and ear/tail movement above four fixed hooves'};
r.clips.idleA.frames[r.clips.idleA.frames.length-1]={...structuredClone(r.clips.idleA.frames[0]),t:1};
r.clips.attack={base:'bind',duration:1500,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contacts:feet,events:[{t:.20,name:'windup',phase:'anticipation'},{t:.34,name:'press-start',phase:'action'},{t:.56,name:'impact',phase:'contact'},{t:.68,name:'release',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.20,to:.34},{id:'action',from:.34,peak:.44,to:.56},{id:'contact',from:.56,peak:.56,to:.68},{id:'recovery',from:.68,peak:.80,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'authored hornless cow shove: weight gathering, slight forehead lowering, forward shoulder/head press, sustained contact and recover; four fixed hooves and modest body pitch, no upward goring toss'};
r.clips.attack.frames.at(-1).poses=structuredClone(r.clips.attack.frames[0].poses);r.clips.attack.frames.at(-1).rotations=structuredClone(r.clips.attack.frames[0].rotations);
const model={$schema:'paper-rig/model-1',family:'cow',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
// Keep ordinary source metadata readable and dense baked frames on single lines.
// Each replacement is JSON.stringify output; undefined fields are omitted normally.
for(const [path,obj] of [['rigs/families/cow.json',r],['rigs/models/cow.json',model]]){
 let text=JSON.stringify(obj,null,2);
 for(const clip of Object.values(obj.clips||{}))for(const frame of clip.frames||[]){
  const block=JSON.stringify(frame,null,2).split('\n').map(line=>'        '+line).join('\n');
  text=text.replace(block,'        '+JSON.stringify(frame));
 }
 const temp=path+'.tmp';fs.writeFileSync(temp,text+'\n');fs.renameSync(temp,path);
}
