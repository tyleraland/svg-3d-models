#!/usr/bin/env node
// Parity gate for `rig build-workbench`: compare a freshly regenerated browser
// bundle with the current pure package sources. exportedSvg() and rigPayload()
// must match for every model, clip, time, and camera; the page must reach
// rigReady; and there must be zero console errors. The original monolith baseline
// is provenance, not the ongoing correctness oracle for intentional model fixes.
//
//   node scripts/check-workbench-parity.mjs [regenerated.html]
//   PAPER_RIG_MODELS=flyingBird npm run test:workbench # focused authoring check

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, renderSvg } from '@paper-rig/compiler';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGEN = resolve(process.cwd(), process.argv[2] || join(ROOT, 'paper-rig-workbench.html'));
const SYSTEM_CHROMIUM = [
  process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].find((candidate) => candidate && existsSync(candidate));

const CLIPS = ['idle', 'idleHind', 'walk', 'walkHind', 'attackHind', 'standUp', 'standDown', 'hop', 'trot', 'sprint', 'fly', 'glide', 'run', 'gallop', 'attack', 'pounce', 'hit', 'ko'];
const TIMES = [0, 0.25, 0.5, 0.62, 1];
const CAMERAS = [null, [60, 0], [45, 90], [90, 180]];

// Node and Chromium may use different V8 revisions, producing last-bit string
// differences such as 68.90864194094382 vs 68.90864194094385. Compare decimal
// tokens with a sub-pixel tolerance while requiring all intervening structure,
// ordering, IDs, and metadata to match exactly.
function equivalentOutput(expected, actual) {
  // Tokenize every JSON/SVG numeric spelling, including integers. Different V8
  // revisions may stringify the same computed value as `98` vs
  // `98.00000000000001`; the surrounding text is still compared byte-for-byte.
  if (expected === actual) return true;
  const pattern = /[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:e[+-]?\d+)?/gi;
  const left = new RegExp(pattern), right = new RegExp(pattern);
  let expectedOffset = 0, actualOffset = 0;
  // Stream numeric tokens instead of retaining millions of match objects for
  // large compiled packages. Coverage and tolerance remain unchanged.
  while (true) {
    const a = left.exec(expected), b = right.exec(actual);
    if (!a || !b) {
      return !a && !b && expected.slice(expectedOffset) === actual.slice(actualOffset);
    }
    if (expected.slice(expectedOffset, a.index) !== actual.slice(actualOffset, b.index)) return false;
    if (Math.abs(Number(a[0]) - Number(b[0])) > 1e-10) return false;
    expectedOffset = a.index + a[0].length;
    actualOffset = b.index + b[0].length;
  }
}

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
function sweep(page, models, clips = CLIPS, includePackage = true) {
  return page.evaluate(({ clips, times, cameras, models, includePackage }) => {
    const out = [];
    for (const model of models) {
      state.model = model; updateModel();
      const defaultCam = [state.elev, state.az];
      if (includePackage) out.push('PKG:' + model + ':' + JSON.stringify(rigPayload()));
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
  }, { clips, times: TIMES, cameras: CAMERAS, models, includePackage });
}

function packageSweep(models, clips = CLIPS, includePackage = true) {
  const out = [];
  for (const model of models) {
    const rig = loadModel(model);
    const defaultCam = [rig.camera?.elevation ?? 90, rig.camera?.azimuth ?? 0];
    if (includePackage) out.push('PKG:' + model + ':' + JSON.stringify(compilePackage(rig)));
    for (const clip of clips) {
      if (!rig.clips[clip]) continue;
      for (const time of TIMES) {
        for (const camera of CAMERAS) {
          const [elevation, heading] = camera || defaultCam;
          out.push([model, clip, time, elevation, heading].join('@') + '=' + renderSvg(rig, {
            clip, time, elevation, heading,
          }));
        }
      }
    }
  }
  return out;
}

async function main() {
  // Prefer Playwright's pinned browser, but keep local development usable when
  // node_modules is present without the separate browser download. CI should
  // still install the pinned browser for reproducibility.
  const browser = await chromium.launch(SYSTEM_CHROMIUM ? { executablePath: SYSTEM_CHROMIUM } : {});
  const regenerated = await open(browser, REGEN);

  if (regenerated.errors.length) {
    console.error('FAIL: regenerated workbench logged console errors:\n' + regenerated.errors.join('\n'));
    await browser.close(); process.exit(1);
  }

  const catalog = await regenerated.page.evaluate(() => Object.keys(rigs));
  const requested = process.env.PAPER_RIG_MODELS?.split(',').map(s => s.trim()).filter(Boolean);
  if (requested?.some(id => !catalog.includes(id))) throw new Error('PAPER_RIG_MODELS contains an unknown model');
  const models = requested?.length ? catalog.filter(id => requested.includes(id)) : catalog;
  // Bound browser transport responses by one clip. Dense baked clips can
  // make the complete catalog exceed V8's maximum string size in one message.
  let outputCount = 0, mismatch = 0;
  for (const model of models) {
    console.log(`checking ${model}`);
    for (const clip of [null, ...CLIPS]) {
      const clips = clip === null ? [] : [clip];
      const expected = packageSweep([model], clips, clip === null);
      const regen = await sweep(regenerated.page, [model], clips, clip === null);
      if (expected.length !== regen.length) throw new Error(`Sweep length differs for ${model}`);
      outputCount += expected.length;

      for (let i = 0; i < expected.length; i++) {
        if (!equivalentOutput(expected[i], regen[i])) {
          mismatch++;
          if (mismatch <= 3) {
            let k = 0; while (k < expected[i].length && expected[i][k] === regen[i][k]) k++;
            console.error(`Mismatch ${model}, output ${i}, character ${k}`);
            console.error(JSON.stringify(expected[i].slice(Math.max(0, k - 60), k + 140)));
            console.error(JSON.stringify(regen[i].slice(Math.max(0, k - 60), k + 140)));
          }
        }
      }
    }
  }
  const patchUi = await regenerated.page.evaluate(() => {
    state.model = 'rabbit';
    state.modelTransforms.rabbit = defaultModelTransform('rabbit');
    state.jointTransforms.rabbit = {};
    state.height = 1;
    state.width = 1;
    updateModel();
    const empty = {
      status: currentSourcePatchInspection().status,
      disabled: $('#copySourcePatch').disabled,
    };
    state.clip = 'attack';
    state.t = 0.5;
    state.jointTransforms.rabbit.neck = { move: [0, 0, 0], rot: [0, 10, 0] };
    render();
    const nonKeyframe = {
      code: currentSourcePatchInspection().code,
      disabled: $('#copySourcePatch').disabled,
    };
    state.t = 0.62;
    render();
    const ids = [...document.querySelectorAll('#mainSvg [id]')].map((element) => element.id);
    const onionTimes = [...document.querySelectorAll('#mainSvg .onionSkin')]
      .map((element) => Number(element.dataset.time));
    const turntableHeadings = [...document.querySelectorAll('.turntableCell')]
      .map((element) => Number(element.dataset.heading));
    document.querySelector('.turntableCell[data-heading="315"]').click();
    return {
      empty,
      nonKeyframe,
      status: currentSourcePatchInspection().status,
      disabled: $('#copySourcePatch').disabled,
      patch: JSON.parse($('#patchText').textContent),
      review: {
        onionTimes,
        uniqueMainSvgIds: new Set(ids).size === ids.length,
        turntableHeadings,
        comparisonElevation: state.compareElev,
        clickedCamera: [state.elev, normalizeHeading(state.az)],
        exportedHasDiagnostics: /onionSkin|turntableCell/.test(exportedSvg()),
      },
    };
  });
  const labelsUi = await regenerated.page.evaluate(() => {
    const toggle = (id, checked) => { const el = document.getElementById(id); if (el.checked !== checked) el.click(); };
    const read = () => ({ labels: document.querySelectorAll('#mainSvg .labelText').length,
      bones: document.querySelectorAll('#mainSvg .boneLine').length });
    toggle('bones', false); toggle('showLabels', true);
    const labelsOnly = read();
    toggle('showLabels', false);
    const neither = read();
    toggle('bones', true);
    const bonesOnly = read();
    toggle('showLabels', true);
    const both = read();
    return { labelsOnly, neither, bonesOnly, both, grouped: ['showLabels','bones','contacts'].every(id=>document.getElementById(id).closest('[aria-label="Projection overlays"]')) };
  });
  if (!(labelsUi.grouped && labelsUi.labelsOnly.labels > 0 && labelsUi.labelsOnly.bones === 0
    && labelsUi.neither.labels === 0 && labelsUi.neither.bones === 0
    && labelsUi.bonesOnly.labels === 0 && labelsUi.bonesOnly.bones > 0
    && labelsUi.both.labels > 0 && labelsUi.both.bones > 0)) {
    console.error('FAIL: labels and skeleton toggles are coupled', labelsUi);
    await browser.close(); process.exit(1);
  }
  const browserErrors = [...regenerated.errors];
  await browser.close();

  const authoringUiReady = patchUi.empty.status === 'empty'
    && patchUi.empty.disabled
    && patchUi.nonKeyframe.code === 'not-a-keyframe'
    && patchUi.nonKeyframe.disabled
    && patchUi.status === 'ready'
    && !patchUi.disabled
    && patchUi.patch?.$schema === 'paper-rig/model-patch-1'
    && patchUi.patch?.sourceModelId === 'rabbit'
    && patchUi.patch?.operation?.value?.clip === 'attack'
    && patchUi.patch?.operation?.value?.t === 0.62
    && JSON.stringify(patchUi.patch?.operation?.value?.add?.rotations?.neck) === '[0,10,0]'
    && JSON.stringify(patchUi.review?.onionTimes) === '[0,1]'
    && patchUi.review?.uniqueMainSvgIds
    && JSON.stringify(patchUi.review?.turntableHeadings) === '[0,45,90,135,180,225,270,315]'
    && patchUi.review?.comparisonElevation === 60
    && JSON.stringify(patchUi.review?.clickedCamera) === '[60,-45]'
    && patchUi.review?.exportedHasDiagnostics === false;
  if (!authoringUiReady) {
    console.error('FAIL: workbench patch/review UI did not enforce the expected patch, onion-skin, or turntable states');
    console.error(JSON.stringify(patchUi, null, 2));
    process.exit(1);
  }
  if (browserErrors.length) {
    console.error('FAIL: regenerated workbench logged console errors during the sweep:\n' + browserErrors.join('\n'));
    process.exit(1);
  }

  if (mismatch) { console.error(`FAIL: ${mismatch}/${outputCount} outputs differ`); process.exit(1); }
  console.log(`workbench parity: ${outputCount}/${outputCount} package/browser outputs identical across ${requested?.length ? "selected models" : "all models"}, clips, times, cameras`);
  console.log('workbench authoring UI: patch states, onion skins, turntable, and independent labels/skeleton toggles passed');
  console.log('regenerated workbench matches the current package sources, with zero console errors.');
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
