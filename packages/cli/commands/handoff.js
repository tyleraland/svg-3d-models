// `rig handoff <model> --profile consumer.json` — project one pose/camera and
// apply a versioned consumer profile without flattening or renumbering vectors.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadModel, loadModelConfigured } from '@paper-rig/rigs';
import { projectScene } from '@paper-rig/compiler';
import { createConsumerHandoff } from '@paper-rig/handoff';
import { validateConsumerHandoff, validateConsumerProfile } from '@paper-rig/validator/handoff';
import { parseArgs } from '../lib/args.js';

function formatErrors(errors) {
  return errors.map((error) => `${error.path} ${error.message}`).join('; ');
}

export function runHandoff(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out', e: 'elevation', h: 'heading' });
  const target = positionals[0];
  if (!target || positionals.length > 1 || !flags.profile) {
    console.error('usage: rig handoff <model> --profile <consumer.json> [--motion] [--attachments] [--paint] [--clip --time --elevation --heading] [-o out.json]');
    return 2;
  }

  const profilePath = resolve(process.cwd(), flags.profile);
  const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
  const profileValidation = validateConsumerProfile(profile);
  if (!profileValidation.valid) throw new Error(`consumer profile validation failed: ${formatErrors(profileValidation.errors)}`);

  const rig = flags.motion || flags.attachments || flags.paint
    ? loadModelConfigured(target, {
      motion: Boolean(flags.motion),
      attachments: Boolean(flags.attachments),
      appearance: Boolean(flags.paint),
    }).rig
    : loadModel(target);
  const opts = {};
  if (flags.clip !== undefined) opts.clip = flags.clip;
  if (flags.time !== undefined) opts.time = Number(flags.time);
  if (flags.elevation !== undefined) opts.elevation = Number(flags.elevation);
  if (flags.heading !== undefined) opts.heading = Number(flags.heading);

  const handoff = createConsumerHandoff(projectScene(rig, opts), profile);
  const handoffValidation = validateConsumerHandoff(handoff);
  if (!handoffValidation.valid) throw new Error(`consumer handoff validation failed: ${formatErrors(handoffValidation.errors)}`);
  const json = `${JSON.stringify(handoff, null, 2)}\n`;
  if (!flags.out) {
    process.stdout.write(json);
    return 0;
  }

  const out = resolve(process.cwd(), flags.out);
  writeFileSync(out, json);
  console.log(`consumer handoff: ${rig.id}, profile=${profile.id}, tier=${profile.selection.maximumDetailTier} -> ${out}`);
  return 0;
}
