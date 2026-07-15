// CLI smoke tests: exercise the `rig` commands end-to-end as a subprocess and
// assert exit codes and byte-parity of rendered output against the golden fixture.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
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
