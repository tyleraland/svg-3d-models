// JSON Schema validation for consumer profiles and handoffs.

import Ajv2020 from 'ajv/dist/2020.js';
import profileSchema from '@paper-rig/schema/schemas/consumer-profile-1.schema.json' with { type: 'json' };
import handoffSchema from '@paper-rig/schema/schemas/consumer-handoff-1.schema.json' with { type: 'json' };
import sceneSchema from '@paper-rig/schema/schemas/projected-scene-1.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(sceneSchema);
const validateProfileSchema = ajv.compile(profileSchema);
const validateHandoffSchema = ajv.compile(handoffSchema);

function result(validate, value) {
  const valid = validate(value);
  return {
    valid,
    errors: valid ? [] : (validate.errors || []).map((error) => ({
      path: error.instancePath || '/',
      message: error.message,
    })),
  };
}

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const semanticError = (path, message) => ({ path, message });
const TIERS = ['silhouette', 'identity', 'expression', 'texture', 'micro'];

export function validateConsumerProfile(profile) {
  const schema = result(validateProfileSchema, profile);
  if (!schema.valid) return schema;
  const ids = profile.capabilities.map((capability) => capability.id);
  const errors = new Set(ids).size === ids.length
    ? []
    : [semanticError('/capabilities', 'capability ids must be unique')];
  return { valid: errors.length === 0, errors };
}

export function validateConsumerHandoff(handoff) {
  const schema = result(validateHandoffSchema, handoff);
  if (!schema.valid) return schema;

  const errors = [];
  const elements = handoff.scene.compositingGroups.flatMap((group) => group.elements);
  const sceneIds = elements.map((element) => element.id);
  const assignments = handoff.semanticDetail.assignments;
  const assignmentIds = assignments.map((assignment) => assignment.elementId);
  const included = handoff.semanticDetail.includedElementIds;
  const omitted = handoff.semanticDetail.omittedElementIds;
  const maximum = TIERS.indexOf(handoff.selection.maximumDetailTier);
  const assignmentById = new Map(assignments.map((assignment) => [assignment.elementId, assignment]));

  if (new Set(assignmentIds).size !== assignmentIds.length) errors.push(semanticError('/semanticDetail/assignments', 'assignment element IDs must be unique'));
  if (!same(sceneIds, included)) errors.push(semanticError('/semanticDetail/includedElementIds', 'included IDs must exactly match filtered scene order'));
  if (!same(assignmentIds.filter((id) => included.includes(id)), included)) errors.push(semanticError('/semanticDetail/includedElementIds', 'included IDs must retain assignment order'));
  if (!same(assignmentIds.filter((id) => omitted.includes(id)), omitted)) errors.push(semanticError('/semanticDetail/omittedElementIds', 'omitted IDs must retain assignment order'));
  if (new Set([...included, ...omitted]).size !== assignmentIds.length
    || !assignmentIds.every((id) => included.includes(id) || omitted.includes(id))) {
    errors.push(semanticError('/semanticDetail', 'included and omitted IDs must partition assignments'));
  }
  for (const element of elements) {
    const assignment = assignmentById.get(element.id);
    if (!assignment || assignment.tier !== element.semanticDetailTier || assignment.source !== element.semanticDetailSource
      || !same(assignment.dependencyElementIds, element.detailDependencyIds)) {
      errors.push(semanticError(`/scene/${element.id}`, 'scene semantic detail must match its assignment'));
    }
  }
  for (const assignment of assignments.filter((candidate) => candidate.dependencyElementIds)) {
    const dependencies = assignment.dependencyElementIds.map((id) => assignmentById.get(id));
    if (dependencies.some((dependency) => !dependency) || assignment.dependencyElementIds.includes(assignment.elementId)) {
      errors.push(semanticError(`/semanticDetail/assignments/${assignment.elementId}`, 'semantic detail dependencies must reference other assignments'));
      continue;
    }
    const requiredTier = dependencies.map((dependency) => dependency.tier)
      .sort((left, right) => TIERS.indexOf(left) - TIERS.indexOf(right))[0];
    if (assignment.tier !== requiredTier) {
      errors.push(semanticError(`/semanticDetail/assignments/${assignment.elementId}`, `dependent element tier must be ${requiredTier}`));
    }
    if (included.includes(assignment.elementId)
      && !assignment.dependencyElementIds.some((id) => included.includes(id))) {
      errors.push(semanticError(`/semanticDetail/assignments/${assignment.elementId}`, 'included dependent element must retain at least one dependency'));
    }
  }
  if (included.some((id) => TIERS.indexOf(assignmentById.get(id)?.tier) > maximum)) {
    errors.push(semanticError('/semanticDetail/includedElementIds', 'included detail exceeds selected maximum'));
  }
  if (omitted.some((id) => TIERS.indexOf(assignmentById.get(id)?.tier) <= maximum)) {
    errors.push(semanticError('/semanticDetail/omittedElementIds', 'omitted detail is within selected maximum'));
  }
  const expectedStatus = handoff.negotiation.capabilities.some((capability) => capability.status === 'omitted') ? 'degraded' : 'accepted';
  if (handoff.negotiation.status !== expectedStatus) errors.push(semanticError('/negotiation/status', `status must be ${expectedStatus}`));
  const available = new Set(handoff.negotiation.availableCapabilities);
  for (const capability of handoff.negotiation.capabilities) {
    if ((capability.status === 'available') !== available.has(capability.id)) {
      errors.push(semanticError('/negotiation/capabilities', `capability ${capability.id} status disagrees with availability`));
    }
    if (capability.policy === 'require' && capability.status !== 'available') {
      errors.push(semanticError('/negotiation/capabilities', `required capability ${capability.id} cannot be omitted`));
    }
  }
  const expectedPaletteRoles = [...new Set(elements.map((element) => element.paletteRole))];
  if (!same(handoff.paletteRoles, expectedPaletteRoles)) errors.push(semanticError('/paletteRoles', 'palette roles must match first-use order in the filtered scene'));

  return { valid: errors.length === 0, errors };
}
