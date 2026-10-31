// Shared author-time baking only: output is ordinary rigid joint-local clips.
import fs from 'node:fs';
import {applyGroundedQuadruped,bindPositions,quadrupedLegs,solveLeg,sagittalBodyPose} from '../../rigs/quadruped-locomotion.js';
import {curve,round} from './spatial-leg-ik.mjs';
export function bakeSpecies(r,options={}){
 const feet=r.clips.idleA.contacts,blank={base:'bind',duration:options.idleDuration||3600,loop:true,easing:'linear',contacts:feet,frames:[{t:0,poses:{},rotations:{}},{t:1,poses:{},rotations:{}}]};r.clips={idleA:structuredClone(blank),walkA:structuredClone(blank)};
 applyGroundedQuadruped(r,{});
 const h=bindPositions(r).pelvis[2],walk={durationMs:options.walkDuration||1300,pattern:'lateral-sequence',stride:.34,lift:.16,dutyFactor:.6875,bodyBounce:.012,headNodDegrees:1,tailSwingDegrees:2,earSwingDegrees:1,keepPawsLevel:true,...options.walk},run={durationMs:options.runDuration||550,stride:.38,lift:.30,bodyRise:.07,bodyDip:.02,pitchDegrees:1,neckPitchDegrees:0,headPitchDegrees:0,tailPitchDegrees:0,spineFlexDegrees:2,keepPawsLevel:true,...options.run};
 applyGroundedQuadruped(r,{walk,run});for(const c of Object.values(r.clips))for(const f of c.frames)for(const side of ['near','far'])if(!r.joints.some(j=>j.id===side+'EarBase'))delete f.rotations[side+'EarBase'];const legs=quadrupedLegs(r),bind=bindPositions(r),has=id=>r.joints.some(j=>j.id===id),neck=has('neckBase')?'neckBase':has('neck')?'neck':null;
 for(const [name,c]of Object.entries(r.clips))for(const f of c.frames){for(const q of r.joints.filter(j=>/^tail\d+$/.test(j.id)))f.rotations[q.id]=[0,0,round(2*Math.sin(2*Math.PI*f.t-Number(q.id.slice(4))*.55))];}
 function frame(attack,t){const w=2*Math.PI*t,shift=options.attackShift??h*.075,move=attack?[curve([[0,0],[.22,-shift*.35],[.42,shift],[.48,shift],[.60,shift*.35],[.85,0],[1,0]],t),0,curve([[0,0],[.22,-h*.015],[.48,-h*.025],[.85,0],[1,0]],t)]:[0,0,-h*.008*(1-Math.cos(w))/2];
 const rotations={};if(neck)rotations[neck]=[0,attack?curve([[0,0],[.22,-6],[.42,options.neckStrike??12],[.48,options.neckStrike??12],[.60,4],[.85,0],[1,0]],t):.5*Math.sin(w),0];if(has('head'))rotations.head=[0,attack?curve([[0,0],[.22,3],[.40,options.headStrike??-7],[.48,options.headStrike??-7],[.65,0],[1,0]],t):-.3*Math.sin(w),0];if(has('jaw'))rotations.jaw=[0,attack?curve([[0,0],[.22,8],[.36,options.jawOpen??30],[.42,options.jawOpen??30],[.48,0],[1,0]],t):0,0];
 if(has('tailBase'))rotations.tailBase=[0,0,Math.sin(w)*(attack?3:1.5)];for(const q of r.joints.filter(j=>/^tail\d+$/.test(j.id)))rotations[q.id]=[0,0,round(2*Math.sin(w-Number(q.id.slice(4))*.55))];
 for(const side of ['near','far'])if(has(side+'EarBase'))rotations[side+'EarBase']=[0,Math.sin(w)*1.2,0];
 if(options.layer)Object.assign(rotations,options.layer(attack,t));
 const body=sagittalBodyPose(r,rotations,move);for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]-=body.angles[leg.hip.id];Object.assign(rotations,local);}
 const pose=sagittalBodyPose(r,rotations,move);for(const leg of legs)rotations[leg.foot.id]=[0,round(-pose.angles[leg.foot.id]),0];
 return{t,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};}
 r.clips.idleA={...blank,frames:Array.from({length:161},(_,i)=>frame(false,i/160)),events:[],boneLengthPolicy:'preserve',motionSemantics:options.idleSemantics||'quiet reference-informed breathing and head/tail motion above four fixed contact surfaces'};
 const times=[...new Set([...Array.from({length:481},(_,i)=>i/480),.22,.28,.36,.42,.48,.56,.60,.65,.85,.94])].sort((a,b)=>a-b);
 r.clips.attack={base:'bind',duration:options.attackDuration||1100,loop:false,easing:'linear',frames:times.map(t=>frame(true,t)),contacts:feet,boneLengthPolicy:'preserve',motionSemantics:options.attackSemantics||'authored reference-informed braced bite: preload, jaw opening, fast closure, recoil and recovery; fixed support paws',events:[{t:.22,name:'windup',phase:'anticipation'},{t:.36,name:'strike-start',phase:'action'},{t:.48,name:'impact',phase:'contact'},{t:.56,name:'release',phase:'contact'},{t:.94,name:'settled',phase:'settle'}],phases:[{id:'anticipation',from:0,peak:.22,to:.28},{id:'action',from:.28,peak:.36,to:.46},{id:'contact',from:.46,peak:.48,to:.56},{id:'recovery',from:.56,peak:.65,to:.94},{id:'settle',from:.94,peak:1,to:1}]};
 for(const c of Object.values(r.clips))c.frames[c.frames.length-1]={...structuredClone(c.frames[0]),t:1};
 return r;
}
export function writeSpecies(id,r,extra={}){
 const model={$schema:'paper-rig/model-1',family:id,base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run,...extra}};delete r.clips.run;
 for(const [path,obj]of [[`rigs/families/${id}.json`,r],[`rigs/models/${id}.json`,model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(l=>'        '+l).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
}
export function sizeSeams(r){for(const q of r.joints.filter(j=>j.parent&&!j.helper)){const ps=r.plates.filter(p=>p.role!=='shadow'&&(p.bone===q.id||p.span?.includes(q.id)));if(ps.length)q.gasket={diameterMeters:round(Math.min(...ps.map(p=>p.size[0]))*.8)};}}
export function polygon(r,id,owner,points,role='head',extra={}){const ids=points.map((v,i)=>{const q=id+'V'+i;r.joints.push({id:q,parent:owner,bind:v,role,helper:true});return q;});r.plates.push({id,bone:owner,shape:'polygon',points:ids,size:[.02],role,attachment:'rigid',material:'paperMain',zBias:0,semanticDetailTier:'identity',...extra});}
