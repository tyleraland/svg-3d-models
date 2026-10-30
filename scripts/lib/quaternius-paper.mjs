// Author-time native reference retargeting. Consumers receive ordinary paper-rig clips.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {core} from '@paper-rig/compiler';
import {angles,round} from './spatial-leg-ik.mjs';
export const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(v,s)=>v.map(n=>n*s),tr=M=>M[0].map((_,i)=>M.map(r=>r[i])),mm=(A,B)=>A.map(r=>B[0].map((_,i)=>r.reduce((n,v,k)=>n+v*B[k][i],0))),mv=(M,v)=>M.map(r=>r.reduce((n,a,i)=>n+a*v[i],0));
const C=[[0,-1,0],[1,0,0],[0,0,1]],I=core.euler([0,0,0]);
const unit=M=>M.map(r=>r.map((v,i)=>v/Math.hypot(...M.map(r=>r[i]))));
export function nativePaper(id,{scale=.05,names={},exclude=[],height=1,profile={}}={}){
 const source=JSON.parse(fs.readFileSync(`reference-studies/${id}-reference.json`)),idle=Object.values(source.actions).find(a=>a===source.actions[Object.keys(source.actions).find(n=>n.endsWith('_Idle'))]),bind=idle.samples[0].bones;
 const bones=source.bones.filter(b=>!exclude.includes(b.name)&&b.name!=='root'&&!/Foot|IK|Target|Pole/i.test(b.name));
 const ids=Object.fromEntries(bones.map(b=>[b.name,names[b.name]||b.name.replace(/\.L$/,'Left').replace(/\.R$/,'Right').replace(/^./,s=>s.toLowerCase())]));
 const point=v=>mul(mv(C,v),scale),r=loadFamily('deer');Object.assign(r,{id:id+'Base',family:'dinosaur',archetypes:[id,'dinosaur'],heightMeters:height,tokenScale:28,tokenGroundY:65,profile,joints:[],plates:[],anchors:[],clips:{}});
 const J=(id,parent,v,role='limb',extra={})=>{r.joints.push({id,parent,bind:v.map(round),role,...extra});return id;};
 const P=(id,bone,shape,size,role='limb',extra={})=>{r.plates.push({id,bone,shape,size:size.map(round),role,bodyRegion:['core','head','neck','tail'].includes(role)?role:role==='shadow'?'groundShadow':'limb',attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});return id;};
 J('root',null,[0,0,0],'root');
 for(const b of bones){const parent=ids[b.parent]||'root',p=bind[b.name].head,q=bind[b.parent]?.head||[0,0,0];J(ids[b.name],parent,point(parent==='root'?p:sub(p,q)),/Head/.test(b.name)?'head':/Neck/.test(b.name)?'neck':/Tail|Back$/.test(b.name)?'tail':/Body|Hips|Torso|Shoulders/.test(b.name)?'body':'limb');}
 const span=(name,width,role='limb',extra={})=>{const b=bind[name],a=ids[name],tail=J(a+'Tip',a,point(sub(b.tail,b.head)),role,{helper:true}),center=J(a+'Center',a,point(mul(sub(b.tail,b.head),.5)),role,{helper:true});P(a+'Plate',center,'capsule',[width],role,{span:[a,tail],...extra});return tail;};
 function clip(action,mode){const a=source.actions[action],frames=a.samples.map(s=>{const D=Object.fromEntries(bones.map(b=>[b.name,mm(C,mm(mm(unit(s.bones[b.name].rotation),tr(unit(bind[b.name].rotation))),tr(C)))])),rotations={};for(const b of bones)rotations[ids[b.name]]=angles(mm(tr(D[b.parent]||I),D[b.name]));return{t:s.t,poses:{root:point(sub(s.bones[bones[0].name].head,bind[bones[0].name].head)).map(round)},rotations};});
 // Unwrap Euler branches before interpolation; equivalent representations stay local.
 for(let i=1;i<frames.length;i++)for(const[id,v]of Object.entries(frames[i].rotations))for(let k=0;k<3;k++){let prev=frames[i-1].rotations[id][k];while(v[k]-prev>180)v[k]-=360;while(v[k]-prev< -180)v[k]+=360;}
 const loop=['idle','walk','run'].includes(mode);if(loop)frames[frames.length-1]={...structuredClone(frames[0]),t:1};r.clips[mode]={base:'bind',duration:Math.round((a.frames[1]-a.frames[0])/source.fps*1000),easing:'linear',loop,frames,contacts:[],contactIntervals:[],boneLengthPolicy:'preserve',motionSemantics:`${action}: native evaluated rigid rotation study retargeted to paper joints; no mesh or native runtime dependency`,events:[]};return r.clips[mode];}
 function save(){const model={$schema:'paper-rig/model-1',family:id,base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;r.clips.idleA=r.clips.idle;delete r.clips.idle;r.clips.walkA=r.clips.walk;delete r.clips.walk;for(const[path,obj]of[[`rigs/families/${id}.json`,r],[`rigs/models/${id}.json`,model]])fs.writeFileSync(path,JSON.stringify(obj,null,2)+'\n');}
 return{r,source,bind,ids,point,J,P,span,clip,save};
}
