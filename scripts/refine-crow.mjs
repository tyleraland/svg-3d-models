// Author-time Crow geometry + clips, using the shared avian hierarchy/baker.
// The native Crow study is in reference-studies/crow.md; no mesh data ships.
import fs from 'node:fs';
import {bakeAvianMotion} from './lib/avian-motion.mjs';
const r=JSON.parse(fs.readFileSync('rigs/families/flyingBird.json'));
const scale=.6,round=n=>+n.toFixed(10),j=id=>r.joints.find(j=>j.id===id),p=id=>r.plates.find(p=>p.id===id);
for(const joint of r.joints){joint.bind=joint.bind.map(v=>round(v*scale));if(joint.gasket?.diameterMeters)joint.gasket.diameterMeters=round(joint.gasket.diameterMeters*scale);}
for(const plate of r.plates)plate.size=plate.size.map(v=>round(v*scale));
for(const anchor of r.anchors)anchor.offset=anchor.offset.map(v=>round(v*scale));
Object.assign(r,{id:'crowBase',family:'theropodAvianFlying',archetypes:['crow'],heightMeters:.55,tokenScale:35,tokenGroundY:68});
r.camera.framing='fixed scale with ground origin at token [50,68]';
r.profile={stance:'grounded alert idle with folded wings; alternating ground gait, assisted hop and separate flight',silhouette:'slim horizontal body, compact head, long straight pointed bill and long narrow tail',wings:'crow: narrower secondary chord and separated swept primary fingers',feet:'slender articulated legs, three forward toes and rear hallux'};
j('chest').bind=[.20,0,.016];j('neck').bind=[.08,0,.033];j('head').bind=[.065,0,.02];j('beak').bind=[.12,0,-.008];j('beakHook').bind=[.004,0,-.002];j('beak').gasket.diameterMeters=.012;
p('bodyPlate').size=[.185];p('neckPlate').size=[.105];p('headConnectorPlate').size=[.105];p('headPlate').size=[.12,.128];p('headPlate').material='paperMain';p('beakPlate').size=[.05];p('beakHookPlate').size=[.012];
j('tailBase').bind=[-.15,0,-.012];j('tailTip').bind=[-.30,0,-.015];
const tail=[[0,.045,0],[-.28,.075,-.015],[-.30,.055,-.015],[-.31,.025,-.015],[-.315,0,-.015],[-.31,-.025,-.015],[-.30,-.055,-.015],[-.28,-.075,-.015],[0,-.045,0]];
tail.forEach((v,i)=>j('tailFan'+i).bind=v);
for(const side of ['near','far']){
 const s=side==='near'?1:-1;
 j(side+'WingRootTrailing').bind=[-.12,0,0];j(side+'WingElbowTrailing').bind=[-.15,0,0];j(side+'WingWristTrailing').bind=[-.165,0,0];
 for(let i=0;i<14;i++){const a=j(side+'Primary'+i);a.bind[0]=round(a.bind[0]*.76);}
 p(side+'ThighPlate').size=[.043];p(side+'ShinPlate').size=[.024];p(side+'FootPlate').size=[.02];p(side+'TalonPlate').size=[.046,.039];
 for(const name of ['InnerToe','MiddleToe','OuterToe','Hallux'])p(side+name+'Plate').size=[.009];
 // Wing fold retains a narrow shoulder spacing rather than Eagle's broad breast.
 j(side+'WingRoot').bind[1]=s*.071;
}
r.plates.push({id:'tailQuillPlate',bone:'tailTip',span:['tailBase','tailTip'],shape:'taperedBone',size:[.025],role:'tail',bodyRegion:'tail',attachment:'rigid',material:'paperShade',zBias:1.9,semanticDetailTier:'silhouette'});
const motion=bakeAvianMotion(r,{scale,pitch:-12,groundHeight:.294,idleDuration:3600,walkDuration:840,runDuration:520,hopDuration:760,flightDuration:1250,glideDuration:2500,peckDuration:1250,talonStrike:false,hopWingAssist:true,wingbeat:{Root:{0:[[0,46],[.42,-40],[.56,-34],[.86,42],[1,46]]},Elbow:{0:[[0,3],[.42,-4],[.56,12],[.78,17],[1,3]],2:[[0,0],[.42,0],[.66,30],[.83,23],[1,0]]},Wrist:{0:[[0,8],[.42,15],[.56,-18],[.72,-32],[.9,-3],[1,8]],2:[[0,0],[.42,0],[.64,20],[.82,15],[1,0]]}}});
r.clips=motion.familyClips;
const m={$schema:'paper-rig/model-1',family:'crow',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}},clips:motion.modelClips};
for(const clip of [...Object.values(r.clips),...Object.values(m.clips)]){
 if(clip.motionSemantics)clip.motionSemantics=clip.motionSemantics.replaceAll('eagle','crow').replaceAll('Eagle','Crow');
 for(const f of clip.frames){
  if(clip===r.clips.idleA)f.rotations.neck[2]=round((f.rotations.neck[2]||0)*1.5);
 }
}
m.clips.hop.motionSemantics='paired-foot hop adapted from Crow Jump; crouch and landing contacts with a outward spread-wing assist during suspension';
m.clips.run.motionSemantics='authored faster alternating ground gait adapted from Crow Walk/WalkSpeed; no separate native Run action';
m.clips.attack.motionSemantics='authored airborne crow peck: quick neck-only angular jab over continuous flight, adapted because the native Crow has no named Attack';
function save(path,obj){let s=JSON.stringify(obj,null,2);for(const c of Object.values(obj.clips||{}))for(const f of c.frames||[]){const block=JSON.stringify(f,null,2).split('\n').map(line=>'        '+line).join('\n');s=s.replace(block,'        '+JSON.stringify(f));}fs.writeFileSync(path,s+'\n');}
save('rigs/families/crow.json',r);save('rigs/models/crow.json',m);
