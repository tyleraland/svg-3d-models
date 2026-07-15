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

export function attachmentSlots(rig) {
  return (rig.anchors || []).map((anchor) => ({
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
  }));
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
  return report(checks);
}

export function validateAttachmentConfiguration({ rig, instances = [], modules = {} }) {
  const registry = modulesById(modules);
  const slots = attachmentSlots(rig);
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const checks = [];
  for (const module of Object.values(registry)) checks.push(...validateAttachmentModule(module).checks);
  const rigJointIds = new Set((rig.joints || []).map((joint) => joint.id));
  const rigMaterials = new Set(Object.keys(rig.materials || {}));
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
    slots.every((slot) => rigJointIds.has(slot.owner.id)),
    'attachment slot owners reference rig joints',
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

export function resolveAttachmentAssembly({ rig, sourceModelId = rig.id, instances = [], modules = {} }) {
  const validation = validateAttachmentConfiguration({ rig, instances, modules });
  if (validation.status !== 'passed') {
    const issue = validation.issues[0];
    throw new AttachmentAssemblyError(issue.id, issue.detail);
  }
  const registry = modulesById(modules);
  const slotsById = new Map(attachmentSlots(rig).map((slot) => [slot.id, slot]));
  const assemblyRig = cloneData(rig);
  const manifestInstances = [];

  for (const instance of instances) {
    const module = registry[instance.moduleId];
    const slot = slotsById.get(instance.slotId);
    const amount = instance.scale ?? 1;
    const moduleFrame = module.attachmentFrame;
    const slotRotation = eulerXYZ(slot.localFrame.rotationXYZDegrees);
    const moduleRotation = eulerXYZ(moduleFrame.rotationXYZDegrees);
    const rotation = mm(slotRotation, transpose(moduleRotation));
    const root = module.geometry.joints.find((joint) => joint.parent == null);
    const jointIds = Object.fromEntries(module.geometry.joints.map((joint) => [joint.id, namespaceId(instance.id, joint.id)]));
    const plateIds = Object.fromEntries(module.geometry.plates.map((plate) => [plate.id, namespaceId(instance.id, plate.id)]));
    const attachmentPoint = scale(moduleFrame.positionMeters, amount);

    for (const joint of module.geometry.joints) {
      const localBind = scale(joint.bind, amount);
      const bind = joint.id === root.id
        ? add(slot.localFrame.positionMeters, mv(rotation, subtract(localBind, attachmentPoint)))
        : mv(rotation, localBind);
      assemblyRig.joints.push({
        ...cloneData(joint),
        id: jointIds[joint.id],
        parent: joint.parent == null ? slot.owner.id : jointIds[joint.parent],
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
