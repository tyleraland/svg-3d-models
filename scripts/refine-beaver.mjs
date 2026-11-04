import{loadFamily}from'@paper-rig/rigs';
import{bakeSpecies,writeSpecies,sizeSeams,polygon}from'./lib/grounded-species.mjs';
const r=loadFamily('badger'),j=id=>r.joints.find(q=>q.id===id),p=id=>r.plates.find(q=>q.id===id);
Object.assign(r,{id:'beaverBase',family:'rodent',archetypes:['beaver','largeRodent'],heightMeters:.43,tokenScale:47,tokenGroundY:57,profile:{silhouette:'animal Beaver: high rounded rump, deep continuous pear-shaped barrel, small blunt head, tiny round ears, short forelimbs, large hind feet and broad flat paddle tail',locomotion:'short four-beat walk and quick low running strides; articulated shoulders, elbows, stifles and hocks',attack:'native Attack-informed braced head lift, incisor jaw opening and fast bite with recoil'}});
j('pelvis').bind=[-.22,0,.235];j('spineMid').bind=[.17,0,-.015];j('chest').bind=[.17,0,-.005];j('neckBase').bind=[.08,0,.005];j('head').bind=[.09,0,.025];j('muzzle').bind=[.09,0,-.025];
p('torsoPlate').size=[.32];p('frontBarrelPlate').size=[.28];p('pelvisPlate').size=[.38,.37];p('backPlate').size=[.34,.29];p('chestPlate').size=[.25,.25];p('neckPlate').size=[.19];p('headConnectorPlate').size=[.14];p('headPlate').size=[.19,.15];p('muzzleConnectorPlate').size=[.13];p('nosePlate').size=[.075,.055];p('castShadow').size=[1.65,.56];
j('jaw').bind=[.035,0,-.045];j('jawTip').bind=[.085,0,-.01];p('jawPlate').size=[.055];
// Rigid local XY paddle plus a narrow XZ thickness panel: neither billboards.
j('tailBase').bind=[-.16,0,-.115];j('tail1').bind=[-.13,0,-.05];j('tail2').bind=[-.15,0,-.012];j('tail3').bind=[-.14,0,.015];p('tailSocketPlate').size=[.10];p('tailSegment1Plate').size=[.075];p('tailSegment2Plate').size=[.04];p('tailSegment3Plate').size=[.02];
polygon(r,'tailPaddlePlate','tail1',[[.025,-.045,0],[-.07,-.105,0],[-.23,-.105,0],[-.30,-.045,0],[-.30,.045,0],[-.23,.105,0],[-.07,.105,0],[.025,.045,0]],'tail',{material:'paperShade',occlusionMode:'under-core'});
polygon(r,'tailThicknessPlate','tail1',[[.025,0,.012],[-.25,0,.012],[-.30,0,0],[-.25,0,-.012],[.025,0,-.012]],'tail',{material:'paperShade',occlusionMode:'under-core'});
r.plates=r.plates.filter(p=>!['tailSegment2Plate','tailSegment3Plate'].includes(p.id));r.joints=r.joints.filter(j=>!['tail2','tail3'].includes(j.id));
const claws=new Set(r.joints.filter(q=>/Claw/.test(q.id)).map(q=>q.id));r.joints=r.joints.filter(q=>!claws.has(q.id));r.plates=r.plates.filter(q=>!claws.has(q.bone)&&!q.span?.some(id=>claws.has(id)));
for(const side of ['near','far']){const s=side==='near'?1:-1;
 j(side+'EarBase').bind=[-.04,s*.068,.055];p(side+'EarPlate').size=[.035,.04];
 for(const part of ['Front','Rear']){const rear=part==='Rear';j(side+part+'Hip').bind=[rear?-.01:.025,s*(rear?.12:.10),-.035];p(side+part+'UpperPlate').size=[rear?.12:.075];p(side+part+'UpperPlate').occlusionMode=rear?'under-core':'surface-relative';p(side+part+'LowerPlate').size=[rear?.055:.035];p(side+part+'PawPlate').size=[rear?.14:.08,.03];
 if(rear)polygon(r,side+'HindWebPlate',side+part+'Paw',[[-.04,-.035,.006],[.08,-.05,.006],[.10,-.015,.006],[.085,.05,.006],[-.04,.035,.006]],'hoof',{material:'paperShade'});
 }
 for(const sign of [-1,1])polygon(r,side+(sign<0?'Lower':'Upper')+'IncisorPlate',sign<0?'jawTip':'muzzle',[[.02,-s*.022,.005],[.02,-s*.002,.005],[.02,-s*.002,-.02],[.02,-s*.022,-.02]],'head',{material:'paperLight',occlusionMode:'under-core'});
}
sizeSeams(r);bakeSpecies(r,{walkDuration:900,runDuration:450,walk:{stride:.40,lift:.16},run:{stride:.48,lift:.32,bodyRise:.08,bodyDip:.02,spineFlexDegrees:3},neckStrike:-12,headStrike:6,attackDuration:1200,attackSemantics:'native Attack-informed head lift and braced incisor snap, small body preload and recoil; four paws remain fixed'});writeSpecies('beaver',r);
