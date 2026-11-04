// authored Kangaroo. All support IK is baked at authoring time.
import fs from 'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{bindPositions,solveLeg,sagittalBodyPose}from'../rigs/quadruped-locomotion.js';
import{curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('deer');r.joints=[];r.plates=[];r.anchors=[];r.clips={};
Object.assign(r,{id:'kangarooBase',family:'macropod',archetypes:['kangaroo','macropod'],heightMeters:1.72,tokenScale:26,tokenGroundY:61,profile:{silhouette:'upright kangaroo: heavy haunches, narrow rising chest, small forearms, long hind feet, upright leaf ears and a thick tapering support tail',locomotion:'slow hands-and-tail-assisted pentapedal advance; fast paired hind-leg hopping with an airborne counterbalance tail',attack:'authored boxing punch from native aggressive guard; separate native-combat-informed tail-braced double-foot kick'}});
r.camera.framing='fixed scale with ground origin at token [50,61]';
const J=(id,parent,bind,role='limb',extra={})=>{const q={id,parent,bind,role,...extra};r.joints.push(q);return q;};
const P=(id,bone,shape,size,role='limb',extra={})=>r.plates.push({id,bone,shape,size,role,attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});
const span=(id,a,b,width,role='limb',extra={})=>P(id,b,'capsule',[width],role,{span:[a,b],...extra});
J('root',null,[0,0,0],'root');J('pelvis','root',[0,0,.67],'body');J('chest','pelvis',[.32,0,.48],'body');J('neck','chest',[.07,0,.14],'neck');J('head','neck',[.06,0,.11],'head');J('muzzle','head',[.20,0,-.065],'head');
P('castShadow','root','ellipse',[2.6,.80],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});span('torsoPlate','pelvis','chest',.42,'core');P('pelvisPlate','pelvis','ellipse',[.50,.60],'core');P('chestPlate','chest','ellipse',[.31,.37],'core');span('neckPlate','chest','neck',.23,'neck');span('headConnectorPlate','neck','head',.19,'head');P('headPlate','head','ellipse',[.22,.27],'head');span('muzzleConnectorPlate','head','muzzle',.16,'head',{shape:'taperedBone',occlusionMode:'under-core',zBias:.1});P('muzzlePlate','muzzle','ellipse',[.15,.11],'head',{material:'paperShade'});
for(const [id,diameter]of [['chest',.23],['neck',.16],['head',.14],['muzzle',.10]])r.joints.find(j=>j.id===id).gasket={diameterMeters:diameter,underIncidentPlates:!['head','muzzle'].includes(id)};
r.joints.find(j=>j.id==='pelvis').gasket={diameterMeters:.32};
J('tailBase','pelvis',[-.12,0,-.05],'tail');J('tailMid','tailBase',[-.20,0,-.38],'tail');J('tailContact','tailMid',[-.46,0,-.24],'tail',{gasket:{diameterMeters:.08}});J('tailTip','tailContact',[-.38,0,.025],'tail');
span('tailRootPlate','pelvis','tailBase',.29,'tail',{occlusionMode:'under-core'});span('tailUpperPlate','tailBase','tailMid',.22,'tail');span('tailLowerPlate','tailMid','tailContact',.14,'tail');span('tailTipPlate','tailContact','tailTip',.10,'tail',{shape:'taperedBone'});
for(const side of ['near','far']){
 const sign=side==='near'?1:-1,other=side==='near'?'far':'near';
 J(side+'Hip','pelvis',[0,sign*.175,-.05],'limb',{mirror:other+'Hip'});J(side+'Knee',side+'Hip',[.27,0,.12],'limb',{mirror:other+'Knee',bendAxis:[0,1,0],limits:[-100,155],gasket:{diameterMeters:.07}});J(side+'Hock',side+'Knee',[-.12,0,-.63],'limb',{mirror:other+'Hock',bendAxis:[0,1,0],limits:[-155,155]});J(side+'Foot',side+'Hock',[.22,0,-.11],'limb',{mirror:other+'Foot',gasket:{diameterMeters:.075}});
 span(side+'ThighPlate',side+'Hip',side+'Knee',.28,'limb',{occlusionMode:'surface-relative',occlusionReference:'pelvis'});P(side+'HaunchPlate',side+'Hip','ellipse',[.43,.52],'limb',{occlusionMode:'surface-relative',occlusionReference:'pelvis'});span(side+'ShinPlate',side+'Knee',side+'Hock',.085);span(side+'FootPlate',side+'Hock',side+'Foot',.085,'hoof');P(side+'ToePlate',side+'Foot','ellipse',[.11,.075],'hoof',{material:'paperShade'});
 J(side+'Shoulder','chest',[.10,sign*.21,-.02],'limb',{mirror:other+'Shoulder'});J(side+'Elbow',side+'Shoulder',[.045,0,-.21],'limb',{mirror:other+'Elbow',bendAxis:[0,1,0],limits:[-160,120]});J(side+'Hand',side+'Elbow',[.14,0,-.25],'limb',{mirror:other+'Hand',gasket:{diameterMeters:.06}});
 P(side+'ShoulderCapPlate',side+'Shoulder','ellipse',[.14,.14],'limb',{occlusionMode:'over-core'});
 span(side+'UpperArmPlate',side+'Shoulder',side+'Elbow',.095,'limb',{occlusionMode:'over-core'});span(side+'ForearmPlate',side+'Elbow',side+'Hand',.07,'limb',{occlusionMode:'over-core'});P(side+'HandPlate',side+'Hand','ellipse',[.09,.12],'limb',{material:'paperShade',occlusionMode:'over-core'});
 J(side+'EarBase','head',[-.045,sign*.065,.09],'ear',{mirror:other+'EarBase'});J(side+'EarTip',side+'EarBase',[-.06,sign*.04,.18],'ear',{mirror:other+'EarTip',helper:true});
 const points=[[0,0,0],[-.06,sign*.02,.04],[-.09,sign*.04,.16],[-.06,sign*.06,.22],[.005,sign*.05,.17],[.03,0,.05]].map((v,i)=>{const id=side+'EarLeaf'+i;J(id,side+'EarBase',v,'accessoryAnchor',{helper:true});return id;});
 P(side+'EarPlate',side+'EarBase','polygon',[.1],'ear',{points,bodyRegion:'accessory',occlusionMode:'surface-relative',occlusionReference:'head',zBias:5.3,semanticDetailTier:'identity'});span(side+'EarSpinePlate',side+'EarBase',side+'EarTip',.03,'ear',{bone:side+'EarBase',bodyRegion:'accessory',occlusionMode:'under-core',zBias:5.2});
}
const map=new Map(r.joints.map(j=>[j.id,j])),leg=side=>({hip:map.get(side+'Hip'),knee:map.get(side+'Knee'),hock:map.get(side+'Hock'),foot:map.get(side+'Foot'),rear:true}),arm=side=>({hip:map.get(side+'Shoulder'),knee:map.get(side+'Elbow'),foot:map.get(side+'Hand'),rear:false}),tail={hip:map.get('tailBase'),knee:map.get('tailMid'),foot:map.get('tailContact'),rear:true},bind=bindPositions(r),feet=['nearFoot','farFoot'],hands=['nearHand','farHand'];
// Upward-pointing macropod thighs cross atan2's branch cut. Normalize each
// relative angle before enforcing authored limits, then bake ordinary rotations.
function foldedLeg(chain,origin,target,distalPitch=0){
 const {hip,knee,hock,foot}=chain,pitch=distalPitch*Math.PI/180,distal=[foot.bind[0]*Math.cos(pitch)+foot.bind[2]*Math.sin(pitch),0,-foot.bind[0]*Math.sin(pitch)+foot.bind[2]*Math.cos(pitch)],dx=target[0]-distal[0]-origin[0],dz=target[2]-distal[2]-origin[2],d=Math.hypot(dx,dz),a=Math.hypot(knee.bind[0],knee.bind[2]),b=Math.hypot(hock.bind[0],hock.bind[2]);
 if(d>a+b+1e-9||d<Math.abs(a-b)-1e-9)throw Error('Unreachable folded leg '+foot.id);
 const along=(a*a-b*b+d*d)/(2*d),across=Math.sqrt(Math.max(0,a*a-along*along)),upper=[dx/d*along-dz/d*across,0,dz/d*along+dx/d*across],lower=[dx-upper[0],0,dz-upper[2]],angle=v=>Math.atan2(-v[0],-v[2])*180/Math.PI,wrap=x=>((x+180)%360+360)%360-180;
 const H=wrap(angle(upper)-angle(knee.bind)),K=wrap(angle(lower)-angle(hock.bind)-H),A=wrap(distalPitch-H-K),out={[hip.id]:[0,H,0],[knee.id]:[0,K,0],[hock.id]:[0,A,0]};
 for(const q of [knee,hock])if(q.limits&&(out[q.id][1]<q.limits[0]-1e-8||out[q.id][1]>q.limits[1]+1e-8))throw Error('Folded leg exceeds '+q.id+' limits: '+out[q.id][1]);return out;
}
function hermite(a,b,va,vb,u,length){return(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*va*length+(-2*u**3+3*u*u)*b+(u**3-u*u)*vb*length;}
function hopHeight(t){if(t<.18||t>.70)return 0;if(t<.30)return curve([[.18,0],[.30,-.06]],t);if(t<.36)return hermite(-.06,0,0,4.8,(t-.30)/.06,.06);if(t<=.56){const u=(t-.36)/.20;return .96*u*(1-u);}if(t<.64)return hermite(0,-.045,-4.8,0,(t-.56)/.08,.08);return curve([[.64,-.045],[.70,0]],t);}
function frame(mode,time){
 const t=time===1&&['idle','walk','run'].includes(mode)?0:time,w=2*Math.PI*t,walk=mode==='walk',run=mode==='run',kick=mode==='kick',punch=mode==='attack',hop=mode==='hop';
 const root=walk?[0,0,.13-.012*(1-Math.cos(w))/2]:run?[0,0,curve([[0,.11],[.12,-.01],[.30,.15],[.62,.28],[.90,.18],[1,.11]],t)]:[0,0,-.004*(1-Math.cos(w))/2];
 const rotations={pelvis:[0,walk?85:run?45+3*Math.sin(w):0,0],neck:[0,walk?-45:run?-20:0,0],head:[0,walk?-25:run?-12:0,0]};
 if(hop){root[2]=hopHeight(t);rotations.pelvis=[0,curve([[0,0],[.18,0],[.30,4],[.36,0],[.56,0],[.64,3],[.70,0],[1,0]],t),0];}
 if(kick){root[0]=curve([[0,0],[.18,-.03],[.38,-.30],[.54,-.30],[.72,-.04],[.88,0],[1,0]],t);root[2]=curve([[0,0],[.18,-.03],[.38,.16],[.54,.14],[.72,-.025],[.88,0],[1,0]],t);rotations.pelvis=[0,curve([[0,0],[.18,-8],[.38,-30],[.54,-26],[.72,-6],[.88,0],[1,0]],t),0];rotations.head=[0,curve([[0,0],[.38,20],[.54,18],[.88,0],[1,0]],t),0];}
 if(punch){root[0]=curve([[0,0],[.20,-.018],[.42,.025],[.55,0],[1,0]],t);root[2]=curve([[0,0],[.20,-.02],[.42,-.004],[.70,-.008],[1,0]],t);rotations.neck=[0,curve([[0,0],[.20,-3],[.42,4],[.75,0],[1,0]],t),0];}
 const body=sagittalBodyPose(r,rotations,root);
 function solve(chain,target,distalPitch=0){let a;try{a=chain.hock?foldedLeg(chain,body.positions[chain.hip.id],target,distalPitch):solveLeg(chain,body.positions[chain.hip.id],target,{distalPitch});}catch(e){throw Error(mode+'/'+t+': '+e.message+' '+JSON.stringify({origin:body.positions[chain.hip.id],target}));}a[chain.hip.id][1]-=body.angles[chain.hip.id];Object.assign(rotations,a);}
 for(const side of ['near','far']){
  const q=bind[side+'Foot'],target=[...q];
  if(walk){target[0]=curve([[0,.18],[.12,.12],[.32,.44],[.40,.42],[.80,.24],[1,.18]],t);target[2]=curve([[0,0],[.12,0],[.26,.17],[.40,0],[1,0]],t);}
  if(run){target[0]=curve([[0,.25],[.28,-.08],[.52,.02],[.82,.42],[1,.25]],t);target[2]=t<=.28?0:curve([[.28,0],[.48,.26],[.66,.38],[.86,.12],[1,0]],t);}
  if(hop){const air=t>.36&&t<.56,u=(t-.36)/.20;target[0]=q[0]+(air?.025*Math.sin(Math.PI*u)**2:0);target[2]=air?root[2]+.035*Math.sin(Math.PI*u)**2:0;}
  if(kick){target[0]=curve([[0,q[0]],[.20,q[0]],[.32,.66],[.44,.80],[.52,.80],[.64,.64],[.76,q[0]],[1,q[0]]],t);target[2]=curve([[0,0],[.20,0],[.32,.55],[.44,.75],[.52,.73],[.64,.40],[.76,0],[1,0]],t);}
  const footPitch=kick?curve([[0,0],[.20,0],[.32,-30],[.44,-65],[.54,-65],[.64,-25],[.76,0],[1,0]],t):run&&t>.28?20*Math.sin(Math.PI*(t-.28)/.72)**2:0;
  solve(leg(side),target,footPitch);
  let hand=[.62,bind[side+'Hand'][1],.92];
  if(walk){hand=[.54,hand[1],curve([[0,0],[.48,0],[.64,.13],[.80,0],[1,0]],t)];}
  if(run){const origin=body.positions[side+'Shoulder'];hand=[origin[0]+.12,hand[1],origin[2]-.20];}
  if(hop){hand[2]+=(t>.36&&t<.56?root[2]:0);}
  if(punch||kick){const active=side==='near'&&punch;hand[0]=curve([[0,hand[0]],[.20,active ? .43 : .54],[.42,active ? .80 : .54],[.50,active ? .79 : .54],[.66,.53],[.88,.62],[1,.62]],t);hand[2]=curve([[0,hand[2]],[.20,.99],[.42,active?1.12:1.04],[.50,active?1.11:1.04],[.66,.99],[.88,.92],[1,.92]],t);}
  if(kick){const g=curve([[0,0],[.20,1],[.66,1],[.88,0],[1,0]],t),origin=body.positions[side+'Shoulder'];hand=[origin[0]+.20,hand[1],origin[2]-.21+.08*g];}
  solve(arm(side),hand);
  rotations[side+'EarBase']=[0,2*Math.sin(w+(side==='near'?0:.4)),0];
 }
 const support=walk?[-.22,0,curve([[0,0],[.52,0],[.66,.045],[.80,0],[1,0]],t)]:run?[-.64,0,.64+root[2]+.025*Math.sin(w)]:[...bind.tailContact];
 if(hop&&t>.36&&t<.56){support[2]=root[2]+.035*Math.sin(Math.PI*(t-.36)/.20)**2;}
 if(run){const angle=v=>Math.atan2(-v[0],-v[2])*180/Math.PI,baseWorld=90+2*Math.sin(w)-angle(tail.knee.bind),midWorld=90+3*Math.sin(w-.5)-angle(tail.foot.bind);rotations.tailBase=[0,baseWorld-body.angles.tailBase,0];rotations.tailMid=[0,midWorld-baseWorld,0];}else solve(tail,support);
 // Distal tail lies along the ground support patch instead of rotating through it.
 const posed=sagittalBodyPose(r,rotations,root);rotations.tailContact=[0,-posed.angles.tailContact,0];
 return{t:time,poses:{root:root.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};
}
const sorted=xs=>xs.sort((a,b)=>a.from-b.from||a.to-b.to),critical=[.12,.18,.20,.28,.32,.38,.42,.44,.48,.50,.52,.54,.64,.66,.72,.76,.80,.88,.94,.18,.30,.36,.46,.56,.64,.70];
const supports={hop:[{ids:[...feet,'tailContact'],from:0,to:.36},{ids:[...feet,'tailContact'],from:.56,to:1}],idle:[{ids:[...feet,'tailContact'],from:0,to:1}],walk:sorted([{ids:feet,from:0,to:.12},{ids:feet,from:.40,to:1},{ids:hands,from:0,to:.48},{ids:hands,from:.80,to:1},{ids:['tailContact'],from:0,to:.52},{ids:['tailContact'],from:.80,to:1}]),run:[{ids:feet,from:0,to:.28},{ids:feet,from:1,to:1}],attack:[{ids:[...feet,'tailContact'],from:0,to:1}],kick:sorted([{ids:feet,from:0,to:.20},{ids:feet,from:.76,to:1},{ids:['tailContact'],from:0,to:1}])};
for(const [mode,duration]of Object.entries({idle:5000,walk:1550,run:570,hop:2200,attack:1150,kick:1450})){
 const samples={idle:240,walk:320,run:320,hop:1280,attack:480,kick:960}[mode],bakeTimes=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),...critical])].sort((a,b)=>a-b);
 const frames=bakeTimes.map(t=>frame(mode,t));frames[frames.length-1]={...structuredClone(frames[0]),t:1};
 r.clips[mode]={base:'bind',duration,loop:['idle','walk','run'].includes(mode),easing:'linear',frames,contactIntervals:supports[mode],boneLengthPolicy:'preserve',motionSemantics:mode==='hop'?'single occasional upright hop: quiet hold, crouch, paired takeoff .36, short ballistic rise, landing .56, settle and quiet hold; no forward running lean':mode==='kick'?'tail anchored before double-foot lift, backward torso lean, tucked knees then forward kick, retraction, two-foot landing and upright recovery; tail remains grounded':mode==='attack'?'authored near-hand boxing punch from native aggressive guard; opposite hand guards; two feet and tail brace':mode==='walk'?'native-informed pentapedal walk: hands/tail brace as hind feet advance together; hind feet then support hand/tail reset':mode==='run'?'native-informed paired hind-leg hopping with support .0-.28 and suspension .28-1; airborne tail counterbalance':'upright breathing over two fixed hind feet and a grounded tail support patch',events:[]};
 if(mode==='walk')r.clips[mode].events=[{t:.12,name:'hind-lift'},{t:.40,name:'hind-landing'},{t:.48,name:'hand-reset'},{t:.52,name:'tail-reset'},{t:.80,name:'supports-planted'}];
 if(mode==='hop')r.clips[mode].events=[{t:.30,name:'crouch'},{t:.36,name:'paired-takeoff'},{t:.46,name:'apex'},{t:.56,name:'paired-landing'},{t:.70,name:'settled'}];
 if(mode==='run')r.clips[mode].events=[{t:0,name:'paired-landing'},{t:.28,name:'takeoff'},{t:.62,name:'apex'}];
 if(mode==='attack'||mode==='kick'){const impact=mode==='kick' ? .44 : .42;r.clips[mode].phases=[{id:'anticipation',from:0,peak:.18,to:.28},{id:'action',from:.28,peak:.38,to:impact},{id:'contact',from:impact,peak:impact,to:.54},{id:'recovery',from:.54,peak:.72,to:.88},{id:'settle',from:.88,peak:.94,to:1}];r.clips[mode].events=[{t:.18,name:'windup',phase:'anticipation'},{t:impact,name:'impact',phase:'contact'},{t:.54,name:'release',phase:'contact'},{t:.94,name:'settled',phase:'settle'}];if(mode==='kick')r.clips[mode].events.push({t:0,name:'tail-brace',phase:'anticipation'},{t:.20,name:'feet-lift',phase:'anticipation'},{t:.76,name:'feet-land',phase:'recovery'});r.clips[mode].events.sort((a,b)=>a.t-b.t);}
}
// The contact contract measures surface offsets in bind. Use the native low
// support posture as bind so hands, hind feet and tail all have true Z=0 soles.
// Rebase the entire sagittal hierarchy, including ear polygons, without changing
// any bone length or world animation. Relative limits shift by the same constant.
const rest=frame('walk',0),world=sagittalBodyPose(r,rest.rotations,rest.poses.root);
for(const q of r.joints){if(q.id==='root')continue;const parent=q.parent==='root'?[0,0,0]:world.positions[q.parent];q.bind=world.positions[q.id].map((v,k)=>round(v-parent[k]));if(q.limits)q.limits=q.limits.map(v=>round(v-(rest.rotations[q.id]?.[1]||0)));}
for(const c of Object.values(r.clips))for(const f of c.frames){f.poses.root=f.poses.root.map((v,k)=>round(v-rest.poses.root[k]));for(const q of r.joints){const old=f.rotations[q.id]||[0,0,0],base=rest.rotations[q.id]||[0,0,0],delta=old.map((v,k)=>round(v-base[k]));if(delta.some(v=>v!==0)||f.rotations[q.id])f.rotations[q.id]=delta;}}
const model={$schema:'paper-rig/model-1',family:'kangaroo',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run,kick:r.clips.kick,hop:r.clips.hop}};delete r.clips.run;delete r.clips.kick;delete r.clips.hop;
// Resolver derives canonical aliases from idleA/walkA; all other clips stay explicit.
r.clips.idleA=r.clips.idle;delete r.clips.idle;r.clips.walkA=r.clips.walk;delete r.clips.walk;
for(const[path,obj]of[['rigs/families/kangaroo.json',r],['rigs/models/kangaroo.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
