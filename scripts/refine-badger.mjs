// WildMesh HoneyBadger reference -> independent broad mustelid geometry and ordinary clips.
import fs from'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';
import{curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('deer');Object.assign(r,{id:'badgerBase',family:'mustelid',archetypes:['badger','honeyBadger','mustelid'],heightMeters:.46,tokenScale:68,tokenGroundY:56,profile:{silhouette:'HoneyBadger-informed badger: broad long low barrel, powerful short limbs, deep shoulders, thick neck, blunt wedge muzzle, small ears, short down-curved tail and foreclaws',locomotion:'sturdy four-beat walk with a lowered travel head; short bounding run with a flexing back and tucked hind recovery',attack:'authored braced bite from reference threat posture: neck preload, jaw opening, short forward snap and recovery; no dedicated attack exists in the native library'},joints:[],plates:[],anchors:[],clips:{}});r.camera.framing='fixed scale with ground origin at token [50,56]';
const J=(id,parent,bind,role='limb',extra={})=>{const q={id,parent,bind,role,...extra};r.joints.push(q);return q;};
const P=(id,bone,shape,size,role='limb',extra={})=>r.plates.push({id,bone,shape,size,role,attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});
const span=(id,a,b,width,role='limb',extra={})=>P(id,b,'capsule',[width],role,{span:[a,b],...extra});
J('root',null,[0,0,0],'root');J('pelvis','root',[-.22,0,.255],'body');J('spineMid','pelvis',[.16,0,.012],'body');J('chest','spineMid',[.16,0,.018],'body');J('neckBase','chest',[.10,0,.035],'neck');J('head','neckBase',[.115,0,.060],'head');J('muzzle','head',[.115,0,-.025],'head');
P('castShadow','root','ellipse',[.95,.38],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});span('torsoPlate','pelvis','spineMid',.255,'core');span('frontBarrelPlate','spineMid','chest',.25,'core');P('pelvisPlate','pelvis','ellipse',[.26,.25],'core',{occlusionMode:'under-core'});P('backPlate','spineMid','ellipse',[.26,.23],'core');P('chestPlate','chest','ellipse',[.25,.29],'core');span('neckPlate','chest','neckBase',.17,'neck');span('headConnectorPlate','neckBase','head',.13,'head',{occlusionMode:'under-core'});P('headPlate','head','ellipse',[.14,.13],'head');span('muzzleConnectorPlate','head','muzzle',.105,'head',{shape:'taperedBone',occlusionMode:'under-core'});P('nosePlate','muzzle','ellipse',[.055,.05],'head',{material:'paperShade'});
for(const[id,d]of[['chest',.17],['neckBase',.12],['head',.085],['muzzle',.035]])r.joints.find(j=>j.id===id).gasket={diameterMeters:d};
J('jaw','head',[.03,0,-.035],'head',{bendAxis:[0,1,0],limits:[0,34],gasket:{diameterMeters:.025}});J('jawTip','jaw',[.095,0,-.012],'head',{helper:true});span('jawPlate','jaw','jawTip',.04,'head',{shape:'taperedBone',material:'paperShade',occlusionMode:'under-core'});
J('tailBase','pelvis',[-.13,0,.015],'tail',{gasket:{diameterMeters:.03}});span('tailSocketPlate','pelvis','tailBase',.045,'tail',{occlusionMode:'under-core'});
const tailBinds=[[-.075,0,-.035],[-.025,0,-.075],[.015,0,-.045]];
for(let i=0;i<tailBinds.length;i++){const a=i?'tail'+i:'tailBase',id='tail'+(i+1),width=.045-i*.011;J(id,a,tailBinds[i],'tail',{gasket:{diameterMeters:width*.82}});span('tailSegment'+(i+1)+'Plate',a,id,width,'tail',{occlusionMode:'surface-relative',occlusionReference:'pelvis'});}
for(const side of ['near','far']){
 const sign=side==='near'?1:-1,other=side==='near'?'far':'near';
 for(const part of ['Front','Rear']){
  const rear=part==='Rear',hip=side+part+'Hip',knee=side+part+'Knee',distal=side+part+(rear?'Hock':'Carpus'),foot=side+part+'Paw';
  J(hip,rear?'pelvis':'chest',rear?[-.015,sign*.095,-.015]:[.035,sign*.10,-.045],'limb',{mirror:other+part+'Hip'});J(knee,hip,rear?[.075,0,-.10]:[-.055,0,-.09],'limb',{mirror:other+part+'Knee',bendAxis:[0,1,0],limits:[-120,120],gasket:{diameterMeters:.032}});J(distal,knee,rear?[-.09,0,-.075]:[.035,0,-.105],'limb',{mirror:other+part+(rear?'Hock':'Carpus'),bendAxis:[0,1,0],limits:[-150,150]});J(foot,distal,rear?[.035,0,-.065]:[.025,0,-.045],'limb',{mirror:other+part+'Paw',gasket:{diameterMeters:.025}});
  span(side+part+'UpperPlate',hip,knee,rear?.09:.10,'limb',{occlusionMode:'surface-relative',occlusionReference:rear?'pelvis':'chest'});span(side+part+'LowerPlate',knee,distal,.045);span(side+part+'PasternPlate',distal,foot,.03,'hoof');P(side+part+'PawPlate',foot,'ellipse',[rear?.09:.095,.035],'hoof',{material:'paperShade'});
 }
 J(side+'EarBase','head',[-.035,sign*.054,.045],'ear',{mirror:other+'EarBase'});P(side+'EarPlate',side+'EarBase','ellipse',[.045,.05],'ear',{material:'paperMain',bodyRegion:'accessory',occlusionMode:'surface-relative',occlusionReference:'head',semanticDetailTier:'identity'});
}
// Three short digging claws per forepaw; no imported texture or mesh geometry.
for(const side of ['near','far'])for(let digit=0;digit<3;digit++){
 const base=side+'FrontClaw'+digit+'Base',tip=side+'FrontClaw'+digit+'Tip',y=(digit-1)*.022;
 J(base,side+'FrontPaw',[.025,y,.012],'claw',{helper:true});J(tip,base,[.036,0,-.006],'claw',{helper:true});span(side+'FrontClaw'+digit+'Plate',base,tip,.010,'claw',{shape:'taperedBone',bodyRegion:'limb',material:'paperShade',semanticDetailTier:'identity'});
}
// Explicit small-animal seam diameters avoid the legacy 6 cm default floor.
for(const q of r.joints.filter(j=>j.parent&&!j.helper&&!j.gasket)){const incident=r.plates.filter(p=>p.role!=='shadow'&&(p.bone===q.id||p.span?.includes(q.id)));if(incident.length)q.gasket={diameterMeters:round(Math.max(...incident.map(p=>p.size[0]))*.85)};}
const feet=['nearFrontPaw','farFrontPaw','nearRearPaw','farRearPaw'],blank={base:'bind',duration:4200,easing:'linear',loop:true,contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
applyGroundedQuadruped(r,{});const legs=quadrupedLegs(r),bind=bindPositions(r);
// Walk contact boundaries fall exactly on the existing 160-sample bake grid.
applyGroundedQuadruped(r,{walk:{durationMs:1250,pattern:'lateral-sequence',stride:.52,lift:.22,dutyFactor:.6875,bodyBounce:.012,headNodDegrees:1.5,tailSwingDegrees:2,earSwingDegrees:1.5,keepPawsLevel:true},run:{durationMs:500,stride:.48,lift:.44,dutyFactor:.20,bodyRise:.12,bodyDip:.025,pitchDegrees:.6,neckPitchDegrees:24,headPitchDegrees:-10,tailPitchDegrees:0,spineFlexDegrees:4,keepPawsLevel:true}});
for(const f of r.clips.walkA.frames){f.rotations.neckBase[1]+=20;f.rotations.head[1]-=8;}
r.clips.walkA.events=[{t:0,name:'near-hind-contact'},{t:.25,name:'near-fore-contact'},{t:.5,name:'far-hind-contact'},{t:.75,name:'far-fore-contact'}];
// Propagated lateral tail sway adds motion without changing the ground plane.
for(const[name,c]of Object.entries(r.clips))for(const f of c.frames)for(let i=1;i<3;i++)f.rotations['tail'+i]=[0,0,round((name==='run'?3.5:2)*Math.sin(2*Math.PI*f.t-i*.55))];
function frame(attack,t){const w=2*Math.PI*t,move=attack?[curve([[0,0],[.22,-.012],[.46,.028],[.56,.025],[.76,.008],[1,0]],t),0,curve([[0,0],[.22,-.009],[.46,-.008],[.76,-.004],[1,0]],t)]:[0,0,-.002*(1-Math.cos(w))/2];
 const rotations=attack?{neckBase:[0,curve([[0,0],[.22,-8],[.42,16],[.50,14],[.76,3],[1,0]],t),0],head:[0,curve([[0,0],[.22,4],[.38,-10],[.46,-12],[.56,-3],[1,0]],t),0],jaw:[0,curve([[0,0],[.22,8],[.36,32],[.42,32],[.48,1],[.56,0],[1,0]],t),0]}:{neckBase:[0,.7*Math.sin(w),0],head:[0,-.4*Math.sin(w),0],jaw:[0,0,0]};
 for(let i=0;i<3;i++)rotations[i?'tail'+i:'tailBase']=[0,0,round((attack?1+.5*Math.sin(Math.PI*t)**2:1)*Math.sin(w-i*.55))];
 for(const side of ['near','far'])rotations[side+'EarBase']=[0,1.5*Math.sin(w+(side==='near'?0:.4)),0];
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const a=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);a[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,a);}
 const posed=sagittalBodyPose(r,rotations,move);for(const leg of legs)rotations[leg.foot.id]=[0,round(-posed.angles[leg.foot.id]),0];
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
r.clips.idleA={...blank,frames:Array.from({length:161},(_,i)=>frame(false,i/160)),events:[],boneLengthPolicy:'preserve',motionSemantics:'quiet broad-bodied honey badger breathing and head/ear/tail motion over four fixed paws; alert head carriage informed by native Idle'};
const critical=[.22,.28,.36,.42,.46,.48,.56,.64,.76,.94],times=[...new Set([...Array.from({length:481},(_,i)=>i/480),...critical])].sort((a,b)=>a-b);
r.clips.attack={base:'bind',duration:1100,easing:'linear',loop:false,frames:times.map(t=>frame(true,t)),contacts:feet,events:[{t:.22,name:'windup',phase:'anticipation'},{t:.36,name:'jaw-open',phase:'action'},{t:.48,name:'impact',phase:'contact'},{t:.56,name:'release',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.22,to:.28},{id:'action',from:.28,peak:.36,to:.46},{id:'contact',from:.46,peak:.48,to:.56},{id:'recovery',from:.56,peak:.76,to:.94},{id:'settle',from:.94,peak:1,to:1}],boneLengthPolicy:'preserve',motionSemantics:'authored braced bite: jaw opening, short powerful forward snout/body thrust, fast closure, release and complete recovery over four fixed paws; authored from HoneyBadger threat/foraging transitions; native action library has no dedicated bite'};
for(const c of Object.values(r.clips))c.frames[c.frames.length-1]={...structuredClone(c.frames[0]),t:1};
const model={$schema:'paper-rig/model-1',family:'badger',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;
for(const[path,obj]of[['rigs/families/badger.json',r],['rigs/models/badger.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
