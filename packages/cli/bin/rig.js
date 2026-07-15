#!/usr/bin/env node
// paper-rig CLI. Runs the pure pipeline headless — no browser, no workbench.
//
//   rig validate <model|path.json> [--json]
//   rig render <model> [--clip --time --elevation --heading] [-o out.svg]
//   rig sheet <model> [--clip --time] [-o out.html]
//   rig audit <model> [--json] [-o report.html]
//   rig audit-all [--json] [-o report.json]
//   rig manifest <model> [-o candidate.json]
//   rig explain <model> <entity[.field]> [--json] [--history]
//   rig diff <baseline-model> <candidate-model> [--json]
//   rig validate-sources [model]
//   rig validate-all
//   rig build-workbench [-o paper-rig-workbench.html]

import { runValidate } from '../commands/validate.js';
import { runRender } from '../commands/render.js';
import { runSheet } from '../commands/sheet.js';
import { runAudit } from '../commands/audit.js';
import { runAuditAll } from '../commands/audit-all.js';
import { runManifest } from '../commands/manifest.js';
import { runExplain } from '../commands/explain.js';
import { runDiff } from '../commands/diff.js';
import { runValidateSources } from '../commands/validate-sources.js';
import { runValidateAll } from '../commands/validate-all.js';
import { runBuildWorkbench } from '../commands/build-workbench.js';

const USAGE = `paper-rig CLI

  rig validate <model|path.json> [--json]         validate one model
  rig render <model> [flags] [-o out.svg]         render a projected SVG
      --clip <name> --time <0..1> --elevation <deg> --heading <deg> --stdout
  rig sheet <model> [--clip --time] [-o out.html] 8x4 heading/elevation contact sheet
  rig audit <model> [--json] [-o report.html]      deterministic 240-view audit
      --against <manifest.json> [--fail-on-change]
  rig audit-all [--json] [-o report.json]          audit every model; warnings do not fail CI
  rig manifest <model> [-o candidate.json]         emit canonical projected review evidence
  rig explain <model> <entity[.field]> [--json] [--history]
                                                   explain resolved field provenance
  rig diff <baseline-model> <candidate-model> [--json]
                                                   source-to-semantic model diff
  rig validate-sources [model] [--json]            validate authoring JSON and references
  rig validate-all                                validate every model in rigs/models/
  rig build-workbench [-o file.html]              regenerate the workbench demo
`;

const [cmd, ...rest] = process.argv.slice(2);

function main() {
  switch (cmd) {
    case 'validate': return runValidate(rest);
    case 'render': return runRender(rest);
    case 'sheet': return runSheet(rest);
    case 'audit': return runAudit(rest);
    case 'audit-all': return runAuditAll(rest);
    case 'manifest': return runManifest(rest);
    case 'explain': return runExplain(rest);
    case 'diff': return runDiff(rest);
    case 'validate-sources': return runValidateSources(rest);
    case 'validate-all': return runValidateAll(rest);
    case 'build-workbench': return runBuildWorkbench(rest);
    case undefined:
    case '-h':
    case '--help':
    case 'help':
      process.stdout.write(USAGE);
      return 0;
    default:
      console.error(`unknown command: ${cmd}\n`);
      process.stdout.write(USAGE);
      return 2;
  }
}

try {
  // Let Node drain stdout before exiting. Calling process.exit() immediately can
  // truncate large `rig render --stdout` SVGs when stdout is a pipe.
  process.exitCode = main();
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exitCode = 1;
}
