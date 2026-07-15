#!/usr/bin/env node
// One-time migration: carve the workbench's HTML shell, DOM/UI layer, and the
// (not-yet-migrated) creature builders out of paper-rig-workbench.html into
// committed sources that `rig build-workbench` reassembles. After this runs, the
// HTML is a generated artifact; these files are edited directly.
//
//   node scripts/extract-workbench-sources.mjs
//
// Emits:
//   apps/workbench/template.html   HTML shell with a <!--PAPER_RIG_BUNDLE--> slot
//   apps/workbench/ui.js           DOM/UI code (render*, event bindings, state, ...)
//   rigs/legacy/builders.js        the 29 creatures still built imperatively

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(join(ROOT, 'paper-rig-workbench.html'), 'utf8');

// Reuse the same regex-aware scanner used for the package extraction.
const { scan } = await import('./lib/scan.mjs');
const mainOpen = HTML.indexOf('<script>', HTML.indexOf('id="workbench-maintainer-spec"'));
const mainClose = HTML.indexOf('</script>', mainOpen);
const scriptBody = HTML.slice(mainOpen + '<script>'.length, mainClose);
const { units, text } = scan(scriptBody);

// ---- template ----------------------------------------------------------------
const shellHead = HTML.slice(0, mainOpen + '<script>'.length);
const shellTail = HTML.slice(mainClose); // </script>\n</body></html>
const template = `${shellHead}\n/* PAPER_RIG_BUNDLE */\n${shellTail}\n`;
writeFileSync(join(ROOT, 'apps/workbench/template.html'), template);

// ---- bucket index ranges (see scripts/extract-packages.mjs for the full map) --
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Legacy creature builders: 7..153 and 156..164 (cloneData/groupBy at 154/155 are
// in @paper-rig/schema; the pipeline units 165..282 are in the packages/UI).
const BUILDERS = [...range(7, 153), ...range(156, 164)];

// DOM/UI: shell tag, state, $ helpers, and every render/selection/event/init unit.
const UI = [165, 166, 167, 168, 180, ...range(204, 218), 234, 235, 236, ...range(245, 250), ...range(252, 282)];

const emit = (indices) => indices.map((i) => text(i)).join('\n');

writeFileSync(join(ROOT, 'rigs/legacy/builders.js'),
  '// Legacy creature builders, extracted verbatim from paper-rig-workbench.html.\n'
  + '// A script fragment (NOT a standalone module): it is concatenated after the\n'
  + '// schema + compiler bundle by `rig build-workbench`, and defines the global\n'
  + '// `rigs` table the workbench UI drives. Creatures migrate out of here into\n'
  + '// rigs/models/*.json over time.\n/* eslint-disable */\n'
  + emit(BUILDERS) + '\n');

writeFileSync(join(ROOT, 'apps/workbench/ui.js'),
  '// Workbench DOM/UI layer, extracted verbatim from paper-rig-workbench.html.\n'
  + '// A script fragment concatenated after the pipeline + builders by\n'
  + '// `rig build-workbench`. Owns the mutable `state` the pure pipeline reads.\n/* eslint-disable */\n'
  + emit(UI) + '\n');

console.log(`template.html, ui.js (${UI.length} units), builders.js (${BUILDERS.length} units) written`);
