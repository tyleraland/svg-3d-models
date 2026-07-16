// @paper-rig/attachments — pure typed-slot normalization and module assembly.
// Ordinary rig resolution remains byte-compatible; callers opt into assembly
// when they want reusable module geometry merged onto a resolved rig.

import { cloneData } from '@paper-rig/schema';

const LEGACY_SLOT_TYPES = {
  weapon: 'hand.grip',
  horn: 'head.horn',
  hat: 'head.hat',
  helmet: 'head.helmet',
  backItem: 'back.mount',
  collar: 'neck.collar',
  saddle: 'back.saddle',
  ear: 'head.ear',
  wing: 'back.wing',
  tail: 'tail.mount',
  generic: 'generic',
};

const pass = (id, detail) => ({ id, pass: true, detail });
const fail = (id, detail) => ({ id, pass: false, detail });
const report = (checks) => {
  const issues = checks.filter((check) => !check.pass);
  return { status: issues.length ? 'failed' : 'passed', checks, issues };
};
const check = (id, condition, detail) => condition ? pass(id, detail) : fail(id, detail);
const unique = (values) => new Set(values).size === values.length;
const namespaceId = (instanceId, localId) => `${instanceId}__${localId}`;
const vector3 = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const stableId = (value) => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);

function modulesById(modules) {
  if (Array.isArray(modules)) return Object.fromEntries(modules.map((module) => [module.id, module]));
  return modules || {};
}

export function slotTypeForAnchor(anchor) {
  const declared = anchor.slotType || anchor.moduleType || anchor.role || 'generic';
  return LEGACY_SLOT_TYPES[declared] || declared;
}

const axisVector = (axis) => {
  const sign = axis?.[0] === '-' ? -1 : 1;
  const index = { x: 0, y: 1, z: 2 }[axis?.[1]];
  if (index === undefined) return null;
  return [0, 1, 2].map((candidate) => candidate === index ? sign : 0);
};
const basisMatrix = (tangent, bitangent, normal) => [0, 1, 2].map((row) => [
  tangent[row], bitangent[row], normal[row],
]);
const dot3 = (left, right) => left.reduce((sum, value, axis) => sum + value * right[axis], 0);
const cross3 = (left, right) => [
  left[1] * right[2] - left[2] * right[1],
  left[2] * right[0] - left[0] * right[2],
  left[0] * right[1] - left[1] * right[0],
];
const rightHandedOrthonormal = (tangent, bitangent, normal) => {
  if (![tangent, bitangent, normal].every(vector3)) return false;
  const lengths = [tangent, bitangent, normal].map((vector) => Math.hypot(...vector));
  if (lengths.some((length) => Math.abs(length - 1) > 1e-6)) return false;
  if (Math.abs(dot3(tangent, bitangent)) > 1e-6
    || Math.abs(dot3(tangent, normal)) > 1e-6
    || Math.abs(dot3(bitangent, normal)) > 1e-6) return false;
  return dot3(cross3(tangent, bitangent), normal) > 1 - 1e-6;
};

function plateSurfaceBasis(plate) {
  if (plate?.surfaceFrame) {
    const { tangent, bitangent, normal } = plate.surfaceFrame;
    return rightHandedOrthonormal(tangent, bitangent, normal) ? basisMatrix(tangent, bitangent, normal) : null;
  }
  if (vector3(plate?.surfaceNormal) && Array.isArray(plate?.planeAxes) && plate.planeAxes.length === 2) {
    const tangent = axisVector(plate.planeAxes[0]);
    const bitangent = axisVector(plate.planeAxes[1]);
    return rightHandedOrthonormal(tangent, bitangent, plate.surfaceNormal)
      ? basisMatrix(tangent, bitangent, plate.surfaceNormal)
      : null;
  }
  return null;
}

function normalizedAuthoredSlot(rig, slot) {
  const localFrame = cloneData(slot.localFrame);
  if (slot.owner.kind === 'joint') {
    return {
      ...cloneData(slot),
      counterpartSlotId: slot.counterpartSlotId || null,
      resolvedParentJointId: slot.owner.id,
      resolvedJointFrame: {
        positionMeters: [...localFrame.positionMeters],
        rotation: eulerXYZ(localFrame.rotationXYZDegrees),
      },
    };
  }
  const plate = (rig.plates || []).find((candidate) => candidate.id === slot.owner.id);
  const basis = plateSurfaceBasis(plate);
  return {
    ...cloneData(slot),
    counterpartSlotId: slot.counterpartSlotId || null,
    resolvedParentJointId: plate?.bone || null,
    resolvedJointFrame: basis ? {
      positionMeters: mv(basis, localFrame.positionMeters),
      rotation: mm(basis, eulerXYZ(localFrame.rotationXYZDegrees)),
    } : null,
  };
}

export function attachmentSlots(rig, declaredSlots = []) {
  const legacy = (rig.anchors || []).map((anchor) => ({
    id: anchor.id,
    type: slotTypeForAnchor(anchor),
    owner: { kind: 'joint', id: anchor.bone },
    localFrame: {
      positionMeters: [...(anchor.offset || [0, 0, 0])],
      rotationXYZDegrees: [...(anchor.rotation || [0, 0, 0])],
    },
    scaleBehavior: anchor.inheritScale === false ? 'preserve-local-aspect' : 'inherit-owner-scale',
    cardinality: anchor.cardinality || 1,
    counterpartSlotId: anchor.counterpart || null,
    resolvedParentJointId: anchor.bone,
    resolvedJointFrame: {
      positionMeters: [...(anchor.offset || [0, 0, 0])],
      rotation: eulerXYZ(anchor.rotation || [0, 0, 0]),
    },
  }));
  const byId = new Map(legacy.map((slot) => [slot.id, slot]));
  for (const slot of declaredSlots) byId.set(slot.id, normalizedAuthoredSlot(rig, slot));
  return [...byId.values()];
}

const boundsValid = (bounds) => vector3(bounds?.centerMeters)
  && vector3(bounds?.sizeMeters) && bounds.sizeMeters.every((value) => value > 0);
const boundsCorners = (bounds) => {
  if (!boundsValid(bounds)) return [];
  const half = bounds.sizeMeters.map((value) => value / 2);
  return [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z].map(
    (sign, axis) => bounds.centerMeters[axis] + sign * half[axis],
  ))));
};
const boundsContains = (bounds, points, tolerance = 1e-9) => {
  if (!boundsValid(bounds) || !points.length) return false;
  const half = bounds.sizeMeters.map((value) => value / 2);
  return points.every((point) => point.every((value, axis) =>
    value >= bounds.centerMeters[axis] - half[axis] - tolerance
    && value <= bounds.centerMeters[axis] + half[axis] + tolerance));
};

function moduleGeometryPoints(module) {
  const joints = Array.isArray(module?.geometry?.joints) ? module.geometry.joints : [];
  const plates = Array.isArray(module?.geometry?.plates) ? module.geometry.plates : [];
  const positions = {};
  for (const joint of joints) {
    if (!vector3(joint.bind) || (joint.parent != null && !positions[joint.parent])) return [];
    positions[joint.id] = joint.parent == null ? [...joint.bind] : add(positions[joint.parent], joint.bind);
  }
  const points = [];
  for (const plate of plates) {
    if (!Array.isArray(plate.size) || !plate.size.length) return [];
    const controls = plate.span?.length
      ? plate.span.map((id) => positions[id])
      : plate.points?.length
        ? plate.points.map((id) => positions[id])
        : [positions[plate.bone]];
    if (controls.some((point) => !vector3(point))) return [];
    const radius = plate.points?.length ? 0 : Math.max(...plate.size) / 2;
    for (const point of controls) {
      points.push(...[-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [
        point[0] + x * radius,
        point[1] + y * radius,
        point[2] + z * radius,
      ]))));
    }
  }
  return points;
}

function pointsBounds(points) {
  if (!points.length) return null;
  const min = [0, 1, 2].map((axis) => Math.min(...points.map((point) => point[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...points.map((point) => point[axis])));
  return {
    centerMeters: min.map((value, axis) => (value + max[axis]) / 2),
    sizeMeters: min.map((value, axis) => max[axis] - value),
  };
}

function effectiveModuleBounds(module) {
  return module?.bounds || pointsBounds(moduleGeometryPoints(module));
}

export function validateAttachmentModule(module) {
  const checks = [];
  const joints = Array.isArray(module?.geometry?.joints) ? module.geometry.joints : [];
  const plates = Array.isArray(module?.geometry?.plates) ? module.geometry.plates : [];
  const jointIds = joints.map((joint) => joint.id);
  const plateIds = plates.map((plate) => plate.id);
  const jointIdSet = new Set(jointIds);
  const paletteRoles = new Set(module?.paletteRoles || []);
  checks.push(check('attachment-module-id', stableId(module?.id), `module ${module?.id || '(missing)'} has a stable ID`));
  checks.push(check(
    'attachment-module-slot-types',
    Array.isArray(module?.compatibleSlotTypes) && module.compatibleSlotTypes.length > 0 && module.compatibleSlotTypes.every((type) => typeof type === 'string' && type.length > 0),
    `module ${module?.id || '(missing)'} declares compatible slot types`,
  ));
  checks.push(check(
    'attachment-module-attachment-frame',
    vector3(module?.attachmentFrame?.positionMeters) && vector3(module?.attachmentFrame?.rotationXYZDegrees),
    `module ${module?.id || '(missing)'} has a finite attachment frame`,
  ));
  checks.push(check(
    'attachment-module-bounds',
    module?.bounds == null || boundsValid(module.bounds),
    `module ${module?.id || '(missing)'} optional geometry bounds are finite and positive`,
  ));
  checks.push(check(
    'attachment-module-palette-roles',
    Array.isArray(module?.paletteRoles) && module.paletteRoles.length > 0 && module.paletteRoles.every((role) => typeof role === 'string' && role.length > 0),
    `module ${module?.id || '(missing)'} declares semantic palette roles`,
  ));
  checks.push(check('attachment-module-geometry', joints.length > 0 && plates.length > 0, `module ${module?.id || '(missing)'} contains joints and plates`));
  checks.push(check(
    'attachment-module-local-id-format',
    joints.every((joint) => stableId(joint.id) && (joint.parent == null || stableId(joint.parent)))
      && plates.every((plate) => stableId(plate.id) && stableId(plate.bone)),
    `module ${module?.id || '(missing)'} joint, parent, plate, and bone IDs are stable`,
  ));
  checks.push(check('attachment-module-joint-ids', unique(jointIds), `module ${module?.id || '(missing)'} joint IDs are unique`));
  checks.push(check('attachment-module-plate-ids', unique(plateIds), `module ${module?.id || '(missing)'} plate IDs are unique`));
  checks.push(check('attachment-module-stable-ids', unique([...jointIds, ...plateIds]), `module ${module?.id || '(missing)'} joint and plate IDs occupy one collision-free namespace`));
  checks.push(check('attachment-module-root', joints.filter((joint) => joint.parent == null).length === 1, `module ${module?.id || '(missing)'} has exactly one root joint`));
  const ordered = new Set();
  let hierarchyValid = true;
  for (const joint of joints) {
    if (joint.parent != null && (!jointIdSet.has(joint.parent) || !ordered.has(joint.parent))) hierarchyValid = false;
    ordered.add(joint.id);
  }
  checks.push(check('attachment-module-hierarchy', hierarchyValid, `module ${module?.id || '(missing)'} parents exist and precede children`));
  checks.push(check('attachment-module-joint-binds', joints.every((joint) => vector3(joint.bind)), `module ${module?.id || '(missing)'} joint binds are finite local vectors`));
  const plateReferencesValid = plates.every((plate) => {
    const span = plate.span == null ? [] : plate.span;
    const points = plate.points == null ? [] : plate.points;
    return jointIdSet.has(plate.bone)
      && Array.isArray(span) && span.every((id) => jointIdSet.has(id))
      && Array.isArray(points) && points.every((id) => jointIdSet.has(id));
  });
  checks.push(check('attachment-module-plate-references', plateReferencesValid, `module ${module?.id || '(missing)'} plate geometry references module-local joints`));
  checks.push(check(
    'attachment-module-plate-geometry',
    plates.every((plate) => Array.isArray(plate.size) && plate.size.length >= 1 && plate.size.length <= 2 && plate.size.every((value) => Number.isFinite(value) && value > 0)),
    `module ${module?.id || '(missing)'} plate sizes are finite and positive`,
  ));
  checks.push(check(
    'attachment-module-palette-references',
    plates.every((plate) => paletteRoles.has(plate.paletteRole)),
    `module ${module?.id || '(missing)'} plate palette roles are declared by the module`,
  ));
  checks.push(check(
    'attachment-module-bounds-contain-geometry',
    moduleGeometryPoints(module).length > 0
      && (module?.bounds == null || boundsContains(module.bounds, moduleGeometryPoints(module))),
    `module ${module?.id || '(missing)'} conservative plate geometry fits its optional declared bounds`,
  ));
  return report(checks);
}

export function validateAttachmentConfiguration({ rig, slots: declaredSlots = [], instances = [], modules = {} }) {
  const registry = modulesById(modules);
  const slots = attachmentSlots(rig, declaredSlots);
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const checks = [];
  for (const module of Object.values(registry)) checks.push(...validateAttachmentModule(module).checks);
  const rigJointIds = new Set((rig.joints || []).map((joint) => joint.id));
  const rigPlateIds = new Set((rig.plates || []).map((plate) => plate.id));
  const rigMaterials = new Set(Object.keys(rig.materials || {}));
  checks.push(check('attachment-authored-slot-ids', unique(declaredSlots.map((slot) => slot.id)), 'authored attachment slot IDs are unique'));
  checks.push(check(
    'attachment-slot-frames',
    slots.every((slot) => vector3(slot.localFrame.positionMeters) && vector3(slot.localFrame.rotationXYZDegrees)),
    'attachment slots have finite local frames',
  ));
  checks.push(check(
    'attachment-slot-cardinalities',
    slots.every((slot) => Number.isInteger(slot.cardinality) && slot.cardinality > 0),
    'attachment slot cardinalities are positive integers',
  ));
  checks.push(check(
    'attachment-slot-owner-references',
    slots.every((slot) => slot.owner.kind === 'joint'
      ? rigJointIds.has(slot.owner.id)
      : rigPlateIds.has(slot.owner.id) && rigJointIds.has(slot.resolvedParentJointId)),
    'attachment slot owners reference rig joints or plates attached to rig joints',
  ));
  checks.push(check(
    'attachment-plate-slot-surface-frames',
    slots.every((slot) => slot.owner.kind !== 'plate' || slot.resolvedJointFrame != null),
    'plate-owned attachment slots have an explicit source surface frame',
  ));
  checks.push(check(
    'attachment-slot-regions',
    slots.every((slot) => slot.region == null || (slot.region.kind === 'box' && boundsValid(slot.region))),
    'declared attachment regions are finite positive boxes in owner-local coordinates',
  ));
  checks.push(check(
    'attachment-plate-slot-regions',
    slots.every((slot) => slot.owner.kind !== 'plate' || slot.region != null),
    'plate-owned attachment slots declare bounded plate-local regions',
  ));
  const allSlotIds = new Set(slots.map((slot) => slot.id));
  checks.push(check(
    'attachment-slot-counterparts',
    slots.every((slot) => !slot.counterpartSlotId || allSlotIds.has(slot.counterpartSlotId)),
    'attachment slot counterpart references resolve',
  ));

  const instanceIds = instances.map((instance) => instance.id);
  checks.push(check('attachment-instance-ids', unique(instanceIds), 'attachment instance IDs are unique within the model'));
  const occupied = new Map();
  const emittedIds = new Set([
    ...(rig.joints || []).map((joint) => joint.id),
    ...(rig.plates || []).map((plate) => plate.id),
  ]);
  for (const instance of instances) {
    const module = registry[instance.moduleId];
    const slot = slotsById.get(instance.slotId);
    const amount = instance.scale ?? 1;
    checks.push(check(
      'attachment-instance-shape',
      stableId(instance.id) && stableId(instance.moduleId) && stableId(instance.slotId),
      `instance ${instance.id || '(missing)'} has stable instance, module, and slot IDs`,
    ));
    checks.push(check('attachment-instance-scale', Number.isFinite(amount) && amount > 0, `instance ${instance.id} scale is finite and positive`));
    checks.push(check('attachment-module-reference', Boolean(module), `instance ${instance.id} references module ${instance.moduleId}`));
    checks.push(check('attachment-slot-reference', Boolean(slot), `instance ${instance.id} references slot ${instance.slotId}`));
    if (module && slot) {
      const moduleJoints = module.geometry?.joints || [];
      const modulePlates = module.geometry?.plates || [];
      checks.push(check(
        'attachment-slot-compatible',
        Array.isArray(module.compatibleSlotTypes) && module.compatibleSlotTypes.includes(slot.type),
        `instance ${instance.id}: module ${module.id} accepts slot type ${slot.type}`,
      ));
      checks.push(check(
        'attachment-module-material-references',
        modulePlates.every((plate) => rigMaterials.has(plate.material)),
        `instance ${instance.id}: module ${module.id} materials exist on rig ${rig.id}`,
      ));
      const moduleBounds = effectiveModuleBounds(module);
      const framesValid = vector3(slot.localFrame?.positionMeters)
        && vector3(slot.localFrame?.rotationXYZDegrees)
        && vector3(module.attachmentFrame?.positionMeters)
        && vector3(module.attachmentFrame?.rotationXYZDegrees)
        && boundsValid(moduleBounds)
        && Number.isFinite(amount) && amount > 0;
      const pointsInOwner = framesValid ? (() => {
        const moduleOwnerRotation = mm(
          eulerXYZ(slot.localFrame.rotationXYZDegrees),
          transpose(eulerXYZ(module.attachmentFrame.rotationXYZDegrees)),
        );
        const attachmentPoint = scale(module.attachmentFrame.positionMeters, amount);
        return boundsCorners(moduleBounds).map((point) => add(
          slot.localFrame.positionMeters,
          mv(moduleOwnerRotation, subtract(scale(point, amount), attachmentPoint)),
        ));
      })() : [];
      checks.push(check(
        'attachment-region-containment',
        slot.region == null || (framesValid && boundsContains(slot.region, pointsInOwner)),
        slot.region == null
          ? `instance ${instance.id}: slot ${slot.id} has no bounded region`
          : `instance ${instance.id}: module ${module.id} fits slot ${slot.id} owner-local region`,
      ));
      occupied.set(slot.id, (occupied.get(slot.id) || 0) + 1);
      const generated = [
        ...moduleJoints.map((joint) => namespaceId(instance.id, joint.id)),
        ...modulePlates.map((plate) => namespaceId(instance.id, plate.id)),
      ];
      const collision = generated.find((id, index) => emittedIds.has(id) || generated.indexOf(id) !== index);
      checks.push(check('attachment-stable-id-collision', !collision, collision ? `instance ${instance.id} collides at stable ID ${collision}` : `instance ${instance.id} stable IDs are collision-free`));
      generated.forEach((id) => emittedIds.add(id));
    }
  }
  for (const [slotId, count] of occupied) {
    const cardinality = slotsById.get(slotId).cardinality;
    checks.push(check('attachment-slot-cardinality', count <= cardinality, `slot ${slotId} occupancy ${count}/${cardinality}`));
  }
  return report(checks);
}

const mm = (left, right) => left.map((row) => right[0].map((_, column) =>
  row[0] * right[0][column] + row[1] * right[1][column] + row[2] * right[2][column]));
const mv = (matrix, vector) => matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
const transpose = (matrix) => matrix[0].map((_, column) => matrix.map((row) => row[column]));
const add = (left, right) => left.map((value, index) => value + right[index]);
const subtract = (left, right) => left.map((value, index) => value - right[index]);
const scale = (vector, amount) => vector.map((value) => value * amount);

function eulerXYZ(rotation) {
  const [x, y, z] = rotation.map((value) => value * Math.PI / 180);
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);
  return mm(
    [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]],
    mm([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], [[1, 0, 0], [0, cx, -sx], [0, sx, cx]]),
  );
}

function transformedFrame(frame, rotation) {
  if (!frame) return frame;
  return {
    normal: mv(rotation, frame.normal),
    tangent: mv(rotation, frame.tangent),
    bitangent: mv(rotation, frame.bitangent),
  };
}

export class AttachmentAssemblyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AttachmentAssemblyError';
    this.code = code;
  }
}

export function resolveAttachmentAssembly({ rig, sourceModelId = rig.id, slots: declaredSlots = [], instances = [], modules = {} }) {
  const validation = validateAttachmentConfiguration({ rig, slots: declaredSlots, instances, modules });
  if (validation.status !== 'passed') {
    const issue = validation.issues[0];
    throw new AttachmentAssemblyError(issue.id, issue.detail);
  }
  const registry = modulesById(modules);
  const slotsById = new Map(attachmentSlots(rig, declaredSlots).map((slot) => [slot.id, slot]));
  const assemblyRig = cloneData(rig);
  assemblyRig.attachmentSlots = declaredSlots.map((declared) => {
    const slot = slotsById.get(declared.id);
    return {
      id: slot.id,
      type: slot.type,
      owner: cloneData(slot.owner),
      localFrame: cloneData(slot.localFrame),
      scaleBehavior: slot.scaleBehavior,
      cardinality: slot.cardinality,
      counterpartSlotId: slot.counterpartSlotId,
      region: slot.region ? cloneData(slot.region) : null,
      resolvedParentJointId: slot.resolvedParentJointId,
      resolvedJointFrame: cloneData(slot.resolvedJointFrame),
    };
  });
  const manifestInstances = [];

  for (const instance of instances) {
    const module = registry[instance.moduleId];
    const slot = slotsById.get(instance.slotId);
    const amount = instance.scale ?? 1;
    const moduleFrame = module.attachmentFrame;
    const slotRotation = slot.resolvedJointFrame.rotation;
    const moduleRotation = eulerXYZ(moduleFrame.rotationXYZDegrees);
    const rotation = mm(slotRotation, transpose(moduleRotation));
    const root = module.geometry.joints.find((joint) => joint.parent == null);
    const jointIds = Object.fromEntries(module.geometry.joints.map((joint) => [joint.id, namespaceId(instance.id, joint.id)]));
    const plateIds = Object.fromEntries(module.geometry.plates.map((plate) => [plate.id, namespaceId(instance.id, plate.id)]));
    const attachmentPoint = scale(moduleFrame.positionMeters, amount);

    for (const joint of module.geometry.joints) {
      const localBind = scale(joint.bind, amount);
      const bind = joint.id === root.id
        ? add(slot.resolvedJointFrame.positionMeters, mv(rotation, subtract(localBind, attachmentPoint)))
        : mv(rotation, localBind);
      assemblyRig.joints.push({
        ...cloneData(joint),
        id: jointIds[joint.id],
        parent: joint.parent == null ? slot.resolvedParentJointId : jointIds[joint.parent],
        bind,
      });
    }
    for (const plate of module.geometry.plates) {
      assemblyRig.plates.push({
        ...cloneData(plate),
        id: plateIds[plate.id],
        bone: jointIds[plate.bone],
        size: plate.size.map((value) => value * amount),
        ...(plate.span ? { span: plate.span.map((id) => jointIds[id]) } : {}),
        ...(plate.points ? { points: plate.points.map((id) => jointIds[id]) } : {}),
        ...(plate.surfaceNormal ? { surfaceNormal: mv(rotation, plate.surfaceNormal) } : {}),
        ...(plate.surfaceFrame ? { surfaceFrame: transformedFrame(plate.surfaceFrame, rotation) } : {}),
      });
    }
    manifestInstances.push({
      id: instance.id,
      moduleId: module.id,
      slotId: slot.id,
      slotType: slot.type,
      scale: amount,
      owner: cloneData(slot.owner),
      slotFrame: cloneData(slot.localFrame),
      geometryIds: {
        joints: Object.values(jointIds),
        plates: Object.values(plateIds),
      },
    });
  }

  return {
    rig: assemblyRig,
    manifest: {
      schema: 'paper-rig/attachment-assembly/1',
      schemaVersion: '1.0.0',
      sourceModelId,
      resolvedModelId: rig.id,
      instances: manifestInstances,
    },
  };
}
