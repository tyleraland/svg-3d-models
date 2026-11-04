// Author-time many-legged anatomy and metachronal support baking. Emits plain
// rigid plates and local transforms; spatial IK never enters the exported rig.
import{templateRig}from'../../rigs/family-kit.js';
import{ik}from'./spatial-leg-ik.mjs';
const round=n=>{const x=Math.round(n*1e9)/1e9;return x===0?0:x;},V=a=>a.map(round),rad=a=>a*Math.PI/180;
const add=(a,b)=>a.map((x,i)=>x+b[i]),mv=(M,v)=>M.map(r=>r.reduce((s,x,i)=>s+x*v[i],0)),mm=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,x,k)=>s+x*B[k][j],0))),I=()=>[[1,0,0],[0,1,0],[0,0,1]];
function euler(r){const[x,y,z]=r.map(rad),cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);return mm([[cz,-sz,0],[sz,cz,0],[0,0,1]],mm([[cy,0,sy],[0,1,0],[-sy,0,cy]],[[1,0,0],[0,cx,-sx],[0,sx,cx]]));}
const pulse=(t,a,b,c)=>t<=a||t>=c?0:t<b?(1-Math.cos(Math.PI*(t-a)/(b-a)))/2:(1+Math.cos(Math.PI*(t-b)/(c-b)))/2;
function periodic(v){const n=v.length-1,d=v[n]-v[0],p=v.slice(0,n).map((x,i)=>x-d*i/n);return t=>{const x=((t%1+1)%1)*n,i=Math.floor(x),u=x-i,a=p[(i+n-1)%n],b=p[i],c=p[(i+1)%n],d=p[(i+2)%n];return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);};}
export function makeSegmentedCrawlerFamily(kind,reference){
 if(!['centipede','segmentedCrawler'].includes(kind))throw Error(`Unknown crawler: ${kind}`);
 const broad=kind==='segmentedCrawler',count=broad?6:12,step=broad?.28:.20,height=broad?.31:.18,width=broad?.31:.125,bodyHeight=broad?.20:.065;
 const joints=[],plates=[],legs=[],bodyIds=[];
 const J=(id,parent,bind,role='body',extra={})=>{const j={id,parent,bind:V(bind),role,...extra};joints.push(j);return j;};
 const vertex=(id,owner,p)=>J(id,owner,p,'geometry',{helper:true}).id;
 function face(id,owner,ids,region='core',extra={}){const p=ids.map(id=>joints.find(j=>j.id===id).bind),center=p[0].map((_,k)=>p.reduce((s,p)=>s+p[k],0)/p.length),bone=J(id+'Center',owner,center,region==='head'?'head':region==='core'?'body':'limb',{helper:true}).id;plates.push({id:id+'Plate',bone,shape:'polygon',size:[.02],points:ids,bodyRegion:region,role:region==='head'?'head':region==='core'?'core':'limb',attachment:'rigid',material:'paperMain',semanticDetailTier:'silhouette',zBias:0,...extra});}
 function polygon(id,owner,ps,region,extra){face(id,owner,ps.map((p,i)=>vertex(id+'Point'+i,owner,p)),region,extra);}
 function shell(id,owner,rings,region='core'){
  const rows=rings.map(([x,w,h],k)=>Array.from({length:6},(_,i)=>vertex(id+'Ring'+k+'Point'+i,owner,[x,w*Math.cos(i*Math.PI/3),h*Math.sin(i*Math.PI/3)])));
  for(let k=0;k<rows.length-1;k++)for(let i=0;i<6;i++)face(id+'Band'+k+'Facet'+i,owner,[rows[k][i],rows[k][(i+1)%6],rows[k+1][(i+1)%6],rows[k+1][i]],region,i>=3?{role:'accent',material:'paperShade'}:{});
  face(id+'FrontCap',owner,rows[0],region);face(id+'BackCap',owner,[...rows.at(-1)].reverse(),region);
 }
 function limb(id,owner,v,r0,r1,region='limb'){
  // Limbs lie in the lateral/vertical plane at bind, so +X is a stable cross axis.
  const len=Math.hypot(...v),u=[1,0,0],w=[0,v[2]/len,-v[1]/len],ring=(label,p,r)=>Array.from({length:3},(_,i)=>{const a=i*2*Math.PI/3;return vertex(id+label+i,owner,p.map((x,k)=>x+r*(u[k]*Math.cos(a)+w[k]*Math.sin(a))));});
  // Antennae/terminal legs may have an X component. Use a general perpendicular frame.
  let rows;
  if(Math.abs(v[0])>1e-9){const z=[v[0]/len,v[1]/len,v[2]/len],seed=Math.abs(z[2])<.9?[0,0,1]:[0,1,0],a=[z[1]*seed[2]-z[2]*seed[1],z[2]*seed[0]-z[0]*seed[2],z[0]*seed[1]-z[1]*seed[0]],al=Math.hypot(...a),b=a.map(x=>x/al),c=[z[1]*b[2]-z[2]*b[1],z[2]*b[0]-z[0]*b[2],z[0]*b[1]-z[1]*b[0]];rows=(label,p,r)=>Array.from({length:3},(_,i)=>vertex(id+label+i,owner,p.map((x,k)=>x+r*(b[k]*Math.cos(i*2*Math.PI/3)+c[k]*Math.sin(i*2*Math.PI/3)))));}
  else rows=ring;
  const a=rows('Base',[0,0,0],r0);
  if(r1===0){const tip=vertex(id+'End',owner,v);for(let i=0;i<3;i++)face(id+'Facet'+i,owner,[a[i],a[(i+1)%3],tip],region);}
  else{const b=rows('End',v,r1);for(let i=0;i<3;i++)face(id+'Facet'+i,owner,[a[i],a[(i+1)%3],b[(i+1)%3],b[i]],region);face(id+'EndCap',owner,b,region);}
  face(id+'BaseCap',owner,[...a].reverse(),region);
 }
 J('root',null,[0,0,0],'root');J('body','root',[broad?.98:1.25,0,height],'body');J('head','body',[0,0,0],'head');
 shell('head','head',broad?[[.21,.14,.15],[.04,.235,.235],[-.20,.205,.20]]:[[.17,.065,.04],[.015,.14,.075],[-.15,.12,.065]],'head');
 J('noseTip','head',[broad?.21:.17,0,0],'snout',{helper:true});
 for(let i=0;i<count;i++){
  const id='segment'+String(i+1).padStart(2,'0'),parent=i?bodyIds[i-1]:'body';J(id,parent,[-(i?step:broad?.32:.19),0,0],'body');bodyIds.push(id);
  const taper=broad?1-.12*(i/(count-1)):1-.18*(i/(count-1));
  shell(id,id,broad?[[.155,width*.83*taper,bodyHeight*.80],[0,width*taper,bodyHeight],[-.16,width*.83*taper,bodyHeight*.80]]:[[.12,width*taper,bodyHeight],[-.12,width*.91*taper,bodyHeight*.9]]);
 }
 for(let pair=0;pair<12;pair++)for(const side of ['near','far']){
  const s=side==='near'?1:-1,other=s>0?'far':'near',owner=bodyIds[broad?Math.floor(pair/2):pair],prefix=side+'Leg'+String(pair+1).padStart(2,'0');
  const hip=J(prefix+'Hip',owner,[broad?(pair%2?.065:-.065):0,s*(broad?.16:width*(1-.18*pair/11)*.72),broad?-.10:-.02],'limb',{mirror:other+'Leg'+String(pair+1).padStart(2,'0')+'Hip'}),upper=broad?[0,s*.13,-.01]:[0,s*.20,.11],lower=broad?[0,s*.07,-.20]:[0,s*.18,-.27];
  const knee=J(prefix+'Knee',hip.id,upper,'limb',{mirror:other+'Leg'+String(pair+1).padStart(2,'0')+'Knee',bendAxis:[1,0,0],limits:[-150,150]}),foot=J(prefix+'Foot',knee.id,lower,'limb',{mirror:other+'Leg'+String(pair+1).padStart(2,'0')+'Foot'});
  limb(prefix+'Upper',hip.id,upper,broad?.032:.018,broad?.024:.013);limb(prefix+'Lower',knee.id,lower,broad?.025:.014,0);
  legs.push({hip,knee,foot,owner,pair,side,s});
 }
 J('tail','segment'+String(count).padStart(2,'0'),[-(broad?.17:.22),0,0],'tail');shell('tail','tail',[[.07,broad?.22:.09,broad?.16:.055],[-.14,broad?.065:.03,broad?.09:.035]],'tail');J('tailTip','tail',[-.14,0,0],'tail',{helper:true});
 for(const side of ['near','far']){
  const s=side==='near'?1:-1,other=s>0?'far':'near';J(side+'AntennaBase','head',[broad?.12:.13,s*(broad?.10:.075),broad?.13:.035],'antenna',{mirror:other+'AntennaBase'});const first=broad?[.08,s*.07,.045]:[.22,s*.085,.04],second=broad?[.055,s*.03,.02]:[.18,s*.075,.025];
  limb(side+'AntennaLower',side+'AntennaBase',first,broad?.017:.014,broad?.012:.009,'head');J(side+'AntennaMid',side+'AntennaBase',first,'antenna',{mirror:other+'AntennaMid'});limb(side+'AntennaUpper',side+'AntennaMid',second,broad?.013:.009,0,'head');J(side+'AntennaTip',side+'AntennaMid',second,'antenna',{helper:true});
  if(!broad){J(side+'Mandible','head',[.12,s*.055,-.045],'head');limb(side+'Mandible',side+'Mandible',[.13,-s*.055,-.01],.022,0,'head');J(side+'TerminalLeg','tail',[-.02,s*.055,.015],'tail');limb(side+'Terminal',side+'TerminalLeg',[-.43,s*.19,.03],.019,0,'tail');}
  polygon(side+'Eye','head',Array.from({length:6},(_,i)=>[.07+.017*Math.cos(i*Math.PI/3),s*(broad?.185:.119),.025+.017*Math.sin(i*Math.PI/3)]),'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity'});
 }
 plates.unshift({id:'castShadow',bone:'root',shape:'ellipse',size:[broad?2.2:3.6,broad?.95:.85],role:'shadow',bodyRegion:'groundShadow',attachment:'rigid',material:'shadow',zBias:-100,surfaceNormal:[0,0,1],semanticDetailTier:'texture'});
 const bind={};for(const j of joints)bind[j.id]=add(bind[j.parent]||[0,0,0],j.bind);
 const bodyCurves={};for(const mode of ['idle','walk','run'])bodyCurves[mode]=Array.from({length:12},(_,i)=>{const index=Math.round(i*17/11);return periodic(reference.centipede.clips[mode].samples.map(s=>s.body_yaw_degrees[index]-s.body_yaw_degrees[0]));});
 const feet=legs.map(l=>l.foot.id),skeleton=joints.filter(j=>!j.helper&&['root','body','head','tail','antenna'].includes(j.role));
 function frame(mode,t){const moving=mode==='walk'||mode==='run',phase=mode==='attack'||mode==='ko'?0:t,sourceMode=moving?mode:'idle',drive=mode==='attack'?pulse(t,.10,.46,.94):0,down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0;
  const move=[drive*.035,0,-down*(broad?.06:.045)],rotations={head:[0,broad?0:-drive*3,0]};let previous=0;
  for(let i=0;i<count;i++){
   const global=broad?(moving?.55:.12)*Math.sin(2*Math.PI*phase-i*.65)*(1-down):3*Math.tanh((moving?.10:.025)*bodyCurves[sourceMode][i](phase)/3)*(1-down);
   rotations[bodyIds[i]]=broad?[0,global-previous,0]:[0,0,global-previous];previous=global;
  }
  rotations.tail=broad?[0,-previous*.5,0]:[0,0,-previous*.3];
  for(const side of ['near','far']){const s=side==='near'?1:-1;rotations[side+'AntennaBase']=[0,down*25,3*s*Math.sin(2*Math.PI*phase+.4*s)-drive*s*12];rotations[side+'AntennaMid']=[0,down*15,2*s*Math.sin(2*Math.PI*phase-.4)];if(!broad){rotations[side+'Mandible']=[0,0,s*drive*32];rotations[side+'TerminalLeg']=[0,0,s*3*Math.sin(2*Math.PI*phase-.6)];}}
  const P={},M={};for(const j of skeleton){P[j.id]=j.parent?add(P[j.parent],mv(M[j.parent],j.bind)):add(j.bind,move);M[j.id]=mm(j.parent?M[j.parent]:I(),euler(rotations[j.id]||[0,0,0]));}
  for(const leg of legs){let target=[...bind[leg.foot.id]];
   if(moving){const cycles=broad?1:reference.centipede.measured_stride_cycles[mode],offset=((broad?.173-leg.pair*.10:.263-leg.pair*(17/11)*.20)+(leg.side==='far'&&!broad?.5:0)+100)%1,q=((t===1?0:t)*cycles+offset)%1,duty=broad?.74:.67,stride=broad?(mode==='run'?.075:.055):(mode==='run'?.11:.08),lift=broad?(mode==='run'?.032:.022):(mode==='run'?.07:.05);const stance=q<=duty,u=stance?q/duty:(q-duty)/(1-duty);target[0]+=stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2);target[2]=stance?0:lift*Math.sin(Math.PI*u)**2;}
   const origin=add(P[leg.owner],mv(M[leg.owner],leg.hip.bind));Object.assign(rotations,ik(leg,origin,target,M[leg.owner]));
  }
  return{t,poses:{root:V(move)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,V(v)]))};
 }
 const clips={},meta=reference.centipede.clip_metadata.clips,centiMs=mode=>{const c=meta.find(c=>c.name.toLowerCase()===mode);return Math.round(1000*c.frames/c.fps);};
 for(const[id,mode,ms,loop]of [['idleA','idle',broad?3000:centiMs('idle'),true],['walkA','walk',broad?2440:centiMs('walk'),true],['run','run',broad?1240:centiMs('run'),true],['attack','attack',broad?1400:1200,false],['ko','ko',1800,false]]){
  const moving=mode==='walk'||mode==='run',cycles=broad?1:3,duty=broad?.74:.67,intervals=[],times=new Set(Array.from({length:(moving?(broad?240:480):160)+1},(_,i)=>i/(moving?(broad?240:480):160)));
  if(moving)for(const leg of legs){const offset=((broad?.173-leg.pair*.10:.263-leg.pair*(17/11)*.20)+(leg.side==='far'&&!broad?.5:0)+100)%1;for(let k=0;k<=cycles+1;k++){const a=(k-offset)/cycles,b=(k+duty-offset)/cycles;if(b<0||a>1)continue;const from=round(Math.max(0,a)),to=round(Math.min(1,b));intervals.push({ids:[leg.foot.id],from,to});times.add(from);times.add(to);}}
  const frames=[...times].sort((a,b)=>a-b).map(t=>frame(mode,t));if(loop)frames[frames.length-1]={...structuredClone(frames[0]),t:1};
  clips[id]={base:'bind',duration:ms,easing:'linear',loop,frames,...(moving?{contactIntervals:intervals.sort((a,b)=>a.from-b.from||a.to-b.to)}:{contacts:feet}),boneLengthPolicy:'preserve',events:[],motionSemantics:moving?(broad?'Authored paired short-leg traveling support wave, two leg pairs per rounded segment; crawler slow-gait timing and  centipede support-wave comparison; baked spatial IK, grounded stance and lifted recovery':' centipede-inspired three-stride metachronal wave per native Walk/Run cycle, opposite-side phase offset and stabilized lateral trunk bend; reduced segment count and authored grounded spatial IK'):mode==='idle'?'Quiet feeler and trunk movement above fixed support feet':mode==='attack'?'Authored braced mandible/head motion and recovery; not native Bite playback':'Authored supported low settle and folded feelers; not native Death playback'};
  if(id==='attack')clips[id].events=[{t:.46,name:'impact'},{t:.94,name:'release'}];if(id==='ko')clips[id].events=[{t:1,name:'down'}];
 }
 return templateRig({id:kind+'Base',family:broad?'doublePairSegmentedCrawler':'longLeggedCentipede',archetypes:broad?['many-legged segmented crawler','broad double-pair trunk']:['centipede','slender metachronal crawler'],height:broad?.65:.5,scale:broad?31:24,groundY:50,joints,plates,clips,profile:{silhouette:broad?'six rounded barrel segments, two short walking-leg pairs per segment, compact head and feelers':'twelve flattened trunk segments with one long walking-leg pair each, long antennae, mandibles and paired trailing terminal legs',locomotion:broad?'slow paired left/right steps traveling along a broad body, short lifted recovery and shallow vertical trunk wave':'three traveling leg strides per native full cycle, alternating sides and a restrained lateral trunk wave; in-place stance sweeps',}});
}
