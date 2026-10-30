// WildMesh Ostrich_Stylized -> separate paper ratite; all support IK is author-time.
import fs from'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{bindPositions,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';
import{curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('deer');Object.assign(r,{id:'ostrichBase',family:'ratite',archetypes:['ostrich','ratite'],heightMeters:2.3,tokenScale:21,tokenGroundY:65,profile:{silhouette:'ostrich: broad feather barrel, long thin S-neck, small head and flat bill, very long articulated legs, two forward toes, reduced folded wings and short feather tail',locomotion:'alternating long-legged walk and fast bipedal run with foot recovery, steady head carriage and brief suspension',attack:'native Attack4-informed jumping forward double-foot kick: preload, takeoff, tucked forward legs, upturned feet, wing assist, landing and recovery'},joints:[],plates:[],anchors:[],clips:{}});r.camera.framing='fixed scale with ground origin at token [50,65]';
const J=(id,parent,bind,role='limb',extra={})=>{const q={id,parent,bind,role,...extra};r.joints.push(q);return q;};
const P=(id,bone,shape,size,role='limb',extra={})=>r.plates.push({id,bone,shape,size,role,...(['head','neck'].includes(role)?{bodyRegion:role}:{}),attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});
const span=(id,a,b,width,role='limb',extra={})=>P(id,b,'capsule',[width],role,{span:[a,b],...extra});
J('root',null,[0,0,0],'root');J('pelvis','root',[0,0,1.35],'body');J('chest','pelvis',[.30,0,-.03],'body');J('neckBase','chest',[.22,0,0],'neck');J('neckLower','neckBase',[.23,0,.08],'neck');J('neckMid','neckLower',[-.015,0,.26],'neck');J('neckUpper','neckMid',[-.035,0,.32],'neck');J('head','neckUpper',[.08,0,.20],'head');J('beak','head',[.16,0,-.035],'head');
P('castShadow','root','ellipse',[1.8,.85],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});span('torsoPlate','pelvis','chest',.63,'core');P('pelvisPlate','pelvis','ellipse',[.68,.70],'core',{zBias:1.8});P('chestPlate','chest','ellipse',[.62,.57],'core');span('neckRootPlate','chest','neckBase',.20,'neck');span('neckLowerPlate','neckBase','neckLower',.13,'neck');span('neckMidPlate','neckLower','neckMid',.105,'neck');span('neckUpperPlate','neckMid','neckUpper',.09,'neck');span('headConnectorPlate','neckUpper','head',.085,'head',{occlusionMode:'under-core'});P('headPlate','head','ellipse',[.19,.22],'head');span('beakPlate','head','beak',.08,'head',{shape:'taperedBone',material:'paperShade',occlusionMode:'under-core'});P('beakTipPlate','beak','ellipse',[.05,.035],'head',{material:'paperShade'});
J('jaw','head',[.045,0,-.04],'head',{bendAxis:[0,1,0],limits:[0,24]});J('jawTip','jaw',[.105,0,-.015],'head',{helper:true});span('lowerBillPlate','jaw','jawTip',.035,'head',{shape:'taperedBone',material:'paperShade',occlusionMode:'under-core'});
J('tailBase','pelvis',[-.22,0,.025],'tail');J('tailTip','tailBase',[-.33,0,-.085],'tail');span('tailSocketPlate','pelvis','tailBase',.17,'tail',{occlusionMode:'under-core'});span('tailFanPlate','tailBase','tailTip',.30,'tail',{shape:'taperedBone',occlusionMode:'under-core'});
for(const side of ['near','far']){
 const s=side==='near'?1:-1,other=side==='near'?'far':'near';
 J(side+'Hip','pelvis',[0,s*.19,-.03],'limb',{mirror:other+'Hip',bendAxis:[0,1,0],limits:[-90,90]});J(side+'Knee',side+'Hip',[.12,0,-.30],'limb',{mirror:other+'Knee',bendAxis:[0,1,0],limits:[-155,155]});J(side+'Hock',side+'Knee',[-.11,0,-.44],'limb',{mirror:other+'Hock',bendAxis:[0,1,0],limits:[-165,165]});J(side+'Ankle',side+'Hock',[.11,0,-.48],'limb',{mirror:other+'Ankle',bendAxis:[0,1,0],limits:[-180,180]});J(side+'Toe',side+'Ankle',[.16,0,-.10],'limb',{mirror:other+'Toe'});
 span(side+'ThighPlate',side+'Hip',side+'Knee',.18,'limb',{occlusionMode:'under-core'});span(side+'CalfPlate',side+'Knee',side+'Hock',.085,'limb',{occlusionMode:'under-core'});span(side+'MetatarsalPlate',side+'Hock',side+'Ankle',.055);span(side+'InstepPlate',side+'Ankle',side+'Toe',.05,'hoof',{bone:side+'Ankle'});
 for(const[id,bind]of [[side+'ToeBase',[-.075,0,0]],[side+'MainToeTip',[.065,0,0]],[side+'SmallToeTip',[.025,s*.055,0]]])J(id,side+'Toe',bind,'limb',{helper:true});
 const outline=[[-.075,-s*.022,0],[.065,-s*.022,0],[.078,0,0],[.065,s*.018,0],[.005,s*.018,0],[.035,s*.067,0],[.012,s*.078,0],[-.075,s*.022,0]],points=outline.map((v,i)=>{const id=side+'SoleOutline'+i;J(id,side+'Toe',v,'limb',{helper:true});return id;});
 P(side+'MainToePlate',side+'Toe','polygon',[.025],'hoof',{points,material:'paperShade'});
 J(side+'WingRoot','chest',[-.12,s*.31,.025],'wing',{mirror:other+'WingRoot'});J(side+'WingTip',side+'WingRoot',[-.34,s*.025,-.20],'wing',{mirror:other+'WingTip',helper:true});P(side+'WingCovertPlate',side+'WingRoot','ellipse',[.36,.38],'wing',{bodyRegion:'wing',occlusionMode:'surface-relative',occlusionReference:'chest',semanticDetailTier:'identity'});span(side+'WingFeatherPlate',side+'WingRoot',side+'WingTip',.27,'wing',{shape:'capsule',bodyRegion:'wing',occlusionMode:'surface-relative',occlusionReference:'chest',semanticDetailTier:'identity'});
}
for(const q of r.joints.filter(j=>j.parent&&!j.helper)){const incident=r.plates.filter(p=>p.role!=='shadow'&&(p.bone===q.id||p.span?.includes(q.id)));if(incident.length)q.gasket={diameterMeters:round(Math.min(...incident.map(p=>p.size[0]))*.82)};}
const map=new Map(r.joints.map(j=>[j.id,j])),bind=bindPositions(r),feet=['nearToe','farToe'];
const chains=['near','far'].map(side=>({side,hip:map.get(side+'Knee'),knee:map.get(side+'Hock'),hock:map.get(side+'Ankle'),foot:map.get(side+'Toe')}));
// The short true thigh is separately articulated; IK solves calf + metatarsus
// with a prescribed foot pitch. This preserves the visible backward hock bend.
function distalIK(chain,origin,target,pitch){
 const{hip,knee,hock,foot}=chain,w=pitch*Math.PI/180,dist=[foot.bind[0]*Math.cos(w)+foot.bind[2]*Math.sin(w),0,-foot.bind[0]*Math.sin(w)+foot.bind[2]*Math.cos(w)],dx=target[0]-dist[0]-origin[0],dz=target[2]-dist[2]-origin[2],d=Math.hypot(dx,dz),a=Math.hypot(knee.bind[0],knee.bind[2]),b=Math.hypot(hock.bind[0],hock.bind[2]);
 if(d>a+b+1e-9||d<Math.abs(a-b)-1e-9)throw Error('Unreachable '+foot.id+' '+d+' / '+(a+b));
 const along=(a*a-b*b+d*d)/(2*d),across=-Math.sqrt(Math.max(0,a*a-along*along)),upper=[dx/d*along-dz/d*across,0,dz/d*along+dx/d*across],lower=[dx-upper[0],0,dz-upper[2]],angle=v=>Math.atan2(-v[0],-v[2])*180/Math.PI,wrap=v=>((v+180)%360+360)%360-180,H=wrap(angle(upper)-angle(knee.bind)),K=wrap(angle(lower)-angle(hock.bind)-H),A=wrap(pitch-H-K);
 return{[hip.id]:[0,H,0],[knee.id]:[0,K,0],[hock.id]:[0,A,0]};
}
function hermite(a,b,va,vb,u,length){return(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*va*length+(-2*u**3+3*u*u)*b+(u**3-u*u)*vb*length;}
function jumpZ(t){const speed=1.6/.44;if(t<.16)return curve([[0,0],[.16,-.08]],t);if(t<.28)return hermite(-.08,0,0,speed,(t-.16)/.12,.12);if(t<=.72){const u=(t-.28)/.44;return 1.6*u*(1-u);}if(t<.82)return hermite(0,-.06,-speed,0,(t-.72)/.10,.10);return curve([[.82,-.06],[1,0]],t);}
function frame(mode,time){
 const t=time===1&&mode!=='attack'?0:time,w=2*Math.PI*t,walk=mode==='walk',run=mode==='run',attack=mode==='attack',gait=walk||run,duty=walk?.625:.40,stride=walk?.52:.78;
 let z=walk?-.045-.008*(1-Math.cos(2*w))/2:run?-.085: -.004*(1-Math.cos(w))/2;
 if(run){const p=t%.5;z+=p>.40?.035*Math.sin(Math.PI*(p-.40)/.10)**2:-.012*Math.sin(Math.PI*p/.40)**2;}
 const move=[0,0,attack?jumpZ(t):z],kick=attack?curve([[0,0],[.16,0],[.28,.05],[.46,1],[.54,1],[.72,0],[1,0]],t):0;
 const rotations={pelvis:[0,run?3*Math.sin(w):walk?1.5*Math.sin(w):attack?curve([[0,0],[.16,4],[.28,0],[.46,-5],[.54,-4],[.72,3],[1,0]],t):0,0],neckBase:[0,attack?curve([[0,0],[.16,6],[.46,-6],[.54,-5],[.72,2],[1,0]],t):(gait?2:1)*Math.sin(w),0],neckLower:[0,attack?2*kick:0,0],neckMid:[0,(gait?1:0)*Math.sin(w-.4),0],head:[0,attack?4*kick:-Math.sin(w),0],jaw:[0,attack?12*kick:0,0],tailBase:[0,(gait?3:1)*Math.sin(w),0]};
 for(const[side,index]of[['near',0],['far',1]]){
  const s=side==='near'?1:-1,phase=(t+index*.5)%1,stance=phase<=duty,u=stance?phase/duty:(phase-duty)/(1-duty),x=gait?(stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2)):0;
  rotations[side+'Hip']=[0,attack?curve([[0,0],[.28,0],[.46,-65],[.54,-60],[.62,-30],[.72,0],[1,0]],t):gait?-30*x:0,0];
  rotations[side+'WingRoot']=[s*(attack?45*kick:gait?4*Math.sin(w):0),0,0];
 }
 const body=sagittalBodyPose(r,rotations,move);
 for(const[index,chain]of chains.entries()){
  const id=chain.foot.id,target=[...bind[id]],phase=(t+index*.5)%1,stance=phase<=duty,u=stance?phase/duty:(phase-duty)/(1-duty);let pitch=0;
  if(gait){target[0]+=stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2);target[2]=stance?0:(run?.32:.20)*Math.sin(Math.PI*u)**2;pitch=stance?0:18*Math.sin(Math.PI*u)**2;}
  if(attack){target[0]=curve([[0,bind[id][0]],[.28,bind[id][0]],[.38,.55],[.46,.95],[.54,.95],[.62,.65],[.72,bind[id][0]],[1,bind[id][0]]],t);target[2]=curve([[0,0],[.28,0],[.38,.60],[.46,1.80],[.54,1.75],[.62,.80],[.72,0],[1,0]],t);pitch=curve([[0,0],[.28,0],[.38,-15],[.46,-55],[.54,-55],[.62,-20],[.72,0],[1,0]],t);}
  let local;try{local=distalIK(chain,body.positions[chain.hip.id],target,pitch);}catch(e){throw Error(mode+'/'+t+': '+e.message);}local[chain.hip.id][1]-=body.angles[chain.hip.id];Object.assign(rotations,local);
  for(const q of [map.get(chain.side+'Hip'),chain.hip,chain.knee,chain.hock]){const a=rotations[q.id]?.[1]||0;if(a<q.limits[0]-1e-8||a>q.limits[1]+1e-8)throw Error(mode+'/'+t+' '+q.id+' limit '+a);}
 }
 return{t:time,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
const intervals={idle:[{ids:feet,from:0,to:1}],walk:[],run:[],attack:[{ids:feet,from:0,to:.28},{ids:feet,from:.72,to:1}]};
for(const mode of ['walk','run']){const duty=mode==='walk'?.625:.40;for(const[index,id]of feet.entries())for(const cycle of[0,1]){const from=Math.max(0,cycle-index*.5),to=Math.min(1,cycle-index*.5+duty);if(from<=to)intervals[mode].push({ids:[id],from:round(from),to:round(to)});}intervals[mode].sort((a,b)=>a.from-b.from||a.to-b.to);}
for(const[mode,duration]of Object.entries({idle:4200,walk:1980,run:900,attack:1300})){
 const samples=mode==='attack'?960:320,times=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),.12,.125,.16,.28,.38,.40,.46,.50,.54,.62,.625,.72,.82,.90,.94])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));frames[frames.length-1]={...structuredClone(frames[0]),t:1};
 r.clips[mode]={base:'bind',duration,loop:mode!=='attack',easing:'linear',frames,contactIntervals:intervals[mode],events:[],boneLengthPolicy:'preserve',motionSemantics:mode==='attack'?'Attack4-informed jumping double-foot kick: two-foot crouch, takeoff .28, high forward feet and wing assist, two-foot landing .72 and recovery':mode==='run'?'alternating long-legged run with .40 duty and brief support gaps, articulated thigh/knee/hock/ankle, raised foot recovery and reduced wing balance':mode==='walk'?'alternating long-legged walk with .625 duty, double support, bent hocks and planted stance; small head stabilization':'quiet upright ostrich, S-neck and folded reduced wings over two fixed toes'};
 if(mode==='walk'||mode==='run')r.clips[mode].events=[{t:0,name:'near-footfall'},{t:.5,name:'far-footfall'}];
 if(mode==='attack'){r.clips[mode].phases=[{id:'anticipation',from:0,peak:.16,to:.28},{id:'action',from:.28,peak:.38,to:.46},{id:'contact',from:.46,peak:.46,to:.54},{id:'recovery',from:.54,peak:.72,to:.94},{id:'settle',from:.94,peak:1,to:1}];r.clips[mode].events=[{t:.16,name:'preload',phase:'anticipation'},{t:.28,name:'takeoff',phase:'action'},{t:.46,name:'impact',phase:'contact'},{t:.54,name:'retract',phase:'recovery'},{t:.72,name:'landing',phase:'recovery'},{t:.94,name:'settled',phase:'settle'}];}
}
const model={$schema:'paper-rig/model-1',family:'ostrich',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;r.clips.idleA=r.clips.idle;delete r.clips.idle;r.clips.walkA=r.clips.walk;delete r.clips.walk;
for(const[path,obj]of[['rigs/families/ostrich.json',r],['rigs/models/ostrich.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
