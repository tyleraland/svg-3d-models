// `rig validate-sources [model]` — validate declarative model and family JSON
// before resolution. With no model, checks the complete authoring database.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  loadAttachmentModule,
  loadAttachmentModulesForModel,
  loadFamily,
  loadModelSource,
  resolveModel,
} from '@paper-rig/rigs';
import { validateSourcePair } from '@paper-rig/validator/source';
import { validateAttachmentModuleSource } from '@paper-rig/validator/attachments';
import { parseArgs } from '../lib/args.js';

const MODELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../rigs/models');
const MODULES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../rigs/modules');

export function runValidateSources(argv) {
  const { positionals, flags } = parseArgs(argv);
  const targets = positionals.length
    ? positionals
    : readdirSync(MODELS_DIR).filter((file) => file.endsWith('.json')).sort().map((file) => file.replace(/\.json$/, ''));
  if (!targets.length) { console.error('no models found in rigs/models/'); return 2; }

  const results = [];
  const moduleResults = [];
  let moduleFailed = 0;
  if (!positionals.length) {
    for (const file of readdirSync(MODULES_DIR).filter((item) => item.endsWith('.json')).sort()) {
      const name = file.replace(/\.json$/, '');
      try {
        const report = validateAttachmentModuleSource(loadAttachmentModule(name));
        moduleResults.push({ module: name, ...report });
        if (report.status !== 'passed') moduleFailed++;
      } catch (error) {
        moduleFailed++;
        moduleResults.push({ module: name, status: 'failed', checks: [], issues: [{ id: 'attachment-module-load', pass: false, detail: error.message }] });
      }
    }
  }
  let modelFailed = 0;
  for (const target of targets) {
    try {
      const model = loadModelSource(target);
      const family = loadFamily(model.family);
      const preliminary = validateSourcePair(model, family);
      const report = preliminary.status === 'passed'
        ? validateSourcePair(model, family, {
          resolvedRig: resolveModel(model, family),
          attachmentModules: loadAttachmentModulesForModel(model),
        })
        : preliminary;
      const name = target.endsWith('.json') ? target : target.replace(/\.json$/, '');
      results.push({ model: name, family: model.family, ...report });
      if (report.status !== 'passed') modelFailed++;
    } catch (error) {
      modelFailed++;
      results.push({ model: target, status: 'failed', checks: [], issues: [{ id: 'source-load', pass: false, detail: error.message }] });
    }
  }
  const failed = moduleFailed + modelFailed;

  if (flags.json) {
    console.log(JSON.stringify({ status: failed ? 'failed' : 'passed', modules: moduleResults, results }, null, 2));
  } else {
    for (const result of moduleResults) {
      const mark = result.status === 'passed' ? '✓' : '✗';
      console.log(`${mark} module:${result.module.padEnd(11)} ${result.status.padEnd(7)} ${result.checks.length} source checks, ${result.issues.length} issue${result.issues.length === 1 ? '' : 's'}`);
      for (const issue of result.issues) console.log(`    - ${issue.id}: ${issue.detail}`);
    }
    if (moduleResults.length) console.log(`\n${moduleResults.filter((result) => result.status === 'passed').length}/${moduleResults.length} attachment modules passed\n`);
    for (const result of results) {
      const mark = result.status === 'passed' ? '✓' : '✗';
      console.log(`${mark} ${result.model.padEnd(18)} ${result.status.padEnd(7)} ${result.checks.length} source checks, ${result.issues.length} issue${result.issues.length === 1 ? '' : 's'}`);
      for (const issue of result.issues) console.log(`    - ${issue.id}: ${issue.detail}`);
    }
    console.log(`\n${results.length - modelFailed}/${results.length} model sources passed`);
  }
  return failed ? 1 : 0;
}
