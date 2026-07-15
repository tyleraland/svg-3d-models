#!/usr/bin/env node
// Capture golden fixtures from the current monolithic workbench.
//
// This is the regression oracle for the extraction. It loads the CURRENT
// `paper-rig-workbench.html` in headless Chromium, drives its `state` global,
// and dumps the outputs of the (soon to be extracted) pipeline so every ported
// module can be diffed against a known-good baseline.
//
//   node scripts/capture-fixtures.mjs
//
// Outputs (all under fixtures/):
//   paper-rig-workbench.baseline.html  copy of the source of truth at capture time
//   rigs/<model>.json                  JSON.stringify(rigs[model])         (resolver oracle)
//   packages/<model>.json              rigPayload() per model              (compile oracle)
//   svg/<model>@<clip>@<t>@<elev>@<az>.svg  exportedSvg() sweep            (render oracle)
//   contact-sheets/<model>.json        8 headings x 4 elevations grid      (sheet oracle)
//
// The page exposes `state`, `rigs`, `updateModel`, `rigPayload`, `exportedSvg`,
// `svgMarkup` as top-level classic-script globals reachable inside page.evaluate.

import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile, copyFile, readdir, rm } from 'node:fs/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'paper-rig-workbench.html');
const FIX = join(ROOT, 'fixtures');
const BASELINE = join(FIX, 'paper-rig-workbench.baseline.html');

// Models to capture the SVG render sweep for (kept bounded; broad all-model
// parity is proven live in the workbench parity test, not from committed SVGs).
// Only the models the CLI actually renders this increment need committed SVG
// goldens; broad all-model render parity is proven live (baseline vs regenerated
// workbench) in the Playwright parity test, which needs no committed SVGs.
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
  await copyFile(SRC, BASELINE);
  for (const sub of ['rigs', 'packages', 'svg', 'contact-sheets']) {
    await emptyDir(join(FIX, sub));
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(pathToFileURL(BASELINE).href);
  await page.waitForSelector('html[data-rig-ready="true"]', { timeout: 30000 });
  if (errors.length) {
    console.warn('WARNING: console errors while loading baseline:\n' + errors.join('\n'));
  }

  const models = await page.evaluate(() => Object.keys(rigs));
  console.log(`Loaded baseline with ${models.length} models.`);

  // 1. Raw rig objects (resolver oracle) — pure data, no state needed.
  for (const m of models) {
    const json = await page.evaluate((m) => JSON.stringify(rigs[m], null, 2), m);
    await writeFile(join(FIX, 'rigs', `${m}.json`), json + '\n');
  }
  console.log(`Captured ${models.length} rig fixtures.`);

  // 2. Compiled packages (compile oracle) — deterministic at default camera.
  for (const m of models) {
    const json = await page.evaluate((m) => {
      state.model = m;
      updateModel();
      state.clip = 'idle';
      state.t = 0;
      state.height = 1;
      state.width = 1;
      return JSON.stringify(rigPayload(), null, 2);
    }, m);
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
    const { svg, elev, az } = await page.evaluate(({ model, clip, t, cam }) => {
      state.model = model;
      updateModel();
      if (cam) { state.elev = cam[0]; state.az = cam[1]; }
      state.clip = clip;
      state.t = t;
      state.height = 1;
      state.width = 1;
      return { svg: exportedSvg(), elev: state.elev, az: state.az };
    }, { model, clip, t, cam });
    await writeFile(join(FIX, 'svg', svgName(model, clip, t, elev, az)), svg);
    svgCount++;
  }
  // Extra exact-command goldens.
  for (const { model, clip, t, elev, az } of EXTRA_SVGS) {
    const svg = await page.evaluate(({ model, clip, t, elev, az }) => {
      state.model = model;
      updateModel();
      state.elev = elev;
      state.az = az;
      state.clip = clip;
      state.t = t;
      state.height = 1;
      state.width = 1;
      return exportedSvg();
    }, { model, clip, t, elev, az });
    await writeFile(join(FIX, 'svg', svgName(model, clip, t, elev, az)), svg);
    svgCount++;
  }
  console.log(`Captured ${svgCount} SVG fixtures.`);

  // 4. Contact sheets (sheet oracle) — 8 headings x 4 elevations of clean markup.
  for (const model of SWEEP_MODELS) {
    const grid = await page.evaluate(({ model, headings, elevations }) => {
      state.model = model;
      updateModel();
      state.clip = 'idle';
      state.t = 0;
      state.height = 1;
      state.width = 1;
      const rig = rigs[model];
      const cells = [];
      for (const elev of elevations) {
        for (const az of headings) {
          state.elev = elev;
          state.az = az;
          cells.push({ elev, az, markup: svgMarkup(rig, 0, 'idle', 'projected', { clean: true }) });
        }
      }
      return cells;
    }, { model, headings: SHEET_HEADINGS, elevations: SHEET_ELEVATIONS });
    await writeFile(join(FIX, 'contact-sheets', `${model}.json`), JSON.stringify(grid, null, 2) + '\n');
  }
  console.log(`Captured ${SWEEP_MODELS.length} contact-sheet fixtures.`);

  await browser.close();
  console.log('Done. Fixtures written to fixtures/.');
}

main().catch((e) => { console.error(e); process.exit(1); });
