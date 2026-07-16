// @paper-rig/appearance — pure plate-local semantic paint resolution.
// Paint sources are reusable, versioned data. Models place them on an explicit
// bounded surface region; resolution emits ordinary rig-local paint records for
// the compiler and never introduces product colors or CSS as authoring data.

import { cloneData } from '@paper-rig/schema';

const EPSILON = 1e-9;
const COMMAND_ARITY = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
const pass = (id, detail) => ({ id, pass: true, detail });
const fail = (id, detail) => ({ id, pass: false, detail });
const check = (id, condition, detail) => condition ? pass(id, detail) : fail(id, detail);
const stableId = (value) => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);
const semanticRole = (value) => typeof value === 'string' && /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/.test(value);
const vector2 = (value) => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
const vector3 = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const unique = (values) => new Set(values).size === values.length;
const report = (checks) => {
  const issues = checks.filter((item) => !item.pass);
  return { status: issues.length ? 'failed' : 'passed', checks, issues };
};

function tokenizeClosedPath(path) {
  if (typeof path !== 'string') return null;
  const tokens = path.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) || [];
  const residue = path.replace(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?|[\s,]+/g, '');
  if (residue || tokens[0] !== 'M' || tokens.at(-1) !== 'Z') return null;
  const points = [];
  let index = 0;
  let moveCount = 0;
  while (index < tokens.length) {
    const command = tokens[index++];
    const arity = COMMAND_ARITY[command];
    if (arity == null || index + arity > tokens.length) return null;
    if (command === 'M' && ++moveCount > 1) return null;
    if (command === 'Z') {
      if (index !== tokens.length) return null;
      continue;
    }
    const numbers = tokens.slice(index, index + arity).map(Number);
    if (!numbers.every(Number.isFinite)) return null;
    for (let axis = 0; axis < numbers.length; axis += 2) points.push([numbers[axis], numbers[axis + 1]]);
    index += arity;
    if (index < tokens.length && !/[A-Za-z]/.test(tokens[index])) return null;
  }
  return points.length >= 3 ? points : null;
}

function rightHandedFrame(frame) {
  const vectors = [frame?.tangent, frame?.bitangent, frame?.normal];
  if (!vectors.every(vector3)) return false;
  const dot = (left, right) => left.reduce((sum, value, axis) => sum + value * right[axis], 0);
  const lengths = vectors.map((vector) => Math.hypot(...vector));
  if (lengths.some((length) => Math.abs(length - 1) > 1e-6)) return false;
  if (Math.abs(dot(vectors[0], vectors[1])) > 1e-6
    || Math.abs(dot(vectors[0], vectors[2])) > 1e-6
    || Math.abs(dot(vectors[1], vectors[2])) > 1e-6) return false;
  const [tangent, bitangent, normal] = vectors;
  const cross = [
    tangent[1] * bitangent[2] - tangent[2] * bitangent[1],
    tangent[2] * bitangent[0] - tangent[0] * bitangent[2],
    tangent[0] * bitangent[1] - tangent[1] * bitangent[0],
  ];
  return dot(cross, normal) > 1 - 1e-6;
}

function regionValid(region) {
  if (!vector2(region?.center) || !vector2(region?.size) || region.size.some((value) => value <= 0)) return false;
  return region.center.every((value, axis) => (
    value - region.size[axis] / 2 >= -1 - EPSILON
    && value + region.size[axis] / 2 <= 1 + EPSILON
  ));
}

function transformValid(transform) {
  return vector2(transform?.translate)
    && vector2(transform?.scale)
    && transform.scale.every((value) => value > 0)
    && Number.isFinite(transform?.rotateDegrees);
}

function transformedPoints(points, transform) {
  const radians = transform.rotateDegrees * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return points.map(([x, y]) => {
    const sx = x * transform.scale[0];
    const sy = y * transform.scale[1];
    return [
      transform.translate[0] + sx * cosine - sy * sine,
      transform.translate[1] + sx * sine + sy * cosine,
    ];
  });
}

function regionContains(region, points) {
  if (!regionValid(region) || !points.length) return false;
  return points.every((point) => point.every((value, axis) => (
    value >= region.center[axis] - region.size[axis] / 2 - EPSILON
    && value <= region.center[axis] + region.size[axis] / 2 + EPSILON
  )));
}

export function validatePaintPrimitive(primitive) {
  const points = tokenizeClosedPath(primitive?.geometry?.path);
  return report([
    check(
      'paint-primitive-schema',
      primitive?.$schema === 'paper-rig/paint-primitive-1' && primitive?.schemaVersion === '1.0.0',
      'paint primitive declares the supported versioned schema',
    ),
    check('paint-primitive-id', stableId(primitive?.id), `paint primitive ${primitive?.id || '(missing)'} has a stable ID`),
    check('paint-primitive-role', semanticRole(primitive?.semanticRole), 'paint semantic role uses a namespaced token'),
    check('paint-primitive-palette', semanticRole(primitive?.paletteRole), 'paint palette role uses a namespaced semantic token'),
    check(
      'paint-primitive-detail-tier',
      ['identity', 'expression', 'texture', 'micro'].includes(primitive?.detailTier),
      'paint primitive declares a semantic detail tier',
    ),
    check(
      'paint-primitive-closed-geometry',
      primitive?.geometry?.type === 'closedPath' && Boolean(points),
      'paint geometry is one closed absolute M/L/Q/C/Z path',
    ),
    check(
      'paint-primitive-normalized-geometry',
      Boolean(points) && points.every((point) => point.every((value) => value >= -1 && value <= 1)),
      'paint path endpoints and curve controls stay in primitive-local normalized bounds',
    ),
  ]);
}

function registryById(primitives) {
  if (Array.isArray(primitives)) return Object.fromEntries(primitives.map((primitive) => [primitive.id, primitive]));
  return primitives || {};
}

export function validateAppearanceConfiguration({ rig, plan, primitives = {} }) {
  const instances = plan?.instances || [];
  const registry = registryById(primitives);
  const plateById = new Map((rig?.plates || []).map((plate) => [plate.id, plate]));
  const emittedIds = new Set([
    ...(rig?.joints || []).map((joint) => joint.id),
    ...(rig?.plates || []).map((plate) => plate.id),
    ...(rig?.paint || []).map((paint) => paint.id),
  ]);
  const checks = [
    check(
      'appearance-plan-schema',
      instances.length === 0 || plan?.$schema === 'paper-rig/appearance-plan-1',
      'nonempty appearance plans declare paper-rig/appearance-plan-1',
    ),
    check('appearance-instance-ids', unique(instances.map((instance) => instance.id)), 'paint instance IDs are unique'),
  ];

  for (const instance of instances) {
    const primitive = registry[instance.primitiveId];
    const owner = plateById.get(instance.ownerPlateId);
    const primitiveReport = primitive ? validatePaintPrimitive(primitive) : null;
    const transform = instance.transform || { translate: [0, 0], rotateDegrees: 0, scale: [1, 1] };
    const points = primitiveReport?.status === 'passed' ? tokenizeClosedPath(primitive.geometry.path) : [];
    checks.push(check(
      'appearance-instance-shape',
      stableId(instance.id) && stableId(instance.primitiveId) && stableId(instance.ownerPlateId),
      `paint instance ${instance.id || '(missing)'} has stable instance, primitive, and owner IDs`,
    ));
    checks.push(check('appearance-primitive-reference', Boolean(primitive), `paint instance ${instance.id} references primitive ${instance.primitiveId}`));
    if (primitiveReport) checks.push(...primitiveReport.checks.map((item) => ({ ...item, detail: `${instance.id}/${primitive.id}: ${item.detail}` })));
    checks.push(check(
      'appearance-owner-reference',
      Boolean(owner),
      `paint instance ${instance.id} targets existing plate ${instance.ownerPlateId}`,
    ));
    checks.push(check(
      'appearance-owner-shape',
      Boolean(owner) && owner.role !== 'shadow' && !owner.span && !owner.points && Array.isArray(owner.size) && owner.size.length === 2,
      `paint instance ${instance.id} targets a bounded rigid two-axis plate`,
    ));
    checks.push(check('appearance-surface-frame', rightHandedFrame(instance.surfaceFrame), `paint instance ${instance.id} declares an orthonormal right-handed plate-local frame`));
    checks.push(check('appearance-region', regionValid(instance.region), `paint instance ${instance.id} declares a bounded normalized owner region`));
    checks.push(check('appearance-transform', transformValid(transform), `paint instance ${instance.id} transform is finite with positive scale`));
    checks.push(check(
      'appearance-region-containment',
      Boolean(points?.length) && transformValid(transform) && regionContains(instance.region, transformedPoints(points, transform)),
      `paint instance ${instance.id} geometry fits its declared plate-local region`,
    ));
    checks.push(check(
      'appearance-palette-role',
      instance.paletteRole == null || semanticRole(instance.paletteRole),
      `paint instance ${instance.id} optional palette override is semantic`,
    ));
    checks.push(check('appearance-stable-id-collision', !emittedIds.has(instance.id), `paint instance ${instance.id} does not collide with resolved geometry IDs`));
    emittedIds.add(instance.id);
  }

  if (!instances.length) checks.push(pass('appearance-plan-instances', 'model declares no appearance instances'));
  return report(checks);
}

export class AppearanceResolutionError extends Error {
  constructor(reportValue) {
    super(`appearance configuration failed: ${reportValue.issues.map((item) => item.detail).join('; ')}`);
    this.name = 'AppearanceResolutionError';
    this.report = reportValue;
  }
}

export function resolveAppearancePlan({ rig, sourceModelId = rig.id, plan, primitives = {} }) {
  const validation = validateAppearanceConfiguration({ rig, plan, primitives });
  if (validation.status !== 'passed') throw new AppearanceResolutionError(validation);
  const registry = registryById(primitives);
  const resolvedRig = cloneData(rig);
  resolvedRig.paint = [...(resolvedRig.paint || [])];
  const manifestInstances = [];

  for (const instance of plan?.instances || []) {
    const primitive = registry[instance.primitiveId];
    const transform = instance.transform || { translate: [0, 0], rotateDegrees: 0, scale: [1, 1] };
    const resolved = {
      id: instance.id,
      primitiveId: primitive.id,
      owningPlateId: instance.ownerPlateId,
      semanticRole: primitive.semanticRole,
      paletteRole: instance.paletteRole || primitive.paletteRole,
      detailTier: primitive.detailTier,
      lodTier: primitive.detailTier === 'identity' ? 'detail' : 'micro',
      opacity: 1,
      geometry: cloneData(primitive.geometry),
      surfaceFrame: cloneData(instance.surfaceFrame),
      region: cloneData(instance.region),
      transform: cloneData(transform),
      compositingGroup: 'paint/details/accessories',
    };
    resolvedRig.paint.push(resolved);
    manifestInstances.push({
      id: resolved.id,
      primitiveId: resolved.primitiveId,
      ownerPlateId: resolved.owningPlateId,
      semanticRole: resolved.semanticRole,
      paletteRole: resolved.paletteRole,
      detailTier: resolved.detailTier,
      region: cloneData(resolved.region),
      transform: cloneData(resolved.transform),
    });
  }

  return {
    rig: resolvedRig,
    manifest: {
      schema: 'paper-rig/appearance-resolution/1',
      schemaVersion: '1.0.0',
      sourceModelId,
      resolvedModelId: resolvedRig.id,
      instances: manifestInstances,
    },
  };
}

export function validateResolvedAppearance(rig) {
  const paint = rig?.paint || [];
  const primitives = Object.fromEntries(paint.map((item) => [item.primitiveId, {
    $schema: 'paper-rig/paint-primitive-1',
    schemaVersion: '1.0.0',
    id: item.primitiveId,
    semanticRole: item.semanticRole,
    paletteRole: item.paletteRole,
    detailTier: item.detailTier,
    geometry: cloneData(item.geometry),
  }]));
  const plan = {
    $schema: 'paper-rig/appearance-plan-1',
    instances: paint.map((item) => ({
      id: item.id,
      primitiveId: item.primitiveId,
      ownerPlateId: item.owningPlateId,
      surfaceFrame: cloneData(item.surfaceFrame),
      region: cloneData(item.region),
      transform: cloneData(item.transform),
      paletteRole: item.paletteRole,
    })),
  };
  return validateAppearanceConfiguration({ rig: { ...rig, paint: [] }, plan, primitives });
}

export { tokenizeClosedPath };
