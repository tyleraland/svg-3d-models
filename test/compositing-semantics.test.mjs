import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { compilePackage, core } from '@paper-rig/compiler';
import { auditRig } from '@paper-rig/validator/audit';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = readdirSync(join(ROOT, 'rigs/models'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();

test('inferred centerline anatomy never silently enters appendage compositing', () => {
  for (const model of MODELS) {
    const rig = loadModel(model);
    assert.deepEqual(core.inferredCentralAppendageConflicts(rig), [], model);
    const check = compilePackage(rig).validation.checks.find(
      (candidate) => candidate.id === 'inferred-central-appendage-regions',
    );
    assert.equal(check?.pass, true, `${model}: missing or failing semantic-region diagnostic`);
  }
});

test('the semantic-region diagnostic catches the original harpy failure mode', () => {
  const rig = structuredClone(loadModel('harpy'));
  const shoulder = rig.plates.find((plate) => plate.id === 'shoulderPlate');
  delete shoulder.bodyRegion;

  assert.deepEqual(core.inferredCentralAppendageConflicts(rig), [{
    plateId: 'shoulderPlate',
    jointId: 'shoulders',
    jointRole: 'body',
    inferredBodyRegion: 'limb',
  }]);

  const report = compilePackage(rig).validation;
  const check = report.checks.find((candidate) => candidate.id === 'inferred-central-appendage-regions');
  assert.equal(check.pass, false);
  assert.deepEqual(check.entityIds, ['shoulderPlate']);
  assert.equal(report.status, 'failed');

  const auditDiagnostic = auditRig(rig).diagnostics.find(
    (candidate) => candidate.code === 'rig.inferred-central-appendage-regions',
  );
  assert.equal(auditDiagnostic.pass, false);
  assert.deepEqual(auditDiagnostic.entityIds, ['shoulderPlate']);
});

test('an explicit region remains authoritative for intentional centerline appendages', () => {
  const rig = structuredClone(loadModel('harpy'));
  const shoulder = rig.plates.find((plate) => plate.id === 'shoulderPlate');
  shoulder.bodyRegion = 'limb';

  assert.deepEqual(core.inferredCentralAppendageConflicts(rig), []);
  const check = compilePackage(rig).validation.checks.find(
    (candidate) => candidate.id === 'inferred-central-appendage-regions',
  );
  assert.equal(check.pass, true);
});
