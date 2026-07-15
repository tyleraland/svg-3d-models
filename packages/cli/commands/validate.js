// `rig validate <model|path.json>` — resolve, compile, and validate a single
// model. Prints a summary (or the full JSON report with --json) and exits 0 iff
// every structural and directional check passes.

import { loadFamily, loadModelSource, resolveModel } from '@paper-rig/rigs';
import { validate } from '@paper-rig/validator';
import { validateSourcePair } from '@paper-rig/validator/source';
import { parseArgs } from '../lib/args.js';

export function runValidate(argv) {
  const { positionals, flags } = parseArgs(argv);
  const target = positionals[0];
  if (!target) { console.error('usage: rig validate <model|path.json> [--json]'); return 2; }

  const model = loadModelSource(target);
  const family = loadFamily(model.family);
  const sourceReport = validateSourcePair(model, family);
  if (sourceReport.status !== 'passed') {
    if (flags.json) console.log(JSON.stringify({ model: target, source: sourceReport }, null, 2));
    else {
      console.log(`✗ ${target}  failed source validation  (${sourceReport.issues.length} issue${sourceReport.issues.length === 1 ? '' : 's'})`);
      for (const issue of sourceReport.issues) console.log(`    - ${issue.id}: ${issue.detail}`);
    }
    return 1;
  }

  const rig = resolveModel(model, family);
  const report = validate(rig);

  if (flags.json) {
    console.log(JSON.stringify({ model: rig.id, ...report }, null, 2));
  } else {
    const issues = report.issues || [];
    const mark = report.status === 'passed' ? '✓' : '✗';
    console.log(`${mark} ${rig.id}  ${report.status}  (${report.checks.length} checks, ${issues.length} issue${issues.length === 1 ? '' : 's'})`);
    for (const i of issues) console.log(`    - ${i.id}: ${i.detail}`);
  }
  return report.status === 'passed' ? 0 : 1;
}
