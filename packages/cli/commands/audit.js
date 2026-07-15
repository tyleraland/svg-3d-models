// `rig audit <model> [--json] [-o report.html]` — deterministic multi-view
// diagnostics for agents/CI plus a self-contained human review artifact.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { auditRig, renderAuditHtml } from '@paper-rig/validator/audit';
import { parseArgs } from '../lib/args.js';

export function runAudit(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out' });
  const target = positionals[0];
  if (!target) { console.error('usage: rig audit <model> [--json] [-o report.html] [--no-overlays]'); return 2; }

  const rig = loadModel(target);
  const report = auditRig(rig);
  if (flags.json) {
    const json = JSON.stringify(report, null, 2) + '\n';
    if (flags.out) {
      const out = resolve(process.cwd(), flags.out);
      writeFileSync(out, json);
      console.log(`audit ${report.status}: ${report.summary.viewCount} views, ${report.summary.issueCount} issues, ${report.summary.warningCount} warnings -> ${out}`);
    } else {
      process.stdout.write(json);
    }
  } else {
    const out = resolve(process.cwd(), flags.out || `${rig.id}-audit.html`);
    writeFileSync(out, renderAuditHtml(rig, report, { overlays: !flags['no-overlays'] }));
    console.log(`audit ${report.status}: ${report.summary.viewCount} views, ${report.summary.issueCount} issues, ${report.summary.warningCount} warnings -> ${out}`);
  }
  return report.status === 'passed' ? 0 : 1;
}
