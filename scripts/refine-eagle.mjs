// Author-time Eagle refinement from the WildMesh studies. Emits ordinary clips.
// Run from the repository root; reference mesh data never enters the renderer.
import fs from 'node:fs';
import {bakeAvianMotion} from './lib/avian-motion.mjs';
const familyPath='rigs/families/flyingBird.json',modelPath='rigs/models/flyingBird.json';
const r=JSON.parse(fs.readFileSync(familyPath)),m=JSON.parse(fs.readFileSync(modelPath));
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(10),clone=structuredClone;
const j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
const bind=(id,value)=>j(id).bind=value;
Object.assign(r.profile,{stance:'folded-wing standing idle; grounded walk/run/hop and separate powered flight/glide',wings:'eagle: broad secondary chord, slotted outer primaries, delayed wrist recovery',feet:'articulated ankles and three forward toes with rear hallux'});
r.archetypes=['eagle'];r.tokenScale=22;
bind('chest',[.32,0,.045]);bind('neck',[.12,0,.065]);bind('head',[.095,0,.045]);bind('beak',[.13,0,-.025]);
p('bodyPlate').size=[.40];p('neckPlate').size=[.23];p('headConnectorPlate').size=[.22];p('headPlate').size=[.245,.255];p('headPlate').material='paperLight';p('beakPlate').size=[.12];
bind('tailBase',[-.22,0,-.03]);bind('tailTip',[-.32,0,-.025]);
const tail=[[0,.10,0],[-.29,.19,-.025],[-.32,.135,-.025],[-.325,.065,-.025],[-.33,0,-.025],[-.325,-.065,-.025],[-.32,-.135,-.025],[-.29,-.19,-.025],[0,-.10,0]];
tail.forEach((v,i)=>bind('tailFan'+i,v));
for(const side of ['near','far']){
 const s=side==='near'?1:-1;
 bind(side+'WingRootTrailing',[-.28,0,0]);bind(side+'WingElbowTrailing',[-.37,0,0]);bind(side+'WingWristTrailing',[-.39,0,0]);
 const primary=[[.065,0,0],[.055,.19,0],[-.045,.48,-.008],[-.10,.50,-.008],[-.12,.33,0],[-.19,.51,-.008],[-.25,.49,-.008],[-.235,.31,0],[-.345,.44,-.008],[-.40,.39,-.008],[-.32,.22,0],[-.46,.28,0],[-.475,.21,0],[-.39,0,0]];
 primary.forEach((v,i)=>bind(side+'Primary'+i,[v[0],s*v[1],v[2]]));
 p(side+'TalonPlate').size=[.09,.08];
 for(const [name,v]of [['InnerToe',[.085,-.04,0]],['MiddleToe',[.105,0,0]],['OuterToe',[.08,.04,0]],['Hallux',[-.065,0,0]]]){
  const id=side+name;
  if(!j(id))r.joints.push({id,parent:side+'Talon',bind:[v[0],s*v[1],v[2]],role:'accessoryAnchor',helper:true});
  if(!p(id+'Plate'))r.plates.push({id:id+'Plate',bone:id,span:[side+'Talon',id],shape:'taperedBone',size:[.018],role:'limb',bodyRegion:'limb',attachment:'rigid',material:'paperShade',zBias:2.5,semanticDetailTier:'identity'});
 }
}
const motion=bakeAvianMotion(r);r.clips=motion.familyClips;Object.assign(m.clips,motion.modelClips);
function save(path,obj){let s=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');s=s.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,s+'\n');}
save(familyPath,r);save(modelPath,m);
