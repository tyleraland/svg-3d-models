#!/usr/bin/env node
// Parity gate for `rig build-workbench`: load the committed baseline workbench and
// a freshly regenerated one side by side in headless Chromium and assert they
// behave identically — exportedSvg() and rigPayload() must match for every model,
// clip, time, and camera, the page must reach rigReady, and there must be zero
// console errors.
//
//   node scripts/check-workbench-parity.mjs [regenerated.html]

import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, 'fixtures/paper-rig-workbench.baseline.html');
const REGEN = resolve(process.cwd(), process.argv[2] || join(ROOT, 'paper-rig-workbench.html'));

const CLIPS = ['idle', 'walk', 'attack', 'hit', 'ko'];
const TIMES = [0, 0.25, 0.5, 0.62, 1];
const CAMERAS = [null, [60, 0], [45, 90], [90, 180]];

async function open(browser, file) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForSelector('html[data-rig-ready="true"]', { timeout: 30000 });
  return { page, errors };
}

// Drive one page over the full sweep, returning a signature array of outputs.
function sweep(page) {
  return page.evaluate(({ clips, times, cameras }) => {
    const out = [];
    for (const model of Object.keys(rigs)) {
      state.model = model; updateModel();
      const defaultCam = [state.elev, state.az];
      out.push('PKG:' + model + ':' + JSON.stringify(rigPayload()));
      for (const clip of clips) {
        if (!rigs[model].clips[clip]) continue;
        for (const t of times) {
          for (const cam of cameras) {
            const [elev, az] = cam || defaultCam;
            state.elev = elev; state.az = az; state.clip = clip; state.t = t;
            out.push([model, clip, t, elev, az].join('@') + '=' + exportedSvg());
          }
        }
      }
    }
    return out;
  }, { clips: CLIPS, times: TIMES, cameras: CAMERAS });
}

async function main() {
  const browser = await chromium.launch();
  const a = await open(browser, BASELINE);
  const b = await open(browser, REGEN);

  if (b.errors.length) {
    console.error('FAIL: regenerated workbench logged console errors:\n' + b.errors.join('\n'));
    await browser.close(); process.exit(1);
  }

  const [base, regen] = await Promise.all([sweep(a.page), sweep(b.page)]);
  await browser.close();

  if (base.length !== regen.length) {
    console.error(`FAIL: sweep length ${base.length} (baseline) vs ${regen.length} (regenerated)`);
    process.exit(1);
  }
  let mismatch = 0;
  for (let i = 0; i < base.length; i++) {
    if (base[i] !== regen[i]) {
      mismatch++;
      if (mismatch <= 3) {
        const label = base[i].slice(0, base[i].indexOf('='));
        let k = 0; while (k < base[i].length && base[i][k] === regen[i][k]) k++;
        console.error(`  mismatch @ ${label} (first diff at char ${k})`);
      }
    }
  }
  if (mismatch) { console.error(`FAIL: ${mismatch}/${base.length} outputs differ`); process.exit(1); }
  console.log(`workbench parity: ${base.length}/${base.length} outputs identical across all models, clips, times, cameras`);
  console.log('regenerated workbench is behavior-identical to the baseline, with zero console errors.');
}

main().catch((e) => { console.error(e); process.exit(1); });
