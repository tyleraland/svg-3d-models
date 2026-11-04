import fs from 'node:fs';
import { makeEelFamily } from './lib/eel-family.mjs';

const family = makeEelFamily();
let text = JSON.stringify(family, null, 2);
for (const clip of Object.values(family.clips)) for (const frame of clip.frames) {
  const block = JSON.stringify(frame, null, 2).split('\n').map(line => '        ' + line).join('\n');
  text = text.replace(block, '        ' + JSON.stringify(frame));
}
fs.writeFileSync('rigs/families/eel.json', text + '\n');
fs.writeFileSync('rigs/models/eel.json', JSON.stringify({ $schema: 'paper-rig/model-1', family: 'eel', base: true,
  semanticDetailPolicy: { defaultTier: 'silhouette', byRole: { shadow: 'texture' } } }, null, 2) + '\n');
