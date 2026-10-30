// Author-time Boar, informed by WildBoar anatomy/gaits/attack and Boar tusks.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../rigs/quadruped-locomotion.js';
import {curve,round,smooth} from './lib/spatial-leg-ik.mjs';
const r=loadFamily('deer'),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
Object.assign(r,{id:'boarBase',archetypes:['boar','wildBoar'],heightMeters:1.12,tokenScale:27,tokenGroundY:55,profile:{silhouette:'low heavy boar: high forequarters, short thick neck/legs, tapered long snout with flat disc, upright ears, short thin tail and modest curved tusks',locomotion:'four-beat walk and short fast gallop with articulated carpi, stifles and hocks',attack:'reference-informed tusk lunge: crouch, hind push-off, brief suspension, open-jaw upward head flick, fore then hind landing and recovery'}});
r.camera.framing='fixed scale with ground origin at token [50,55]';
j('pelvis').bind=[-.40,0,.74];j('chest').bind=[.76,0,.08];
j('neckBase').bind=[.10,0,-.075];j('neckTip').bind=[.16,0,-.025];j('head').bind=[.15,0,-.015];j('muzzle').bind=[.32,0,-.08];
j('tailBase').bind=[-.12,0,.03];j('tailTip').bind=[-.055,0,-.22];
j('barrelRear').bind=[.06,0,-.08];j('barrelFront').bind=[-.04,0,-.13];
p('muzzleConnectorPlate').occlusionMode='under-core';
p('torsoPlate').size=[.60];p('pelvisPlate').size=[.43,.44];p('shoulderPlate').size=[.47,.58];p('withersPlate').size=[.40];p('neckPlate').size=[.34];p('headConnectorPlate').size=[.27];p('headPlate').size=[.30,.33];p('muzzleConnectorPlate').size=[.24];p('muzzlePlate').size=[.21,.15];p('tailConnectorPlate').size=[.06];p('tailPlate').size=[.045];p('castShadow').size=[2.0,.82];
j('jaw').bind=[.04,0,-.08];j('jawTip').bind=[.27,0,-.045];p('jawPlate').size=[.12];
function tooth(side,kind,parent,bind,centers,radii){
 const sign=side==='near'?1:-1,root=side+kind+'TuskRoot';
 r.joints.push({id:root,parent,bind:[bind[0],sign*bind[1],bind[2]],role:'tooth',helper:true});
 centers.forEach((v,i)=>r.joints.push({id:side+kind+'TuskCenter'+i,parent:root,bind:[v[0],sign*v[1],v[2]],role:'tooth',helper:true}));
 for(const cross of [false,true]){
  const rim=[[],[]];centers.forEach((v,i)=>{const a=centers[Math.max(0,i-1)],b=centers[Math.min(centers.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
   for(let k=0;k<2;k++){const direction=k===0?1:-1,id=side+kind+'Tusk'+(cross?'Cross':'Rim')+k+'_'+i,bind=cross?[v[0],sign*(v[1]+direction*radii[i]),v[2]]:[v[0]-direction*dz/len*radii[i],sign*v[1],v[2]+direction*dx/len*radii[i]];
    r.joints.push({id,parent:root,bind,role:'tooth',helper:true});rim[k].push(id);}
  });
  r.plates.push({id:side+kind+'Tusk'+(cross?'Cross':'')+'Plate',bone:root,points:[...rim[0],...rim[1].reverse()],shape:'polygon',size:[.08],role:'tusk',bodyRegion:'accessory',attachment:'rigid',material:'paperMain',zBias:5.2,semanticDetailTier:'identity'});
 }
}
for(const side of ['near','far']){
 const sign=side==='near'?1:-1;
 j(side+'FrontHip').bind=[.05,sign*.145,-.25];j(side+'FrontKnee').bind=[-.06,0,-.20];j(side+'FrontCarpus').bind=[.04,0,-.20];j(side+'FrontHoof').bind=[.025,0,-.17];
 j(side+'RearHip').bind=[-.025,sign*.145,-.15];j(side+'RearKnee').bind=[.105,0,-.22];j(side+'RearHock').bind=[-.14,0,-.18];j(side+'RearHoof').bind=[.025,0,-.19];
 for(const part of ['Front','Rear']){p(side+part+'UpperPlate').size=[part==='Front' ? .20 : .18];p(side+part+'LowerPlate').size=[.08];p(side+part+'PasternPlate').size=[.06];p(side+part+'HoofPlate').size=[.13,.095];}
 j(side+'EarBase').bind=[-.055,sign*.09,.10];j(side+'EarTip').bind=[-.055,sign*.09,.17];
 const leaf=[[0,0,0],[-.065,sign*.03,.035],[-.10,sign*.09,.18],[-.04,sign*.10,.20],[.025,sign*.065,.12],[.03,-sign*.02,.04]];
 leaf.forEach((v,i)=>j(side+'EarLeaf'+i).bind=v);p(side+'EarSpinePlate').size=[.035];
 // Lower cutters follow the jaw; smaller upper canines stay rigid to the skull.
 tooth(side,'Lower','jaw',[.09,.105,-.025],[[0,0,0],[.055,.025,-.005],[.11,.055,.045],[.12,.085,.10],[.10,.10,.16]],[.028,.024,.018,.010,0]);
 tooth(side,'Upper','head',[.14,.11,-.05],[[0,0,0],[.025,.008,-.018],[.05,.010,-.055]],[.020,.012,0]);
}
applyGroundedQuadruped(r,{});
const legs=quadrupedLegs(r),bind=bindPositions(r),feet=legs.map(l=>l.foot.id),fore=feet.filter(id=>id.includes('Front')),hind=feet.filter(id=>id.includes('Rear'));
const blank={base:'bind',duration:4000,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
applyGroundedQuadruped(r,{walk:{durationMs:950,pattern:'lateral-sequence',stride:.30,lift:.12,dutyFactor:.65,bodyBounce:.012,headNodDegrees:2,tailSwingDegrees:3,earSwingDegrees:2},run:{durationMs:420,stride:.28,lift:.27,bodyRise:.025,bodyDip:.025,pitchDegrees:.6,neckPitchDegrees:3,headPitchDegrees:-2,tailPitchDegrees:-3}});
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
const times=[...new Set([...Array.from({length:961},(_,i)=>i/960),.18,.28,.34,.42,.48,.54,.62,.70,.80,.94])].sort((a,b)=>a-b);
function footTarget(leg,t){
 const a=leg.rear ? .34 : .28,b=leg.rear ? .70 : .62,q=bind[leg.foot.id];if(t<=a||t>=b)return q;
 const u=(t-a)/(b-a),wave=Math.sin(Math.PI*u),arc=wave**2,entry=smooth(Math.min(1,u/.2)),z=leg.rear ? .16*arc : .20*wave*entry;return[q[0]+.075*arc,q[1],z];
}
// Match takeoff/landing vertical velocity to a short ballistic body arc.
function hermite(a,b,va,vb,u,length){return(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*va*length+(-2*u**3+3*u*u)*b+(u**3-u*u)*vb*length;}
function bodyHeight(t){const speed=.4/.28;
 if(t<.18)return curve([[0,0],[.18,-.045]],t);
 if(t<.34)return hermite(-.045,0,0,speed,(t-.18)/.16,.16);
 if(t<=.62){const u=(t-.34)/.28;return .4*u*(1-u);}
 if(t<.70)return hermite(0,-.02,-speed,0,(t-.62)/.08,.08);
 return curve([[.70,-.02],[.94,0],[1,0]],t);
}
function frame(attack,t){
 const w=2*Math.PI*t,move=attack?[curve([[0,0],[.18,-.03],[.28,-.025],[.34,.01],[.48,.14],[.54,.13],[.62,.075],[.70,.035],[.94,0],[1,0]],t),0,bodyHeight(t)]:[0,0,-.004*(1-Math.cos(w))/2];
 const rotations=attack?{
  root:[0,curve([[0,0],[.18,2],[.28,0],[.34,-2],[.48,-4],[.54,-1],[.62,3],[.70,0],[1,0]],t),0],
  neckBase:[0,curve([[0,0],[.18,10],[.28,12],[.34,8],[.48,-14],[.54,-8],[.62,4],[.80,0],[1,0]],t),0],
  neckTip:[0,curve([[0,0],[.28,5],[.34,3],[.48,-6],[.54,-3],[.62,3],[.80,0],[1,0]],t),0],
  head:[0,curve([[0,0],[.28,4],[.34,2],[.48,-10],[.54,-5],[.62,2],[.80,0],[1,0]],t),0],
  jaw:[0,curve([[0,0],[.18,5],[.34,18],[.42,26],[.48,26],[.54,22],[.62,12],[.80,0],[1,0]],t),0],
  tailBase:[0,0,3*Math.sin(w)]
 }:{neckBase:[0,.6*Math.sin(w),0],neckTip:[0,-.35*Math.sin(w),0],head:[0,-.25*Math.sin(w),0],tailBase:[0,0,2*Math.sin(w)]};
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.4)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const target=attack?footTarget(leg,t):bind[leg.foot.id],local=solveLeg(leg,body.positions[leg.hip.id],target);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:241},(_,i)=>frame(false,i/240)),events:[],boneLengthPolicy:'preserve',motionSemantics:'quiet boar breathing, subtle ear/tail/neck motion over four fixed hooves'};
r.clips.idleA.frames[r.clips.idleA.frames.length-1]={...structuredClone(r.clips.idleA.frames[0]),t:1};
r.clips.attack={base:'bind',duration:1050,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contactIntervals:[{ids:fore,from:0,to:.28},{ids:hind,from:0,to:.34},{ids:fore,from:.62,to:1},{ids:hind,from:.70,to:1}],events:[{t:.18,name:'windup',phase:'anticipation'},{t:.28,name:'fore-lift',phase:'anticipation'},{t:.34,name:'hind-push-off',phase:'action'},{t:.42,name:'jaws-open',phase:'action'},{t:.48,name:'impact',phase:'contact'},{t:.54,name:'release',phase:'contact'},{t:.62,name:'fore-landing',phase:'recovery'},{t:.70,name:'hind-landing',phase:'recovery'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.18,to:.28},{id:'action',from:.28,peak:.42,to:.48},{id:'contact',from:.48,peak:.48,to:.54},{id:'recovery',from:.54,peak:.70,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'native-informed isolated tusk lunge: crouch, hind push-off, suspension .34-.62, open-jaw upward head flick, fore then hind landing and recovery; modest in-place adaptation of WildBoar attack_02'};
r.clips.attack.frames.at(-1).poses=structuredClone(r.clips.attack.frames[0].poses);r.clips.attack.frames.at(-1).rotations=structuredClone(r.clips.attack.frames[0].rotations);
const model={$schema:'paper-rig/model-1',family:'boar',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
for(const[path,obj]of[['rigs/families/boar.json',r],['rigs/models/boar.json',model]]){
 let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}
 const temp=path+'.tmp';fs.writeFileSync(temp,text+'\n');fs.renameSync(temp,path);
}
