import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import projectedSceneSchema from '@paper-rig/schema/schemas/projected-scene-1.schema.json' with { type: 'json' };
import {
  loadModel,
  loadModelAppearance,
  loadModelSource,
  loadPaintPrimitive,
} from '@paper-rig/rigs';
import { compilePackage, projectScene } from '@paper-rig/compiler';
import {
  AppearanceResolutionError,
  resolveAppearancePlan,
  validateAppearanceConfiguration,
  validatePaintPrimitive,
} from '@paper-rig/appearance';
import { validateAppearanceManifest } from '@paper-rig/validator/appearance';
import { createAuditManifest, validateAuditManifest } from '@paper-rig/validator/audit-manifest';

const validateScene = new Ajv2020({ allErrors: true, strict: true }).compile(projectedSceneSchema);
const paintElement = (scene) => scene.compositingGroups
  .flatMap((group) => group.elements)
  .find((element) => element.sourceKind === 'paint');

test('humanoid and quadruped resolve one reusable semantic paint primitive', () => {
  for (const name of ['humanoid', 'rabbit']) {
    const plain = loadModel(name);
    const { rig, manifest } = loadModelAppearance(name);
    assert.equal(plain.paint, undefined, `${name}: ordinary resolution remains appearance-free`);
    assert.equal(rig.paint.length, 1, name);
    assert.equal(rig.paint[0].primitiveId, 'faceBlaze', name);
    assert.equal(rig.paint[0].owningPlateId, 'headPlate', name);
    assert.equal(rig.paint[0].paletteRole, 'body.marking', name);
    assert.equal(validateAppearanceManifest(manifest).status, 'passed', name);
    const compiled = compilePackage(rig);
    assert.deepEqual(compiled.geometryCapabilities.semanticPaint, ['closedPath'], name);
    assert.equal(compiled.paletteRoles['body.marking'], 'semantic authored paint', name);
  }
});

test('paint follows its owning plate frame through animation and culls on the reverse surface', () => {
  const { rig } = loadModelAppearance('rabbit');
  const opts = { clip: 'attack', elevation: 60, heading: 180 };
  const bind = projectScene(rig, { ...opts, time: 0 });
  const impact = projectScene(rig, { ...opts, time: 0.62 });
  assert.equal(validateScene(bind), true, JSON.stringify(validateScene.errors));
  assert.equal(validateScene(impact), true, JSON.stringify(validateScene.errors));

  const before = paintElement(bind);
  const after = paintElement(impact);
  assert.ok(before?.surfaceFrame);
  assert.ok(after?.surfaceFrame);
  assert.equal(before.vector.attributes['data-owner-plate'], 'headPlate');
  assert.equal(before.vector.attributes['data-paint-primitive'], 'faceBlaze');
  assert.notEqual(after.vector.attributes.transform, before.vector.attributes.transform);
  assert.notDeepEqual(after.surfaceFrame.normal, before.surfaceFrame.normal);

  const reverse = projectScene(rig, { ...opts, time: 0.62, heading: 0 });
  assert.equal(paintElement(reverse), undefined, 'front-surface paint is not projected through the back of the head');
});

test('paint validation rejects open paths, invalid targets, and region escapes', () => {
  const rig = loadModel('rabbit');
  const model = loadModelSource('rabbit');
  const primitive = loadPaintPrimitive('faceBlaze');
  const primitives = { faceBlaze: primitive };

  const open = structuredClone(primitive);
  open.geometry.path = open.geometry.path.replace(/ Z$/, '');
  assert.equal(validatePaintPrimitive(open).status, 'failed');
  assert.ok(validatePaintPrimitive(open).issues.some((issue) => issue.id === 'paint-primitive-closed-geometry'));

  const multipleSubpaths = structuredClone(primitive);
  multipleSubpaths.geometry.path = 'M -0.2 -0.2 L 0.2 -0.2 M 0 0 L 0.2 0.2 Z';
  assert.ok(validatePaintPrimitive(multipleSubpaths).issues.some((issue) => issue.id === 'paint-primitive-closed-geometry'));

  const escaped = structuredClone(model.appearance);
  escaped.instances[0].transform.scale = [4, 4];
  const escapeReport = validateAppearanceConfiguration({ rig, plan: escaped, primitives });
  assert.ok(escapeReport.issues.some((issue) => issue.id === 'appearance-region-containment'));
  assert.throws(
    () => resolveAppearancePlan({ rig, plan: escaped, primitives }),
    AppearanceResolutionError,
  );

  const invalidTarget = structuredClone(model.appearance);
  invalidTarget.instances[0].ownerPlateId = 'torsoPlate';
  const targetReport = validateAppearanceConfiguration({ rig, plan: invalidTarget, primitives });
  assert.ok(targetReport.issues.some((issue) => issue.id === 'appearance-owner-shape'));
});

test('appearance resolution is deterministic and does not mutate source inputs', () => {
  const rig = loadModel('humanoid');
  const plan = loadModelSource('humanoid').appearance;
  const primitives = { faceBlaze: loadPaintPrimitive('faceBlaze') };
  const before = JSON.stringify({ rig, plan, primitives });
  const first = resolveAppearancePlan({ rig, sourceModelId: 'humanoid', plan, primitives });
  const second = resolveAppearancePlan({ rig, sourceModelId: 'humanoid', plan, primitives });
  assert.deepEqual(second, first);
  assert.equal(JSON.stringify({ rig, plan, primitives }), before);
});

test('canonical consumer evidence preserves semantic paint source metadata', () => {
  const { rig } = loadModelAppearance('humanoid');
  const manifest = createAuditManifest(rig, {
    headings: [180],
    elevations: [60],
    poses: [{ id: 'attackImpact', clip: 'attack', t: 0.62 }],
  });
  assert.equal(validateAuditManifest(manifest).valid, true);
  const paint = manifest.views[0].elements.find((element) => element.semantic.sourceKind === 'paint');
  assert.equal(paint.id, 'faceBlaze');
  assert.equal(paint.semantic.paletteRole, 'body.marking');
  assert.equal(paint.semantic.semanticRole, 'face.marking');
  assert.equal(paint.vector.attributes['data-owner-plate'], 'headPlate');
});
