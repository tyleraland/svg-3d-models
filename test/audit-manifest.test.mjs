import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import manifestSchema from '@paper-rig/schema/schemas/audit-manifest-1.schema.json' with { type: 'json' };
import { loadModel } from '@paper-rig/rigs';
import { auditRig, renderAuditHtml } from '@paper-rig/validator/audit';
import { createAuditManifest, diffAuditManifests } from '@paper-rig/validator/audit-manifest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RIG = join(ROOT, 'packages/cli/bin/rig.js');
const ONE_VIEW = {
  headings: [0],
  elevations: [60],
  poses: [{ id: 'bind', clip: 'bind', t: 0 }],
};
const validateManifest = new Ajv2020({ allErrors: true, strict: true }).compile(manifestSchema);

test('audit manifests are deterministic, schema-valid, and ignore non-projected notes', () => {
  const rig = loadModel('rabbit');
  const manifest = createAuditManifest(rig, ONE_VIEW);
  assert.equal(validateManifest(manifest), true, JSON.stringify(validateManifest.errors));
  assert.deepEqual(createAuditManifest(rig, ONE_VIEW), manifest);
  assert.equal(diffAuditManifests(manifest, manifest).status, 'unchanged');

  const annotated = structuredClone(rig);
  annotated.profile = { ...(annotated.profile || {}), reviewNote: 'not projected' };
  assert.deepEqual(createAuditManifest(annotated, ONE_VIEW), manifest);
});

test('manifest diffs identify affected geometry without asserting that a change is wrong', () => {
  const rig = loadModel('rabbit');
  const approved = createAuditManifest(rig, ONE_VIEW);
  const changed = structuredClone(rig);
  changed.plates.find((plate) => plate.id === 'headPlate').size[0] *= 1.1;
  const diff = diffAuditManifests(approved, createAuditManifest(changed, ONE_VIEW));

  assert.equal(diff.compatible, true);
  assert.equal(diff.status, 'changed');
  assert.equal(diff.summary.changedViewCount, 1);
  assert.deepEqual(diff.changes[0].categories, ['vector-geometry']);
  assert.deepEqual(diff.changes[0].geometryChangedElementIds, ['headPlate', 'headPlateOccluderCell']);
  assert.equal('severity' in diff, false);

  const report = auditRig(changed, ONE_VIEW);
  report.approvedManifestDiff = diff;
  const html = renderAuditHtml(changed, report);
  assert.match(html, /Approved manifest comparison/);
  assert.match(html, /headPlate/);
});

test('manifest diffs separate semantic/compositing changes from vector changes', () => {
  const rig = loadModel('rabbit');
  const approved = createAuditManifest(rig, ONE_VIEW);
  const changed = structuredClone(rig);
  changed.plates.find((plate) => plate.id === 'torsoPlate').bodyRegion = 'accessory';
  const diff = diffAuditManifests(approved, createAuditManifest(changed, ONE_VIEW));
  const view = diff.changes[0];

  assert.ok(view.categories.includes('semantic-metadata'));
  assert.ok(view.categories.includes('compositing-order'));
  assert.ok(view.semanticChangedElementIds.includes('torsoPlate'));
  assert.ok(view.compositingChangedElementIds.includes('torsoPlate'));
});

test('manifest comparisons refuse mismatched models and sampling matrices', () => {
  const rabbit = createAuditManifest(loadModel('rabbit'), ONE_VIEW);
  const wolf = createAuditManifest(loadModel('wolf'), ONE_VIEW);
  const modelDiff = diffAuditManifests(rabbit, wolf);
  assert.equal(modelDiff.status, 'incompatible');
  assert.ok(modelDiff.incompatibilities.some((item) => item.code === 'manifest.model-id'));

  const otherSampling = createAuditManifest(loadModel('rabbit'), { ...ONE_VIEW, headings: [45] });
  const samplingDiff = diffAuditManifests(rabbit, otherSampling);
  assert.equal(samplingDiff.status, 'incompatible');
  assert.ok(samplingDiff.incompatibilities.some((item) => item.code === 'manifest.sampling'));
});

test('CLI generates candidates, reports approval diffs, and gates only by explicit opt-in', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rig-manifest-'));
  const manifestPath = join(dir, 'rabbit-candidate.json');
  const reportPath = join(dir, 'rabbit-audit.json');
  const stdout = execFileSync('node', [RIG, 'manifest', 'rabbit', '-o', manifestPath], { cwd: ROOT, encoding: 'utf8' });
  assert.match(stdout, /manifest candidate: rabbitBase, 192 views/);

  const approved = JSON.parse(readFileSync(manifestPath, 'utf8'));
  approved.views[0].elements[0].vector.attributes.rx = '999';
  writeFileSync(manifestPath, `${JSON.stringify(approved, null, 2)}\n`);

  const review = spawnSync('node', [RIG, 'audit', 'rabbit', '--json', '--against', manifestPath, '-o', reportPath], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(review.status, 0, review.stderr);
  assert.match(review.stdout, /approved manifest changed \(1 changed views\)/);
  assert.equal(JSON.parse(readFileSync(reportPath, 'utf8')).approvedManifestDiff.status, 'changed');

  const gate = spawnSync('node', [RIG, 'audit', 'rabbit', '--json', '--against', manifestPath, '--fail-on-change', '-o', reportPath], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(gate.status, 1);
});
