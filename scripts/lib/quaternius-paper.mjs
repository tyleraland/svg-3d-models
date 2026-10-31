// Author-time native reference retargeting. Consumers receive ordinary paper-rig clips.
import fs from 'node:fs';
import {loadFamily} from '@paper-rig/rigs';
import {core} from '@paper-rig/compiler';
import {angles,round} from './spatial-leg-ik.mjs';
export const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(v,s)=>v.map(n=>n*s),tr=M=>M[0].map((_,i)=>M.map(r=>r[i])),mm=(A,B)=>A.map(r=>B[0].map((_,i)=>r.reduce((n,v,k)=>n+v*B[k][i],0))),mv=(M,v)=>M.map(r=>r.reduce((n,a,i)=>n+a*v[i],0));
const C=[[0,-1,0],[1,0,0],[0,0,1]],I=core.euler([0,0,0]);
const unit=M=>M.map(r=>r.map((v,i)=>v/Math.hypot(...M.map(r=>r[i]))));
export function nativePaper(id,{scale=.05,names={},exclude=[],include=[],height=1,profile={}}={}){
 const source=JSON.parse(fs.readFileSync(`reference-studies/${id}-reference.json`)),idle=Object.values(source.actions).find(a=>a===source.actions[Object.keys(source.actions).find(n=>n.endsWith('_Idle'))]),bind=idle.samples[0].bones;
 const bones=source.bones.filter(b=>!exclude.includes(b.name)&&b.name!=='root'&&(!/Foot|IK|Target|Pole/i.test(b.name)||include.includes(b.name)));
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

// Paper support adaptation shared by the dinosaur authoring scripts, never by consumers.
export function finishDinosaur(n,{prefix,feet,sole=.025,idleFixed=true,attack='native strike',configureFrames}={}){
 const {r,clip}=n;
 for(const[suffix,mode]of [['Idle','idle'],['Walk','walk'],['Run','run'],['Attack','attack'],['Death','ko']])clip(prefix+'_'+suffix,mode);
 configureFrames?.(r);
 const initial=core.solveWorld(r,0,'bind'),floor=Math.min(...feet.map(f=>initial[f][2]))-sole;r.joints.find(j=>j.id==='body').bind[2]-=floor;
 for(const id of feet){const j=r.joints.find(j=>j.id===id);j.bind[2]=round(j.bind[2]-(initial[id][2]-floor-sole));}
 if(idleFixed){for(const f of r.clips.idle.frames){f.poses.root=[0,0,0];for(const id of Object.keys(f.rotations))if(!/neck|head|tail/i.test(id))f.rotations[id]=[0,0,0];}r.clips.idle.contacts=feet;r.clips.idle.contactIntervals=undefined;}
 for(const mode of ['walk','run','attack','ko'])for(const f of r.clips[mode].frames){const p=core.solveWorld(r,f.t,mode),low=Math.min(...feet.map(id=>p[id][2]-sole));if(low<0||mode==='walk'||mode==='attack')f.poses.root[2]=round(f.poses.root[2]-low);if(mode==='ko'){const posed=core.solveWorld(r,f.t,mode),min=Math.min(...r.plates.filter(p=>p.role!=='shadow').flatMap(plate=>(plate.points||plate.span||[plate.bone]).map(id=>posed[id][2]-(plate.shape==='ellipse'?plate.size[1]:(plate.points ? .01 : plate.size[0]))/2)));if(min<0)f.poses.root[2]=round(f.poses.root[2]-min);}}
 r.clips.attack.motionSemantics+=`; ${attack}`;r.clips.attack.events=[{t:.25,name:'windup'},{t:.5,name:'impact'},{t:.75,name:'release'},{t:1,name:'settled'}];r.clips.ko.events=[{t:.25,name:'fall'},{t:.8,name:'down'}];
 const down=structuredClone(r.clips.ko.frames[32]);for(const f of r.clips.ko.frames)if(f.t>=.8){f.poses=structuredClone(down.poses);f.rotations=structuredClone(down.rotations);}
 for(const mode of ['walk','attack'])bakeGroundSupport(r,mode,feet,sole);
 // Conservative spherical camera envelope includes every key, plate radius and the fixed shadow.
 let radius=0;for(const mode of ['bind',...Object.keys(r.clips)])for(const t of mode==='bind'?[0]:r.clips[mode].frames.map(f=>f.t)){const p=core.solveWorld(r,t,mode);for(const plate of r.plates)for(const id of plate.points||plate.span||[plate.bone])radius=Math.max(radius,Math.hypot(...p[id])+Math.max(...plate.size)/2);}
 r.tokenGroundY=50;r.tokenScale=Math.floor(44/radius*100)/100;
}
// Small closed faceted paper solids: actual thickness, true triangle centroid sorting.
export function paperSolid(n,id,parent,vertices,faces,{reference=parent,tier='identity',material='paperMain'}={}){
 const {J,P}=n,points=vertices.map((p,i)=>J(id+'Vertex'+i,parent,p,'accent',{helper:true}));
 for(const[face,indices]of faces.entries()){const center=indices.reduce((s,i)=>add(s,vertices[i]),[0,0,0]).map(v=>v/indices.length),bone=J(id+'Face'+face+'Center',parent,center,'accent',{helper:true});P(id+'Face'+face+'Plate',bone,'polygon',[.01],'accent',{points:indices.map(i=>points[i]),material,bodyRegion:'accessory',semanticDetailTier:tier,occlusionMode:'surface-relative',occlusionReference:reference});}
 return points;
}
export function paperNeedle(n,id,parent,base,tip,radius,options={}){let axis=sub(tip,base),len=Math.hypot(...axis);axis=mul(axis,1/len);let seed=Math.abs(axis[2])<.8?[0,0,1]:[0,1,0],u=[axis[1]*seed[2]-axis[2]*seed[1],axis[2]*seed[0]-axis[0]*seed[2],axis[0]*seed[1]-axis[1]*seed[0]];u=mul(u,radius/Math.hypot(...u));let v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];return paperSolid(n,id,parent,[add(base,u),add(base,v),sub(base,u),sub(base,v),tip],[[0,1,4],[1,2,4],[2,3,4],[3,0,4]],options);}

// Bake support height from posed soles, including between the native reference keys.
// Rotational curves stay unchanged; only root height is corrected. Contacts are
// declared only over intervals whose endpoint soles actually lie on the plane.
export function bakeGroundSupport(r,mode,feet,sole){
 const c=r.clips[mode],source=structuredClone(c.frames),frames=[];
 for(let i=0;i<source.length-1;i++)for(let step=0;step<4;step++){const a=source[i],b=source[i+1],u=step/4;frames.push({t:a.t+(b.t-a.t)*u,poses:{root:a.poses.root.map((v,k)=>v+(b.poses.root[k]-v)*u)},rotations:Object.fromEntries(Object.entries(a.rotations).map(([id,v])=>[id,v.map((v,k)=>v+((b.rotations[id]||[0,0,0])[k]-v)*u)]))});}frames.push(structuredClone(source.at(-1)));c.frames=frames;
 for(const f of frames){const p=core.solveWorld(r,f.t,mode),low=Math.min(...feet.map(id=>p[id][2]-sole));f.poses.root[2]=round(f.poses.root[2]-low);}
 if(c.loop)c.frames[c.frames.length-1]={...structuredClone(c.frames[0]),t:1};
 const poses=frames.map(f=>core.solveWorld(r,f.t,mode)),intervals=[];
 for(const id of feet){let active=null;for(let i=0;i<frames.length-1;i++){const supported=poses[i][id][2]<=sole+.002&&poses[i+1][id][2]<=sole+.002;if(supported){if(active)active.to=frames[i+1].t;else active={ids:[id],from:frames[i].t,to:frames[i+1].t};}else if(active){intervals.push(active);active=null;}}if(active)intervals.push(active);}
 c.contactIntervals=intervals.sort((a,b)=>a.from-b.from||a.to-b.to);c.motionSemantics+='; paper root support baked between reference keys; contact intervals require on-plane soles';
}
