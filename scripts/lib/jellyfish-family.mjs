// Rigid umbrella-sector bell and source-informed pendant chains, baked at
// authoring time into ordinary paper-rig geometry and local clip transforms.
import {templateRig}from'../../rigs/family-kit.js';
const round=n=>{const v=Math.round(n*1e8)/1e8;return v===0?0:v;},V=a=>a.map(round),rad=a=>a*Math.PI/180;
const pulse=(t,a,b,c)=>t<=a||t>=c?0:t<b?(1-Math.cos(Math.PI*(t-a)/(b-a)))/2:(1+Math.cos(Math.PI*(t-b)/(c-b)))/2;
function periodic(v){const n=v.length-1,d=v[n]-v[0],p=v.slice(0,n).map((x,i)=>x-d*i/n);return t=>{const x=((t%1+1)%1)*n,i=Math.floor(x),u=x-i,a=p[(i+n-1)%n],b=p[i],c=p[(i+1)%n],d=p[(i+2)%n];return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);};}
function tangentRotation(az,angle){const a=rad(angle),ux=-Math.sin(rad(az)),uy=Math.cos(rad(az)),c=Math.cos(a),s=Math.sin(a);return V([Math.atan2(ux*s,c),Math.asin(uy*s),Math.atan2(ux*uy*(1-c),c+ux*ux*(1-c))].map(x=>x*180/Math.PI));}
export function makeJellyfishFamily(reference){
 const source=reference.models.jellyfish,joints=[],plates=[],chains=Object.entries(reference.adaptation.chainMap),lengths=[.24,.23,.21,.19];
 const angles={nearFront:22.5,nearSide:67.5,nearRear:112.5,nearBack:157.5,farFront:-22.5,farSide:-67.5,farRear:-112.5,farBack:-157.5};
 const J=(id,parent,bind,role='body',extra={})=>{joints.push({id,parent,bind:V(bind),role,...extra});return id;};
 const vertex=(id,owner,p)=>J(id,owner,p,'geometry',{helper:true});
 function face(id,owner,ids,region='core',extra={}){const ps=ids.map(id=>joints.find(j=>j.id===id).bind),center=ps[0].map((_,k)=>ps.reduce((s,p)=>s+p[k],0)/ps.length),bone=J(id+'Center',owner,center,region==='core'?'body':'tentacle',{helper:true});plates.push({id:id+'Plate',bone,points:ids,shape:'polygon',size:[.02],role:region==='core'?'core':'tentacle',bodyRegion:region,attachment:'rigid',material:'paperMain',semanticDetailTier:'silhouette',zBias:0,...extra});}
 function polygon(id,owner,points,region,extra){face(id,owner,points.map((p,i)=>vertex(id+'Point'+i,owner,p)),region,extra);}
 function pendant(id,owner,len,r0,r1,az){const ring=(label,z,r)=>Array.from({length:3},(_,i)=>{const a=rad(az)+i*2*Math.PI/3;return vertex(id+label+i,owner,[r*Math.cos(a),r*Math.sin(a),z]);});const a=ring('Top',.018,r0),b=ring('Bottom',-len-.018,r1);for(let i=0;i<3;i++)face(id+'Facet'+i,owner,[a[i],b[i],b[(i+1)%3],a[(i+1)%3]],'limb',i===2?{role:'accent',material:'paperShade'}:{});face(id+'TopCap',owner,a,'limb');face(id+'BottomCap',owner,[...b].reverse(),'limb');}
 J('root',null,[0,0,0],'root');J('body','root',[0,0,1.9],'body');J('crown','body',[0,0,.10],'body',{helper:true});
 // The small fixed cap covers the petal hinges. Each curved sector is a rigid
 // faceted shell; overlapping angular edges close the bell throughout folding.
 const capRing=Array.from({length:8},(_,i)=>vertex('crownRim'+i,'body',[.18*Math.cos(i*Math.PI/4),.18*Math.sin(i*Math.PI/4),-.035]));const capTop=vertex('crownApex','body',[0,0,.105]);
 for(let i=0;i<8;i++)face('crownFacet'+i,'body',[capTop,capRing[i],capRing[(i+1)%8]]);
 const profile=[[.065,.035],[.29,-.045],[.53,-.22],[.64,-.45]];
 for(const[name]of chains){const az=angles[name];J(name+'BellSector','body',[0,0,0],'body',{bendAxis:[-Math.sin(rad(az)),Math.cos(rad(az)),0],limits:[-38,38]});
  const ring=(label,lower)=>profile.map(([r,z],k)=>[-1,1].map((s,i)=>vertex(name+label+k+i,name+'BellSector',[r*Math.cos(rad(az+s*24.5)),r*Math.sin(rad(az+s*24.5)),z-(lower?.022:0)])));
  const upper=ring('Upper',false),lower=ring('Lower',true);
  for(let k=0;k<3;k++){face(name+'Canopy'+k,name+'BellSector',[upper[k][0],upper[k+1][0],upper[k+1][1],upper[k][1]]);face(name+'UnderCanopy'+k,name+'BellSector',[lower[k][1],lower[k+1][1],lower[k+1][0],lower[k][0]],'core',{role:'accent',material:'paperShade'});}
  for(const side of [0,1])face(name+'BellEdge'+side,name+'BellSector',[upper[0][side],lower[0][side],lower[1][side],lower[2][side],lower[3][side],upper[3][side],upper[2][side],upper[1][side]]);
  face(name+'Rim',name+'BellSector',[upper[3][0],lower[3][0],lower[3][1],upper[3][1]]);
  J(name+'BellRim',name+'BellSector',[.64*Math.cos(rad(az)),.64*Math.sin(rad(az)),-.45],'body',{helper:true});
  J(name+'Filament0',name+'BellSector',[.58*Math.cos(rad(az)),.58*Math.sin(rad(az)),-.43],'tentacle',{bendAxis:[-Math.sin(rad(az)),Math.cos(rad(az)),0],limits:[-100,100]});
  for(let i=0;i<4;i++){if(i)J(name+'Filament'+i,name+'Filament'+(i-1),[0,0,-lengths[i-1]],'tentacle',{bendAxis:[-Math.sin(rad(az)),Math.cos(rad(az)),0],limits:[-100,100]});pendant(name+'FilamentPanel'+i,name+'Filament'+i,lengths[i],[.022,.017,.012,.008][i],[.017,.012,.008,.003][i],az);}
  J(name+'FilamentTip',name+'Filament3',[0,0,-lengths[3]],'tentacle',{helper:true});
 }
 J('oralHub','body',[0,0,-.38],'body');polygon('underside','oralHub',Array.from({length:8},(_,i)=>[.22*Math.cos(i*Math.PI/4),.22*Math.sin(i*Math.PI/4),0]),'core',{role:'accent',material:'paperShade'});
 for(let arm=0;arm<4;arm++){const az=45+arm*90;for(let i=0;i<3;i++){J('oralArm'+arm+'Segment'+i,i?'oralArm'+arm+'Segment'+(i-1):'oralHub',i?[0,0,-.24]:[.10*Math.cos(rad(az)),.10*Math.sin(rad(az)),0],'tentacle',{bendAxis:[-Math.sin(rad(az)),Math.cos(rad(az)),0],limits:[-60,60]});pendant('oralArm'+arm+'Panel'+i,'oralArm'+arm+'Segment'+i,.24,[.085,.065,.038][i],[.065,.038,.012][i],az);}J('oralArm'+arm+'Tip','oralArm'+arm+'Segment2',[0,0,-.24],'tentacle',{helper:true});}
 plates.unshift({id:'castShadow',bone:'root',shape:'ellipse',size:[1.25,1.25],role:'shadow',bodyRegion:'groundShadow',attachment:'rigid',material:'shadow',zBias:-100,surfaceNormal:[0,0,1],semanticDetailTier:'texture'});
 const curves={},bob={};for(const mode of ['idle','walk','run']){curves[mode]=Object.fromEntries(chains.map(([name,src])=>[name,Array.from({length:4},(_,i)=>periodic(source.clips[mode].samples.map(s=>s.chains[src].radial_pitch_degrees[i])))]));const samples=source.clips[mode].samples;bob[mode]=periodic(samples.map(s=>(s.waist[2]-samples[0].waist[2])*.5));}
 function frame(mode,t){const loop=['idle','swim','fastSwim'].includes(mode),key=mode==='swim'?'walk':mode==='fastSwim'?'run':'idle',phase=loop?t:0,drive=mode==='attack'?pulse(t,.10,.38,.95):0,down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0;
  const beat=pulse((phase+.25)%1,0,.24,1),bellAngle=(mode==='idle'||!loop?12:mode==='fastSwim'?26:22)*beat*(1-down)+drive*15+down*28;
  const rotations={body:[0,down*15,0],oralHub:[0,0,0]};
  for(const[name]of chains){const az=angles[name];rotations[name+'BellSector']=tangentRotation(az,bellAngle);let previous=0;for(let i=0;i<4;i++){const beta=.65*curves[key][name][i](phase)*(1-down)-down*(10+i*8)-drive*(i+1)*5;const a=-beta-(i?previous:bellAngle);rotations[name+'Filament'+i]=tangentRotation(az,a);previous=-beta;}}
  for(let arm=0;arm<4;arm++){const az=45+arm*90;for(let i=0;i<3;i++){const a=(7+i*4)*Math.sin(2*Math.PI*(phase-.15-i*.11)+arm*.35)*(1-down)+down*18+drive*10;rotations['oralArm'+arm+'Segment'+i]=tangentRotation(az,a);}}
  return{t,poses:{root:V([drive*.08,0,(loop?bob[key](phase):0)+drive*.08-down*.12])},rotations:Object.fromEntries(Object.entries(rotations).map(([k,v])=>[k,V(v)]))};
 }
 const clips={};for(const[id,mode,ms,loop]of [['idleA','idle',source.clips.idle.duration_ms,true],['walkA','swim',source.clips.walk.duration_ms,true],['fastSwim','fastSwim',source.clips.run.duration_ms,true],['attack','attack',1500,false],['ko','ko',1800,false]]){
  const frames=Array.from({length:97},(_,i)=>frame(mode,i/96));if(loop){for(const field of ['poses','rotations'])for(const[j,start]of Object.entries(frames[0][field])){const next=frames[1][field][j],prev=frames[95][field][j],tangent=next.map((v,k)=>(v-prev[k])/2);frames[1][field][j]=V(start.map((v,k)=>v+tangent[k]));frames[95][field][j]=V(start.map((v,k)=>v-tangent[k]));}frames[96]={...structuredClone(frames[0]),t:1};}
  clips[id]={base:'bind',duration:ms,easing:'linear',loop,frames,contacts:[],contactIntervals:[],boneLengthPolicy:'preserve',events:[],motionSemantics:loop?'Measured jellyfish pendant-chain radial pitch and bob timing adapted to eight marginal chains; authored hinged umbrella bell pulse and inner oral-arm follow-through, no native Swim or mesh scaling':mode==='attack'?'Authored pulse burst, appendage tuck and recovery; not a native sting attack':'Authored bell closure, slight tilt and gentle sink; not native death playback'};if(id==='attack')clips[id].events=[{t:.38,name:'impact'},{t:.95,name:'release'}];if(id==='ko')clips[id].events=[{t:1,name:'down'}];
 }
 clips.swim={...structuredClone(clips.walkA),aliasOf:'walkA'};clips.run={...structuredClone(clips.fastSwim),aliasOf:'fastSwim'};
 return templateRig({id:'jellyfishBase',family:'bellPulsingMedusa',archetypes:['jellyfish','bell and trailing filaments'],height:2.15,scale:29,groundY:65,joints,plates,clips,profile:{silhouette:'rounded faceted umbrella bell, eight thin marginal chains and four thicker inner oral arms; no face, gems, beak or pincers',locomotion:'eight rigid canopy sectors contract inward, followed by measured independent trailing-chain curls; suspended body bob, no ground contacts',}});
}
