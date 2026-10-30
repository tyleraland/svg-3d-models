// Author-time Mountain Goat: proportions and motion informed by the native WildMesh study.
// Reuses ungulate geometry/grounding tools; emits independent declarative sources.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
import {curve,round} from './lib/spatial-leg-ik.mjs';
const r=loadFamily('deer'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
Object.assign(r,{id:'mountainGoatBase',archetypes:['mountainGoat','goat'],heightMeters:1.60,tokenScale:26,tokenGroundY:60,profile:{silhouette:'compact mountain goat: deep chest, sturdy short lower legs, narrow head/muzzle, upright-outward ears, short tail and narrow swept-back horns',locomotion:'careful four-beat walk and agile gallop with articulated carpi, stifles and hocks',attack:'authored braced head-butt: recoil, tuck forehead, sudden head-driven thrust, recoil and recover; domestic Goat ram-run informs the charging posture'}});
r.camera.framing='fixed scale with ground origin at token [50,60]';
j('pelvis').bind=[-.40,0,.94];j('chest').bind=[.77,0,.04];
j('neckBase').bind=[.13,0,.03];j('neckTip').bind=[.23,0,.14];j('head').bind=[.14,0,.04];j('muzzle').bind=[.21,0,-.08];
j('tailBase').bind=[-.12,0,.05];j('tailTip').bind=[-.04,0,-.15];
j('barrelRear').bind=[.05,0,-.09];j('barrelFront').bind=[-.04,0,-.09];
p('muzzleConnectorPlate').occlusionMode='under-core';
p('torsoPlate').size=[.55];p('pelvisPlate').size=[.43,.48];p('shoulderPlate').size=[.43,.60];p('withersPlate').size=[.32];p('neckPlate').size=[.26];p('headConnectorPlate').size=[.20];p('headPlate').size=[.205,.26];p('muzzleConnectorPlate').size=[.145];p('muzzlePlate').size=[.155,.13];p('tailConnectorPlate').size=[.07];p('tailPlate').size=[.075];p('castShadow').size=[1.95,.76];
j('jaw').bind=[.035,0,-.06];j('jawTip').bind=[.18,0,-.05];p('jawPlate').size=[.075];
r.joints.push({id:'foreheadContact',parent:'head',bind:[.04,0,.10],role:'head',helper:true});
for(const side of ['near','far']){
 const sign=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.035,sign*.135,-.12];j(side+'FrontKnee').bind=[-.09,0,-.27];j(side+'FrontCarpus').bind=[.06,0,-.31];j(side+'FrontHoof').bind=[.035,0,-.28];
 j(side+'RearHip').bind=[-.02,sign*.14,.01];j(side+'RearKnee').bind=[.12,0,-.34];j(side+'RearHock').bind=[-.19,0,-.28];j(side+'RearHoof').bind=[.04,0,-.33];
 for(const part of ['Front','Rear']){p(side+part+'UpperPlate').size=[part==='Front'?.16:.19];p(side+part+'LowerPlate').size=[.075];p(side+part+'PasternPlate').size=[.055];p(side+part+'HoofPlate').size=[.13,.10];}
 j(side+'EarBase').bind=[-.035,sign*.065,.055];j(side+'EarTip').bind=[-.055,sign*.10,.13];
 const leaf=[[0,0,0],[-.06,sign*.04,.025],[-.085,sign*.10,.11],[-.055,sign*.10,.15],[.015,sign*.035,.09],[.02,-sign*.015,.035]];
 leaf.forEach((v,i)=>j(side+'EarLeaf'+i).bind=v);p(side+'EarSpinePlate').size=[.03];
 // Two perpendicular curved ribbons share true 3-D head-local points.
 // Rigid skull ownership, not permanent front ordering, controls near/far overlap.
 const root=side+'HornRoot';r.joints.push({id:root,parent:'head',bind:[-.03,sign*.065,.08],role:'horn',helper:true});
 const centers=[[0,0,0],[-.005,.015,.09],[-.025,.035,.18],[-.06,.06,.25],[-.105,.07,.30],[-.15,.055,.33]],radii=[.035,.032,.026,.018,.010,0];
 centers.map((v,i)=>{const id=side+'HornCenter'+i;r.joints.push({id,parent:root,bind:[v[0],sign*v[1],v[2]],role:'horn',helper:true});return id;});
 const rims=[[],[]];centers.forEach((v,i)=>{const a=centers[Math.max(0,i-1)],b=centers[Math.min(centers.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);for(let k=0;k<2;k++){const direction=k===0?1:-1,id=side+'HornRim'+k+'_'+i;r.joints.push({id,parent:root,bind:[v[0]-direction*dz/len*radii[i],sign*v[1],v[2]+direction*dx/len*radii[i]],role:'horn',helper:true});rims[k].push(id);}});
 r.plates.push({id:side+'HornPlate',bone:root,points:[...rims[0],...rims[1].reverse()],shape:'polygon',size:[.1],role:'horn',bodyRegion:'accessory',attachment:'rigid',material:'paperShade',zBias:5.2,semanticDetailTier:'identity'});
 const crossRims=[[],[]];centers.forEach((v,i)=>{for(let k=0;k<2;k++){const id=side+'HornCross'+k+'_'+i;r.joints.push({id,parent:root,bind:[v[0],sign*(v[1]+(k===0?1:-1)*radii[i]),v[2]],role:'horn',helper:true});crossRims[k].push(id);}});
 r.plates.push({id:side+'HornCrossPlate',bone:root,points:[...crossRims[0],...crossRims[1].reverse()],shape:'polygon',size:[.1],role:'horn',bodyRegion:'accessory',attachment:'rigid',material:'paperShade',zBias:5.15,semanticDetailTier:'identity'});
}
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
const blank={base:'bind',duration:2083,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
applyGroundedQuadruped(r,{walk:{durationMs:1458,pattern:'lateral-sequence',stride:.34,lift:.14,dutyFactor:.65,bodyBounce:.012,headNodDegrees:2,tailSwingDegrees:3,earSwingDegrees:1.5},run:{durationMs:583,stride:.34,lift:.28,bodyRise:.05,bodyDip:.025,pitchDegrees:1,neckPitchDegrees:24,headPitchDegrees:-3,tailPitchDegrees:-4}});
// Native moving poses carry the neck forward/lower than the alert standing pose.
for(const f of r.clips.walkA.frames){f.rotations.neckBase[1]=round(f.rotations.neckBase[1]+24);f.rotations.neckTip=[0,6,0];f.rotations.head[1]=round(f.rotations.head[1]-4);}
for(const f of r.clips.run.frames)f.rotations.neckTip=[0,8,0];
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
const times=[...new Set([...Array.from({length:961},(_,i)=>i/960),.20,.28,.34,.48,.54,.60,.80,.92])].sort((a,b)=>a-b);
function frame(attack,t){
 const w=2*Math.PI*t,move=attack?[curve([[0,0],[.20,-.03],[.34,-.025],[.48,.12],[.54,.10],[.60,.055],[.80,.005],[1,0]],t),0,curve([[0,0],[.20,-.015],[.34,-.02],[.48,-.035],[.54,-.03],[.60,-.015],[1,0]],t)]:[0,0,-.005*(1-Math.cos(w))/2];
 // Horns rake backward: the forehead drives the butt, rather than an upward gore.
 const rotations=attack?{
  neckBase:[0,curve([[0,0],[.20,-8],[.34,-6],[.48,30],[.54,26],[.60,18],[.80,2],[1,0]],t),0],
  neckTip:[0,curve([[0,0],[.20,-4],[.34,-3],[.48,18],[.54,14],[.60,10],[.80,1],[1,0]],t),0],
  head:[0,curve([[0,0],[.20,-4],[.34,-3],[.48,16],[.54,12],[.60,8],[.80,1],[1,0]],t),0],
  tailBase:[0,0,3*Math.sin(w)]
 }:{neckBase:[0,.7*Math.sin(w),0],neckTip:[0,-.4*Math.sin(w),0],head:[0,-.3*Math.sin(w),0],tailBase:[0,0,2*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.4)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return {t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:241},(_,i)=>frame(false,i/240)),events:[],boneLengthPolicy:'preserve',motionSemantics:'alert mountain-goat breathing, neck counter-motion and ear/tail movement above four fixed hooves'};
r.clips.idleA.frames[r.clips.idleA.frames.length-1]={...structuredClone(r.clips.idleA.frames[0]),t:1};
r.clips.attack={base:'bind',duration:1300,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contacts:feet,events:[{t:.20,name:'windup',phase:'anticipation'},{t:.34,name:'butt-start',phase:'action'},{t:.48,name:'impact',phase:'contact'},{t:.54,name:'release',phase:'contact'},{t:.92,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.20,to:.34},{id:'action',from:.34,peak:.40,to:.48},{id:'contact',from:.48,peak:.48,to:.54},{id:'recovery',from:.54,peak:.60,to:.92},{id:'settle',from:.92,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'authored braced mountain-goat head-butt: load neck, tuck forehead and thrust suddenly, brief contact and recoil, recover; Goat ram-run informs tucked charging posture, not a literal native impact retarget'};
r.clips.attack.frames.at(-1).poses=structuredClone(r.clips.attack.frames[0].poses);r.clips.attack.frames.at(-1).rotations=structuredClone(r.clips.attack.frames[0].rotations);
const model={$schema:'paper-rig/model-1',family:'mountainGoat',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
// Keep ordinary source metadata readable and dense baked frames on single lines.
// Each replacement is JSON.stringify output; undefined fields are omitted normally.
for(const [path,obj] of [['rigs/families/mountainGoat.json',r],['rigs/models/mountainGoat.json',model]]){
 let text=JSON.stringify(obj,null,2);
 for(const clip of Object.values(obj.clips||{}))for(const frame of clip.frames||[]){
  const block=JSON.stringify(frame,null,2).split('\n').map(line=>'        '+line).join('\n');
  text=text.replace(block,'        '+JSON.stringify(frame));
 }
 const temp=path+'.tmp';fs.writeFileSync(temp,text+'\n');fs.renameSync(temp,path);
}
