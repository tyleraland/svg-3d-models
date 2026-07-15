#!/usr/bin/env node
// paper-rig CLI. Runs the pure pipeline headless — no browser, no workbench.
//
//   rig validate <model|path.json> [--json]
//   rig render <model> [--clip --time --elevation --heading] [-o out.svg]
//   rig sheet <model> [--clip --time] [-o out.html]
//   rig validate-all
//   rig build-workbench [-o paper-rig-workbench.html]

import { runValidate } from '../commands/validate.js';
import { runRender } from '../commands/render.js';
import { runSheet } from '../commands/sheet.js';
import { runValidateAll } from '../commands/validate-all.js';
import { runBuildWorkbench } from '../commands/build-workbench.js';

const USAGE = `paper-rig CLI

  rig validate <model|path.json> [--json]         validate one model
  rig render <model> [flags] [-o out.svg]         render a projected SVG
      --clip <name> --time <0..1> --elevation <deg> --heading <deg> --stdout
  rig sheet <model> [--clip --time] [-o out.html] 8x4 heading/elevation contact sheet
  rig validate-all                                validate every model in rigs/models/
  rig build-workbench [-o file.html]              regenerate the workbench demo
`;

const [cmd, ...rest] = process.argv.slice(2);

function main() {
  switch (cmd) {
    case 'validate': return runValidate(rest);
    case 'render': return runRender(rest);
    case 'sheet': return runSheet(rest);
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
  process.exit(main());
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exit(1);
}
