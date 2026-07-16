// Machine-readable source validation for declarative models and family bases.
// This layer runs before resolution so misspelled fields and broken source
// references cannot be normalized away or hidden by generated defaults.

import Ajv2020 from 'ajv/dist/2020.js';
import modelSchema from '@paper-rig/schema/schemas/model-1.schema.json' with { type: 'json' };
import familySchema from '@paper-rig/schema/schemas/family-1.schema.json' with { type: 'json' };
import { validateModelAttachmentConfiguration } from './attachments.js';
import { validateModelAppearanceConfiguration } from './appearance.js';
import { validateModelMotionConfiguration } from './motion.js';

const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: false });
const validateModelSchema = ajv.compile(modelSchema);
const validateFamilySchema = ajv.compile(familySchema);

const pass = (id, detail) => ({ id, pass: true, detail });
const fail = (id, detail, path = '') => ({ id, pass: false, detail, path });

function schemaChecks(kind, validateSchema, value) {
  if (validateSchema(value)) return [pass(`${kind}-json-schema`, `${kind} source matches its JSON Schema`)];
  return (validateSchema.errors || []).map((error) => fail(
    `${kind}-json-schema`,
    `${error.instancePath || '/'} ${error.message}`,
    error.instancePath || '/',
  ));
}

function uniqueIds(items, kind) {
  const seen = new Set();
  const duplicates = [];
  for (const item of items || []) {
    if (seen.has(item.id)) duplicates.push(item.id);
    seen.add(item.id);
  }
  return duplicates.length
    ? fail(`family-unique-${kind}-ids`, `duplicate ${kind} IDs: ${[...new Set(duplicates)].join(', ')}`)
    : pass(`family-unique-${kind}-ids`, `${kind} IDs are unique`);
}

function referenceCheck(id, condition, detail) {
  return condition ? pass(id, detail) : fail(id, detail);
}

function surfaceFrameIsValid(frame) {
  if (!frame) return true;
  const vectors = [frame.normal, frame.tangent, frame.bitangent];
  if (!vectors.every((vector) => Array.isArray(vector) && vector.length === 3 && vector.every(Number.isFinite))) return false;
  const length = (vector) => Math.hypot(...vector);
  const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
  if (vectors.some((vector) => length(vector) < 1e-9)) return false;
  const unit = vectors.map((vector) => vector.map((value) => value / length(vector)));
  if (Math.abs(dot(unit[0], unit[1])) > 1e-6 || Math.abs(dot(unit[0], unit[2])) > 1e-6 || Math.abs(dot(unit[1], unit[2])) > 1e-6) return false;
  const cross = [
    unit[1][1] * unit[2][2] - unit[1][2] * unit[2][1],
    unit[1][2] * unit[2][0] - unit[1][0] * unit[2][2],
    unit[1][0] * unit[2][1] - unit[1][1] * unit[2][0],
  ];
  return dot(cross, unit[0]) > 1 - 1e-6;
}

function surfaceFrameChecks(plates, idPrefix) {
  const invalid = (plates || []).filter((plate) => plate.surfaceFrame && !surfaceFrameIsValid(plate.surfaceFrame));
  return [referenceCheck(
    `${idPrefix}-surface-frames`,
    invalid.length === 0,
    invalid.length ? `invalid right-handed orthogonal surface frames: ${invalid.map((plate) => plate.id || '(plate override)').join(', ')}` : 'explicit surface frames are finite, orthogonal, and right-handed',
  )];
}

function familySemanticChecks(family) {
  if (!family || typeof family !== 'object' || !Array.isArray(family.joints)) return [];

  const checks = [
    uniqueIds(family.joints, 'joint'),
    uniqueIds(family.plates, 'plate'),
    uniqueIds(family.anchors, 'anchor'),
  ];
  const jointIds = new Set(family.joints.map((joint) => joint.id));
  const anchorIds = new Set((family.anchors || []).map((anchor) => anchor.id));
  const materialIds = new Set(Object.keys(family.materials || {}));
  const clipIds = new Set(Object.keys(family.clips || {}));
  const roots = family.joints.filter((joint) => joint.parent == null);
  checks.push(referenceCheck('family-single-root', roots.length === 1, `expected one root joint; found ${roots.length}`));

  const ordered = new Set();
  let hierarchyPass = true;
  let counterpartPass = true;
  for (const joint of family.joints) {
    if (joint.parent != null && (!jointIds.has(joint.parent) || !ordered.has(joint.parent))) hierarchyPass = false;
    if (joint.mirror && !jointIds.has(joint.mirror)) counterpartPass = false;
    if (joint.diagonal && !jointIds.has(joint.diagonal)) counterpartPass = false;
    ordered.add(joint.id);
  }
  checks.push(referenceCheck('family-parent-order', hierarchyPass, 'every parent exists and precedes its children'));
  checks.push(referenceCheck('family-joint-counterparts', counterpartPass, 'mirror and diagonal joint references resolve'));

  const plateRefsPass = (family.plates || []).every((plate) =>
    jointIds.has(plate.bone)
    && (plate.span || []).every((id) => jointIds.has(id))
    && (plate.points || []).every((id) => jointIds.has(id))
    && materialIds.has(plate.material)
    && (!plate.occlusionReference || jointIds.has(plate.occlusionReference)));
  checks.push(referenceCheck('family-plate-references', plateRefsPass, 'plate bones, geometry controls, materials, and occlusion references resolve'));
  checks.push(...surfaceFrameChecks(family.plates, 'family'));

  const anchorRefsPass = (family.anchors || []).every((anchor) =>
    jointIds.has(anchor.bone) && (!anchor.counterpart || anchorIds.has(anchor.counterpart)));
  checks.push(referenceCheck('family-anchor-references', anchorRefsPass, 'anchor bones and counterparts resolve'));

  let clipRefsPass = true;
  let clipTimesPass = true;
  for (const clip of Object.values(family.clips || {})) {
    if (clip.base !== 'bind' && !clipIds.has(clip.base)) clipRefsPass = false;
    let previous = -Infinity;
    for (const frame of clip.frames || []) {
      if (frame.t < previous) clipTimesPass = false;
      previous = frame.t;
      for (const id of [...Object.keys(frame.poses || {}), ...Object.keys(frame.rotations || {})]) {
        if (!jointIds.has(id)) clipRefsPass = false;
      }
    }
    for (const id of clip.contacts || []) if (!jointIds.has(id)) clipRefsPass = false;
    for (const interval of clip.contactIntervals || []) {
      if (interval.from > interval.to) clipTimesPass = false;
      for (const id of interval.ids) if (!jointIds.has(id)) clipRefsPass = false;
    }
    let previousEvent = -Infinity;
    for (const event of clip.events || []) {
      if (event.t < previousEvent) clipTimesPass = false;
      previousEvent = event.t;
    }
  }
  checks.push(referenceCheck('family-clip-references', clipRefsPass, 'clip bases, transforms, and contacts resolve'));
  checks.push(referenceCheck('family-clip-times', clipTimesPass, 'frame, event, and contact times are ordered'));
  return checks;
}

function regularExpressionChecks(model) {
  const checks = [];
  const patterns = [
    ...(model?.plateSizeOverrides || []).map((item) => ['plateSizeOverrides', item.match]),
    ...(model?.occlusion || []).flatMap((item) => [
      ['occlusion', item.match],
      ...(typeof item.reference === 'object' ? [['occlusion.reference.ifMatch', item.reference.ifMatch]] : []),
    ]),
    ...(model?.plateOverrides || []).filter((item) => item.match).map((item) => ['plateOverrides', item.match]),
  ];
  for (const [scope, pattern] of patterns) {
    try {
      new RegExp(pattern);
      checks.push(pass('model-valid-regexp', `${scope} pattern /${pattern}/ is valid`));
    } catch (error) {
      checks.push(fail('model-valid-regexp', `${scope} pattern /${pattern}/ is invalid: ${error.message}`));
    }
  }
  return checks.length ? checks : [pass('model-valid-regexp', 'model has no invalid regular expressions')];
}

function overrideTargetChecks(model, family, resolvedRig) {
  if (!model || !family) return [];
  const plates = resolvedRig?.plates || family.plates || [];
  const anchors = resolvedRig?.anchors || family.anchors || [];
  const clips = resolvedRig?.clips || family.clips || {};
  const checks = [];
  const match = (pattern) => {
    try {
      const regexp = new RegExp(pattern);
      return plates.filter((plate) => regexp.test(plate.id)).length;
    } catch {
      return 0;
    }
  };

  for (const item of model.plateSizeOverrides || []) {
    const count = match(item.match);
    checks.push(referenceCheck('model-plate-size-override-target', count > 0, `plateSizeOverrides /${item.match}/ matches ${count} plate(s)`));
  }
  for (const item of model.occlusion || []) {
    const count = match(item.match);
    checks.push(referenceCheck('model-occlusion-override-target', count > 0, `occlusion /${item.match}/ matches ${count} plate(s)`));
  }
  for (const item of model.plateOverrides || []) {
    const count = item.id ? plates.filter((plate) => plate.id === item.id).length : match(item.match);
    checks.push(referenceCheck('model-plate-override-target', count > 0, `plate override ${item.id || `/${item.match}/`} matches ${count} plate(s)`));
  }
  for (const item of model.anchorOverrides || []) {
    const count = anchors.filter((anchor) => anchor.id === item.id).length;
    checks.push(referenceCheck('model-anchor-override-target', count > 0, `anchor override ${item.id} matches ${count} anchor(s)`));
  }
  for (const clip of Object.keys(model.clipEvents || {})) {
    checks.push(referenceCheck('model-clip-event-target', Boolean(clips[clip]), `clip event override targets ${clip}`));
  }
  if (resolvedRig) {
    const jointIds = new Set(resolvedRig.joints.map((joint) => joint.id));
    const rigidChildren = new Set(resolvedRig.plates
      .filter((plate) => plate.attachment === 'rigid' && plate.span?.length === 2)
      .map((plate) => plate.span[1]));
    for (const patch of model.clipPatches || []) {
      const clip = clips[patch.clip];
      checks.push(referenceCheck('model-clip-patch-target', Boolean(clip), `clip patch targets ${patch.clip}`));
      checks.push(referenceCheck(
        'model-clip-patch-keyframe',
        Boolean(clip?.frames.some((frame) => Math.abs(frame.t - patch.t) <= 1e-9)),
        `clip patch targets keyframe ${patch.clip}@${patch.t}`,
      ));
      const targets = [...Object.keys(patch.add.poses || {}), ...Object.keys(patch.add.rotations || {})];
      checks.push(referenceCheck(
        'model-clip-patch-joints',
        targets.every((id) => jointIds.has(id)),
        `clip patch joint IDs resolve: ${targets.join(', ')}`,
      ));
      const translatedRigidChildren = Object.entries(patch.add.poses || {})
        .filter(([id, vector]) => rigidChildren.has(id) && vector.some((value) => Math.abs(value) > 1e-9))
        .map(([id]) => id);
      checks.push(referenceCheck(
        'model-clip-patch-rigid-child-translation',
        translatedRigidChildren.length === 0,
        translatedRigidChildren.length
          ? `clip patch translates rigid-span child joints: ${translatedRigidChildren.join(', ')}`
          : 'clip patch does not translate rigid-span child joints',
      ));
    }
  }
  return checks.length ? checks : [pass('model-override-targets', 'model declares no unmatched overrides')];
}

function report(checks) {
  const issues = checks.filter((check) => !check.pass);
  return { status: issues.length ? 'failed' : 'passed', checks, issues };
}

export function validateModelSource(model) {
  const patchedPlates = (model?.plateOverrides || []).map((override) => ({ id: override.id || override.match, ...override.set }));
  return report([...schemaChecks('model', validateModelSchema, model), ...regularExpressionChecks(model), ...surfaceFrameChecks(patchedPlates, 'model')]);
}

export function validateFamilySource(family) {
  return report([...schemaChecks('family', validateFamilySchema, family), ...familySemanticChecks(family)]);
}

export function validateSourcePair(model, family, { resolvedRig, attachmentModules, motionRecipes, paintPrimitives } = {}) {
  const modelReport = validateModelSource(model);
  const familyReport = validateFamilySource(family);
  const attachmentReport = resolvedRig && attachmentModules !== undefined
    ? validateModelAttachmentConfiguration(model, resolvedRig, attachmentModules)
    : { checks: [] };
  const motionReport = resolvedRig && motionRecipes !== undefined
    ? validateModelMotionConfiguration(model, resolvedRig, motionRecipes)
    : { checks: [] };
  const appearanceReport = resolvedRig && paintPrimitives !== undefined
    ? validateModelAppearanceConfiguration(model, resolvedRig, paintPrimitives)
    : { checks: [] };
  return report([
    ...modelReport.checks,
    ...familyReport.checks,
    ...overrideTargetChecks(model, family, resolvedRig),
    ...attachmentReport.checks,
    ...motionReport.checks,
    ...appearanceReport.checks,
  ]);
}
