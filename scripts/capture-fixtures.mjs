#!/usr/bin/env node
// Capture byte-exact golden fixtures from the current package implementation,
// after smoke-loading the generated workbench in Chromium. Package/browser
// equivalence is independently proven by check-workbench-parity.mjs with a
// cross-V8 numeric tolerance.
//
// This is the golden-output refresh tool for the extracted pipeline. Node owns
// byte formatting for the Node golden tests; Chromium remains a runtime smoke
// check rather than a source of engine-dependent decimal strings.
//
//   node scripts/capture-fixtures.mjs
//   node scripts/capture-fixtures.mjs --reset-baseline  # exceptional migration use
//
// Outputs (all under fixtures/):
//   paper-rig-workbench.baseline.html  immutable original-monolith provenance
//   rigs/<model>.json                  JSON.stringify(rigs[model])         (resolver oracle)
//   packages/<model>.json              rigPayload() per model              (compile oracle)
//   svg/<model>@<clip>@<t>@<elev>@<az>.svg  exportedSvg() sweep            (render oracle)
//   contact-sheets/<model>.json        8 headings x 4 elevations grid      (sheet oracle)
//
// The page exposes `state`, `rigs`, `updateModel`, `rigPayload`, `exportedSvg`,
// `svgMarkup` as top-level classic-script globals reachable inside page.evaluate.

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile, copyFile, readdir, rm } from 'node:fs/promises';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, markup, renderSvg } from '@paper-rig/compiler';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'paper-rig-workbench.html');
const FIX = join(ROOT, 'fixtures');
const BASELINE = join(FIX, 'paper-rig-workbench.baseline.html');
const RESET_BASELINE = process.argv.includes('--reset-baseline');
const SYSTEM_CHROMIUM = [
  process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].find((candidate) => candidate && existsSync(candidate));

// Models to capture the SVG render sweep for (kept bounded; broad all-model
// parity is proven live against package sources, not from committed SVGs).
// Only the models the CLI actually renders this increment need committed SVG
// goldens; broad all-model render parity is proven live (package sources vs
// generated workbench) in Playwright, which needs no committed SVGs.
const SWEEP_MODELS = ['rabbit', 'quadruped'];
const SWEEP_CLIPS = ['idle', 'walk', 'attack'];
const SWEEP_TIMES = [0, 0.25, 0.5];
// camera: null = the model's default camera (set by updateModel); else [elev, az]
const SWEEP_CAMERAS = [null, [60, 0]];
// The exact command documented in the plan must have a golden output.
const EXTRA_SVGS = [{ model: 'rabbit', clip: 'walk', t: 0.25, elev: 60, az: 0 }];

const SHEET_HEADINGS = [0, 45, 90, 135, 180, 225, 270, 315];
const SHEET_ELEVATIONS = [30, 45, 60, 75];

function svgName(model, clip, t, elev, az) {
  return `${model}@${clip}@${t}@${elev}@${az}.svg`;
}

async function emptyDir(dir) {
  await mkdir(dir, { recursive: true });
  for (const f of await readdir(dir)) await rm(join(dir, f), { recursive: true, force: true });
}

async function main() {
  await mkdir(FIX, { recursive: true });
  // The baseline is provenance from the original monolith. Normal model and
  // fixture updates must not silently replace it with the generated workbench.
  if (RESET_BASELINE) await copyFile(SRC, BASELINE);
  for (const sub of ['rigs', 'packages', 'svg', 'contact-sheets']) {
    await emptyDir(join(FIX, sub));
  }

  const browser = await chromium.launch(SYSTEM_CHROMIUM ? { executablePath: SYSTEM_CHROMIUM } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(pathToFileURL(SRC).href);
  await page.waitForSelector('html[data-rig-ready="true"]', { timeout: 30000 });
  if (errors.length) {
    console.warn('WARNING: console errors while loading generated workbench:\n' + errors.join('\n'));
  }

  const models = await page.evaluate(() => Object.keys(rigs));
  console.log(`Loaded generated workbench with ${models.length} models.`);

  // 1. Raw rig objects (resolver oracle) — pure package data.
  for (const m of models) {
    const json = JSON.stringify(loadModel(m), null, 2);
    await writeFile(join(FIX, 'rigs', `${m}.json`), json + '\n');
  }
  console.log(`Captured ${models.length} rig fixtures.`);

  // 2. Compiled packages (compile oracle) — deterministic Node byte format.
  for (const m of models) {
    const json = JSON.stringify(compilePackage(loadModel(m)), null, 2);
    await writeFile(join(FIX, 'packages', `${m}.json`), json + '\n');
  }
  console.log(`Captured ${models.length} package fixtures.`);

  // 3. SVG render sweep (render oracle).
  const svgJobs = [];
  for (const model of SWEEP_MODELS) {
    for (const clip of SWEEP_CLIPS) {
      for (const t of SWEEP_TIMES) {
        for (const cam of SWEEP_CAMERAS) {
          svgJobs.push({ model, clip, t, cam });
        }
      }
    }
  }
  let svgCount = 0;
  for (const { model, clip, t, cam } of svgJobs) {
    const rig = loadModel(model);
    const elev = cam?.[0] ?? rig.camera?.elevation ?? 90;
    const az = cam?.[1] ?? rig.camera?.azimuth ?? 0;
    const svg = renderSvg(rig, { clip, time: t, elevation: elev, heading: az });
    await writeFile(join(FIX, 'svg', svgName(model, clip, t, elev, az)), svg);
    svgCount++;
  }
  // Extra exact-command goldens.
  for (const { model, clip, t, elev, az } of EXTRA_SVGS) {
    const svg = renderSvg(loadModel(model), { clip, time: t, elevation: elev, heading: az });
    await writeFile(join(FIX, 'svg', svgName(model, clip, t, elev, az)), svg);
    svgCount++;
  }
  console.log(`Captured ${svgCount} SVG fixtures.`);

  // 4. Contact sheets (sheet oracle) — 8 headings x 4 elevations of clean markup.
  for (const model of SWEEP_MODELS) {
    const rig = loadModel(model);
    const grid = SHEET_ELEVATIONS.flatMap((elev) => SHEET_HEADINGS.map((az) => ({
      elev,
      az,
      markup: markup(rig, { clip: 'idle', time: 0, elevation: elev, heading: az }),
    })));
    await writeFile(join(FIX, 'contact-sheets', `${model}.json`), JSON.stringify(grid, null, 2) + '\n');
  }
  console.log(`Captured ${SWEEP_MODELS.length} contact-sheet fixtures.`);

  await browser.close();
  console.log('Done. Fixtures written to fixtures/.');
}

main().catch((e) => { console.error(e); process.exit(1); });
