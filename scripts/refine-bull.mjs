// Author-time Bull: proportions and motion informed by the native WildMesh study.
// Reuses ungulate geometry/grounding tools; emits independent declarative sources.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
import {curve,round} from './lib/spatial-leg-ik.mjs';
const r=loadFamily('deer'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
Object.assign(r,{id:'bullBase',archetypes:['bull','cattle'],heightMeters:1.85,tokenScale:22,tokenGroundY:60,profile:{silhouette:'cattle bull: deep barrel, powerful forequarters and short thick neck, broad forehead/muzzle, paired curved horns and a long tufted tail',locomotion:'deliberate four-beat walk and powerful gallop with whole-leg articulation',attack:'reference-informed horn gore: crouched recoil, lowered horns, quick forward drive and upward sweeping toss'}});
r.camera.framing='fixed scale with ground origin at token [50,60]';
j('pelvis').bind=[-.60,0,1.23];j('chest').bind=[1.15,0,.045];
j('neckBase').bind=[.12,0,.02];j('neckTip').bind=[.24,0,.015];j('head').bind=[.18,0,-.015];j('muzzle').bind=[.26,0,-.17];
j('tailBase').bind=[-.16,0,.04];j('tailTip').bind=[-.09,0,-.68];
j('barrelRear').bind=[.08,0,-.17];j('barrelFront').bind=[-.06,0,-.17];
p('torsoPlate').size=[.84];p('pelvisPlate').size=[.66,.70];p('shoulderPlate').size=[.69,.82];p('withersPlate').size=[.55];p('neckPlate').size=[.48];p('headConnectorPlate').size=[.34];p('headPlate').size=[.42,.47];p('muzzleConnectorPlate').size=[.31];p('muzzlePlate').size=[.34,.245];p('tailConnectorPlate').size=[.075];p('tailPlate').size=[.055];p('castShadow').size=[2.65,1.12];
// Shallow dewlap is cattle neck/chest mass, not a hanging moose bell or buffalo beard.
r.joints.push({id:'dewlapRear',parent:'neckBase',bind:[-.07,0,-.19],role:'neck',helper:true},{id:'dewlapFront',parent:'neckBase',bind:[.24,0,-.20],role:'neck',helper:true},{id:'tailTuft',parent:'tailTip',bind:[-.01,0,-.10],role:'tail',helper:true});
r.plates.push({id:'dewlapPlate',bone:'dewlapFront',span:['dewlapRear','dewlapFront'],shape:'bone',size:[.24],role:'body',bodyRegion:'neck',attachment:'rigid',material:'paperMain',zBias:3.9},{id:'tailTuftPlate',bone:'tailTuft',span:['tailTip','tailTuft'],shape:'taperedBone',size:[.13],role:'tail',bodyRegion:'tail',attachment:'rigid',material:'paperShade',zBias:2});
j('jaw').bind=[.055,0,-.10];j('jawTip').bind=[.22,0,-.10];p('jawPlate').size=[.13];
for(const side of ['near','far']){
 const sign=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.06,sign*.25,-.19];j(side+'FrontKnee').bind=[-.18,0,-.34];j(side+'FrontCarpus').bind=[.12,0,-.36];j(side+'FrontHoof').bind=[.06,0,-.385];
 j(side+'RearHip').bind=[-.035,sign*.25,-.035];j(side+'RearKnee').bind=[.18,0,-.39];j(side+'RearHock').bind=[-.27,0,-.37];j(side+'RearHoof').bind=[.07,0,-.435];
 for(const part of ['Front','Rear']){p(side+part+'UpperPlate').size=[part==='Front'?.25:.27];p(side+part+'LowerPlate').size=[.115];p(side+part+'PasternPlate').size=[.085];p(side+part+'HoofPlate').size=[.19,.135];}
 j(side+'EarBase').bind=[-.04,sign*.17,.04];j(side+'EarTip').bind=[-.055,sign*.24,.035];
 const leaf=[[0,0,0],[-.04,sign*.11,-.045],[-.065,sign*.24,.015],[-.035,sign*.22,.075],[.035,sign*.11,.085],[.04,0,.04]];
 leaf.forEach((v,i)=>j(side+'EarLeaf'+i).bind=v);p(side+'EarSpinePlate').size=[.045];
 // Two perpendicular curved ribbons share true 3-D head-local points.
 // Rigid skull ownership, not permanent front ordering, controls near/far overlap.
 const root=side+'HornRoot';r.joints.push({id:root,parent:'head',bind:[-.045,sign*.16,.17],role:'horn',helper:true});
 const centers=[[0,0,0],[-.025,.12,-.01],[-.025,.25,.02],[-.005,.35,.10],[.035,.40,.23],[.09,.415,.34],[.15,.385,.43]],radii=[.065,.063,.055,.043,.030,.016,0];
 centers.map((v,i)=>{const id=side+'HornCenter'+i;r.joints.push({id,parent:root,bind:[v[0],sign*v[1],v[2]],role:'horn',helper:true});return id;});
 const rims=[[],[]];centers.forEach((v,i)=>{const a=centers[Math.max(0,i-1)],b=centers[Math.min(centers.length-1,i+1)],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dy,dz);for(let k=0;k<2;k++){const direction=k===0?1:-1,id=side+'HornRim'+k+'_'+i;r.joints.push({id,parent:root,bind:[v[0],sign*(v[1]-direction*dz/len*radii[i]),v[2]+direction*dy/len*radii[i]],role:'horn',helper:true});rims[k].push(id);}});
 r.plates.push({id:side+'HornPlate',bone:root,points:[...rims[0],...rims[1].reverse()],shape:'polygon',size:[.1],role:'horn',bodyRegion:'accessory',attachment:'rigid',material:'paperShade',zBias:5.2,semanticDetailTier:'identity'});
 const crossRims=[[],[]];centers.forEach((v,i)=>{for(let k=0;k<2;k++){const id=side+'HornCross'+k+'_'+i;r.joints.push({id,parent:root,bind:[v[0]+(k===0?1:-1)*radii[i],sign*v[1],v[2]],role:'horn',helper:true});crossRims[k].push(id);}});
 r.plates.push({id:side+'HornCrossPlate',bone:root,points:[...crossRims[0],...crossRims[1].reverse()],shape:'polygon',size:[.1],role:'horn',bodyRegion:'accessory',attachment:'rigid',material:'paperShade',zBias:5.15,semanticDetailTier:'identity'});
}
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
const blank={base:'bind',duration:4000,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
applyGroundedQuadruped(r,{walk:{durationMs:1600,pattern:'lateral-sequence',stride:.33,lift:.12,dutyFactor:.65,bodyBounce:.018,headNodDegrees:2.5,tailSwingDegrees:5,earSwingDegrees:1.5},run:{durationMs:600,stride:.40,lift:.26,bodyRise:.065,bodyDip:.03,pitchDegrees:1.2,neckPitchDegrees:4,headPitchDegrees:-2,tailPitchDegrees:-7}});
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
const times=[...new Set([...Array.from({length:961},(_,i)=>i/960),.18,.30,.40,.44,.54,.60,.64,.70,.84,.94])].sort((a,b)=>a-b);
function frame(attack,t){
 const w=2*Math.PI*t,move=attack?[curve([[0,0],[.18,-.055],[.40,-.055],[.54,.11],[.64,.07],[.84,.01],[1,0]],t),0,curve([[0,0],[.30,-.05],[.44,-.04],[.60,-.012],[.70,-.02],[1,0]],t)]:[0,0,-.009*(1-Math.cos(w))/2];
 // Native Buffalo Attack/Attack1 inform recoil, head dip and rapid sweeping toss.
 // In-place adaptation braces four hooves; no native root trajectory is copied.
 const rotations=attack?{
  neckBase:[0,curve([[0,0],[.18,10],[.30,30],[.40,32],[.54,32],[.64,-14],[.84,-2],[1,0]],t),0],
  neckTip:[0,curve([[0,0],[.30,14],[.40,16],[.54,16],[.64,-10],[.84,-2],[1,0]],t),0],
  head:[0,curve([[0,0],[.30,12],[.40,14],[.54,14],[.64,-14],[.84,-2],[1,0]],t),curve([[0,0],[.30,-5],[.40,-6],[.54,0],[.64,12],[.84,0],[1,0]],t)],
  tailBase:[3*Math.sin(w),0,6*Math.sin(w)]
 }:{neckBase:[0,.65*Math.sin(w),0],neckTip:[0,-.4*Math.sin(w),0],head:[0,-.25*Math.sin(w),0],tailBase:[3*Math.sin(w),0,2*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.4)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return {t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:241},(_,i)=>frame(false,i/240)),events:[],boneLengthPolicy:'preserve',motionSemantics:'heavy bull breathing, neck counter-motion and ear/tail movement above four fixed hooves'};
r.clips.idleA.frames[r.clips.idleA.frames.length-1]={...structuredClone(r.clips.idleA.frames[0]),t:1};
r.clips.attack={base:'bind',duration:1400,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contacts:feet,events:[{t:.18,name:'windup',phase:'anticipation'},{t:.30,name:'horns-lowered',phase:'anticipation'},{t:.40,name:'drive-start',phase:'action'},{t:.54,name:'impact',phase:'contact'},{t:.64,name:'horn-toss',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.30,to:.40},{id:'action',from:.40,peak:.44,to:.54},{id:'contact',from:.54,peak:.60,to:.64},{id:'recovery',from:.64,peak:.84,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'reference-informed horn gore: crouched recoil, four-hoof brace, lowered horns, quick forward drive and upward sweeping toss, recover; adapted from native Buffalo Attack/Attack1 without their traveling root/footsteps'};
r.clips.attack.frames.at(-1).poses=structuredClone(r.clips.attack.frames[0].poses);r.clips.attack.frames.at(-1).rotations=structuredClone(r.clips.attack.frames[0].rotations);
const model={$schema:'paper-rig/model-1',family:'bull',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
// Keep ordinary source metadata readable and dense baked frames on single lines.
// Each replacement is JSON.stringify output; undefined fields are omitted normally.
for(const [path,obj] of [['rigs/families/bull.json',r],['rigs/models/bull.json',model]]){
 let text=JSON.stringify(obj,null,2);
 for(const clip of Object.values(obj.clips||{}))for(const frame of clip.frames||[]){
  const block=JSON.stringify(frame,null,2).split('\n').map(line=>'        '+line).join('\n');
  text=text.replace(block,'        '+JSON.stringify(frame));
 }
 const temp=path+'.tmp';fs.writeFileSync(temp,text+'\n');fs.renameSync(temp,path);
}
