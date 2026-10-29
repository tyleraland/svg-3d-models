// Author-time Moose: proportions and motion informed by the native WildMesh study.
// Reuses ungulate geometry/grounding tools; emits independent declarative sources.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
import {curve,round} from './lib/spatial-leg-ik.mjs';
const r=loadFamily('deer'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
Object.assign(r,{id:'mooseBase',archetypes:['moose'],heightMeters:2.80,tokenScale:17,tokenGroundY:59,profile:{silhouette:'bull moose: tall shoulder hump, deep barrel, long hanging muzzle and bell, long legs and broad palmate antlers',locomotion:'four-beat walk and fast gallop; whole-leg articulation with opposing stifle and hock',attack:'authored braced antler gore: lower rack, drive forward, lift and recover'}});
r.camera.framing='fixed scale with ground origin at token [50,59]';
j('pelvis').bind=[-.62,0,1.52];j('chest').bind=[1.12,0,.10];
j('neckBase').bind=[.20,0,.04];j('neckTip').bind=[.31,0,.04];j('head').bind=[.23,0,.02];j('muzzle').bind=[.37,0,-.25];
j('tailBase').bind=[-.16,0,.03];j('tailTip').bind=[-.035,0,-.15];
j('barrelRear').bind=[.08,0,-.16];j('barrelFront').bind=[-.08,0,-.18];
p('torsoPlate').size=[.75];p('pelvisPlate').size=[.60,.66];p('shoulderPlate').size=[.57,.85];p('withersPlate').size=[.48];p('neckPlate').size=[.39];p('headConnectorPlate').size=[.29];p('headPlate').size=[.31,.37];p('muzzleConnectorPlate').size=[.25];p('muzzlePlate').size=[.235,.22];p('tailConnectorPlate').size=[.08];p('tailPlate').size=[.09];p('castShadow').size=[2.65,.94];
// Hump belongs to the shoulder, not the animated neck. The bell belongs to the head.
r.joints.push({id:'withersHump',parent:'chest',bind:[-.12,0,.18],role:'body',helper:true},{id:'bellRoot',parent:'head',bind:[.06,0,-.14],role:'head',helper:true},{id:'bellTip',parent:'bellRoot',bind:[-.015,0,-.25],role:'head',helper:true});
r.plates.push({id:'withersHumpPlate',bone:'withersHump',shape:'ellipse',size:[.42,.44],role:'body',bodyRegion:'core',attachment:'rigid',material:'paperMain',zBias:3.4},{id:'bellPlate',bone:'bellTip',span:['bellRoot','bellTip'],shape:'taperedBone',size:[.14],role:'head',bodyRegion:'head',attachment:'rigid',material:'paperShade',zBias:4.9});
j('jaw').bind=[.08,0,-.13];j('jawTip').bind=[.26,0,-.14];p('jawPlate').size=[.11];
for(const side of ['near','far']){
 const s=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.08,s*.20,-.25];j(side+'FrontKnee').bind=[-.21,0,-.38];j(side+'FrontCarpus').bind=[.14,0,-.47];j(side+'FrontHoof').bind=[.07,0,-.52];
 j(side+'RearHip').bind=[-.05,s*.20,-.035];j(side+'RearKnee').bind=[.20,0,-.46];j(side+'RearHock').bind=[-.35,0,-.48];j(side+'RearHoof').bind=[.07,0,-.545];
 for(const part of ['Front','Rear']){p(side+part+'UpperPlate').size=[part==='Front'?.19:.24];p(side+part+'LowerPlate').size=[.085];p(side+part+'PasternPlate').size=[.065];p(side+part+'HoofPlate').size=[.16,.11];}
 j(side+'EarBase').bind=[-.06,s*.125,.15];j(side+'EarTip').bind=[-.04,s*.18,.17];
 const leaf=[[0,0,0],[-.07,s*.07,.04],[-.08,s*.18,.16],[-.04,s*.18,.20],[.035,s*.08,.13],[.03,0,.04]];
 leaf.forEach((v,i)=>j(side+'EarLeaf'+i).bind=v);p(side+'EarSpinePlate').size=[.04];
 // All rack geometry is rigid to the head, with real 3-D spread and rake.
 const root=side+'AntlerRoot',beam=side+'AntlerBeam';
 r.joints.push({id:root,parent:'head',bind:[-.06,s*.12,.18],role:'horn',helper:true},{id:beam,parent:root,bind:[-.09,s*.20,.07],role:'horn',helper:true});
 const plate=(id,bone,extra)=>r.plates.push({id,bone,role:'horn',bodyRegion:'accessory',attachment:'rigid',material:'paperMain',zBias:5.2,semanticDetailTier:'identity',...extra});
 plate(side+'AntlerStemPlate',beam,{span:[root,beam],shape:'taperedBone',size:[.085]});
 // Broad palm swept rearward/upward. A sloped surface remains legible from top/front/profile.
 const palm=[[-.08,.18,.065],[.08,.31,.10],[.02,.48,.22],[-.25,.65,.43],[-.60,.65,.64],[-.78,.50,.69],[-.66,.36,.53],[-.32,.25,.27]];
 const points=palm.map((v,i)=>{const id=side+'AntlerPalm'+i;r.joints.push({id,parent:root,bind:[v[0],s*v[1],v[2]],role:'horn',helper:true});return id;});
 plate(side+'AntlerPalmPlate',root,{points,shape:'polygon',size:[.1]});
 // Five spaced tines grow from the outer palm edge; two brows project forward.
 const tines=[[[.04,.35,.14],[.27,.44,.37]],[[-.12,.55,.32],[.01,.74,.60]],[[-.32,.64,.47],[-.25,.77,.78]],[[-.50,.64,.59],[-.48,.75,.91]],[[-.69,.54,.65],[-.74,.61,.94]],[[.0,.23,.085],[.30,.29,.18]]];
 tines.forEach(([a,b],i)=>{const from=side+'AntlerTine'+i+'Base',to=side+'AntlerTine'+i+'Tip';r.joints.push({id:from,parent:root,bind:[a[0],s*a[1],a[2]],role:'horn',helper:true},{id:to,parent:root,bind:[b[0],s*b[1],b[2]],role:'horn',helper:true});plate(side+'AntlerTine'+i+'Plate',to,{span:[from,to],shape:'taperedBone',size:[i===5?.055:.065]});});
}
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
const blank={base:'bind',duration:4800,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
applyGroundedQuadruped(r,{walk:{durationMs:1400,pattern:'lateral-sequence',stride:.35,lift:.115,dutyFactor:.65,bodyBounce:.009,headNodDegrees:1.6,tailSwingDegrees:2,earSwingDegrees:1.5},run:{durationMs:560,stride:.40,lift:.25,bodyRise:.055,bodyDip:.022,pitchDegrees:1,neckPitchDegrees:3,headPitchDegrees:-2,tailPitchDegrees:-3}});
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
const times=[...new Set([...Array.from({length:961},(_,i)=>i/960),.18,.32,.44,.50,.58,.66,.84,.94])].sort((a,b)=>a-b);
function frame(attack,t){
 const w=2*Math.PI*t,move=attack?[curve([[0,0],[.18,-.035],[.44,-.025],[.58,.14],[.66,.08],[.84,.01],[1,0]],t),0,curve([[0,0],[.32,-.035],[.50,-.025],[.66,-.015],[1,0]],t)]:[0,0,-.008*(1-Math.cos(w))/2];
 // Lower/aim slowly, then a quick forward and upward rack drive. Skull/rack stay rigid.
 const rotations=attack?{
  neckBase:[0,curve([[0,0],[.18,10],[.32,30],[.44,32],[.58,36],[.66,8],[.84,0],[1,0]],t),0],
  neckTip:[0,curve([[0,0],[.32,17],[.44,18],[.58,20],[.66,-5],[.84,-2],[1,0]],t),0],
  head:[0,curve([[0,0],[.32,10],[.44,12],[.58,14],[.66,-10],[.84,-2],[1,0]],t),0],
  tailBase:[0,0,2*Math.sin(w)]
 }:{neckBase:[0,.65*Math.sin(w),0],neckTip:[0,-.4*Math.sin(w),0],head:[0,-.25*Math.sin(w),0],tailBase:[0,0,1.5*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.4)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return {t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:241},(_,i)=>frame(false,i/240)),events:[],boneLengthPolicy:'preserve',motionSemantics:'quiet moose breathing and ear motion above four fixed hooves'};
r.clips.idleA.frames[r.clips.idleA.frames.length-1]={...structuredClone(r.clips.idleA.frames[0]),t:1};
r.clips.attack={base:'bind',duration:1600,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contacts:feet,events:[{t:.18,name:'windup',phase:'anticipation'},{t:.32,name:'rack-lowered',phase:'anticipation'},{t:.44,name:'drive-start',phase:'action'},{t:.58,name:'impact',phase:'contact'},{t:.66,name:'antler-lift',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.32,to:.44},{id:'action',from:.44,peak:.50,to:.58},{id:'contact',from:.58,peak:.58,to:.66},{id:'recovery',from:.66,peak:.84,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'authored antler gore: four-hoof brace, lower and aim palmate rack, sudden forward/upward neck drive, lift and recover; native grazing/threat articulation informs lowering, not a copied combat action'};
r.clips.attack.frames.at(-1).poses=structuredClone(r.clips.attack.frames[0].poses);r.clips.attack.frames.at(-1).rotations=structuredClone(r.clips.attack.frames[0].rotations);
const model={$schema:'paper-rig/model-1',family:'moose',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
// Keep ordinary source metadata readable and dense baked frames on single lines.
// Each replacement is JSON.stringify output; undefined fields are omitted normally.
for(const [path,obj] of [['rigs/families/moose.json',r],['rigs/models/moose.json',model]]){
 let text=JSON.stringify(obj,null,2);
 for(const clip of Object.values(obj.clips||{}))for(const frame of clip.frames||[]){
  const block=JSON.stringify(frame,null,2).split('\n').map(line=>'        '+line).join('\n');
  text=text.replace(block,'        '+JSON.stringify(frame));
 }
 const temp=path+'.tmp';fs.writeFileSync(temp,text+'\n');fs.renameSync(temp,path);
}
