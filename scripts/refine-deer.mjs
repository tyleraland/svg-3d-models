// Author-time antlerless Deer from the WildMesh FemaleDeer study.
import fs from'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';
import{curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('horse'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
r.joints=r.joints.filter(j=>!/^mane/.test(j.id));r.plates=r.plates.filter(p=>!/^mane/.test(p.id));r.anchors=r.anchors.filter(a=>a.id==='headgearAnchor');
Object.assign(r,{id:'deerBase',family:'quadrupedUngulate',archetypes:['deer','doe'],heightMeters:1.76,tokenScale:25,tokenGroundY:63,profile:{silhouette:'antlerless deer: light barrel, slim long legs, narrow muzzle, large leaf ears and short tail',locomotion:'four-beat walk and light gallop; articulated forelegs, stifles and rear hocks',attack:'authored braced bite; no antlers or goring'}});
r.camera.framing='fixed scale with ground origin at token [50,63]';
j('pelvis').bind=[-.48,0,1.10];j('chest').bind=[.92,0,.015];
j('neckBase').bind=[.16,0,.06];j('neckTip').bind=[.26,0,.21];j('head').bind=[.14,0,.08];j('muzzle').bind=[.24,0,-.11];
j('tailBase').bind=[-.12,0,.04];j('tailTip').bind=[-.09,0,-.13];
Object.assign(p('castShadow'),{size:[1.9,.62],surfaceNormal:[0,0,1]});
p('torsoPlate').size=[.48];p('pelvisPlate').size=[.43,.50];p('shoulderPlate').size=[.38,.51];p('withersPlate').size=[.29];p('neckPlate').size=[.215];p('headConnectorPlate').size=[.18];p('headPlate').size=[.21,.24];p('muzzleConnectorPlate').shape='taperedBone';p('muzzleConnectorPlate').size=[.135];p('muzzlePlate').size=[.125,.105];p('tailConnectorPlate').size=[.09];p('tailPlate').size=[.10];
for(const side of ['near','far']){
 const s=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.04,s*.145,-.12];j(side+'FrontKnee').bind=[-.15,0,-.29];j(side+'FrontCarpus').bind=[.105,0,-.38];j(side+'FrontHoof').bind=[.045,0,-.325];
 j(side+'RearHip').bind=[-.035,s*.16,-.035];j(side+'RearKnee').bind=[.15,0,-.335];j(side+'RearHock').bind=[-.23,0,-.34];j(side+'RearHoof').bind=[.045,0,-.39];
 for(const part of ['Front','Rear']){
  p(side+part+'UpperPlate').size=[part==='Front'?.115:.15];p(side+part+'LowerPlate').size=[.06];p(side+part+'PasternPlate').size=[.045];p(side+part+'HoofPlate').size=[.10,.075];
 }
 const ear=side+'EarBase',tip=side+'EarTip';r.joints.push({id:ear,parent:'head',bind:[-.04,s*.075,.08],role:'ear',mirror:(side==='near'?'far':'near')+'EarBase'},{id:tip,parent:ear,bind:[-.0612,s*.065,.21],role:'ear',mirror:(side==='near'?'far':'near')+'EarTip'});
 const points=[[0,0,.005],[-.01,s*.05,.055],[-.018,s*.10,.14],[-.025,s*.065,.21],[-.035,s*.015,.15],[-.02,-s*.025,.065]].map((v,i)=>{const bind=[round(-1.2*s*v[1]+.08*v[2]),v[1],v[2]],id=side+'EarLeaf'+i;r.joints.push({id,parent:ear,bind,role:'accessoryAnchor',helper:true});return id;});
 r.plates.push({id:side+'EarPlate',bone:ear,points,shape:'polygon',size:[.1],role:'ear',bodyRegion:'accessory',attachment:'rigid',material:'paperMain',zBias:5.3,occlusionMode:'surface-relative',occlusionReference:'head',semanticDetailTier:'identity'},
 {id:side+'EarSpinePlate',bone:tip,span:[ear,tip],shape:'taperedBone',size:[.035],role:'ear',bodyRegion:'accessory',attachment:'rigid',material:'paperShade',zBias:5.2,occlusionMode:'surface-relative',occlusionReference:'head',semanticDetailTier:'identity'});
}
r.joints.push({id:'barrelRear',parent:'pelvis',bind:[.08,0,-.10],role:'body',helper:true},{id:'barrelFront',parent:'chest',bind:[-.08,0,-.10],role:'body',helper:true});p('torsoPlate').bone='barrelFront';p('torsoPlate').span=['barrelRear','barrelFront'];
r.joints.push({id:'jaw',parent:'head',bind:[.035,0,-.065],role:'head',bendAxis:[0,1,0],limits:[0,30],gasket:{diameterMeters:.035,underIncidentPlates:true}},{id:'jawTip',parent:'jaw',bind:[.21,0,-.035],role:'head',helper:true});
r.plates.push({id:'jawPlate',bone:'jawTip',span:['jaw','jawTip'],shape:'taperedBone',size:[.075],role:'head',bodyRegion:'head',attachment:'rigid',material:'paperShade',zBias:5.1,semanticDetailTier:'silhouette'});
// Keep broad upper limbs anatomically side-relative rather than permanently foreground.
for(const plate of r.plates.filter(p=>/(Front|Rear)UpperPlate$/.test(p.id)))Object.assign(plate,{occlusionMode:'surface-relative',occlusionReference:/Front/.test(plate.id)?'chest':'pelvis'});
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id);
r.clips.idleA={base:'bind',duration:4000,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips.walkA=structuredClone(r.clips.idleA);
applyGroundedQuadruped(r,{walk:{durationMs:1250,pattern:'lateral-sequence',stride:.36,lift:.14,dutyFactor:.65,bodyBounce:.012,headNodDegrees:2,tailSwingDegrees:4,earSwingDegrees:2},run:{durationMs:540,stride:.40,lift:.28,bodyRise:.075,bodyDip:.025,pitchDegrees:1,neckPitchDegrees:5,headPitchDegrees:-3,tailPitchDegrees:-4}});
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
const times=[...new Set([...Array.from({length:241},(_,i)=>i/240),.20,.28,.38,.48,.52,.56,.64,.80,.94])].sort((a,b)=>a-b);
function frame(mode,t){const attack=mode==='attack',w=2*Math.PI*t,move=attack?[curve([[0,0],[.20,-.025],[.56,.055],[.80,.015],[1,0]],t),0,curve([[0,0],[.20,-.018],[.56,-.01],[.80,-.004],[1,0]],t)]:[0,0,-.006*(1-Math.cos(w))/2];
 const rotations=attack?{neckBase:[0,curve([[0,0],[.20,-5],[.38,7],[.56,14],[.80,3],[1,0]],t),0],neckTip:[0,curve([[0,0],[.20,-4],[.38,4],[.56,9],[.80,2],[1,0]],t),0],head:[0,curve([[0,0],[.20,3],[.38,-8],[.56,-14],[.80,-3],[1,0]],t),0],jaw:[0,curve([[0,0],[.20,5],[.38,26],[.48,26],[.56,2],[.64,0],[1,0]],t),0],tailBase:[0,0,2*Math.sin(w)]}:{neckBase:[0,.8*Math.sin(w),0],neckTip:[0,-.5*Math.sin(w),0],head:[0,-.3*Math.sin(w),0],tailBase:[0,0,2*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,(attack?1:2)*Math.sin(w+(side==='near'?0:.5)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={base:'bind',duration:4000,easing:'linear',loop:true,frames:Array.from({length:241},(_,i)=>frame('idle',i/240)),contacts:feet,events:[],boneLengthPolicy:'preserve',motionSemantics:'alert antlerless deer; quiet neck breathing and independent ear flicks over four planted hooves'};
r.clips.idleA.frames.at(-1).rotations=structuredClone(r.clips.idleA.frames[0].rotations);
r.clips.attack={base:'bind',duration:1150,easing:'linear',loop:false,frames:times.map(t=>frame('attack',t)),contacts:feet,events:[{t:.20,name:'windup',phase:'anticipation'},{t:.38,name:'jaw-open',phase:'action'},{t:.56,name:'impact',phase:'contact'},{t:.64,name:'release',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.20,to:.28},{id:'action',from:.28,peak:.38,to:.48},{id:'contact',from:.48,peak:.56,to:.64},{id:'recovery',from:.64,peak:.80,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'authored antlerless deer bite: preload, neck reach, jaw opening and fast closure, four-hoof brace and recovery; adapted from feeding articulation'};
r.clips.attack.frames[r.clips.attack.frames.length-1]={...structuredClone(r.clips.attack.frames[0]),t:1};
const m={$schema:'paper-rig/model-1',family:'deer',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
function save(path,obj){let s=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');s=s.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,s+'\n');}
save('rigs/families/deer.json',r);save('rigs/models/deer.json',m);
