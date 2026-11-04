// Authoring-time conversion of measured dinosaur cetacean pitch to ordinary
// rigid paper sections. No runtime wave, mesh skinning or renderer special case.
import {templateRig} from '../../rigs/family-kit.js';
const round=n=>{const v=Math.round(n*1e8)/1e8;return v===0?0:v;},V=a=>a.map(round);
const pulse=(t,a,b,c)=>t<=a||t>=c?0:t<b?(1-Math.cos(Math.PI*(t-a)/(b-a)))/2:(1+Math.cos(Math.PI*(t-b)/(c-b)))/2;
function periodic(samples){const n=samples.length-1,drift=samples[n]-samples[0],p=samples.slice(0,n).map((v,i)=>v-drift*i/n);return t=>{const x=((t%1+1)%1)*n,i=Math.floor(x),u=x-i,a=p[(i+n-1)%n],b=p[i],c=p[(i+1)%n],d=p[(i+2)%n];return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);};}
export function makeCetaceanFamily(kind,reference){
 if(!['dolphin','whale'].includes(kind))throw new Error(`Unknown cetacean: ${kind}`);
 const whale=kind==='whale',source=reference.models[kind],joints=[],plates=[];
 const J=(id,parent,bind,role='body',extra={})=>{joints.push({id,parent,bind:V(bind),role,...extra});return id;};
 const vertex=(id,owner,p)=>J(id,owner,p,'geometry',{helper:true});
 function face(id,owner,ids,region='core',extra={}){const p=ids.map(id=>joints.find(j=>j.id===id).bind),center=p[0].map((_,k)=>p.reduce((s,p)=>s+p[k],0)/p.length);const bone=J(id+'Center',owner,center,region==='head'?'head':'body',{helper:true});plates.push({id:id+'Plate',bone,points:ids,shape:'polygon',size:[.02],bodyRegion:region,role:region==='head'?'head':region==='core'?'core':'fin',attachment:'rigid',material:'paperMain',semanticDetailTier:'silhouette',zBias:0,...extra});}
 function polygon(id,owner,p,region,extra){face(id,owner,p.map((p,i)=>vertex(id+'Point'+i,owner,p)),region,extra);}
 function section(id,owner,front,back,region='core'){
  const ring=(label,[x,w,h,z=0])=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return vertex(id+label+i,owner,[x,w*Math.cos(a),z+h*Math.sin(a)]);});
  const a=ring('Front',front),b=ring('Back',back);
  for(let i=0;i<8;i++)face(id+'Facet'+i,owner,[a[i],a[(i+1)%8],b[(i+1)%8],b[i]],region,i>=4?{role:'accent',material:'paperShade'}:{});
  face(id+'FrontCap',owner,a,region);face(id+'BackCap',owner,[...b].reverse(),region);
 }
 function slab(id,owner,outline,region='limb',thickness=.025){const a=outline.map((p,i)=>vertex(id+'Upper'+i,owner,[p[0],p[1],p[2]+thickness/2])),b=outline.map((p,i)=>vertex(id+'Lower'+i,owner,[p[0],p[1],p[2]-thickness/2]));face(id+'Upper',owner,a,region);face(id+'Lower',owner,[...b].reverse(),region,{role:'accent',material:'paperShade'});for(let i=0;i<a.length;i++)face(id+'Edge'+i,owner,[a[i],b[i],b[(i+1)%a.length],a[(i+1)%a.length]],region);}
 const width=whale?.43:.25,height=whale?.40:.27,backLength=whale?.60:.48,stemLength=whale?.58:.48,peduncleLength=whale?.48:.38;
 J('root',null,[0,0,0],'root');J('body','root',[0,0,1.1],'body',{bendAxis:[0,1,0],limits:[-20,20]});J('head','body',[.48,0,0],'head',{bendAxis:[0,1,0],limits:[-25,25]});
 J('rearBody','body',[-.20,0,0],'body',{bendAxis:[0,1,0],limits:[-25,25]});J('tailBase','rearBody',[-backLength,0,0],'tail',{bendAxis:[0,1,0],limits:[-35,35]});J('tailPeduncle','tailBase',[-stemLength,0,0],'tail',{bendAxis:[0,1,0],limits:[-40,40]});J('tailFin','tailPeduncle',[-peduncleLength,0,0],'tail',{bendAxis:[0,1,0],limits:[-65,65]});
 section('foreBody','body',[.53,width*.79,height*.82],[-.29,width,height]);
 section('head','head',whale?[.62,.22,.20,-.025]:[.24,.10,.13,-.04],[-.10,width*.87,height*.86],'head');
 if(!whale)section('rostrum','head',[.62,.028,.032,-.10],[.16,.085,.07,-.08],'head');
 section('rearBody','rearBody',[.13,width*.98,height*.98],[-backLength-.04,width*.62,height*.62]);section('tailStem','tailBase',[.10,width*.67,height*.66],[-stemLength-.045,.10,.105]);section('peduncle','tailPeduncle',[.085,.12,.13],[-peduncleLength-.03,.045,.045]);
 const spread=whale?.67:.53;
 // Separate lobes retain a central rear notch and a broad horizontal fluke.
 for(const side of ['near','far']){
  const s=side==='near'?1:-1;
  slab(side+'Fluke','tailFin',[[.075,0,.015],[-.11,s*spread*.70,.015],[-.17,s*spread,0],[-.37,s*spread*.80,-.012],[-.22,s*.055,0],[-.31,0,0]],'tail',.028);
  // Compare each fluke surface to the body, rather than its posterior owner.
  // A bilateral near-side tie must not paint a distant tail over the rostrum.
  for(const p of plates.filter(p=>p.id.startsWith(side+'Fluke')))Object.assign(p,{occlusionMode:'surface-relative',occlusionReference:'body'});
  J(side+'FlukeTip','tailFin',[-.17,s*spread,0],'tail',{helper:true,mirror:(s>0?'far':'near')+'FlukeTip'});
  J(side+'PectoralFin','body',[whale?.37:.32,s*width*.80,whale?-.22:-.15],'fin',{mirror:(s>0?'far':'near')+'PectoralFin',bendAxis:[1,0,0],limits:[-20,20]});
  slab(side+'Pectoral',side+'PectoralFin',whale?[[.11,0,.035],[-.27,s*.62,-.33],[-.43,s*.70,-.40],[-.32,s*.39,-.26],[-.18,0,-.035]]:[[.11,0,.025],[-.21,s*.32,-.12],[-.39,s*.40,-.15],[-.22,s*.10,-.045],[-.15,0,-.025]],'limb');
  // Eye and mouth details stay in the opaque head surface depth order.
  const ex=whale?.27:.075,ey=s*(whale?.307:.181),ez=.015;
  polygon(side+'Eye','head',Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return[ex+.025*Math.cos(a),ey,ez+.025*Math.sin(a)];}),'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity',zBias:.1});
  polygon(side+'Mouth','head',whale?[[.61,s*.22,-.055],[.36,s*.295,-.08],[.08,s*.36,-.10],[.08,s*.36,-.115],[.36,s*.295,-.095],[.61,s*.22,-.07]]:[[.61,s*.03,-.105],[.23,s*.10,-.11],[.15,s*.105,-.10],[.15,s*.105,-.115],[.23,s*.10,-.122],[.61,s*.03,-.115]],'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity',zBias:.1});
 }
 const dorsalOwner=whale?'rearBody':'body',dorsalX=whale?-.22:-.06,dorsalZ=whale?.31:.23;
 J('dorsalFin',dorsalOwner,[dorsalX,0,dorsalZ],'fin');
 const outline=whale?[[.12,0,0],[.02,0,.15],[-.08,0,.18],[-.15,0,.07],[-.23,0,-.015]]:[[.22,0,0],[.025,0,.31],[-.08,0,.43],[-.16,0,.39],[-.13,0,.16],[-.29,0,-.015]];
 const a=outline.map(p=>[p[0],.014,p[2]]),b=outline.map(p=>[p[0],-.014,p[2]]);polygon('dorsalNear','dorsalFin',a,'tail');polygon('dorsalFar','dorsalFin',[...b].reverse(),'tail');for(let i=0;i<a.length;i++)polygon('dorsalEdge'+i,'dorsalFin',[a[i],b[i],b[(i+1)%a.length],a[(i+1)%a.length]],'tail');
 J('headForward','head',[.25,0,0],'head',{helper:true});J('noseTip','head',[.62,0,whale?-.025:-.10],'snout',{helper:true});J('tailTip','tailFin',[-.31,0,0],'tail',{helper:true});
 plates.unshift({id:'castShadow',bone:'root',shape:'ellipse',size:[whale?2.6:2.15,whale?1.05:.70],role:'shadow',bodyRegion:'groundShadow',attachment:'rigid',material:'shadow',zBias:-100,surfaceNormal:[0,0,1],semanticDetailTier:'texture'});
 const curves=Object.fromEntries(Object.entries(source.pitch_degrees).map(([k,v])=>[k,periodic(v)])),finCurve=periodic(source.flipper_dihedral_degrees);
 function frame(mode,t){
  const loop=['idle','swim','fastSwim'].includes(mode),phase=loop?t:0,amp=mode==='idle'||!loop?.35:mode==='fastSwim'?1.08:1;
  const drive=mode==='attack'?pulse(t,.15,.48,.95):0,down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0,fade=1-down;
  const global=['Spine1','Spine2','Spine3','Spine4','Tail'].map(k=>amp*curves[k](phase)*fade);
  const rotations={body:[down*65,global[0]-drive*3,0],head:[0,-amp*curves.Head(phase)*fade-global[0],0],rearBody:[0,global[1]-global[0],0],tailBase:[0,global[2]-global[1]+drive*8,0],tailPeduncle:[0,global[3]-global[2]+drive*5,0],tailFin:[0,global[4]-global[3]-drive*6,0],dorsalFin:[0,0,0]};
  const trim=(finCurve(phase)-source.flipper_dihedral_degrees[0])*amp*fade;
  rotations.nearPectoralFin=[trim,0,0];rotations.farPectoralFin=[-trim,0,0];
  return{t,poses:{root:V([drive*.18,0,-down*.08])},rotations:Object.fromEntries(Object.entries(rotations).map(([k,v])=>[k,V(v)]))};
 }
 const duration=Math.round(1000*(source.frame_range[1]-source.frame_range[0])/source.fps),clips={};
 for(const[id,mode,ms,loop]of [['idleA','idle',duration*2,true],['walkA','swim',duration,true],['fastSwim','fastSwim',Math.round(duration*.67),true],['attack','attack',whale?1600:900,false],['ko','ko',1800,false]]){
  const frames=Array.from({length:97},(_,i)=>frame(mode,i/96));if(loop){for(const field of ['poses','rotations'])for(const[joint,start]of Object.entries(frames[0][field])){const next=frames[1][field][joint],previous=frames[95][field][joint],tangent=next.map((v,k)=>(v-previous[k])/2);frames[1][field][joint]=V(start.map((v,k)=>v+tangent[k]));frames[95][field][joint]=V(start.map((v,k)=>v-tangent[k]));}frames[96]={...structuredClone(frames[0]),t:1};}
  clips[id]={base:'bind',duration:ms,easing:'linear',loop,frames,contacts:[],contactIntervals:[],boneLengthPolicy:'preserve',events:[],motionSemantics:loop?'Authored Swim pitch adapted to rigid body/tail sections and horizontal flukes; averaged pectoral trim, no lateral fish-tail yaw or ground contacts':mode==='attack'?'Authored forward surge and vertical tail drive; no native attack clip':'Authored roll and slight sink; no native death clip'};
  if(id==='attack')clips[id].events=[{t:.48,name:'impact'},{t:.95,name:'release'}];if(id==='ko')clips[id].events=[{t:.5,name:'roll'},{t:1,name:'down'}];
 }
 clips.swim={...structuredClone(clips.walkA),aliasOf:'walkA'};clips.run={...structuredClone(clips.fastSwim),aliasOf:'fastSwim'};
 return templateRig({id:kind+'Base',family:'cetaceanSwimmer',archetypes:whale?['whale','broad-headed cetacean']:['dolphin','beaked cetacean'],height:2.15,scale:whale?17.5:19,groundY:50,joints,plates,clips,profile:{silhouette:whale?'broad blunt head, bulky tapered body, long pectoral flippers, small posterior dorsal, wide horizontal notched flukes':'rounded forehead, projecting slender rostrum, compact pectoral flippers, tall swept dorsal and horizontal notched flukes',locomotion:'dorsoventral body/tail pitch, increasing posterior motion and independently pitched flukes; no fish-like lateral yaw',}});
}
