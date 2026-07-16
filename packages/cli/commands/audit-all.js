// `rig audit-all [--json] [-o report.json]` — run the deterministic audit over
// every declarative model and emit a compact catalog envelope for CI.

import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { loadModel, loadModelConfigured } from '@paper-rig/rigs';
import { auditCatalog } from '@paper-rig/validator/audit';
import { parseArgs } from '../lib/args.js';

const MODELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../rigs/models');

export function runAuditAll(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out' });
  if (positionals.length) {
    console.error('usage: rig audit-all [--motion] [--attachments] [--paint] [--json] [-o report.json]');
    return 2;
  }

  const names = readdirSync(MODELS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort();
  if (!names.length) {
    console.error('no models found in rigs/models/');
    return 2;
  }

  const report = auditCatalog(names.map((name) => ({
    sourceModelId: name,
    rig: flags.motion || flags.attachments || flags.paint
      ? loadModelConfigured(name, { motion: Boolean(flags.motion), attachments: Boolean(flags.attachments), appearance: Boolean(flags.paint) }).rig
      : loadModel(name),
  })));
  if (flags.json || flags.out) {
    const json = `${JSON.stringify(report, null, 2)}\n`;
    if (flags.out) {
      const out = resolve(process.cwd(), flags.out);
      writeFileSync(out, json);
      console.log(`audit-all ${report.status}: ${report.summary.passedModelCount}/${report.summary.modelCount} models, ${report.summary.issueCount} issues, ${report.summary.warningCount} warnings -> ${out}`);
    } else {
      process.stdout.write(json);
    }
  } else {
    for (const model of report.models) {
      const mark = model.status === 'passed' ? '✓' : '✗';
      console.log(`${mark} ${model.sourceModelId.padEnd(18)} ${model.status.padEnd(7)} ${model.summary.issueCount} issues, ${model.summary.warningCount} warnings`);
    }
    console.log(`\n${report.summary.passedModelCount}/${report.summary.modelCount} models passed; ${report.summary.issueCount} issues, ${report.summary.warningCount} advisory warnings`);
  }
  return report.status === 'passed' ? 0 : 1;
}
