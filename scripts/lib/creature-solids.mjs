// Small author-time solid primitives. All geometry is rigid and emitted as
// ordinary paper-rig plates; consumers never evaluate these construction tools.
import {templateRig} from '../../rigs/family-kit.js';
export const round=n=>Math.abs(n)<1e-10?0:Math.round(n*1e8)/1e8;
export const V=v=>v.map(round);
export const pulse=(t,a,b,c)=>t<=a||t>=c?0:t<b?(1-Math.cos(Math.PI*(t-a)/(b-a)))/2:(1+Math.cos(Math.PI*(t-b)/(c-b)))/2;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=v=>v.map(x=>x/Math.hypot(...v));
export function solidKit(){
 const joints=[],plates=[],anchors=[],ids=new Set();
 const J=(id,parent,bind,role='body',extra={})=>{if(ids.has(id))throw Error('Duplicate joint '+id);ids.add(id);joints.push({id,parent,bind:V(bind),role,...extra});return id;};
 function face(id,owner,points,region='core',extra={}){
  const center=points[0].map((_,k)=>points.reduce((s,p)=>s+p[k],0)/points.length),bone=J(id+'Center',owner,center,'geometry',{helper:true});
  const vertices=points.map((p,i)=>J(id+'Point'+i,owner,p,'geometry',{helper:true}));
  plates.push({id:id+'Plate',bone,shape:'polygon',size:[.02],points:vertices,role:region==='head'?'head':region==='core'?'core':'limb',bodyRegion:region,attachment:'rigid',material:'paperMain',semanticDetailTier:'silhouette',zBias:0,...extra});
 }
 function tube(id,owner,a,b,ra,rb,region='core',extra={},sides=6){
  const axis=norm(b.map((x,i)=>x-a[i])),seed=Math.abs(axis[2])>.9?[0,1,0]:[0,0,1],u=norm(cross(axis,seed)),v=cross(axis,u);
  const ring=(p,r)=>Array.from({length:sides},(_,i)=>p.map((x,k)=>x+u[k]*r[0]*Math.cos(i*2*Math.PI/sides)+v[k]*r[1]*Math.sin(i*2*Math.PI/sides)));
  const x=ring(a,ra),y=ring(b,rb),points=[...x,...y].map((p,i)=>J(id+'Vertex'+i,owner,p,'geometry',{helper:true}));
  function f(name,is,shade=false){const ps=is.map(i=>[...x,...y][i]),c=ps[0].map((_,k)=>ps.reduce((s,p)=>s+p[k],0)/ps.length),bone=J(name+'Center',owner,c,'geometry',{helper:true});plates.push({id:name+'Plate',bone,points:is.map(i=>points[i]),shape:'polygon',size:[.02],role:shade?'accent':region==='core'?'core':region==='head'?'head':'limb',bodyRegion:region,attachment:'rigid',material:shade?'paperShade':'paperMain',semanticDetailTier:'silhouette',zBias:0,...extra});}
  for(let i=0;i<sides;i++)f(id+'Facet'+i,[i,(i+1)%sides,(i+1)%sides+sides,i+sides],i>=sides/2);
  f(id+'FrontCap',Array.from({length:sides},(_,i)=>i));f(id+'RearCap',Array.from({length:sides},(_,i)=>2*sides-1-i));
 }
 function slab(id,owner,outline,region='tail',thickness=.014,extra={}){
  const a=outline.map(p=>[p[0],p[1]+thickness/2,p[2]]),b=outline.map(p=>[p[0],p[1]-thickness/2,p[2]]);
  face(id+'Near',owner,a,region,extra);face(id+'Far',owner,[...b].reverse(),region,extra);for(let i=0;i<a.length;i++)face(id+'Edge'+i,owner,[a[i],b[i],b[(i+1)%a.length],a[(i+1)%a.length]],region,extra);
 }
 function finish(id,options,clips){plates.unshift({id:'castShadow',bone:'root',shape:'ellipse',size:options.shadow||[2,1],role:'shadow',bodyRegion:'groundShadow',attachment:'rigid',material:'shadow',zBias:-100,surfaceNormal:[0,0,1],semanticDetailTier:'texture'});return templateRig({id:id+'Base',family:id,...options,joints,plates,anchors,clips});}
 return{joints,plates,anchors,J,face,tube,slab,finish};
}
export function sampleClip({mode,duration=1200,loop=false,sample,contacts=[],events=[],times=[]}){
 const ts=[...new Set([...Array.from({length:49},(_,i)=>i/48),...times])].sort((a,b)=>a-b),frames=ts.map(t=>{const p=sample(mode,t);return{t,poses:Object.fromEntries(Object.entries(p.poses||{}).map(([id,v])=>[id,V(v)])),rotations:Object.fromEntries(Object.entries(p.rotations||{}).map(([id,v])=>[id,V(v)]))};});
 if(loop)frames[frames.length-1]={...structuredClone(frames[0]),t:1};
 return{base:'bind',duration,easing:'linear',loop,frames,contacts,contactIntervals:[],events,boneLengthPolicy:'preserve'};
}
