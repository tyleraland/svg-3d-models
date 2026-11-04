// Raw-family authoring upgrade preserving the original lobster IDs. Spatial IK
// and motion composition are baked here; consumers receive ordinary clips.
import{templateRig}from'../../rigs/family-kit.js';import{core}from'../../packages/compiler/index.js';import{ik,angles}from'./spatial-leg-ik.mjs';
const round=n=>Math.abs(n)<1e-10?0:Math.round(n*1e9)/1e9,V=a=>a.map(round),mv=(M,v)=>M.map(r=>r.reduce((s,x,i)=>s+x*v[i],0)),mm=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,x,k)=>s+x*B[k][j],0))),tr=M=>M[0].map((_,i)=>M.map(r=>r[i]));
const pulse=(t,a,b,c)=>t<=a||t>=c?0:t<b?(1-Math.cos(Math.PI*(t-a)/(b-a)))/2:(1+Math.cos(Math.PI*(t-b)/(c-b)))/2;
function curve(keys,t){for(let i=0;i<keys.length-1;i++)if(t>=keys[i][0]&&t<=keys[i+1][0]){const[a,x]=keys[i],[b,y]=keys[i+1],u=(t-a)/(b-a),s=u*u*(3-2*u);return x+(y-x)*s;}return keys.at(-1)[1];}
export function makeLobsterFamily(baseline,reference){
 const joints=structuredClone(baseline.joints),byId=new Map(joints.map(j=>[j.id,j])),oldOrder=new Map(baseline.plates.map((p,i)=>[p.id,i])),plates=new Array(baseline.plates.length),extra=[];
 const set=(id,fields)=>Object.assign(byId.get(id),fields),J=(id,parent,bind,role='body',more={})=>{if(byId.has(id))throw Error('Duplicate joint '+id);const j={id,parent,bind:V(bind),role,...more};joints.push(j);byId.set(id,j);return j;};
 const put=p=>{if(oldOrder.has(p.id))plates[oldOrder.get(p.id)]=p;else extra.push(p);};
 function face(id,owner,points,region='core',more={}){const center=points[0].map((_,k)=>points.reduce((s,p)=>s+p[k],0)/points.length),bone=J(id+'Center',owner,center,region==='head'?'head':region==='core'?'body':'limb',{helper:true}).id,ids=points.map((p,i)=>J(id+'Point'+i,owner,p,'geometry',{helper:true}).id);put({id,bone,shape:'polygon',size:[.02],points:ids,role:region==='head'?'head':region==='core'?'core':'limb',bodyRegion:region,attachment:'rigid',material:'paperMain',semanticDetailTier:'silhouette',zBias:0,...more});}
 function shell(id,owner,front,back,region='core'){
  const ring=([x,w,h])=>Array.from({length:6},(_,i)=>[x,w*Math.cos(i*Math.PI/3),h*Math.sin(i*Math.PI/3)]),a=ring(front),b=ring(back);
  for(let i=0;i<6;i++)face(i===1?id:id+'Facet'+i,owner,[a[i],a[(i+1)%6],b[(i+1)%6],b[i]],region,i>=3?{role:'accent',material:'paperShade'}:{});face(id+'FrontCap',owner,a,region);face(id+'BackCap',owner,[...b].reverse(),region);
 }
 function slab(id,owner,outline,region='head',thickness=.04){const a=outline.map(p=>[p[0],p[1],p[2]+thickness/2]),b=outline.map(p=>[p[0],p[1],p[2]-thickness/2]);face(id,owner,a,region);face(id+'Lower',owner,[...b].reverse(),region,{role:'accent',material:'paperShade'});for(let i=0;i<a.length;i++)face(id+'Edge'+i,owner,[a[i],b[i],b[(i+1)%a.length],a[(i+1)%a.length]],region);}
 function limb(id,owner,v,r0,r1,region='limb'){
  const len=Math.hypot(...v),z=v.map(x=>x/len),seed=Math.abs(z[2])<.9?[0,0,1]:[0,1,0],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],u0=cross(z,seed),u=u0.map(x=>x/Math.hypot(...u0)),w=cross(z,u),ring=(p,r)=>Array.from({length:3},(_,i)=>p.map((x,k)=>x+r*(u[k]*Math.cos(i*2*Math.PI/3)+w[k]*Math.sin(i*2*Math.PI/3))));const a=ring([0,0,0],r0),b=ring(v,r1);
  for(let i=0;i<3;i++)face(i===0?id:id+'Facet'+i,owner,r1?[a[i],a[(i+1)%3],b[(i+1)%3],b[i]]:[a[i],a[(i+1)%3],v],region);face(id+'BaseCap',owner,[...a].reverse(),region);if(r1)face(id+'EndCap',owner,b,region);
 }
 set('abdomen',{bind:[-.30,0,.24]});set('thorax',{bind:[.36,0,0]});set('head',{bind:[.31,0,.015]});set('tailBase',{bind:[-.31,0,0]});set('tailMid',{bind:[-.23,0,-.005]});
 // A new distal articulation precedes the retained fan IDs.
 const tailEnd={id:'tailEnd',parent:'tailMid',bind:[-.18,0,-.005],role:'tail',bendAxis:[0,1,0],limits:[-100,100]};const insertion=joints.findIndex(j=>j.id==='leftTailFan');joints.splice(insertion,0,tailEnd);byId.set(tailEnd.id,tailEnd);
 for(const side of ['left','right'])set(side+'TailFan',{parent:'tailEnd',bind:[-.12,side==='left'?.075:-.075,0]});
 put({id:'castShadow',bone:'root',shape:'ellipse',size:[2.35,1.0],role:'shadow',bodyRegion:'groundShadow',attachment:'rigid',material:'shadow',zBias:-100,surfaceNormal:[0,0,1],semanticDetailTier:'texture'});
 shell('abdomenPlate','abdomen',[.16,.205,.12],[-.34,.17,.105]);shell('thoraxPlate','thorax',[.24,.17,.13],[-.24,.225,.14]);shell('headPlate','head',[.20,.085,.065],[-.12,.18,.12],'head');shell('tailBasePlate','tailBase',[.10,.18,.11],[-.17,.145,.09],'tail');shell('tailMidPlate','tailMid',[.085,.145,.09],[-.14,.115,.065],'tail');shell('tailEndPlate','tailEnd',[.075,.115,.065],[-.12,.085,.045],'tail');
 for(const side of ['left','right']){const s=side==='left'?1:-1;slab(side+'TailFanPlate',side+'TailFan',[[.04,-s*.04,0],[-.13,s*.12,.012],[-.27,s*.17,0],[-.29,-s*.015,-.005],[-.12,-s*.07,0]],'tail',.022);}
 J('telson','tailEnd',[-.12,0,0],'tail');slab('telsonPlate','telson',[[.04,-.06,0],[-.25,-.075,0],[-.30,0,0],[-.25,.075,0],[.04,.06,0]],'tail',.025);
 const legs=[];
 for(const side of ['left','right']){const s=side==='left'?1:-1;
  for(let i=1;i<=4;i++){const prefix=side+'Leg'+i,fan=[.24,.08,-.08,-.24][i-1],hip=byId.get(prefix+'Hip'),knee=byId.get(prefix+'Knee'),foot=byId.get(prefix+'Foot');set(hip.id,{bind:[fan,s*[.115,.135,.15,.155][i-1],-.04]});set(knee.id,{bind:[fan*.18,s*.19,0],limits:[-100,150]});set(foot.id,{bind:[-fan*.10,s*.11,-.20]});limb(prefix+'UpperPlate',hip.id,knee.bind,.028,.019);limb(prefix+'LowerPlate',knee.id,foot.bind,.021,0);face(prefix+'FootPlate',foot.id,[[.035,0,0],[-.02,.015,0],[-.02,-.015,0]],'limb',{semanticDetailTier:'identity'});legs.push({side,i,hip,knee,foot,phase:((i-1+(side==='right'?1:0))%2)*.5});}
  set(side+'ClawShoulder',{bind:[.015,s*.115,-.01]});set(side+'ClawElbow',{bind:[.20,s*.14,-.04]});set(side+'Claw',{bind:[.22,-s*.02,-.02]});limb(side+'ClawUpperPlate',side+'ClawShoulder',byId.get(side+'ClawElbow').bind,.052,.043,'head');limb(side+'ClawForePlate',side+'ClawElbow',byId.get(side+'Claw').bind,.043,.055,'head');
  slab(side+'ClawPlate',side+'Claw',[[-.11,-.09,0],[.075,-.11,0],[.16,-.055,0],[.12,.10,0],[-.10,.10,0]],'head',.085);
  J(side+'ClawFixedBase',side+'Claw',[.10,-s*.07,0],'claw');J(side+'ClawMovingBase',side+'Claw',[.06,s*.09,0],'claw',{bendAxis:[0,0,1],limits:[-50,50]});
  slab(side+'ClawFixedPlate',side+'ClawFixedBase',[[0,-s*.035,0],[.20,-s*.03,0],[.27,s*.015,0],[.20,s*.055,0],[.13,s*.025,0],[0,s*.035,0]],'head',.06);
  slab(side+'ClawMovingPlate',side+'ClawMovingBase',[[0,-s*.035,0],[.20,s*.035,0],[.342,s*.017,0],[.20,-s*.065,0],[.14,-s*.015,0],[0,s*.035,0]],'head',.055);
  J(side+'ClawFixedTip',side+'ClawFixedBase',[.27,s*.015,0],'claw',{helper:true});J(side+'ClawMovingTip',side+'ClawMovingBase',[.342,s*.017,0],'claw',{helper:true});
  set(side+'AntennaBase',{bind:[.10,s*.07,.035]});const mid=J(side+'AntennaMid',side+'AntennaBase',[.26,s*.08,.03],'antenna');const tip=byId.get(side+'AntennaTip');set(tip.id,{parent:mid.id,bind:[.28,s*.08,.01]});
  // Move the new parent ahead of the retained tip in topological order.
  joints.splice(joints.indexOf(mid),1);joints.splice(joints.indexOf(tip),0,mid);
  limb(side+'AntennaPlate',side+'AntennaBase',mid.bind,.014,.009,'head');limb(side+'AntennaUpperPlate',mid.id,tip.bind,.009,0,'head');
  J(side+'EyeBase','head',[.04,s*.085,.045],'head');J(side+'EyeTip',side+'EyeBase',[.04,s*.015,.10],'head',{helper:true});limb(side+'EyeStalkPlate',side+'EyeBase',[.04,s*.015,.10],.016,.022,'head');shell(side+'EyePlate',side+'EyeTip',[.025,.026,.026],[-.025,.026,.026],'head');
 }
 if(plates.filter(Boolean).length!==baseline.plates.length)throw Error('An original lobster plate was not preserved');
 const anchors=structuredClone(baseline.anchors);anchors.find(a=>a.id==='tailFanAnchor').bone='tailEnd';
 const r=templateRig({id:baseline.id,family:baseline.family,archetypes:baseline.archetypes,height:.55,scale:25,groundY:52,joints,plates:[...plates,...extra],anchors,clips:{},profile:{silhouette:'elongated closed carapace, four walking-leg pairs, segmented articulated abdomen and three-lobed tail fan, long jointed antennae and two forward hinged pincers',locomotion:'crustacean native Walk/Run rhythm and repeated stride counts adapted to eight grounded walking feet; in-place alternating tetrapod support',}});
 const bind={};for(const j of joints)bind[j.id]=j.parent?j.bind.map((v,k)=>bind[j.parent][k]+v):[...j.bind];const feet=legs.map(l=>l.foot.id),source=reference.models.crustacean;
 function frame(mode,t){const loop=['idle','walk','run'].includes(mode),phase=loop?(t===1?0:t):0,w=2*Math.PI*phase,moving=mode==='walk'||mode==='run',strike=mode==='attack',down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0,u=mode==='tailFlip'?Math.max(0,Math.min(1,(t-.18)/.64)):0,h=mode==='tailFlip'&&t>.18&&t<.82?Math.sin(Math.PI*u)**2:0;
  const move=[0,0,-down*.04-(loop?.006*(1-Math.cos(w))/2:0)];const rotations={root:[0,0,0],abdomen:[0,loop?.6*Math.sin(w):0,0],thorax:[0,0,0],head:[0,0,0],tailBase:[0,-45*h+down*12+(loop?1.2*Math.sin(w):0),0],tailMid:[0,-65*h+down*8+(loop?1.5*(Math.sin(w-.4)-Math.sin(-.4)):0),0],tailEnd:[0,-50*h+(loop?1.5*(Math.sin(w-.8)-Math.sin(-.8)):0),0],leftTailFan:[h*10,0,0],rightTailFan:[-h*10,0,0],telson:[0,0,0]};
  // Each arm reaches horizontally, pinches at full extension, then retracts
  // before the opposite arm begins. No paired downward slam or inward clap.
  for(const side of ['left','right']){const s=side==='left'?1:-1,offset=side==='left'?0:.5,q=t-offset,end=1-offset,hold=.92-offset;
   const arm=keys=>q<0?0:curve(keys.filter((k,i,a)=>!i||k[0]!==a[i-1][0]),q);
   rotations[side+'ClawShoulder']=[0,strike?0:(loop?2*Math.sin(w):0),strike?s*arm([[0,0],[.12,50],[.24,-15],[.34,-15],[.42,50],[hold,50],[end,0]]):0];
   rotations[side+'ClawElbow']=[0,0,strike?s*arm([[0,0],[.12,-85],[.24,20],[.34,20],[.42,-85],[hold,-85],[end,0]]):0];
   rotations[side+'ClawMovingBase']=[0,0,strike?s*arm([[0,0],[.12,20],[.24,20],[.28,-28],[.42,-28],[.48,0],[end,0]]):s*(loop?-4+4*Math.cos(w):down*8)];
   rotations[side+'AntennaBase']=[0,down*15,s*(loop?3*Math.sin(w):0)];rotations[side+'AntennaMid']=[0,down*10,s*(loop?2*(Math.sin(w-.3)-Math.sin(-.3)):0)];}

  const poses={root:V(move)},sample={t:0,poses,rotations},body=core.solvePose({...r,clips:{pose:{frames:[sample]}}},0,'pose');
  for(const leg of legs){let target=[...bind[leg.foot.id]];
   if(moving){const cycles=source.measured_stride_cycles[mode],q=(cycles*phase+leg.phase)%1,duty=mode==='run'?.60:.70,stride=mode==='run'?.15:.12,lift=mode==='run'?.065:.045,stance=q<=duty,a=stance?q/duty:(q-duty)/(1-duty);target[0]+=stance?stride*(.5-a):stride*(-.5+(1-Math.cos(Math.PI*a))/2);target[2]=stance?0:lift*Math.sin(Math.PI*a)**2;}
   const local=ik(leg,body.positions[leg.hip.id],target,body.rotations.thorax);Object.assign(rotations,local);const global=mm(body.rotations.thorax,mm(core.euler(local[leg.hip.id]),core.euler(local[leg.knee.id])));rotations[leg.foot.id]=angles(tr(global));
  }
  return{t,poses,rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,V(v)]))};
 }
 for(const[id,mode,ms,loop]of [['idleA','idle',source.clips.idle.duration_ms,true],['walkA','walk',source.clips.walk.duration_ms,true],['run','run',source.clips.run.duration_ms,true],['attack','attack',2200,false],['tailFlip','tailFlip',1700,true],['ko','ko',1700,false]]){
  const moving=mode==='walk'||mode==='run',cycles=moving?source.measured_stride_cycles[mode]:1,duty=mode==='run'?.60:.70,N=moving?cycles*160:240,times=new Set(Array.from({length:N+1},(_,i)=>i/N)),intervals=[];
  if(moving)for(const leg of legs)for(let k=0;k<=cycles;k++){const a=(k-leg.phase)/cycles,b=(k+duty-leg.phase)/cycles;if(b<0||a>1)continue;const from=round(Math.max(0,a)),to=round(Math.min(1,b));intervals.push({ids:[leg.foot.id],from,to});times.add(from);times.add(to);}
  if(mode==='tailFlip')for(const t of [.18,.50,.82])times.add(t);
  if(mode==='attack')for(const t of [.12,.24,.28,.34,.42,.48,.50,.62,.74,.78,.84,.92,.98])times.add(t);
  const frames=[...times].sort((a,b)=>a-b).map(t=>frame(mode,t));if(loop)frames[frames.length-1]={...structuredClone(frames[0]),t:1};
  r.clips[id]={base:'bind',duration:ms,easing:'linear',loop,frames,...(moving?{contactIntervals:intervals.sort((a,b)=>a.from-b.from||a.to-b.to)}:{contacts:mode==='tailFlip'?[]:feet}),boneLengthPolicy:'preserve',events:[],motionSemantics:moving?'crustacean native cadence and stride repetition adapted to eight feet with baked spatial IK, constant backward stance and lifted forward recovery':mode==='idle'?'Quiet antenna, pincer, tail and body motion over eight fixed supports':mode==='attack'?'Alternating horizontal reach, pinch at full extension and retract; opposite claw holds its rest or retracted guard posture until its turn':mode==='tailFlip'?'In-place aquatic tail tuck/release with fixed root and limbs; no body translation, jump, takeoff or landing; authored swimming demonstration':'Authored supported crouch and appendage relaxation; no native death playback'};
  if(mode==='attack')r.clips[id].events=[{t:.12,name:'left-windup'},{t:.24,name:'left-extend'},{t:.28,name:'left-pinch'},{t:.42,name:'left-retract'},{t:.62,name:'right-windup'},{t:.74,name:'right-extend'},{t:.78,name:'right-pinch'},{t:.92,name:'right-retract'}];if(mode==='tailFlip')r.clips[id].events=[{t:.18,name:'tail-flex-start'},{t:.50,name:'tail-tuck'},{t:.82,name:'tail-release'}];if(mode==='ko')r.clips[id].events=[{t:1,name:'down'}];
 }
 return r;
}
