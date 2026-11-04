// Reproducible authoring source for the two finned-swimmer family presets.
import fs from 'node:fs';
import { makeFishFamily } from './lib/fish-family.mjs';

for (const kind of ['fish', 'shark']) {
  const family = makeFishFamily(kind);
  const model = { $schema: 'paper-rig/model-1', family: kind, base: true,
    semanticDetailPolicy: { defaultTier: 'silhouette', byRole: { shadow: 'texture' } } };
  // Compact sampled frames while keeping geometry and authoring fields readable.
  let text = JSON.stringify(family, null, 2);
  for (const clip of Object.values(family.clips)) for (const frame of clip.frames) {
    const block = JSON.stringify(frame, null, 2).split('\n').map(line => '        ' + line).join('\n');
    text = text.replace(block, '        ' + JSON.stringify(frame));
  }
  fs.writeFileSync(`rigs/families/${kind}.json`, text + '\n');
  fs.writeFileSync(`rigs/models/${kind}.json`, JSON.stringify(model, null, 2) + '\n');
}
