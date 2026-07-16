// `rig validate-all` — resolve and validate every model in rigs/models/. Prints a
// table and exits 1 if any model fails. This is the CI gate for creature health.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  loadAttachmentModulesForModel,
  loadFamily,
  loadModelConfigured,
  loadModelSource,
  loadMotionRecipesForModel,
  resolveModel,
} from '@paper-rig/rigs';
import { validate } from '@paper-rig/validator';
import { validateSourcePair } from '@paper-rig/validator/source';

const MODELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../rigs/models');

export function runValidateAll() {
  const files = readdirSync(MODELS_DIR).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) { console.error('no models found in rigs/models/'); return 2; }

  let failed = 0;
  for (const f of files) {
    const name = f.replace(/\.json$/, '');
    try {
      const model = loadModelSource(name);
      const family = loadFamily(model.family);
      const preliminary = validateSourcePair(model, family);
      const rig = preliminary.status === 'passed' ? resolveModel(model, family) : null;
      const attachmentModules = preliminary.status === 'passed' ? loadAttachmentModulesForModel(model) : {};
      const motionRecipes = preliminary.status === 'passed' ? loadMotionRecipesForModel(model) : {};
      const sourceReport = preliminary.status === 'passed'
        ? validateSourcePair(model, family, { resolvedRig: rig, attachmentModules, motionRecipes })
        : preliminary;
      if (sourceReport.status !== 'passed') {
        failed++;
        console.log(`✗ ${name.padEnd(18)} source  ${sourceReport.checks.length} checks, ${sourceReport.issues.length} issue${sourceReport.issues.length === 1 ? '' : 's'}`);
        for (const issue of sourceReport.issues) console.log(`    - ${issue.id}: ${issue.detail}`);
        continue;
      }
      const validationRig = model.motion || model.attachments?.length
        ? loadModelConfigured(name, { motion: Boolean(model.motion), attachments: Boolean(model.attachments?.length) }).rig
        : rig;
      const report = validate(validationRig);
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
