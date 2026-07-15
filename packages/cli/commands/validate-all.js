// `rig validate-all` — resolve and validate every model in rigs/models/. Prints a
// table and exits 1 if any model fails. This is the CI gate for creature health.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { validate } from '@paper-rig/validator';

const MODELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../rigs/models');

export function runValidateAll() {
  const files = readdirSync(MODELS_DIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) { console.error('no models found in rigs/models/'); return 2; }

  let failed = 0;
  for (const f of files) {
    const name = f.replace(/\.json$/, '');
    try {
      const rig = loadModel(name);
      const report = validate(rig);
      const issues = report.issues || [];
      const mark = report.status === 'passed' ? '✓' : '✗';
      if (report.status !== 'passed') failed++;
      console.log(`${mark} ${name.padEnd(18)} ${report.status.padEnd(7)} ${report.checks.length} checks, ${issues.length} issue${issues.length === 1 ? '' : 's'}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name.padEnd(18)} error   ${e.message}`);
    }
  }
  console.log(`\n${files.length - failed}/${files.length} models passed`);
  return failed ? 1 : 0;
}
