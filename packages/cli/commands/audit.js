// `rig audit <model> [--json] [-o report.html] [--against manifest.json]` —
// deterministic diagnostics plus a self-contained human review artifact and,
// when requested, a non-judgmental approved-manifest comparison.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadModel, loadModelConfigured } from '@paper-rig/rigs';
import { auditRig, renderAuditHtml } from '@paper-rig/validator/audit';
import { createAuditManifest, diffAuditManifests } from '@paper-rig/validator/audit-manifest';
import { parseArgs } from '../lib/args.js';

export function runAudit(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out' });
  const target = positionals[0];
  if (!target || positionals.length > 1 || (flags['fail-on-change'] && !flags.against)) {
    console.error('usage: rig audit <model> [--motion] [--attachments] [--json] [-o report.html] [--no-overlays] [--against manifest.json] [--fail-on-change]');
    return 2;
  }

  const configured = flags.motion || flags.attachments
    ? loadModelConfigured(target, { motion: Boolean(flags.motion), attachments: Boolean(flags.attachments) })
    : null;
  const rig = configured?.rig || loadModel(target);
  const report = auditRig(rig);
  if (configured?.attachmentManifest) report.attachmentAssembly = configured.attachmentManifest;
  if (configured?.motionManifest) report.motionResolution = configured.motionManifest;
  if (flags.against) {
    const approvedPath = resolve(process.cwd(), flags.against);
    const approved = JSON.parse(readFileSync(approvedPath, 'utf8'));
    report.approvedManifestDiff = diffAuditManifests(approved, createAuditManifest(rig));
  }
  const diff = report.approvedManifestDiff;
  const comparison = diff
    ? `, approved manifest ${diff.status}${diff.compatible ? ` (${diff.summary.changedViewCount} changed views)` : ''}`
    : '';
  if (flags.json) {
    const json = JSON.stringify(report, null, 2) + '\n';
    if (flags.out) {
      const out = resolve(process.cwd(), flags.out);
      writeFileSync(out, json);
      console.log(`audit ${report.status}: ${report.summary.viewCount} views, ${report.summary.issueCount} issues, ${report.summary.warningCount} warnings${comparison} -> ${out}`);
    } else {
      process.stdout.write(json);
    }
  } else {
    const out = resolve(process.cwd(), flags.out || `${rig.id}-audit.html`);
    writeFileSync(out, renderAuditHtml(rig, report, { overlays: !flags['no-overlays'] }));
    console.log(`audit ${report.status}: ${report.summary.viewCount} views, ${report.summary.issueCount} issues, ${report.summary.warningCount} warnings${comparison} -> ${out}`);
  }
  if (diff?.status === 'incompatible') return 2;
  if (flags['fail-on-change'] && diff?.status === 'changed') return 1;
  return report.status === 'passed' ? 0 : 1;
}
