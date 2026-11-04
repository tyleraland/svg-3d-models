import fs from 'node:fs';
import { makeMantaFamily } from './lib/manta-family.mjs';

const reference = JSON.parse(fs.readFileSync('authoring-data/manta-motion.json'));
const family = makeMantaFamily(reference);
let text = JSON.stringify(family, null, 2);
for (const clip of Object.values(family.clips)) for (const frame of clip.frames) {
  const block = JSON.stringify(frame, null, 2).split('\n').map(line => '        ' + line).join('\n');
  text = text.replace(block, '        ' + JSON.stringify(frame));
}
fs.writeFileSync('rigs/families/mantaRay.json', text + '\n');
fs.writeFileSync('rigs/models/mantaRay.json', JSON.stringify({ $schema: 'paper-rig/model-1', family: 'mantaRay', base: true,
  semanticDetailPolicy: { defaultTier: 'silhouette', byRole: { shadow: 'texture' } } }, null, 2) + '\n');
