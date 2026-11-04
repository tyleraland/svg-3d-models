import fs from'node:fs';import{makeMerfolkFamily}from'./lib/merfolk-family.mjs';import{makeGastropodFamily}from'./lib/gastropod-family.mjs';
for(const[id,make]of [['merfolk',makeMerfolkFamily],['slug',()=>makeGastropodFamily('slug')],['snail',()=>makeGastropodFamily('snail')]]){
 const family=make();let text=JSON.stringify(family,null,2);for(const clip of Object.values(family.clips))for(const frame of clip.frames){const old=JSON.stringify(frame,null,2).split('\n').map(s=>'        '+s).join('\n');text=text.replace(old,'        '+JSON.stringify(frame));}
 fs.writeFileSync(`rigs/families/${id}.json`,text+'\n');fs.writeFileSync(`rigs/models/${id}.json`,JSON.stringify({$schema:'paper-rig/model-1',family:id,base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}}},null,2)+'\n');console.log(id,family.joints.length,'joints',family.plates.length,'plates');
}
