// Resolver-provenance tests: the optional sidecar must explain every resolved
// leaf without changing paper-rig/1 output or turning derived behavior into
// opaque compiled data.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import provenanceSchema from '@paper-rig/schema/schemas/provenance-1.schema.json' with { type: 'json' };
import explanationSchema from '@paper-rig/schema/schemas/explanation-1.schema.json' with { type: 'json' };
import {
  explainProvenance,
  loadModel,
  loadModelWithProvenance,
} from '@paper-rig/rigs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = readdirSync(join(ROOT, 'rigs/models'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace(/\.json$/, ''))
  .sort();
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateProvenance = ajv.compile(provenanceSchema);
const validateExplanation = ajv.compile(explanationSchema);

function assertSchemaValid(validate, value, label) {
  assert.equal(validate(value), true, `${label}: ${ajv.errorsText(validate.errors)}`);
}

test('all 31 provenance sidecars preserve rig output and explain every final leaf', () => {
  assert.equal(MODELS.length, 31);
  for (const model of MODELS) {
    const expected = loadModel(model);
    const { rig, provenance } = loadModelWithProvenance(model);
    assert.deepEqual(rig, expected, `${model} changed under provenance tracking`);
    assertSchemaValid(validateProvenance, provenance, `${model} provenance schema`);
    assert.equal(provenance.summary.unexplainedLeafCount, 0, `${model} has unexplained fields`);
    assert.equal(provenance.summary.writeCount, provenance.writes.length, `${model} write count`);
    assert.equal(
      Object.values(provenance.summary.finalOriginCounts).reduce((sum, count) => sum + count, 0),
      provenance.summary.leafCount,
      `${model} final origin count`,
    );
    for (let index = 1; index < provenance.writes.length; index += 1) {
      assert.ok(
        provenance.writes[index].sequence > provenance.writes[index - 1].sequence,
        `${model} write order at ${index}`,
      );
    }
  }
});

test('explain reports an ordered family, recipe, and explicit override chain', () => {
  const { provenance } = loadModelWithProvenance('rabbit');
  const explanation = explainProvenance(provenance, 'plate:nearRearUpperPlate.size');
  assertSchemaValid(validateExplanation, explanation, 'rabbit override explanation');
  assert.equal(explanation.status, 'found');
  assert.equal(explanation.fields.length, 1);
  const [field] = explanation.fields;
  assert.equal(field.targetPointer, '/plates/nearRearUpperPlate/size/0');
  assert.deepEqual(field.history.map((write) => write.origin.kind), [
    'family',
    'recipe',
    'model-override',
    'model-override',
  ]);
  assert.equal(field.origin.sourcePointer, '/plateSizeOverrides/0');
  assert.equal(field.value, 0.16);
});

test('explain distinguishes variant inputs, addons, family fields, and derived defaults', () => {
  const { provenance } = loadModelWithProvenance('rabbit');
  const cases = [
    ['plate:headPlate.size', 2, 'model-override', '/variant/plateTweaks/headPlate'],
    ['joint:nearEarTip.bind', 3, 'model-override', '/addons/0'],
    ['joint:root.bind', 3, 'family', '/joints/root/bind'],
    ['clip:idle', 21, 'derived-default', null],
    ['anchor:nearEarTipAnchor.moduleType', 1, 'derived-default', null],
  ];
  for (const [selector, fieldCount, kind, sourcePrefix] of cases) {
    const explanation = explainProvenance(provenance, selector);
    assertSchemaValid(validateExplanation, explanation, selector);
    assert.equal(explanation.fields.length, fieldCount, selector);
    assert.ok(explanation.fields.every((field) => field.origin.kind === kind), selector);
    if (sourcePrefix === null) {
      assert.ok(explanation.fields.every((field) => field.origin.sourcePointer === null), selector);
    } else {
      assert.ok(explanation.fields.every((field) => field.origin.sourcePointer.startsWith(sourcePrefix)), selector);
    }
  }
});

test('full clip overrides remain attributable to their source object', () => {
  const { provenance } = loadModelWithProvenance('horse');
  const explanation = explainProvenance(provenance, 'clip:attack.frames[1].rotations.neckBase');
  assertSchemaValid(validateExplanation, explanation, 'horse attack explanation');
  assert.equal(explanation.fields.length, 3);
  assert.ok(explanation.fields.every((field) => field.origin.kind === 'model-override'));
  assert.ok(explanation.fields.every((field) => field.origin.sourcePointer === '/clips/attack'));
});

test('semantic detail policies retain default, role, and explicit-ID provenance', async () => {
  const { loadFamily, loadModelSource, resolveModelWithProvenance } = await import('@paper-rig/rigs');
  const source = structuredClone(loadModelSource('horse'));
  source.semanticDetailPolicy.byId = { headPlate: 'identity' };
  const { provenance } = resolveModelWithProvenance(source, loadFamily(source.family), { sourceModelId: 'horse' });
  const cases = [
    ['plate:torsoPlate.semanticDetailTier', '/semanticDetailPolicy/defaultTier'],
    ['plate:castShadow.semanticDetailTier', '/semanticDetailPolicy/byRole/shadow'],
    ['plate:headPlate.semanticDetailTier', '/semanticDetailPolicy/byId/headPlate'],
  ];
  for (const [selector, sourcePointer] of cases) {
    const explanation = explainProvenance(provenance, selector);
    assert.equal(explanation.status, 'found');
    assert.equal(explanation.fields.length, 1);
    assert.equal(explanation.fields[0].origin.sourcePointer, sourcePointer);
  }
});

test('missing selectors produce a schema-valid not-found explanation', () => {
  const { provenance } = loadModelWithProvenance('rabbit');
  const explanation = explainProvenance(provenance, 'plate:notAPlate.size');
  assertSchemaValid(validateExplanation, explanation, 'not-found explanation');
  assert.equal(explanation.status, 'not-found');
  assert.deepEqual(explanation.fields, []);
});
