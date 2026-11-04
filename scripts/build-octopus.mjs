import fs from 'node:fs';
import {makeOctopusFamily} from './lib/octopus-family.mjs';
const reference=JSON.parse(fs.readFileSync('authoring-data/octopus-motion.json'));
const family=makeOctopusFamily(reference);
let text=JSON.stringify(family,null,2);
for(const clip of Object.values(family.clips))for(const frame of clip.frames){const block=JSON.stringify(frame,null,2).split('\n').map(line=>'        '+line).join('\n');text=text.replace(block,'        '+JSON.stringify(frame));}
fs.writeFileSync('rigs/families/octopus.json',text+'\n');
fs.writeFileSync('rigs/models/octopus.json',JSON.stringify({$schema:'paper-rig/model-1',family:'octopus',base:true,semanticDetailPolicy:{defaultTier:'silhouette',byRole:{shadow:'texture'}}},null,2)+'\n');
