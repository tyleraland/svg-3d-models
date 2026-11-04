import{solidKit,V,pulse,sampleClip}from'./creature-solids.mjs';
export function makeMerfolkFamily(){
 const k=solidKit(),{J,tube,face,slab}=k;
 J('root',null,[0,0,0],'root');J('pelvis','root',[.30,0,.85],'body');J('chest','pelvis',[.04,0,.28],'body');J('neck','chest',[.025,0,.24],'neck');J('head','neck',[.025,0,.14],'head');
 tube('pelvis','pelvis',[0,0,.12],[-.05,0,-.18],[.15,.20],[.13,.16]);
 tube('torso','chest',[0,0,-.17],[0,0,.23],[.12,.16],[.15,.24]);
 tube('neck','neck',[0,0,-.025],[0,0,.14],[.085,.075],[.08,.075],'neck');
 tube('head','head',[0,0,-.06],[0,0,.23],[.14,.15],[.13,.14],'head',{},8);
 J('noseTip','head',[.19,0,.055],'snout',{helper:true});tube('nose','head',[.11,0,.04],[.19,0,.04],[.032,.03],[.023,.02],'head');
 for(const side of ['left','right']){const s=side==='left'?1:-1;
  face(side+'Eye','head',Array.from({length:8},(_,i)=>[.145,s*.064+.020*Math.cos(i*Math.PI/4),.09+.020*Math.sin(i*Math.PI/4)]),'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity'});
  J(side+'Shoulder','chest',[.015,s*.22,.13],'limb');J(side+'Elbow',side+'Shoulder',[.025,s*.10,-.27],'limb');J(side+'Wrist',side+'Elbow',[.085,s*.025,-.24],'hand');
  tube(side+'UpperArm',side+'Shoulder',[0,0,.035],[.025,s*.10,-.29],[.065,.065],[.05,.05],'limb',{occlusionMode:'under-core'});
  tube(side+'Forearm',side+'Elbow',[0,0,.025],[.085,s*.025,-.255],[.052,.05],[.035,.035],'limb');
  face(side+'WebbedHand',side+'Wrist',[[-.02,-s*.04,0],[.10,-s*.065,-.035],[.18,0,-.05],[.12,s*.08,-.035],[0,s*.05,0]],'limb');
  J(side+'HandTip',side+'Wrist',[.18,0,-.05],'hand',{helper:true});
  k.anchors.push({id:side+'HandAnchor',bone:side+'Wrist',offset:[.12,0,0],inheritScale:false});
 }
 face('mouth','head',[[.147,-.045,-.012],[.15,0,-.025],[.147,.045,-.012],[.147,.045,-.028],[.15,0,-.038],[.147,-.045,-.028]],'head',{role:'accent',material:'paperShade',semanticDetailTier:'identity'});
 const chain=[['tailBase','pelvis',[-.07,0,-.19]],['tail1','tailBase',[-.16,0,-.24]],['tail2','tail1',[-.25,0,-.19]],['tail3','tail2',[-.29,0,-.09]],['tailFin','tail3',[-.24,0,0]]];
 for(const[i,[id,parent,bind]]of chain.entries()){
  J(id,parent,bind,'tail');const next=chain[i+1]?.[2]||[-.16,0,0],a=[-next[0]*.12,0,-next[2]*.12],b=next.map(x=>x*1.13),w=[.17,.14,.105,.065,.035][i];tube(id,id,a,b,[w,w*.85],[w*.70,w*.65]);
 }
 slab('caudalFin','tailFin',[[.03,0,.045],[-.20,0,.30],[-.37,0,.34],[-.25,0,.04],[-.35,0,-.25],[-.18,0,-.22],[.025,0,-.03]],'tail',.02,{occlusionMode:'surface-relative',occlusionReference:'pelvis'});
 J('tailTip','tailFin',[-.37,0,.34],'tail',{helper:true});
 const tail=chain.map(x=>x[0]);
 function sample(mode,t){const phase=['idle','swim','fastSwim'].includes(mode)?t:0,w=phase*2*Math.PI,fast=mode==='fastSwim',swim=mode==='swim'||fast,hit=mode==='recoil'?pulse(t,0,.28,1):0,attack=mode==='attack',whip=mode==='tailSweep'?pulse(t,.10,.44,.95):0,down=mode==='ko'?(1-Math.cos(Math.PI*t))/2:0;
  const rotations={root:[down*65,0,0],pelvis:[0,0,-hit*8],chest:[0,(fast?30:swim?12:0)-hit*12,0],neck:[0,fast?-12:0,0],head:[0,fast?-8:0,hit*12]};
  for(const[i,id]of tail.entries())rotations[id]=V([0,-whip*(i<2?5:0),Math.sin(w-i*.55)*(swim?(fast?18:12):3.5)*(1+i*.20)+whip*([25,-12,-35,-20,-12][i])]);
  for(const side of ['left','right']){const s=side==='left'?1:-1,stroke=swim?Math.sin(w+(s===1?0:Math.PI)):0,p=attack&&side==='right'?pulse(t,.08,.26,.47):0,f=attack&&side==='right'?pulse(t,.27,.48,.90):0;
   rotations[side+'Shoulder']=V([s*(swim?stroke*14:3*Math.sin(w)),f*-62+p*35,down*s*20]);rotations[side+'Elbow']=V([0,p*-50+f*-12,0]);rotations[side+'Wrist']=V([0,f*8,0]);}
  return{poses:{root:[0,0,-down*.12]},rotations};
 }
 const clips={};for(const[id,mode,duration,loop]of [['idleA','idle',2400,true],['walkA','swim',1400,true],['fastSwim','fastSwim',850,true],['attack','attack',1250,false],['tailSweep','tailSweep',1350,false],['recoil','recoil',600,false],['ko','ko',1400,false]])clips[id]=sampleClip({mode,duration,loop,sample,times:[.26,.44,.48,.90],events:id==='attack'?[{t:.26,name:'arm-windup'},{t:.48,name:'hand-strike'},{t:.9,name:'recover'}]:id==='tailSweep'?[{t:.44,name:'tail-sweep-impact'}]:[]});
 clips.swim={...structuredClone(clips.walkA),aliasOf:'walkA'};clips.run={...structuredClone(clips.fastSwim),aliasOf:'fastSwim'};
 return k.finish('merfolk',{archetypes:['merfolk','fish-tailed humanoid'],height:1.9,scale:25,groundY:53,shadow:[2.3,1.1],profile:{silhouette:'upright humanoid torso and head, two articulated arms with webbed hands, tapering bent fish tail and vertical forked caudal fin',locomotion:'suspended lateral tail propulsion, alternating arm trim and forward lean during faster swimming'}},clips);
}
