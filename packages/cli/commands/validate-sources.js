// `rig validate-sources [model]` — validate declarative model and family JSON
// before resolution. With no model, checks the complete authoring database.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadFamily, loadModelSource, resolveModel } from '@paper-rig/rigs';
import { validateSourcePair } from '@paper-rig/validator/source';
import { parseArgs } from '../lib/args.js';

const MODELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../rigs/models');

export function runValidateSources(argv) {
  const { positionals, flags } = parseArgs(argv);
  const targets = positionals.length
    ? positionals
    : readdirSync(MODELS_DIR).filter((file) => file.endsWith('.json')).sort().map((file) => file.replace(/\.json$/, ''));
  if (!targets.length) { console.error('no models found in rigs/models/'); return 2; }

  const results = [];
  let failed = 0;
  for (const target of targets) {
    try {
      const model = loadModelSource(target);
      const family = loadFamily(model.family);
      const preliminary = validateSourcePair(model, family);
      const report = preliminary.status === 'passed'
        ? validateSourcePair(model, family, { resolvedRig: resolveModel(model, family) })
        : preliminary;
      const name = target.endsWith('.json') ? target : target.replace(/\.json$/, '');
      results.push({ model: name, family: model.family, ...report });
      if (report.status !== 'passed') failed++;
    } catch (error) {
      failed++;
      results.push({ model: target, status: 'failed', checks: [], issues: [{ id: 'source-load', pass: false, detail: error.message }] });
    }
  }

  if (flags.json) {
    console.log(JSON.stringify({ status: failed ? 'failed' : 'passed', results }, null, 2));
  } else {
    for (const result of results) {
      const mark = result.status === 'passed' ? '✓' : '✗';
      console.log(`${mark} ${result.model.padEnd(18)} ${result.status.padEnd(7)} ${result.checks.length} source checks, ${result.issues.length} issue${result.issues.length === 1 ? '' : 's'}`);
      for (const issue of result.issues) console.log(`    - ${issue.id}: ${issue.detail}`);
    }
    console.log(`\n${results.length - failed}/${results.length} model sources passed`);
  }
  return failed ? 1 : 0;
}
