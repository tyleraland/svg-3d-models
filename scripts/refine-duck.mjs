// animal Duck reference -> separate paper waterfowl. IK runs only at author time.
import fs from'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{core}from'@paper-rig/compiler';
import{polygon}from'./lib/grounded-species.mjs';
import{bindPositions,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';
import{curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('deer');Object.assign(r,{id:'duckBase',family:'waterfowl',archetypes:['duck','waterfowl'],heightMeters:.41,tokenScale:76,tokenGroundY:60,profile:{silhouette:'duck: compact broad feather barrel, shorter curved neck, rounded head and broad flat spatulate bill, short articulated legs, webbed feet and long folded wings',locomotion:'alternating short-legged waddling walk; faster longer running steps with lowered neck and brief suspension',attack:'authored braced neck lunge and snapping bite, guided by native grazing neck and jaw articulation; no native combat action'},joints:[],plates:[],anchors:[],clips:{}});r.camera.framing='fixed scale with ground origin at token [50,60]';
const J=(id,parent,bind,role='limb',extra={})=>{const q={id,parent,bind,role,...extra};r.joints.push(q);return q;};
const P=(id,bone,shape,size,role='limb',extra={})=>r.plates.push({id,bone,shape,size,role,...(['head','neck'].includes(role)?{bodyRegion:role}:{}),attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});
const span=(id,a,b,width,role='limb',extra={})=>P(id,b,'capsule',[width],role,{span:[a,b],...extra});
J('root',null,[0,0,0],'root');J('pelvis','root',[0,0,.269],'body');J('chest','pelvis',[.13,0,.031],'body');J('neckBase','chest',[.135,0,.038],'neck');J('neckLower','neckBase',[.016,0,.055],'neck');J('neckMid','neckLower',[.016,0,.040],'neck');J('head','neckMid',[-.014,0,.045],'head');J('beak','head',[.105,0,-.018],'head',{helper:true});
P('castShadow','root','ellipse',[.92,.42],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});span('torsoPlate','pelvis','chest',.25,'core');P('pelvisPlate','pelvis','ellipse',[.34,.255],'core',{zBias:1.8});P('chestPlate','chest','ellipse',[.27,.275],'core');span('neckRootPlate','chest','neckBase',.115,'neck');span('neckLowerPlate','neckBase','neckLower',.082,'neck');span('neckMidPlate','neckLower','neckMid',.064,'neck');span('headConnectorPlate','neckMid','head',.062,'head',{occlusionMode:'under-core'});P('headPlate','head','ellipse',[.13,.105],'head');
// One rounded upper bill, with its root buried inside the skull.
J('billBase','head',[.015,0,-.014],'head',{helper:true});
span('beakPlate','billBase','beak',.035,'head',{bone:'head',material:'paperShade',occlusionMode:'under-core'});
const billTipPoints=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,id='billTipRim'+i;J(id,'beak',[0,.038*Math.cos(a),.0125*Math.sin(a)],'head',{helper:true});return id;});P('billTipPlate','beak','polygon',[.060,.025],'head',{points:billTipPoints,material:'paperShade',occlusionMode:'surface-relative',occlusionReference:'head',semanticDetailTier:'identity'});
J('jaw','head',[.01,0,-.018],'head',{bendAxis:[0,1,0],limits:[0,24]});J('jawTip','jaw',[.093,0,-.014],'head',{helper:true});span('lowerBillPlate','jaw','jawTip',.018,'head',{bone:'jaw',shape:'taperedBone',material:'paperShade',occlusionMode:'under-core'});
J('tailBase','pelvis',[-.10,0,0],'tail');J('tailTip','tailBase',[-.18,0,.04],'tail',{helper:true});span('tailSocketPlate','pelvis','tailBase',.10,'tail',{occlusionMode:'under-core'});span('tailFanPlate','tailBase','tailTip',.12,'tail',{shape:'taperedBone',occlusionMode:'under-core'});
for(const side of ['near','far']){
 const s=side==='near'?1:-1,other=side==='near'?'far':'near';
 J(side+'Hip','pelvis',[0,s*.074,-.009],'limb',{mirror:other+'Hip',bendAxis:[0,1,0],limits:[-90,90]});J(side+'Knee',side+'Hip',[.086,0,-.044],'limb',{mirror:other+'Knee',bendAxis:[0,1,0],limits:[-155,155]});J(side+'Hock',side+'Knee',[-.035,0,-.12],'limb',{mirror:other+'Hock',bendAxis:[0,1,0],limits:[-165,165]});J(side+'Ankle',side+'Hock',[.034,0,-.056],'limb',{mirror:other+'Ankle',bendAxis:[0,1,0],limits:[-180,180]});J(side+'Toe',side+'Ankle',[.024,0,-.04],'limb',{mirror:other+'Toe'});
 span(side+'ThighPlate',side+'Hip',side+'Knee',.065,'limb',{occlusionMode:'under-core'});span(side+'CalfPlate',side+'Knee',side+'Hock',.027);span(side+'MetatarsalPlate',side+'Hock',side+'Ankle',.023);span(side+'InstepPlate',side+'Ankle',side+'Toe',.022,'hoof',{bone:side+'Ankle',material:'paperShade'});
 const web=[[-.025,-.015,0],[.055,-.047,0],[.075,-.045,0],[.056,-.019,0],[.09,0,0],[.056,.019,0],[.075,.045,0],[.055,.047,0],[-.025,.015,0]];
 const points=web.map((p,i)=>{const id=side+'Web'+i;J(id,side+'Toe',[p[0],p[1],.006],'limb',{helper:true});return id;});
 P(side+'WebbedFootPlate',side+'Toe','polygon',[.015],'hoof',{points,material:'paperShade',semanticDetailTier:'identity'});
 const edge=[[-.015,0,0],[.070,0,0],[.070,0,.006],[-.015,0,.006]].map((p,i)=>{const id=side+'SoleEdge'+i;J(id,side+'Toe',p,'limb',{helper:true});return id;});P(side+'SoleEdgePlate',side+'Toe','polygon',[.006],'hoof',{points:edge,material:'paperShade'});
 J(side+'WingRoot','chest',[-.015,s*.125,.025],'wing',{mirror:other+'WingRoot'});J(side+'WingElbow',side+'WingRoot',[-.15,s*.010,0],'wing',{mirror:other+'WingElbow'});J(side+'WingWrist',side+'WingElbow',[.12,s*.010,-.004],'wing',{mirror:other+'WingWrist'});J(side+'WingTip',side+'WingWrist',[-.20,s*.010,-.015],'wing',{mirror:other+'WingTip',helper:true});
 const panel=(id,owner,outline)=>{const points=outline.map((p,i)=>{const n=side+id+'V'+i;J(n,side+owner,p,'wing',{helper:true});return n;});const center=side+id+'Center';J(center,side+owner,[0,1,2].map(k=>outline.reduce((sum,p)=>sum+p[k],0)/outline.length),'wing',{helper:true});P(side+id+'Plate',center,'polygon',[.02],'wing',{points,bodyRegion:'wing',occlusionMode:'surface-relative',occlusionReference:'chest',semanticDetailTier:'identity'});};
 J(side+'CovertFront',side+'WingRoot',[.02,0,.005],'wing',{helper:true});J(side+'CovertBack',side+'WingRoot',[-.27,0,-.035],'wing',{helper:true});J(side+'CovertCenter',side+'WingRoot',[-.125,0,-.015],'wing',{helper:true});span(side+'WingCovertPlate',side+'CovertFront',side+'CovertBack',.14,'wing',{bone:side+'CovertCenter',bodyRegion:'wing',occlusionMode:'surface-relative',occlusionReference:'chest',semanticDetailTier:'identity',zBias:1});
 panel('WingFeather','WingRoot',[[0,0,.005],[-.15,s*.010,.005],[-.15,-s*.17,-.007],[-.01,-s*.17,-.007]]);
 panel('WingSecondary','WingElbow',[[0,0,.005],[.12,s*.010,.001],[.12,s*.16,-.008],[0,s*.15,-.008]]);
 panel('WingPrimary','WingWrist',[[0,0,.005],[-.20,s*.010,-.015],[-.225,-s*.040,-.018],[-.18,-s*.085,-.018],[-.205,-s*.125,-.018],[-.13,-s*.17,-.014],[.015,-s*.15,-.007]]);

}
polygon(r,'billTopPlate','head',[[.012,-.023,-.012],[.080,-.039,-.012],[.115,-.033,-.012],[.124,0,-.012],[.115,.033,-.012],[.080,.039,-.012],[.012,.023,-.012]],'head',{material:'paperShade',occlusionMode:'under-core'});
// Uniform specimen scale precedes the author-time solver. Neck proportions above
// are independently shortened; Goose's source and emitted clips stay unchanged.
for(const q of r.joints)q.bind=q.bind.map(v=>v*.8);for(const p of r.plates)p.size=p.size.map(v=>v*.8);
for(const p of r.plates.filter(p=>p.role==='neck'||p.id==='headConnectorPlate'))p.jointOverlap=1.7;
for(const q of r.joints.filter(j=>j.parent&&!j.helper)){const incident=r.plates.filter(p=>p.role!=='shadow'&&(p.bone===q.id||p.span?.includes(q.id)));if(incident.length)q.gasket={diameterMeters:round(Math.min(...incident.map(p=>p.size[0]))*.82)};}
const map=new Map(r.joints.map(j=>[j.id,j])),bind=bindPositions(r),feet=['nearToe','farToe'];
const chains=['near','far'].map(side=>({side,hip:map.get(side+'Knee'),knee:map.get(side+'Hock'),hock:map.get(side+'Ankle'),foot:map.get(side+'Toe')}));
function distalIK(chain,origin,target,pitch){
 const{hip,knee,hock,foot}=chain,w=pitch*Math.PI/180,dist=[foot.bind[0]*Math.cos(w)+foot.bind[2]*Math.sin(w),0,-foot.bind[0]*Math.sin(w)+foot.bind[2]*Math.cos(w)],dx=target[0]-dist[0]-origin[0],dz=target[2]-dist[2]-origin[2],d=Math.hypot(dx,dz),a=Math.hypot(knee.bind[0],knee.bind[2]),b=Math.hypot(hock.bind[0],hock.bind[2]);
 if(d>a+b+1e-9||d<Math.abs(a-b)-1e-9)throw Error('Unreachable '+foot.id+' '+d+' / '+(a+b));
 const along=(a*a-b*b+d*d)/(2*d),across=-Math.sqrt(Math.max(0,a*a-along*along)),upper=[dx/d*along-dz/d*across,0,dz/d*along+dx/d*across],lower=[dx-upper[0],0,dz-upper[2]],angle=v=>Math.atan2(-v[0],-v[2])*180/Math.PI,wrap=v=>((v+180)%360+360)%360-180,H=wrap(angle(upper)-angle(knee.bind)),K=wrap(angle(lower)-angle(hock.bind)-H),A=wrap(pitch-H-K);
 return{[hip.id]:[0,H,0],[knee.id]:[0,K,0],[hock.id]:[0,A,0]};
}
function frame(mode,time){
 const t=time===1?0:time,w=2*Math.PI*t,walk=mode==='walk',run=mode==='run',attack=mode==='attack',gait=walk||run,duty=walk?.65:.42,stride=walk?.076:.128;
 const thrust=attack?curve([[0,0],[.28,-.18],[.36,-.18],[.46,1],[.53,1],[.76,0],[1,0]],t):0;
 const move=[0,gait?(run?.0024:.0056)*Math.cos(w):0,attack?-.0072*thrust:walk?-.0072-.0024*(1-Math.cos(2*w))/2:run?-.0216+.0056*(1-Math.cos(2*w))/2:-.0008*(1-Math.cos(w))/2];
 const nod=gait?(run?3:2)*Math.sin(w):Math.sin(w),rotations={pelvis:[0,gait?(run?2:1)*Math.sin(w):attack?2*thrust:0,0],neckBase:[0,run?22+nod:attack?24*thrust:nod,0],neckLower:[0,run?18:attack?35*thrust:0,0],neckMid:[0,run?-8:attack?-10*thrust:0,0],head:[0,run?-32-nod:attack?-38*thrust:-nod,0],jaw:[0,attack?curve([[0,0],[.32,0],[.42,22],[.46,22],[.51,0],[1,0]],t):0,0],tailBase:[0,(gait?2:.5)*Math.sin(w),0]};
 for(const[side,index]of[['near',0],['far',1]]){
  const s=side==='near'?1:-1,phase=(t+index*.5)%1,stance=phase<=duty,u=stance?phase/duty:(phase-duty)/(1-duty),x=gait?(stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2)):0;
  rotations[side+'Hip']=[0,gait?-160*x:attack?-4*thrust:0,0];
  rotations[side+'WingRoot']=[s*(run?70:78),run?3*Math.sin(w):0,0];
  rotations[side+'WingElbow']=[0,run?-2*Math.sin(w-.3):0,s*180];rotations[side+'WingWrist']=[s*180,0,0];
 }
 const body=sagittalBodyPose(r,rotations,move);
 for(const[index,chain]of chains.entries()){
  const id=chain.foot.id,target=[...bind[id]],phase=(t+index*.5)%1,stance=phase<=duty,u=stance?phase/duty:(phase-duty)/(1-duty);
  if(gait){target[0]+=stance?stride*(.5-u):stride*(-.5+(1-Math.cos(Math.PI*u))/2);target[2]=stance?0:(run?.0536:.032)*Math.sin(Math.PI*u)**2;}
  const origin=body.positions[chain.hip.id],dy=target[1]-origin[1],dz=target[2]-origin[2],abduction=Math.atan2(dy,-dz)*180/Math.PI,planar=[target[0],origin[1],origin[2]-Math.hypot(dy,dz)];
  let local;try{local=distalIK(chain,origin,planar,0);}catch(e){throw Error(mode+'/'+t+': '+e.message);}
  const mm=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0))),matrix=mm(core.euler([0,-body.angles[chain.hip.id],0]),mm(core.euler([abduction,0,0]),core.euler(local[chain.hip.id])));
  local[chain.hip.id]=[Math.atan2(matrix[2][1],matrix[2][2]),Math.asin(-matrix[2][0]),Math.atan2(matrix[1][0],matrix[0][0])].map(v=>v*180/Math.PI);
  // Cancel the hip's lateral rotation at the sole: the entire web remains flat.
  rotations[id]=[-abduction,0,0];Object.assign(rotations,local);
  for(const q of [map.get(chain.side+'Hip'),chain.hip,chain.knee,chain.hock]){const a=rotations[q.id]?.[1]||0;if(a<q.limits[0]-1e-8||a>q.limits[1]+1e-8)throw Error(mode+'/'+t+' '+q.id+' limit '+a);}
 }
 return{t:time,poses:{root:move.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
const intervals={idle:[{ids:feet,from:0,to:1}],walk:[],run:[],attack:[{ids:feet,from:0,to:1}]};
for(const mode of ['walk','run']){const duty=mode==='walk'?.65:.42;for(const[index,id]of feet.entries())for(const cycle of[0,1]){const from=Math.max(0,cycle-index*.5),to=Math.min(1,cycle-index*.5+duty);if(from<=to)intervals[mode].push({ids:[id],from:round(from),to:round(to)});}intervals[mode].sort((a,b)=>a.from-b.from||a.to-b.to);}
for(const[mode,duration]of Object.entries({idle:3400,walk:1200,run:440,attack:900})){
 const samples=mode==='attack'?640:320,times=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),.15,.28,.32,.36,.42,.46,.50,.51,.53,.65,.76])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));frames[frames.length-1]={...structuredClone(frames[0]),t:1};
 r.clips[mode]={base:'bind',duration,loop:mode!=='attack',easing:'linear',frames,contactIntervals:intervals[mode],events:[],boneLengthPolicy:'preserve',motionSemantics:mode==='attack'?'authored braced bite: small neck recoil, fast joint-pivot lunge, bill opens then snaps shut, retract and settle; both webbed feet planted':mode==='run'?'RunFast-informed lowered neck and faster longer alternating steps; brief suspension, articulated thigh/knee/hock/ankle and mostly folded wing stabilization':mode==='walk'?'WalkMedium-informed short alternating steps; .65 duty double support, lateral weight transfer with grounded webbed soles and articulated backward hocks':'quiet duck breathing and head stabilization, folded wings and two fixed flat webbed feet'};
 if(mode==='walk'||mode==='run')r.clips[mode].events=[{t:0,name:'near-footfall'},{t:.5,name:'far-footfall'}];
 if(mode==='attack'){r.clips[mode].phases=[{id:'anticipation',from:0,peak:.28,to:.36},{id:'action',from:.36,peak:.42,to:.46},{id:'contact',from:.46,peak:.51,to:.53},{id:'recovery',from:.53,peak:.65,to:.76},{id:'settle',from:.76,peak:1,to:1}];r.clips[mode].events=[{t:.28,name:'brace',phase:'anticipation'},{t:.36,name:'lunge-start',phase:'action'},{t:.46,name:'impact',phase:'contact'},{t:.51,name:'bill-snap',phase:'contact'},{t:.53,name:'release',phase:'recovery'},{t:.76,name:'settled',phase:'settle'}];}
}
// Native FlyFlapping-informed powered flight: forward neck, trailing feet,
// synchronous power stroke, delayed elbow/wrist recovery and no ground contacts.
const flyFrames=Array.from({length:241},(_,i)=>{const t=i===240?0:i/240,w=2*Math.PI*t,recovery=curve([[0,0],[.35,0],[.55,1],[.80,1],[1,0]],t),beat=curve([[0,42],[.32,-42],[.44,-40],[.82,42],[1,42]],t),rotations={pelvis:[0,1.5*Math.sin(w),0],neckBase:[0,90,0],neckLower:[0,0,0],neckMid:[0,0,0],head:[0,-90-1.5*Math.sin(w),0],tailBase:[0,2*Math.sin(w-.3),0],jaw:[0,0,0]};for(const side of ['near','far']){const sign=side==='near'?1:-1;Object.assign(rotations,{[side+'WingRoot']:[sign*6,beat,-sign*70],[side+'WingElbow']:[0,-10*Math.sin(w-.5),sign*(180-25*recovery)],[side+'WingWrist']:[0,12*Math.sin(w-.9),sign*(180-20*recovery)],[side+'Hip']:[0,85,0],[side+'Knee']:[0,35,0],[side+'Hock']:[0,-30,0],[side+'Ankle']:[0,-30,0],[side+'Toe']:[0,120,0]});}return{t:i/240,poses:{root:[0,0,round(.16+.008*(1-Math.cos(w)))]},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};});
r.clips.fly={base:'bind',duration:750,loop:true,easing:'linear',frames:flyFrames,contacts:[],contactIntervals:[],events:[{t:0,name:'power-stroke-start'},{t:.32,name:'power-stroke-bottom'},{t:.55,name:'folded-recovery'}],boneLengthPolicy:'preserve',motionSemantics:'FlyFlapping-informed synchronous duck wingbeat with delayed elbow/wrist recovery, short forward neck, trailing webbed feet and stationary ground shadow'};
// Keep the new articulated wings folded in the inherited KO presentation too.
const rest=structuredClone(r.clips.idle.frames[0]);r.clips.ko={base:'bind',duration:900,loop:false,easing:'ease-in',frames:[rest,{...structuredClone(rest),t:1,poses:{root:[0,.08,.032]},rotations:{...rest.rotations,root:[0,72,0]}}],contactIntervals:[{ids:feet,from:0,to:.05}],events:[{t:.5,name:'fall'},{t:1,name:'down'}],boneLengthPolicy:'preserve'};
const model={$schema:'paper-rig/model-1',family:'duck',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run,fly:r.clips.fly}};delete r.clips.run;delete r.clips.fly;r.clips.idleA=r.clips.idle;delete r.clips.idle;r.clips.walkA=r.clips.walk;delete r.clips.walk;
for(const[path,obj]of[['rigs/families/duck.json',r],['rigs/models/duck.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
