// Authoring-time octopod construction and source-informed motion baking.
// Consumers receive ordinary rigid plates and joint-local clip transforms.
import { templateRig } from '../../rigs/family-kit.js';
const round=n=>{const x=Math.round(n*1e8)/1e8;return x===0?0:x;};
const V=a=>a.map(round), rad=a=>a*Math.PI/180;
const pulse=(t,a,b,c)=>t<=a||t>=c?0:t<b?(1-Math.cos(Math.PI*(t-a)/(b-a)))/2:(1+Math.cos(Math.PI*(t-b)/(c-b)))/2;
function periodic(values){
 const n=values.length-1,drift=values[n]-values[0],p=values.slice(0,n).map((x,i)=>x-drift*i/n);
 return t=>{const x=((t%1+1)%1)*n,i=Math.floor(x),u=x-i,a=p[(i+n-1)%n],b=p[i],c=p[(i+1)%n],d=p[(i+2)%n];return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);};
}
export function makeOctopusFamily(reference){
 const joints=[],plates=[],arms=Object.entries(reference.adaptation.armMap),lengths=[.30,.29,.26,.22],radii=[.135,.105,.073,.042,.010];
 const J=(id,parent,bind,role='body',extra={})=>{joints.push({id,parent,bind:V(bind),role,...extra});return id;};
 const vertex=(id,owner,p)=>J(id,owner,p,'geometry',{helper:true});
 function face(id,owner,ids,region='core',extra={}){
  const points=ids.map(id=>joints.find(j=>j.id===id).bind),center=points[0].map((_,k)=>points.reduce((s,p)=>s+p[k],0)/points.length);
  const bone=J(id+'Center',owner,center,region==='head'?'head':'tentacle',{helper:true});
  plates.push({id:id+'Plate',bone,shape:'polygon',size:[.02],points:ids,bodyRegion:region,role:region==='head'?'head':region==='core'?'core':'tentacle',attachment:'rigid',material:'paperMain',semanticDetailTier:'silhouette',zBias:0,...extra});
 }
 function polygon(id,owner,p,region,extra){face(id,owner,p.map((v,i)=>vertex(id+'Point'+i,owner,v)),region,extra);}
 function bulb(id,owner,rings,region='core'){
  const rows=rings.map(([z,rx,ry,cx],j)=>Array.from({length:8},(_,i)=>vertex(id+'Ring'+j+'Point'+i,owner,[cx+rx*Math.cos(i*Math.PI/4),ry*Math.sin(i*Math.PI/4),z])));
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<8;i++)face(id+'Band'+j+'Facet'+i,owner,[rows[j][i],rows[j][(i+1)%8],rows[j+1][(i+1)%8],rows[j+1][i]],region);
  face(id+'Bottom',owner,[...rows[0]].reverse(),region);face(id+'Top',owner,rows.at(-1),region);
 }
 function armPanel(id,owner,len,r0,r1,az){
  const rotate=([x,y,z])=>[x*Math.cos(rad(az))-y*Math.sin(rad(az)),x*Math.sin(rad(az))+y*Math.cos(rad(az)),z];
  // Four-sided tapered solid. Sections overlap around the hinge to retain a
  // continuous paper silhouette while the chain bends; no skinned stretching.
  const ring=(label,x,r)=>Array.from({length:4},(_,i)=>{const a=Math.PI/4+i*Math.PI/2;return vertex(id+label+i,owner,rotate([x,r*Math.cos(a),r*Math.sin(a)]));});
  const a=ring('Base',-.035,r0),b=ring('End',len+.035,r1);
  for(let i=0;i<4;i++)face(id+'Side'+i,owner,[a[i],a[(i+1)%4],b[(i+1)%4],b[i]],'limb',i===2?{role:'accent',material:'paperShade'}:{});
  face(id+'BaseCap',owner,[...a].reverse(),'limb');face(id+'TipCap',owner,b,'limb');
  // Paired small underside suckers; semantic identity, rigid to this segment.
  for(const [k,x]of [.5].map((f,k)=>[k,f*len]))for(const s of [-1,1])polygon(id+'Sucker'+k+(s>0?'L':'R'),owner,Array.from({length:6},(_,i)=>rotate([x+.024*Math.cos(i*Math.PI/3),s*r0*.28+.018*Math.sin(i*Math.PI/3),-r0*.73])),'limb',{role:'accent',material:'paperShade',semanticDetailTier:'identity'});
 }
 J('root',null,[0,0,0],'root');J('body','root',[0,0,1.10],'body');J('mantle','body',[-.065,0,.31],'head');
 bulb('body','body',[[-.24,.21,.21,0],[-.1,.32,.32,0],[.17,.30,.29,-.04],[.31,.23,.23,-.065]]);
 bulb('mantle','mantle',[[-.10,.24,.25,0],[.10,.38,.36,-.05],[.40,.38,.34,-.08],[.64,.26,.25,-.075],[.73,.085,.085,-.06]],'head');
 J('crown','mantle',[-.06,0,.73],'head',{helper:true});
 for(const side of ['near','far']){
  const s=side==='near'?1:-1;
  // Raised lateral eyes face the front and both flanks, avoiding one flat
  // front-facing disk that disappears from side views.
  J(side+'Eye','body',[.245,s*.17,.24],'head',{mirror:(s>0?'far':'near')+'Eye'});
  bulb(side+'Eye',side+'Eye',[[-.045,.064,.064,.01],[.025,.072,.072,.01],[.085,.025,.025,.01]],'head');
  polygon(side+'Pupil',side+'Eye',Array.from({length:8},(_,i)=>[.087,.024*Math.sin(i*Math.PI/4),.025+.030*Math.cos(i*Math.PI/4)]),'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity',zBias:.05});
 }
 const angles={Front:22.5,Side:67.5,Rear:112.5,Back:157.5};
 for(const [name]of arms){
  const s=name.startsWith('near')?1:-1,a=s*angles[name.replace(/^(near|far)/,'')];
  J(name+'Mount','body',[.205*Math.cos(rad(a)),.205*Math.sin(rad(a)),-.21],'tentacle');
  for(let i=0;i<4;i++){
   const parent=i?name+'Segment'+(i-1):name+'Mount';
   J(name+'Segment'+i,parent,i?[lengths[i-1]*Math.cos(rad(a)),lengths[i-1]*Math.sin(rad(a)),0]:[0,0,0],'tentacle',{bendAxis:[-Math.sin(rad(a)),Math.cos(rad(a)),0],limits:[-110,110]});
   armPanel(name+'Panel'+i,name+'Segment'+i,lengths[i],radii[i],radii[i+1],a);
  }
  J(name+'Tip',name+'Segment3',[lengths[3]*Math.cos(rad(a)),lengths[3]*Math.sin(rad(a)),0],'tentacle',{helper:true});
 }
 plates.unshift({id:'castShadow',bone:'root',shape:'ellipse',size:[1.9,1.75],role:'shadow',bodyRegion:'groundShadow',attachment:'rigid',material:'shadow',zBias:-100,surfaceNormal:[0,0,1],semanticDetailTier:'texture'});
 const curves={};
 for(const mode of ['idle','walk','run'])curves[mode]=Object.fromEntries(arms.map(([name,source])=>[name,Array.from({length:4},(_,i)=>periodic(reference.clips[mode].samples.map(s=>{const a=s.arms[source].angles;return a[i===3?a.length-1:i].pitch;})))]));
 function frame(mode,t){
  const loop=['idle','swim','fastSwim'].includes(mode),key=mode==='swim'?'walk':mode==='fastSwim'?'run':'idle',phase=loop?t:0;
  const drive=mode==='attack'?pulse(t,.10,.52,.94):0,down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0;
  const rotations={body:[0,-drive*4+down*8,0],mantle:[0,down*12,0]};
  for(const [name,source]of arms){
   const sign=name.startsWith('near')?1:-1,az=sign*angles[name.replace(/^(near|far)/,'')];
   rotations[name+'Mount']=[0,0,0];
   let previous=0;
   for(let i=0;i<4;i++){
    let pitch=(key==='idle'?.8:.75)*curves[key][name][i](phase)-10;
    // Source physical attack uses a curled right front arm. The paper variant
    // adds an explicit gather/reach/recover envelope, and never labels it a
    // literal retarget of that game action.
    if(mode==='attack'&&name==='farFront'){
     const sample=reference.clips.attack.samples[Math.min(64,Math.round(t*64))].arms.RFront.angles;
     const native=sample[i===3?sample.length-1:i].pitch;
     pitch+=drive*(native*.4+8-i*5);
    }
    pitch=pitch*(1-down)+(-18-i*8)*down;
    const angle=rad(-(pitch-previous)),ux=-Math.sin(rad(az)),uy=Math.cos(rad(az)),c=Math.cos(angle),sn=Math.sin(angle);
    rotations[name+'Segment'+i]=[Math.atan2(ux*sn,c),Math.asin(uy*sn),Math.atan2(ux*uy*(1-c),c+ux*ux*(1-c))].map(x=>x*180/Math.PI);previous=pitch;
   }
  }
  return {t,poses:{root:V([drive*.12,0,-down*.12+(loop?.025*Math.sin(2*Math.PI*t):0)])},rotations:Object.fromEntries(Object.entries(rotations).map(([k,v])=>[k,V(v)]))};
 }
 const clips={};
 for(const [id,mode,ms,loop]of [['idleA','idle',reference.clips.idle.duration_ms,true],['walkA','swim',reference.clips.walk.duration_ms,true],['fastSwim','fastSwim',reference.clips.run.duration_ms,true],['attack','attack',reference.clips.attack.duration_ms,false],['ko','ko',1500,false]]){
  const frames=Array.from({length:65},(_,i)=>frame(mode,i/64));
  if(loop){
   for(const field of ['poses','rotations'])for(const [joint,start]of Object.entries(frames[0][field])){const next=frames[1][field][joint],prev=frames[63][field][joint],tangent=next.map((x,k)=>(x-prev[k])/2);frames[1][field][joint]=V(start.map((x,k)=>x+tangent[k]));frames[63][field][joint]=V(start.map((x,k)=>x-tangent[k]));}
   frames[64]={...structuredClone(frames[0]),t:1};
  }
  clips[id]={base:'bind',duration:ms,easing:'linear',loop,frames,contacts:[],contactIntervals:[],boneLengthPolicy:'preserve',events:[],motionSemantics:loop?'Native octopus arm pitch adapted to a generic suspended eight-arm paddle/curl cycle; not native Swim and no grounded contacts':mode==='attack'?'Authored right-front arm gather, reach and recover informed by the native physical-attack arm curl':'Authored relaxation and mantle droop; suspended, not native death playback'};
  if(id==='attack')clips[id].events=[{t:.52,name:'impact'},{t:.94,name:'release'}];
  if(id==='ko')clips[id].events=[{t:1,name:'down'}];
 }
 clips.swim={...structuredClone(clips.walkA),aliasOf:'walkA'};clips.run={...structuredClone(clips.fastSwim),aliasOf:'fastSwim'};
 return templateRig({id:'octopusBase',family:'radialOctopod',archetypes:['octopus','eight-arm cephalopod'],height:2.35,scale:24,groundY:63,joints,plates,clips,profile:{silhouette:'bulbous mantle above eight separately articulated tapered arms, paired raised lateral eyes, underside sucker rows',locomotion:'asynchronous arm curls adapted from octopus Walk; suspended paddling, not a ground-contact crawl or native Swim',}});
}
