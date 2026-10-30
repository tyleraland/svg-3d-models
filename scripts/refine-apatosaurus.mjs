import {nativePaper,sub,mul} from './lib/quaternius-paper.mjs';
import {core} from '@paper-rig/compiler';
import {round} from './lib/spatial-leg-ik.mjs';
const n=nativePaper('apatosaurus',{scale:.05,height:.58,names:{Body:'body',Hips:'pelvis',Torso:'chest',Shoulders:'shoulders',Neck:'neck',Head:'head'},profile:{silhouette:'low long neck and small blunt head; deep barrel, column legs, long five-segment tapering tail',locomotion:'native-informed four-beat walk and faster heavy run',attack:'body turn and sweeping tail strike from Quaternius Apatosaurus_Attack'}}),{r,ids,bind,point,J,P,span,clip,save}=n;
r.tokenScale=27;r.tokenGroundY=53;
P('castShadow','root','ellipse',[2.65,.70],'shadow',{surfaceNormal:[0,0,1],material:'shadow',zBias:-100});
J('barrelFront','pelvis',point(sub(bind.Shoulders.tail,bind.Hips.head)),'body',{helper:true});J('barrelCenter','pelvis',point(mul(sub(bind.Shoulders.tail,bind.Hips.head),.5)),'body',{helper:true});P('barrelPlate','barrelCenter','capsule',[.30],'core',{span:['pelvis','barrelFront']});
// Native neck begins ahead of its shoulder; a broad-to-narrow rigid connector fills that span.
J('neckBase','shoulders',point(sub(bind.Shoulders.tail,bind.Shoulders.head)),'neck',{helper:true});J('neckConnectorCenter','shoulders',point(mul(sub(bind.Neck.head,bind.Shoulders.head),.5)),'neck',{helper:true});P('neckConnectorPlate','neckConnectorCenter','capsule',[.15],'neck',{span:['shoulders','neck'],occlusionMode:'under-core'});span('Neck',.092,'neck');span('Head',.075,'head');P('headCapPlate','head','ellipse',[.10,.09],'head');
for(let i=1;i<=5;i++)span('Tail'+i,[.19,.12,.065,.038,.022][i-1],'tail');span('Back',.23,'core',{occlusionMode:'under-core'});
const feet=[];for(const s of ['L','R'])for(const part of ['Front','Back']){const a=part+'UpLeg.'+s,b=part+'LowLeg.'+s;span(a,part==='Back'?.115:.085,'limb',{occlusionMode:'surface-relative',occlusionReference:part==='Back'?'pelvis':'chest'});const foot=span(b,part==='Back'?.075:.055);feet.push(foot);P(foot+'FootPlate',foot,'ellipse',[part==='Back'?.105:.075,.045],'hoof',{material:'paperShade'});}
for(const [suffix,mode]of [['Idle','idle'],['Walk','walk'],['Run','run'],['Attack','attack']])clip('Apatosaurus_'+suffix,mode);clip('Stegosaurus_Death','ko');
// Native bind feet sit a small distance above the native mesh's sole. Put paper soles on z=0.
const ground=core.solveWorld(r,0,'bind'),sole=Math.min(...feet.map(f=>ground[f][2]))-.0225;r.joints.find(j=>j.id==='body').bind[2]-=sole;
for(const id of feet){const j=r.joints.find(j=>j.id===id);j.bind[2]=round(j.bind[2]-(ground[id][2]-sole-.0225));}
// Idle is a supported paper breathing pose; preserve the native head and tail motion, keep all four soles planted.
for(const f of r.clips.idle.frames){f.poses.root=[0,0,0];for(const id of Object.keys(f.rotations))if(!/neck|head|tail/i.test(id))f.rotations[id]=[0,0,0];}r.clips.idle.contacts=feet;r.clips.idle.contactIntervals=undefined;
// Body fall stops at the paper silhouette's ground envelope, rather than allowing native floor penetration.
for(const mode of ['walk','run','attack','ko'])for(const f of r.clips[mode].frames){const p=core.solveWorld(r,f.t,mode),min=Math.min(...feet.map(id=>p[id][2]-.0225));if(min<0)f.poses.root[2]=round(f.poses.root[2]-min);if(mode==='ko'){const low=Math.min(...r.plates.filter(p=>p.role!=='shadow').flatMap(plate=>(plate.span||[plate.bone]).map(id=>p[id][2]-plate.size[0]/2)));if(low<0)f.poses.root[2]=round(f.poses.root[2]-low);}}
r.clips.attack.events=[{t:.25,name:'windup'},{t:.5,name:'impact'},{t:.75,name:'release'},{t:1,name:'settled'}];r.clips.ko.events=[{t:.25,name:'fall'},{t:.75,name:'down'}];
for(const f of r.clips.ko.frames)if(f.t>=.8){f.poses=structuredClone(r.clips.ko.frames[32].poses);f.rotations=structuredClone(r.clips.ko.frames[32].rotations);}
save();
