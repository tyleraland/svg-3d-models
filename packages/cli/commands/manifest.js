// `rig manifest <model> [-o candidate.json]` — generate canonical projected
// review evidence. Writing a candidate does not approve it; approval is an
// explicit human/version-control decision after inspecting the audit artifact.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadModel, loadModelConfigured } from '@paper-rig/rigs';
import { createAuditManifest } from '@paper-rig/validator/audit-manifest';
import { parseArgs } from '../lib/args.js';

export function runManifest(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out' });
  const target = positionals[0];
  if (!target || positionals.length > 1) {
    console.error('usage: rig manifest <model> [--motion] [--attachments] [-o candidate.json]');
    return 2;
  }

  const rig = flags.motion || flags.attachments
    ? loadModelConfigured(target, { motion: Boolean(flags.motion), attachments: Boolean(flags.attachments) }).rig
    : loadModel(target);
  const manifest = createAuditManifest(rig);
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  if (flags.out) {
    const out = resolve(process.cwd(), flags.out);
    writeFileSync(out, json);
    console.log(`manifest candidate: ${manifest.modelId}, ${manifest.views.length} views -> ${out}`);
  } else {
    process.stdout.write(json);
  }
  return 0;
}
