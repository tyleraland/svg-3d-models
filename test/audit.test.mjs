import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel, loadModelAssembly, loadModelMotion } from '@paper-rig/rigs';
import { auditCatalog, auditRig, motionDiagnostics, renderAuditHtml } from '@paper-rig/validator/audit';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RIG = join(ROOT, 'packages/cli/bin/rig.js');

test('audit emits deterministic diagnostics over the complete canonical matrix', () => {
  const rig = loadModel('rabbit');
  const report = auditRig(rig);
  assert.equal(report.schema, 'paper-rig/audit/1');
  assert.equal(report.status, 'passed');
  assert.equal(report.summary.viewCount, 240);
  assert.deepEqual(report.sampling.poses.filter((pose) => pose.clip === 'attack').map((pose) => pose.id), [
    'attackAnticipation', 'attackImpact', 'attackRecovery',
  ]);
  assert.equal(report.issues.length, 0);
  assert.equal(report.summary.warningCount, report.warnings.length);
  assert.ok(report.warnings.every((item) => item.severity === 'warning'));
  assert.ok(report.diagnostics.some((item) => item.code === 'audit.rigid-span-policy' && item.pass));
  assert.ok(report.diagnostics.some((item) => item.code === 'audit.overlay-evidence' && item.pass));
  assert.deepEqual(auditRig(rig), report, 'audit output must be deterministic');
});

test('audit views carry traceable plate/depth, compositing, and contact overlay evidence', () => {
  const report = auditRig(loadModel('rabbit'), {
    headings: [0],
    elevations: [60],
    poses: [{ id: 'bind', clip: 'bind', t: 0 }],
  });
  const overlay = report.views[0].overlay;
  assert.equal(overlay.schema, 'paper-rig/audit-overlay/1');
  assert.deepEqual(overlay.compositingGroups.map((group) => group.order), [0, 1, 2, 3, 4, 5]);
  const head = overlay.plateLabels.find((label) => label.elementId === 'headPlate');
  assert.equal(head.sourceId, 'headPlate');
  assert.equal(head.groupId, 'coreSurfaceGroup');
  assert.match(head.label, /^headPlate · g3 · z-?\d/);
  assert.ok([...head.anchor, ...head.labelPosition, head.cameraDepth].every(Number.isFinite));
  assert.deepEqual(overlay.contacts.map((contact) => contact.jointId), [
    'farFrontPaw', 'farRearPaw', 'nearFrontPaw', 'nearRearPaw',
  ]);

  const humanoid = auditRig(loadModel('humanoid'), {
    headings: [315],
    elevations: [75],
    poses: [{ id: 'bind', clip: 'bind', t: 0 }],
  }).views[0].overlay;
  assert.equal(humanoid.anchors.length, 8);
  assert.ok(humanoid.anchors.every((anchor) => anchor.moduleType && anchor.screenPosition.every(Number.isFinite)));
  assert.equal(humanoid.surfaceNormals.length, 3);
  assert.ok(humanoid.surfaceNormals.every((normal) => (
    normal.cameraNormal.length === 3 && normal.cameraNormal.every(Number.isFinite)
  )));
});

test('audit HTML is self-contained and includes every sampled view', () => {
  const rig = loadModel('rabbit');
  const report = auditRig(rig);
  const html = renderAuditHtml(rig, report);
  assert.match(html, /rabbitBase paper-rig audit/);
  assert.equal((html.match(/<svg /g) || []).length, 240);
  assert.equal((html.match(/class="auditPlateDepthOverlay"/g) || []).length, 240);
  assert.match(html, /data-body-class="show-compositing"/);
  assert.match(html, /data-body-class="show-frames"/);
  assert.match(html, /data-body-class="show-contacts" checked/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
});

test('rig audit CLI writes a review artifact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-audit-'));
  const out = join(dir, 'rabbit-audit.html');
  const stdout = execFileSync('node', [RIG, 'audit', 'rabbit', '-o', out], { cwd: ROOT, encoding: 'utf8' });
  assert.match(stdout, /audit passed: 240 views, 0 issues, \d+ warnings/);
  assert.match(readFileSync(out, 'utf8'), /paper-rig\/audit\/1/);
});

test('rig audit can review the declared attachment assembly across the canonical matrix', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-attachment-audit-'));
  const out = join(dir, 'rabbit-attachments-audit.html');
  const stdout = execFileSync('node', [RIG, 'audit', 'rabbit', '--attachments', '-o', out], { cwd: ROOT, encoding: 'utf8' });
  assert.match(stdout, /audit passed: 240 views, 0 issues/);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /simpleHat__body/);
  assert.match(html, /travelPack__body/);
  assert.match(html, /paper-rig\/attachment-assembly\/1/);
  assert.match(html, /slotType&quot;: &quot;head\.hat/);
});

test('assembled audit overlays expose authored joint and plate slot positions', () => {
  const { rig } = loadModelAssembly('humanoid');
  const report = auditRig(rig, {
    headings: [315],
    elevations: [75],
    poses: [{ id: 'bind', clip: 'bind', t: 0 }],
  });
  const anchors = report.views[0].overlay.anchors;
  const headgear = anchors.find((anchor) => anchor.id === 'headgearSlot');
  const eyeDetail = anchors.find((anchor) => anchor.id === 'leftEyeDetailSlot');
  assert.equal(headgear.moduleType, 'head.hat');
  assert.equal(eyeDetail.moduleType, 'face.eye.detail');
  assert.deepEqual(eyeDetail.owner, { kind: 'plate', id: 'leftEyePlate' });
  assert.ok([...headgear.screenPosition, ...eyeDetail.screenPosition].every(Number.isFinite));
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

test('explicit phases drive audit samples and hard phase, event, and limit checks', () => {
  const rig = loadModelMotion('rabbit').rig;
  const report = auditRig(rig);
  assert.equal(report.status, 'passed');
  assert.deepEqual(report.sampling.poses.filter((pose) => pose.clip === 'attack'), [
    { id: 'attackAnticipation', clip: 'attack', t: 0.22 },
    { id: 'attackImpact', clip: 'attack', t: 0.62 },
    { id: 'attackRecovery', clip: 'attack', t: 0.82 },
  ]);
  for (const code of ['audit.phase-contract', 'audit.phase-event-alignment', 'audit.phased-joint-limits']) {
    assert.ok(report.diagnostics.some((item) => item.code === code && item.pass), code);
  }

  const invalid = structuredClone(rig);
  invalid.clips.attack.phases[1].from = 0.33;
  invalid.clips.attack.events[0].t = 0.5;
  invalid.clips.attack.frames[1].rotations.nearFrontKnee = [0, 160, 0];
  const failures = motionDiagnostics(invalid).filter((item) => !item.pass && item.severity === 'error');
  assert.deepEqual(failures.map((item) => item.code), [
    'audit.phase-contract',
    'audit.phase-event-alignment',
    'audit.phased-joint-limits',
  ]);
});

test('catalog audit is deterministic, compact, and warning-tolerant', () => {
  const rigs = [loadModel('rabbit'), loadModel('humanoid')];
  const report = auditCatalog(rigs);
  assert.equal(report.schema, 'paper-rig/audit-catalog/1');
  assert.equal(report.status, 'passed');
  assert.equal(report.summary.modelCount, 2);
  assert.equal(report.summary.viewCount, 480);
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
