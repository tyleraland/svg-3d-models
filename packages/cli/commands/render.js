// `rig render <model> [--attachments] [--clip idle --time 0 --elevation 60 --heading 0] [-o out.svg]`
// Resolve a model and write a standalone projected SVG for one pose and camera.

import { writeFileSync } from 'node:fs';
import { loadModel, loadModelConfigured } from '@paper-rig/rigs';
import { renderSvg } from '@paper-rig/compiler';
import { parseArgs } from '../lib/args.js';

export function runRender(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out', e: 'elevation', h: 'heading' });
  const target = positionals[0];
  if (!target) { console.error('usage: rig render <model> [--motion] [--attachments] [--paint] [--clip --time --elevation --heading] [-o out.svg]'); return 2; }

  const rig = flags.motion || flags.attachments || flags.paint
    ? loadModelConfigured(target, { motion: Boolean(flags.motion), attachments: Boolean(flags.attachments), appearance: Boolean(flags.paint) }).rig
    : loadModel(target);
  const opts = {};
  if (flags.clip !== undefined) opts.clip = flags.clip;
  if (flags.time !== undefined) opts.time = Number(flags.time);
  if (flags.elevation !== undefined) opts.elevation = Number(flags.elevation);
  if (flags.heading !== undefined) opts.heading = Number(flags.heading);

  const svg = renderSvg(rig, opts);
  if (flags.stdout) { process.stdout.write(svg); return 0; }

  const out = flags.out || `${rig.id}.svg`;
  writeFileSync(out, svg);
  const capabilities = [flags.motion && 'motion recipes', flags.attachments && 'attachments', flags.paint && 'semantic paint'].filter(Boolean);
  console.log(`rendered ${rig.id}${capabilities.length ? ` with ${capabilities.join(' + ')}` : ''} (clip=${opts.clip ?? 'idle'} t=${opts.time ?? 0} elev=${opts.elevation ?? rig.camera?.elevation} heading=${opts.heading ?? rig.camera?.azimuth}) -> ${out}`);
  return 0;
}
