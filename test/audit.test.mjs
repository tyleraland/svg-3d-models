import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { auditCatalog, auditRig, motionDiagnostics, renderAuditHtml } from '@paper-rig/validator/audit';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RIG = join(ROOT, 'packages/cli/bin/rig.js');

test('audit emits deterministic diagnostics over the complete canonical matrix', () => {
  const rig = loadModel('rabbit');
  const report = auditRig(rig);
  assert.equal(report.schema, 'paper-rig/audit/1');
  assert.equal(report.status, 'passed');
  assert.equal(report.summary.viewCount, 192);
  assert.equal(report.issues.length, 0);
  assert.equal(report.summary.warningCount, report.warnings.length);
  assert.ok(report.warnings.every((item) => item.severity === 'warning'));
  assert.ok(report.diagnostics.some((item) => item.code === 'audit.rigid-span-policy' && item.pass));
  assert.deepEqual(auditRig(rig), report, 'audit output must be deterministic');
});

test('audit HTML is self-contained and includes every sampled view', () => {
  const rig = loadModel('rabbit');
  const report = auditRig(rig);
  const html = renderAuditHtml(rig, report);
  assert.match(html, /rabbitBase paper-rig audit/);
  assert.equal((html.match(/<svg /g) || []).length, 192);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
});

test('rig audit CLI writes a review artifact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-audit-'));
  const out = join(dir, 'rabbit-audit.html');
  const stdout = execFileSync('node', [RIG, 'audit', 'rabbit', '-o', out], { cwd: ROOT, encoding: 'utf8' });
  assert.match(stdout, /audit passed: 192 views, 0 issues, \d+ warnings/);
  assert.match(readFileSync(out, 'utf8'), /paper-rig\/audit\/1/);
});

test('hard motion diagnostics reject only contract violations', () => {
  const rig = structuredClone(loadModel('rabbit'));
  rig.clips.idle.base = 'walk';
  rig.clips.walk.base = 'idle';
  rig.clips.idle.frames[1].t = rig.clips.idle.frames[0].t;
  rig.clips.attack.events = [{ t: 0.8, name: 'later' }, { t: 0.2, name: 'earlier' }];
  rig.clips.walk.contactIntervals[0] = { ids: ['missingJoint'], from: 0.8, to: 0.2 };
  rig.clips.attack.frames[1].rotations.missingJoint = [0, 0, 0];
  rig.clips.idle.frames.at(-1).poses = { head: [0.1, 0, 0] };

  const failures = motionDiagnostics(rig).filter((item) => !item.pass && item.severity === 'error');
  assert.deepEqual(failures.map((item) => item.code), [
    'audit.clip-base-graph',
    'audit.keyframe-order',
    'audit.event-order',
    'audit.contact-interval-contract',
    'audit.finite-motion-transforms',
    'audit.loop-closure',
  ]);
  assert.ok(failures.every((item) => item.entityIds.length > 0));
});

test('motion quality guidance is advisory and does not fail a model', () => {
  const report = auditRig(loadModel('humanoid'));
  const participation = report.diagnostics.find((item) => item.code === 'audit.attack-core-participation');
  assert.equal(participation.pass, false);
  assert.equal(participation.severity, 'warning');
  assert.equal(report.status, 'passed');
  assert.equal(report.issues.includes(participation), false);
  assert.equal(report.warnings.includes(participation), true);
});

test('catalog audit is deterministic, compact, and warning-tolerant', () => {
  const rigs = [loadModel('rabbit'), loadModel('humanoid')];
  const report = auditCatalog(rigs);
  assert.equal(report.schema, 'paper-rig/audit-catalog/1');
  assert.equal(report.status, 'passed');
  assert.equal(report.summary.modelCount, 2);
  assert.equal(report.summary.viewCount, 384);
  assert.equal(report.summary.issueCount, 0);
  assert.ok(report.summary.warningCount > 0);
  assert.ok(report.models.every((model) => !('views' in model)));
  assert.deepEqual(report.models.map((model) => model.sourceModelId), ['humanoidBase', 'rabbitBase']);
  assert.deepEqual(auditCatalog(rigs), report);
});

test('rig audit-all CLI writes a CI-suitable catalog report', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-audit-all-'));
  const out = join(dir, 'catalog.json');
  const stdout = execFileSync('node', [RIG, 'audit-all', '--json', '-o', out], { cwd: ROOT, encoding: 'utf8' });
  const report = JSON.parse(readFileSync(out, 'utf8'));
  assert.match(stdout, /audit-all passed: 31\/31 models, 0 issues, \d+ warnings/);
  assert.equal(report.schema, 'paper-rig/audit-catalog/1');
  assert.equal(report.summary.modelCount, 31);
  assert.ok(report.models.some((model) => model.sourceModelId === 'rabbit' && model.modelId === 'rabbitBase'));
  assert.equal(report.status, 'passed');
});
