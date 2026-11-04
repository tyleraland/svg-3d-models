// animal Monkey_Stylized study -> independent paper geometry and local clips.
// All support IK is author-time only; no native mesh/action payload is copied.
import fs from 'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{bindPositions,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';
import{curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('deer');Object.assign(r,{id:'monkeyBase',family:'primate',archetypes:['monkey','primate'],heightMeters:.9,tokenScale:43,tokenGroundY:64,profile:{silhouette:'small lean monkey: long forearms, flexed hind legs, broad hands and feet, round ears, small projecting face and a long elevated hook-curled tail',locomotion:'grounded four-beat palm-and-foot walk; faster staggered quadrupedal run with a suspension interval',attack:'native Attack2-informed rear-up, two-hand overhead windup, sudden downward slam, supported recoil and quadrupedal recovery'},joints:[],plates:[],anchors:[],clips:{}});r.camera.framing='fixed scale with ground origin at token [50,64]';
const J=(id,parent,bind,role='limb',extra={})=>{const q={id,parent,bind,role,...extra};r.joints.push(q);return q;};
const P=(id,bone,shape,size,role='limb',extra={})=>r.plates.push({id,bone,shape,size,role,attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});
const span=(id,a,b,width,role='limb',extra={})=>P(id,b,'capsule',[width],role,{span:[a,b],...extra});
J('root',null,[0,0,0],'root');J('pelvis','root',[-.12,0,.34],'body');J('chest','pelvis',[.24,0,-.015],'body');J('neck','chest',[.055,0,.035],'neck');J('head','neck',[.075,0,.025],'head');J('muzzle','head',[.075,0,-.027],'head');
P('castShadow','root','ellipse',[1.02,.40],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});span('torsoPlate','pelvis','chest',.205,'core');P('pelvisPlate','pelvis','ellipse',[.22,.255],'core',{occlusionMode:'under-core'});P('chestPlate','chest','ellipse',[.20,.23],'core');span('neckPlate','chest','neck',.13,'neck');span('headConnectorPlate','neck','head',.12,'head',{occlusionMode:'under-core'});P('headPlate','head','ellipse',[.16,.18],'head');span('muzzleConnectorPlate','head','muzzle',.10,'head',{shape:'taperedBone',occlusionMode:'under-core'});P('muzzlePlate','muzzle','ellipse',[.11,.085],'head',{material:'paperLight'});
for(const[id,d]of[['chest',.16],['neck',.095],['head',.09],['muzzle',.06]])r.joints.find(j=>j.id===id).gasket={diameterMeters:d};
// Multiple short rigid tail sections retain a continuous taper and a real hook.
J('tailBase','pelvis',[-.095,0,.005],'tail');span('tailSocketPlate','pelvis','tailBase',.085,'tail',{occlusionMode:'under-core'});
const tailBinds=[[-.11,0,.015],[-.08,0,.07],[-.04,0,.14],[-.005,0,.16],[-.025,0,.14],[-.065,0,.065],[-.065,0,-.005],[-.025,0,-.06]];
for(let i=0;i<tailBinds.length;i++){const parent=i?'tail'+i:'tailBase',id='tail'+(i+1);J(id,parent,tailBinds[i],'tail',{gasket:{diameterMeters:.06-i*.006}});span('tailSegment'+(i+1)+'Plate',parent,id,.065-i*.006,'tail',{occlusionMode:'surface-relative',occlusionReference:'pelvis'});}
for(const side of ['near','far']){
 const sign=side==='near'?1:-1,other=side==='near'?'far':'near';
 J(side+'Hip','pelvis',[0,sign*.085,-.005],'limb',{mirror:other+'Hip'});J(side+'Knee',side+'Hip',[.12,0,-.14],'limb',{mirror:other+'Knee',bendAxis:[0,1,0],limits:[-145,145],gasket:{diameterMeters:.05}});J(side+'Ankle',side+'Knee',[-.10,0,-.145],'limb',{mirror:other+'Ankle',bendAxis:[0,1,0],limits:[-165,165]});J(side+'Foot',side+'Ankle',[.065,0,-.05],'limb',{mirror:other+'Foot',gasket:{diameterMeters:.035}});
 span(side+'ThighPlate',side+'Hip',side+'Knee',.09,'limb',{occlusionMode:'surface-relative',occlusionReference:'pelvis'});span(side+'ShinPlate',side+'Knee',side+'Ankle',.055);span(side+'InstepPlate',side+'Ankle',side+'Foot',.05,'hoof');P(side+'FootPlate',side+'Foot','ellipse',[.085,.045],'hoof',{material:'paperShade'});
 J(side+'Shoulder','chest',[.005,sign*.105,-.005],'limb',{mirror:other+'Shoulder'});J(side+'Elbow',side+'Shoulder',[-.07,0,-.15],'limb',{mirror:other+'Elbow',bendAxis:[0,1,0],limits:[-170,170],gasket:{diameterMeters:.04}});J(side+'Wrist',side+'Elbow',[.085,0,-.14],'limb',{mirror:other+'Wrist',bendAxis:[0,1,0],limits:[-180,180]});J(side+'Hand',side+'Wrist',[.055,0,-.03],'limb',{mirror:other+'Hand',gasket:{diameterMeters:.032}});
 span(side+'UpperArmPlate',side+'Shoulder',side+'Elbow',.065,'limb',{occlusionMode:'surface-relative',occlusionReference:'chest'});span(side+'ForearmPlate',side+'Elbow',side+'Wrist',.052,'limb',{occlusionMode:'surface-relative',occlusionReference:'chest'});span(side+'PalmPlate',side+'Wrist',side+'Hand',.055,'limb',{occlusionMode:'surface-relative',occlusionReference:'chest'});P(side+'HandPlate',side+'Hand','ellipse',[.08,.04],'limb',{material:'paperShade',occlusionMode:'surface-relative',occlusionReference:'chest'});
 J(side+'Ear','head',[-.018,sign*.085,.012],'ear',{mirror:other+'Ear'});P(side+'EarPlate',side+'Ear','ellipse',[.075,.08],'ear',{bodyRegion:'accessory',occlusionMode:'surface-relative',occlusionReference:'head',semanticDetailTier:'identity'});
}
const m=new Map(r.joints.map(j=>[j.id,j])),bind=bindPositions(r),feet=['nearFoot','farFoot'],hands=['nearHand','farHand'],all=[...feet,...hands];
const chains=['near','far'].flatMap(side=>[{hip:m.get(side+'Hip'),knee:m.get(side+'Knee'),hock:m.get(side+'Ankle'),foot:m.get(side+'Foot'),rear:true,side},{hip:m.get(side+'Shoulder'),knee:m.get(side+'Elbow'),hock:m.get(side+'Wrist'),foot:m.get(side+'Hand'),rear:false,side}]);
// Wrap local relative angles around the sagittal atan2 branch cut before limits.
function limbIK(chain,origin,target,pitch=0){
 const{hip,knee,hock,foot,rear}=chain,a=Math.hypot(knee.bind[0],knee.bind[2]),b=Math.hypot(hock.bind[0],hock.bind[2]),w=pitch*Math.PI/180,dist=[foot.bind[0]*Math.cos(w)+foot.bind[2]*Math.sin(w),0,-foot.bind[0]*Math.sin(w)+foot.bind[2]*Math.cos(w)],dx=target[0]-dist[0]-origin[0],dz=target[2]-dist[2]-origin[2],d=Math.hypot(dx,dz);
 if(d>a+b+1e-9||d<Math.abs(a-b)-1e-9)throw Error('Unreachable '+foot.id+' '+d+' / '+(a+b));
 const along=(a*a-b*b+d*d)/(2*d),across=Math.sqrt(Math.max(0,a*a-along*along))*(rear?1:-1),upper=[dx/d*along-dz/d*across,0,dz/d*along+dx/d*across],lower=[dx-upper[0],0,dz-upper[2]],angle=v=>Math.atan2(-v[0],-v[2])*180/Math.PI,wrap=v=>((v+180)%360+360)%360-180,H=wrap(angle(upper)-angle(knee.bind)),K=wrap(angle(lower)-angle(hock.bind)-H),A=wrap(pitch-H-K),rot={[hip.id]:[0,H,0],[knee.id]:[0,K,0],[hock.id]:[0,A,0]};
 for(const q of[knee,hock])if(rot[q.id][1]<q.limits[0]-1e-8||rot[q.id][1]>q.limits[1]+1e-8)throw Error(q.id+' limit '+rot[q.id][1]);return rot;
}
const offsets={nearFoot:0,farFoot:.5,nearHand:.75,farHand:.25},starts={nearFoot:0,farFoot:.12,nearHand:.38,farHand:.50},dutyWalk=.72,dutyRun=.22,takeoff=.72;
function frame(mode,time){
 const t=time===1&&mode!=='attack'?0:time,w=2*Math.PI*t,walk=mode==='walk',run=mode==='run',attack=mode==='attack';
 const root=[0,0,walk?-.035-.005*(1-Math.cos(2*w))/2:run?t<=takeoff?-.032-.015*Math.sin(Math.PI*t/takeoff)**2:-.032+.035*Math.sin(Math.PI*(t-takeoff)/(1-takeoff))**2:-.006*(1-Math.cos(w))/2];
 const rotations={pelvis:[0,run?4*Math.sin(w):walk?2*Math.sin(w):0,0],neck:[0,run?-3*Math.sin(w):walk?2*Math.sin(2*w):Math.sin(w),0],head:[0,run?2*Math.sin(w):0,0]};
 if(attack){root[0]=curve([[0,0],[.16,-.01],[.38,-.005],[.54,.035],[.64,.025],[.86,0],[1,0]],t);root[2]=curve([[0,0],[.16,-.035],[.32,-.012],[.44,-.01],[.60,-.04],[.76,-.02],[1,0]],t);rotations.pelvis=[0,curve([[0,0],[.16,-8],[.32,-52],[.44,-57],[.54,-30],[.62,5],[.76,2],[1,0]],t),0];rotations.neck=[0,curve([[0,0],[.32,12],[.44,15],[.62,-5],[1,0]],t),0];}
 const body=sagittalBodyPose(r,rotations,root);
 for(const chain of chains){const id=chain.foot.id,target=[...bind[id]];let pitch=0;
  if(walk||run){const phase=walk?(t+offsets[id])%1:(t-starts[id]+1)%1,duty=walk?dutyWalk:dutyRun,stance=phase<=duty,u=stance?phase/duty:(phase-duty)/(1-duty),stride=walk?.115:.17;
   target[0]+=(stance?(.5-u):(-.5+(1-Math.cos(Math.PI*u))/2))*stride;target[2]=stance?0:(walk?.055:.10)*Math.sin(Math.PI*u)**2;
   if(run)pitch=stance?0:12*Math.sin(Math.PI*u)**2;
  }
  if(attack&&!chain.rear){const origin=body.positions[chain.hip.id],base=bind[id],x=curve([[0,base[0]-bind[chain.hip.id][0]],[.16,.14],[.30,.15],[.42,.12],[.50,.17],[.56,.25],[.64,base[0]-.14],[.76,base[0]-.14],[1,base[0]-bind[chain.hip.id][0]]],t),z=curve([[0,base[2]-bind[chain.hip.id][2]],[.16,-.17],[.30,.20],[.42,.25],[.50,.16],[.56,-.08],[.64,-.30],[.76,-.30],[1,base[2]-bind[chain.hip.id][2]]],t);
   target[0]=origin[0]+x;target[2]=origin[2]+z;
   // At impact both palms plant at an exact fixed patch, then release for reset.
   const g=curve([[0,0],[.56,0],[.62,1],[.74,1],[.84,0],[1,0]],t);target[0]=target[0]*(1-g)+.27*g;target[2]=target[2]*(1-g);
   if(t>=.74){target[0]=curve([[.74,.27],[.88,.23],[1,base[0]]],t);target[2]=curve([[.74,0],[.86,.035],[1,0]],t);}
   pitch=curve([[0,0],[.30,-55],[.44,-75],[.54,-25],[.62,0],[1,0]],t);
  }
  let a;try{a=limbIK(chain,body.positions[chain.hip.id],target,pitch);}catch(e){throw Error(mode+'/'+t+': '+e.message);}a[chain.hip.id][1]-=body.angles[chain.hip.id];Object.assign(rotations,a);
 }
 for(let i=0;i<tailBinds.length;i++)rotations[i?'tail'+i:'tailBase']=[0,(attack&&i===0?curve([[0,0],[.32,30],[.44,32],[.62,0],[1,0]],t):0)+(walk?1.4:run?2:1)*Math.sin(w-i*.55),0];
 return{t:time,poses:{root:root.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
const intervals={idle:[{ids:all,from:0,to:1}],walk:[],run:[],attack:[{ids:feet,from:0,to:1},{ids:hands,from:0,to:0},{ids:hands,from:.62,to:.74},{ids:hands,from:1,to:1}]};
for(const id of all){for(const k of[0,1]){const from=Math.max(0,k-offsets[id]),to=Math.min(1,k-offsets[id]+dutyWalk);if(from<=to)intervals.walk.push({ids:[id],from:round(from),to:round(to)});}intervals.run.push({ids:[id],from:starts[id],to:round(starts[id]+dutyRun)});if(starts[id]===0)intervals.run.push({ids:[id],from:1,to:1});}
for(const a of Object.values(intervals))a.sort((a,b)=>a.from-b.from||a.to-b.to);
for(const[mode,duration]of Object.entries({idle:3600,walk:1980,run:900,attack:1960})){
 const samples=mode==='attack'?960:320,times=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),.12,.16,.22,.25,.28,.32,.34,.38,.42,.44,.50,.54,.56,.60,.62,.64,.72,.74,.76,.84,.86])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));
 // Choose continuous Euler representations for interpolated local rotations.
 for(let i=1;i<frames.length;i++)for(const[id,v]of Object.entries(frames[i].rotations))for(let axis=0;axis<3;axis++){const prev=frames[i-1].rotations[id]?.[axis]||0;while(v[axis]-prev>180)v[axis]-=360;while(v[axis]-prev< -180)v[axis]+=360;}
 frames[frames.length-1]={...structuredClone(frames[0]),t:1};
 r.clips[mode]={base:'bind',duration,loop:mode!=='attack',easing:'linear',frames,contactIntervals:intervals[mode],boneLengthPolicy:'preserve',motionSemantics:mode==='walk'?'four-beat quadrupedal palm/foot cycle, .72 duty factor; uniform backward stance and raised recovery':mode==='run'?'staggered hind/hind/hand/hand support followed by .72-1 suspension; whole-limb articulation and tail counterbalance':mode==='attack'?'rear onto planted hind feet, lift both hands overhead, sudden downward slam, palms contact .62-.74, release and four-contact recovery':'four planted contacts, quiet body breathing and propagated tail sway',events:[]};
 if(mode==='walk')r.clips[mode].events=[{t:0,name:'near-hind-step'},{t:.25,name:'near-hand-step'},{t:.5,name:'far-hind-step'},{t:.75,name:'far-hand-step'}];
 if(mode==='run')r.clips[mode].events=[{t:0,name:'hind-contact'},{t:.38,name:'hand-contact'},{t:.72,name:'takeoff'},{t:.86,name:'apex'}];
 if(mode==='attack'){r.clips[mode].phases=[{id:'anticipation',from:0,peak:.16,to:.32},{id:'action',from:.32,peak:.44,to:.62},{id:'contact',from:.62,peak:.62,to:.74},{id:'recovery',from:.74,peak:.84,to:.94},{id:'settle',from:.94,peak:.97,to:1}];r.clips[mode].events=[{t:.16,name:'crouch',phase:'anticipation'},{t:.42,name:'overhead-windup',phase:'action'},{t:.62,name:'impact',phase:'contact'},{t:.74,name:'release',phase:'contact'},{t:.97,name:'settled',phase:'settle'}];}
}
const model={$schema:'paper-rig/model-1',family:'monkey',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;r.clips.idleA=r.clips.idle;delete r.clips.idle;r.clips.walkA=r.clips.walk;delete r.clips.walk;
for(const[path,obj]of[['rigs/families/monkey.json',r],['rigs/models/monkey.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
