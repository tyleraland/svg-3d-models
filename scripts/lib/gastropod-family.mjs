// Elongated muscular-foot gastropods. No blob geometry or gait is reused.
import{solidKit,V,pulse,sampleClip}from'./creature-solids.mjs';
export function makeGastropodFamily(kind){
 if(!['slug','snail'].includes(kind))throw Error('Unknown gastropod '+kind);
 const shelled=kind==='snail',k=solidKit(),{J,tube,face}=k,segments=[],contacts=[];
 J('root',null,[0,0,0],'root');
 for(let i=0;i<6;i++){
  const id='trunk'+i,previous=i?'trunk'+(i-1):'root',width=[.15,.19,.20,.175,.12,.035][i],height=[.09,.10,.10,.085,.06,.025][i];
  J(id,previous,i?[-.25,0,0]:[.40,0,.105],'body');segments.push(id);
  tube(id,id,[.145,0,0],[-.15,0,0],[width,height],[[.19,.20,.175,.12,.035,.012][i],[.10,.10,.085,.06,.025,.01][i]],'core',{},8);
  J('sole'+i,id,[0,0,-.105],'body',{helper:true});contacts.push('sole'+i);
  for(const side of ['left','right']){const s=side==='left'?1:-1,foot='sole'+i+side;J(foot,'sole'+i,[0,0,0],'limb',{helper:true});face(foot+'Rim',foot,[[.145,0,0],[.125,s*(width+.035),0],[-.15,s*([.19,.20,.175,.12,.035,.012][i]+.035),0],[-.15,0,0]],'limb',{occlusionMode:'under-core'});}
 }
 J('neck','trunk0',[.14,0,.025],'head');J('head','neck',[.12,0,.015],'head');
 tube('head','head',[.20,0,0],[-.15,0,0],[.075,.06],[.135,.09],'head',{},8);
 J('mouth','head',[.175,0,-.045],'head');face('mouth','mouth',[[.035,-.05,0],[.045,0,-.015],[.035,.05,0],[-.02,.035,0],[-.02,-.035,0]],'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity'});
 J('radula','mouth',[.015,0,-.005],'head');face('radula','radula',[[0,-.025,0],[.065,-.025,0],[.08,0,-.008],[.065,.025,0],[0,.025,0]],'head',{role:'accent',material:'paperShade',semanticDetailTier:'expression'});
 for(const side of ['left','right']){const s=side==='left'?1:-1;
  J(side+'EyeStalk','head',[.075,s*.075,.055],'head');J(side+'EyeStalkEnd',side+'EyeStalk',[.045,s*.035,.23],'head');
  tube(side+'EyeStalk',side+'EyeStalk',[0,0,-.01],[.045,s*.035,.24],[.019,.019],[.014,.014],'head');
  tube(side+'Eye',side+'EyeStalkEnd',[0,0,-.012],[0,0,.04],[.030,.028],[.022,.021],'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity'},8);
  J(side+'EyeTip',side+'EyeStalkEnd',[0,0,.04],'head',{helper:true});
  J(side+'OralFeeler','head',[.13,s*.065,-.005],'head');tube(side+'OralFeeler',side+'OralFeeler',[0,0,0],[.13,s*.07,.035],[.015,.015],[.006,.006],'head');
 }
 if(shelled){
  J('shell','trunk2',[.04,0,.40],'body');tube('shell','shell',[0,-.24,0],[0,.24,0],[.40,.44],[.40,.44],'core',{},12);
  for(const side of ['left','right']){const s=side==='left'?1:-1,edge=[];
   for(let i=0;i<=32;i++){const t=i/32,a=t*3.4*Math.PI,r=.045+t*.29;edge.push([Math.cos(a)*r,s*.246,Math.sin(a)*r]);}
   const ribbon=[...edge.map((p,i)=>{const a=i/32*3.4*Math.PI;return[p[0]+.010*Math.cos(a),p[1],p[2]+.010*Math.sin(a)];}),...edge.map((p,i)=>{const a=i/32*3.4*Math.PI;return[p[0]-.010*Math.cos(a),p[1],p[2]-.010*Math.sin(a)];}).reverse()];
   face(side+'ShellSpiral','shell',ribbon,'core',{role:'accent',material:'paperShade',semanticDetailTier:'identity',occlusionMode:'surface-relative',occlusionReference:'shell'});
  }
  k.anchors.push({id:'shellTopAnchor',bone:'shell',offset:[0,0,.44],inheritScale:false});
 }else{
  J('mantle','trunk1',[.04,0,.055],'body');tube('mantle','mantle',[.24,0,0],[-.26,0,0],[.15,.075],[.13,.055],'core',{},8);
 }
 J('tailTip','trunk5',[-.18,0,0],'tail',{helper:true});k.anchors.push({id:'headAnchor',bone:'head',offset:[.1,0,.05],inheritScale:false},{id:'tailAnchor',bone:'trunk5',offset:[-.18,0,0],inheritScale:false});
 function sample(mode,t){const moving=mode==='crawl'||mode==='glide',phase=['idle','crawl','glide'].includes(mode)?t:0,w=phase*2*Math.PI,fast=mode==='glide',fold=mode==='feelersFold'?pulse(t,.04,.36,.98):0,rasp=mode==='attack'?pulse(t,.1,.46,.94):0,down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0,rotations={root:[0,0,0],neck:[0,rasp*5,0],head:[0,rasp*5,0],mouth:[0,0,0],radula:[0,rasp*12*Math.sin(t*Math.PI*8),0]};
  for(const[i,id]of segments.entries()){
   rotations[id]=[0,0,moving?(fast?1.8:1.0)*(Math.sin(w-i*.55)-Math.sin(-i*.55)):0];
   for(const side of ['left','right']){const s=side==='left'?1:-1,beat=moving?(1+Math.sin(w-i*.95))/2:0;rotations['sole'+i+side]=V([s*beat*(fast?11:8),0,0]);}
  }
  for(const side of ['left','right']){const s=side==='left'?1:-1;rotations[side+'EyeStalk']=V([s*(moving?3*Math.sin(w):2*Math.sin(w)), -fold*70-down*82+(moving?4*Math.sin(w):2*Math.sin(w)),s*(moving?2*Math.sin(w):4*Math.sin(w))]);rotations[side+'EyeStalkEnd']=[0,-fold*12-down*10,0];rotations[side+'OralFeeler']=V([0,fold*15+down*20,s*4*Math.sin(w)]);}
  if(shelled)rotations.shell=[0,0,0];else rotations.mantle=[0,0,0];
  return{poses:{root:[0,0,0]},rotations:Object.fromEntries(Object.entries(rotations).map(([id,v])=>[id,V(v)]))};
 }
 const clips={};for(const[id,mode,duration,loop]of [['idleA','idle',3000,true],['walkA','crawl',shelled?2600:2200,true],['run','glide',shelled?1700:1400,true],['attack','attack',1600,false],['feelersFold','feelersFold',1800,false],['ko','ko',1600,false]])clips[id]=sampleClip({mode,duration,loop,sample,contacts,times:[.36,.46,.94],events:id==='attack'?[{t:.46,name:'radula-rasp'},{t:.94,name:'recover'}]:id==='feelersFold'?[{t:.36,name:'feelers-folded'},{t:.98,name:'feelers-released'}]:[]});
 return k.finish(kind,{archetypes:[kind,'muscular-foot gastropod',...(shelled?['coiled shell']:['mantle and tapered tail'])],height:shelled?1.0:.6,scale:33,groundY:58,shadow:[2.1,.76],profile:{silhouette:shelled?'elongated muscular sole, rigid coiled shell, paired eye stalks and shorter oral feelers':'elongated broad muscular sole, small dorsal mantle, tapered tail, paired eye stalks and shorter oral feelers',locomotion:'in-place pedal waves travel along the sole margins while the centerline stays grounded; faster glide has quicker and larger sole ripples',defense:'feelers fold at fixed-length articulations; full telescoping eye-stalk and head withdrawal remain future soft-body work'}},clips);
}
