// Quaternius Frog -> independent low, broad amphibian paper rig.
// Reference-native proportions; all contact/pose solving is author-time only.
import fs from'node:fs';
import{loadFamily}from'@paper-rig/rigs';
import{core}from'@paper-rig/compiler';
import{bindPositions}from'../rigs/quadruped-locomotion.js';
import{ik,angles,curve,round}from'./lib/spatial-leg-ik.mjs';
const r=loadFamily('deer');Object.assign(r,{id:'frogBase',family:'amphibian',archetypes:['frog','amphibian'],heightMeters:.40,tokenScale:50,tokenGroundY:50,profile:{silhouette:'broad low frog: rising back, wide blunt head, paired raised eye bulges, short forearms, large folded three-link hind legs and simple splayed webbed toes',locomotion:'authored slow supported crawl; Quaternius Jump-informed paired hind-leg launch, trailing feet, foreleg-first recovery and landing',attack:'authored rapid tongue lash with four braced feet; replaces the native forelimb lunge at user request'},joints:[],plates:[],anchors:[],clips:{}});r.camera.framing='fixed scale with ground origin at token [50,50]';
const J=(id,parent,bind,role='limb',extra={})=>{const j={id,parent,bind:bind.map(round),role,...extra};r.joints.push(j);return j;};
const P=(id,bone,shape,size,role='limb',extra={})=>r.plates.push({id,bone,shape,size,role,bodyRegion:['core','head','neck'].includes(role)?role:role==='shadow'?'groundShadow':'limb',attachment:'rigid',material:'paperMain',zBias:role==='core'?2:0,...extra});
const span=(id,a,b,width,role='limb',extra={})=>P(id,b,'capsule',[width],role,{span:[a,b],...extra});
J('root',null,[0,0,0],'root');J('pelvis','root',[-.18,0,.185],'body');J('chest','pelvis',[.29,0,.087],'body');J('neck','chest',[.057,0,.012],'neck');J('head','neck',[.071,0,.012],'head');
P('castShadow','root','ellipse',[1.10,.96],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});
span('torsoPlate','pelvis','chest',.24,'core');P('pelvisPlate','pelvis','ellipse',[.30,.16],'core');P('chestPlate','chest','ellipse',[.28,.18],'core');span('headConnectorPlate','chest','head',.22,'head',{occlusionMode:'under-core'});P('headPlate','head','ellipse',[.33,.18],'head');
J('chin','head',[.10,0,-.043],'head',{helper:true});P('chinPlate','chin','ellipse',[.18,.12],'head',{material:'paperShade',occlusionMode:'under-core'});
// A folded rigid chain retracts inside the head without scale/opacity animation.
const tongueCount=10;J('tongueRoot','head',[-.03,0,-.015],'head',{helper:true});
for(let i=0;i<tongueCount;i++){const a=i?'tongueLink'+i:'tongueRoot',b='tongueLink'+(i+1);J(b,a,[0,0,i%2?.05:-.05],'head',{helper:true});span('tongueSegment'+i+'Plate',a,b,.018,'head',{bone:a,zBias:-2,material:'paperShade',semanticDetailTier:'expression'});}
const legs=[];
for(const side of ['near','far']){
 const s=side==='near'?1:-1,other=side==='near'?'far':'near';
 J(side+'EyeBulge','head',[.015,s*.115,.052],'head',{helper:true});P(side+'EyeBulgePlate',side+'EyeBulge','ellipse',[.10,.105],'head',{semanticDetailTier:'identity'});
 J(side+'Eye','head',[.035,s*.132,.055],'head',{helper:true});P(side+'EyePlate',side+'Eye','ellipse',[.036,.052],'head',{material:'paperShade',semanticDetailTier:'expression'});
 for(const rear of [false,true]){
  const prefix=side+(rear?'Rear':'Front'),parent=rear?'pelvis':'chest',hip=prefix+'Hip',knee=prefix+'Knee',ankle=prefix+'Ankle',paw=prefix+'Paw';
  J(hip,parent,rear?[-.075,s*.127,-.050]:[.024,s*.085,-.006],'limb',{mirror:other+(rear?'Rear':'Front')+'Hip'});
  if(!rear)span(prefix+'SocketPlate',parent,hip,.065,'limb',{occlusionMode:'under-core'});
  J(knee,hip,rear?[.178,s*.135,-.044]:[-.120,s*.102,-.163],'limb',{mirror:other+(rear?'Rear':'Front')+'Knee'});
  if(rear)J(ankle,knee,[-.273,-s*.037,-.065],'limb',{mirror:other+'RearAnkle'});
  J(paw,rear?ankle:knee,rear?[.248,s*.100,-.026]:[.198,0,-.103],'limb',{mirror:other+(rear?'Rear':'Front')+'Paw',gasket:{diameterMeters:.012}});
  span(prefix+'UpperPlate',hip,knee,rear?.145:.070,'limb',{occlusionMode:'surface-relative',occlusionReference:parent});if(rear)P(prefix+'ThighPlate',knee,'ellipse',[.205,.13],'limb',{occlusionMode:'surface-relative',occlusionReference:'pelvis'});
  span(prefix+'LowerPlate',knee,rear?ankle:paw,rear?.070:.048,'limb',{bone:knee,zBias:-1,occlusionMode:'under-core'});if(rear)span(prefix+'InstepPlate',ankle,paw,.062,'hoof',{bone:ankle,occlusionMode:'under-core'});
  const outline=[[-.026,-.045,.008],[.025,-.046,.008],[.065,-.065,.008],[.050,-.025,.008],[.080,0,.008],[.050,.025,.008],[.065,.065,.008],[.025,.046,.008],[-.026,.045,.008]],points=outline.map((v,i)=>{const id=prefix+'Toe'+i;J(id,paw,v,'limb',{helper:true});return id;});P(prefix+'FootPlate',paw,'polygon',[.02],'hoof',{points,material:'paperShade',occlusionMode:'under-core'});
  legs.push({rear,prefix,hip:r.joints.find(j=>j.id===hip),knee:r.joints.find(j=>j.id===knee),foot:r.joints.find(j=>j.id===(rear?ankle:paw)),paw:r.joints.find(j=>j.id===paw)});
 }
}
for(const j of r.joints.filter(j=>j.parent&&!j.helper&&!j.gasket)){const incident=r.plates.filter(p=>p.role!=='shadow'&&(p.bone===j.id||p.span?.includes(j.id)));if(incident.length)j.gasket={diameterMeters:round(Math.min(...incident.map(p=>p.size[0]))*.72)};}
const bind=bindPositions(r),feet=legs.map(l=>l.paw.id),mm=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0))),mv=(M,v)=>M.map(row=>row.reduce((sum,x,k)=>sum+x*v[k],0)),tr=M=>M[0].map((_,i)=>M.map(row=>row[i])),add=(a,b)=>a.map((v,k)=>v+b[k]),sub=(a,b)=>a.map((v,k)=>v-b[k]),identity=core.euler([0,0,0]);
function fk(rotations,root){const positions={},matrices={};for(const j of r.joints){const parent=matrices[j.parent]||identity;positions[j.id]=j.parent?add(positions[j.parent],mv(parent,j.bind)):add(j.bind,root);matrices[j.id]=mm(parent,core.euler(rotations[j.id]||[0,0,0]));}return{positions,matrices};}
const offsets={nearRear:0,nearFront:.25,farRear:.5,farFront:.75},duty=.76;
function frame(mode,time){const t=time===1&&mode!=='ko'?0:time,w=2*Math.PI*t,walk=mode==='walk',run=mode==='run',attack=mode==='attack',ko=mode==='ko',air=run&&t>.30&&t<.80,u=(t-.30)/.50,g=air?Math.sin(Math.PI*u)**2:0,roll=ko?curve([[0,0],[.12,0],[.32,100],[.56,180],[1,180]],t):0;
 const root=[attack?curve([[0,0],[.25,-.010],[.43,.012],[.68,0],[1,0]],t):0,0,run?curve([[0,0],[.20,-.04],[.30,0],[.52,.34],[.72,.10],[.80,0],[.90,-.02],[1,0]],t):ko?curve([[0,0],[.02,0],[.10,.02],[.20,.24],[.30,.36],[.40,.31],[.50,.20],[.72,.05],[1,.05]],t):attack?curve([[0,0],[.25,-.010],[.43,.006],[.68,0],[1,0]],t):-.002*(1-Math.cos(w))/2];
 const rotations={pelvis:[roll,run?curve([[0,0],[.20,3],[.42,-8],[.65,3],[.80,0],[1,0]],t):attack?curve([[0,0],[.25,2],[.43,-3],[.68,0],[1,0]],t):walk?Math.sin(w):0,0],head:[0,attack?curve([[0,0],[.25,2],[.43,-4],[.68,0],[1,0]],t):.8*Math.sin(w),0]};
 const extension=attack?curve([[0,0],[.30,0],[.43,1],[.48,1],[.64,0],[1,0]],t):0,fold=180*extension;rotations.tongueRoot=[0,-fold/2,0];for(let i=1;i<tongueCount;i++)rotations['tongueLink'+i]=[0,(i%2?1:-1)*fold,0];
 const body=fk(rotations,root);
 for(const l of legs){let target=[...bind[l.paw.id]],pitch=0;
  if(walk){const phase=(t+1-offsets[l.prefix])%1,stance=phase<=duty,v=stance?phase/duty:(phase-duty)/(1-duty);target[0]+=.12*(stance?.5-v:-.5+(1-Math.cos(Math.PI*v))/2);target[2]=stance?0:.032*Math.sin(Math.PI*v)**2;}
  if(run&&air){target[0]+=(l.rear?-.55:.09)*g;target[2]=root[2]*(l.rear?.70:.90)+.02*Math.sin(Math.PI*u)**2;pitch=l.rear?100*g:-12*g;}

  let desired=core.euler([0,pitch,0]),pole=[...l.knee.bind];
  if(ko){const spread=curve([[0,0],[.20,0],[.55,1],[1,1]],t),local=sub(bind[l.paw.id],bind.pelvis);local[0]+=(l.rear?-.16:.10)*spread;target=add(body.positions.pelvis,mv(body.matrices.pelvis,local));desired=body.matrices.pelvis;pole=mv(body.matrices.pelvis,pole);}
  let endpoint=target;if(l.rear)endpoint=sub(target,mv(desired,l.paw.bind));
  const parent=body.matrices[l.hip.parent];let local;try{local=ik(l,body.positions[l.hip.id],endpoint,parent,pole);}catch(e){throw Error(`${mode}/${t}/${l.prefix}: ${e.message}`);}Object.assign(rotations,local);
  const lower=mm(parent,mm(core.euler(local[l.hip.id]),core.euler(local[l.knee.id])));rotations[l.foot.id]=angles(mm(tr(lower),desired));
 }
 return{t:time,poses:{root:root.map(round)},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,v.map(round)]))};}
for(const[mode,duration]of Object.entries({idle:2500,walk:1250,run:875,attack:850,ko:1000})){
 const intervals=[];if(mode==='idle')intervals.push({ids:feet,from:0,to:1});if(mode==='walk')for(const l of legs)for(const cycle of [-1,0,1]){const from=Math.max(0,cycle+offsets[l.prefix]),to=Math.min(1,cycle+offsets[l.prefix]+duty);if(from<=to)intervals.push({ids:[l.paw.id],from:round(from),to:round(to)});}if(mode==='run')intervals.push({ids:feet,from:0,to:.30},{ids:feet,from:.80,to:1});if(mode==='attack')intervals.push({ids:feet,from:0,to:1});if(mode==='ko')intervals.push({ids:feet,from:0,to:.02});
 const samples=mode==='idle'?80:mode==='walk'?320:mode==='attack'?640:320,times=[...new Set([...Array.from({length:samples+1},(_,i)=>i/samples),...intervals.flatMap(i=>[i.from,i.to]),.02,.12,.20,.25,.30,.32,.38,.42,.45,.50,.52,.55,.56,.62,.65,.68,.72,.76,.80,.84,.90])].sort((a,b)=>a-b),frames=times.map(t=>frame(mode,t));if(mode!=='ko')frames[frames.length-1]={...structuredClone(frames[0]),t:1};
 r.clips[mode]={base:'bind',duration,easing:'linear',loop:['idle','walk','run'].includes(mode),frames,contactIntervals:intervals.sort((a,b)=>a.from-b.from||a.to-b.to),boneLengthPolicy:'preserve',motionSemantics:mode==='idle'?'Quaternius Idle-informed low breathing with four fixed webbed contacts':mode==='walk'?'authored larger faster four-beat crawl: .76 stance duty, low recovery, three or four contacts; no native Walk exists':mode==='run'?'Quaternius Jump-informed paired crouch, hind-leg launch, rearward leg extension, airborne recovery and landing':mode==='attack'?'authored folded-chain tongue lash with four planted feet; sudden extension then retraction': 'Quaternius Death-informed rise and roll onto the back with splayed raised feet; terminal pose stays down',events:[]};
 if(mode==='run')r.clips[mode].events=[{t:.20,name:'crouch'},{t:.30,name:'paired-takeoff'},{t:.52,name:'apex'},{t:.80,name:'landing'},{t:.90,name:'settle'}];
 if(mode==='attack'){r.clips[mode].phases=[{id:'anticipation',from:0,peak:.25,to:.30},{id:'action',from:.30,peak:.39,to:.43},{id:'contact',from:.43,peak:.455,to:.48},{id:'recovery',from:.48,peak:.58,to:.68},{id:'settle',from:.68,peak:1,to:1}];r.clips[mode].events=[{t:.25,name:'brace',phase:'anticipation'},{t:.43,name:'impact',phase:'contact'},{t:.48,name:'release',phase:'recovery'},{t:.68,name:'settled',phase:'settle'}];}
 if(mode==='ko')r.clips[mode].events=[{t:.12,name:'fall'},{t:.56,name:'roll-over'},{t:1,name:'down'}];
}
const model={$schema:'paper-rig/model-1',family:'frog',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:{run:r.clips.run}};delete r.clips.run;r.clips.idleA=r.clips.idle;delete r.clips.idle;r.clips.walkA=r.clips.walk;delete r.clips.walk;
for(const[path,obj]of[['rigs/families/frog.json',r],['rigs/models/frog.json',model]]){let text=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,text+'\n');}
