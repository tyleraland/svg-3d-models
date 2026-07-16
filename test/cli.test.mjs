// CLI smoke tests: exercise the `rig` commands end-to-end as a subprocess and
// assert exit codes and byte-parity of rendered output against the golden fixture.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RIG = join(ROOT, 'packages/cli/bin/rig.js');
const run = (args, opts = {}) => execFileSync('node', [RIG, ...args], { cwd: ROOT, encoding: 'utf8', ...opts });

test('validate exits 0 for a passing model', () => {
  const out = run(['validate', 'rigs/models/rabbit.json']);
  assert.match(out, /passed/);
});

test('validate-sources accepts every declarative model and family', () => {
  const out = run(['validate-sources']);
  assert.match(out, /31\/31 model sources passed/);
});

test('render output is byte-identical to the golden fixture', () => {
  const svg = run(['render', 'rabbit', '--clip', 'walk', '--time', '.25', '--elevation', '60', '--heading', '0', '--stdout']);
  const golden = readFileSync(join(ROOT, 'fixtures/svg/rabbit@walk@0.25@60@0.svg'), 'utf8');
  assert.equal(svg, golden);
});

test('render includes declared reusable modules only when attachments are requested', () => {
  const plain = run(['render', 'rabbit', '--stdout']);
  const assembled = run(['render', 'rabbit', '--attachments', '--stdout']);
  assert.doesNotMatch(plain, /travelPack__/);
  assert.match(assembled, /id="travelPack__body"/);
  assert.match(assembled, /id="simpleHat__body"/);
  assert.match(assembled, /data-palette-role="equipment"/);
});

test('render resolves motion recipes only when requested and composes capability flags', () => {
  const plain = run(['render', 'rabbit', '--clip', 'attack', '--time', '.22', '--stdout']);
  const motion = run(['render', 'rabbit', '--motion', '--clip', 'attack', '--time', '.22', '--stdout']);
  const combined = run(['render', 'rabbit', '--motion', '--attachments', '--clip', 'attack', '--time', '.22', '--stdout']);
  assert.doesNotMatch(plain, /paper-rig\/motion-resolution\/1/);
  assert.match(motion, /paper-rig\/motion-resolution\/1/);
  assert.notEqual(motion, plain);
  assert.match(combined, /paper-rig\/motion-resolution\/1/);
  assert.match(combined, /id="travelPack__body"/);
});

test('sheet produces 32 finite tiles', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-sheet-'));
  const out = run(['sheet', 'rabbit', '-o', join(dir, 'sheet.html')]);
  assert.match(out, /32 tiles/);
  const html = readFileSync(join(dir, 'sheet.html'), 'utf8');
  assert.equal((html.match(/<svg /g) || []).length, 32);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('validate-all exits 0 when every model passes', () => {
  const out = run(['validate-all']);
  assert.match(out, /models passed/);
});

test('explain displays the ordered override history for a semantic field', () => {
  const out = run(['explain', 'rabbit', 'plate:nearRearUpperPlate.size', '--history']);
  assert.match(out, /family \/plates\/nearRearUpperPlate\/size\/0 via family\.base/);
  assert.match(out, /recipe \/variant via variant\.quadruped/);
  assert.match(out, /model-override \/plateSizeOverrides\/0 via plates\.size-override/);
});

test('explain emits a stable machine-readable explanation', () => {
  const explanation = JSON.parse(run([
    'explain',
    'horse',
    'clip:attack.frames[1].rotations.neckBase',
    '--json',
  ]));
  assert.equal(explanation.schema, 'paper-rig/explanation/1');
  assert.equal(explanation.status, 'found');
  assert.equal(explanation.fields.length, 3);
  assert.ok(explanation.fields.every((field) => field.origin.sourcePointer === '/clips/attack'));
});

test('diff links declarative source edits to stable-ID resolved effects', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-diff-'));
  const candidatePath = join(dir, 'rabbitCandidate.json');
  const candidate = JSON.parse(readFileSync(join(ROOT, 'rigs/models/rabbit.json'), 'utf8'));
  candidate.variant.plateTweaks.headPlate[0] = 0.4;
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

  const diff = JSON.parse(run(['diff', 'rabbit', candidatePath, '--json']));
  assert.equal(diff.schema, 'paper-rig/semantic-diff/1');
  assert.equal(diff.status, 'changed');
  assert.equal(diff.summary.sourceChangeCount, 1);
  assert.equal(diff.summary.resolvedChangeCount, 1);
  assert.equal(diff.sourceChanges[0].sourcePointer, '/variant/plateTweaks/headPlate/0');
  assert.equal(diff.changes[0].targetPointer, '/plates/headPlate/size/0');

  const human = run(['diff', 'rabbit', candidatePath]);
  assert.match(human, /changed source \/variant\/plateTweaks\/headPlate\/0/);
  assert.match(human, /changed plate:headPlate\.size\[0\]/);
});
