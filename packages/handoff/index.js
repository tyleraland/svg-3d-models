// @paper-rig/handoff — deterministic consumer selection over projected-scene/1.
// The producer keeps semantic importance and capability facts; the consumer
// profile chooses a maximum tier and declares how absent capabilities resolve.
// Selection only removes elements, so surviving stable IDs and order are exact.

import { cloneData } from '@paper-rig/schema';

export const SEMANTIC_DETAIL_TIERS = Object.freeze([
  'silhouette',
  'identity',
  'expression',
  'texture',
  'micro',
]);

export const BASE_HANDOFF_CAPABILITIES = Object.freeze([
  'structuredVectorGeometry',
  'stableElementOrder',
  'semanticDetailTiers',
  'semanticPaletteRoles',
  'jointTransforms',
]);

const DETAIL_INDEX = new Map(SEMANTIC_DETAIL_TIERS.map((tier, index) => [tier, index]));
const STABLE_ID = /^[A-Za-z][A-Za-z0-9_-]*$/;
const DETAIL_SOURCES = new Set([
  'authored',
  'authored-paint',
  'structural',
  'semantic-role',
  'legacy-conservative',
]);
const sameKeys = (value, keys) => value && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).every((key) => keys.includes(key));

const elementsOf = (scene) => scene.compositingGroups.flatMap((group) => group.elements);

function profileIssues(profile) {
  const capabilities = Array.isArray(profile?.capabilities) ? profile.capabilities : [];
  const issues = [];
  if (!sameKeys(profile, ['$schema', 'schemaVersion', 'id', 'selection', 'capabilities'])) issues.push('profile contains unknown fields');
  if (profile?.$schema !== 'paper-rig/consumer-profile-1' || profile?.schemaVersion !== '1.0.0') {
    issues.push('profile must declare paper-rig/consumer-profile-1 version 1.0.0');
  }
  if (!STABLE_ID.test(profile?.id || '')) issues.push('profile id must be a stable ID');
  if (!DETAIL_INDEX.has(profile?.selection?.maximumDetailTier)) issues.push('selection.maximumDetailTier is unsupported');
  if (!STABLE_ID.test(profile?.selection?.paletteId || '')) issues.push('selection.paletteId must be a stable ID');
  if (!sameKeys(profile?.selection, ['maximumDetailTier', 'paletteId'])) issues.push('selection contains unknown fields');
  if (!Array.isArray(profile?.capabilities)) issues.push('capabilities must be an array');
  for (const capability of capabilities) {
    if (!sameKeys(capability, ['id', 'policy'])) issues.push(`capability ${capability?.id || '(missing)'} contains unknown fields`);
    if (!STABLE_ID.test(capability?.id || '')) issues.push('capability id must be a stable ID');
    if (!['require', 'omit'].includes(capability?.policy)) issues.push(`capability ${capability?.id || '(missing)'} has an invalid policy`);
  }
  if (new Set(capabilities.map((capability) => capability.id)).size !== capabilities.length) {
    issues.push('capability ids must be unique');
  }
  return issues;
}

function sceneIssues(scene) {
  const elements = Array.isArray(scene?.compositingGroups) ? elementsOf(scene) : [];
  const issues = [];
  if (scene?.schema !== 'paper-rig/projected-scene/1') issues.push('scene must be paper-rig/projected-scene/1');
  if (!/^1\.(?:[1-9][0-9]*)\.[0-9]+$/.test(scene?.schemaVersion || '')) issues.push('scene must support semantic detail fields from projected-scene/1.1 or later');
  if (new Set(elements.map((element) => element.id)).size !== elements.length) issues.push('scene element IDs must be unique');
  if (!(scene?.compositingGroups || []).every((group, index) => group.order === index)) issues.push('scene compositing group order must be contiguous');
  for (const element of elements) {
    if (element.vector?.attributes?.id !== element.id) issues.push(`element ${element.id} vector ID does not match`);
    if (!DETAIL_INDEX.has(element.semanticDetailTier)) issues.push(`element ${element.id} has no supported semantic detail tier`);
    if (!DETAIL_SOURCES.has(element.semanticDetailSource)) issues.push(`element ${element.id} has no supported semantic detail source`);
  }
  return issues;
}

export class ConsumerProfileError extends Error {
  constructor(issues) {
    super(`invalid consumer profile: ${issues.join('; ')}`);
    this.name = 'ConsumerProfileError';
    this.code = 'INVALID_CONSUMER_PROFILE';
    this.issues = issues;
  }
}

export class ConsumerCapabilityError extends Error {
  constructor(capabilityId, availableCapabilities) {
    super(`[UNSUPPORTED_CONSUMER_CAPABILITY] consumer requires unsupported capability ${capabilityId}`);
    this.name = 'ConsumerCapabilityError';
    this.code = 'UNSUPPORTED_CONSUMER_CAPABILITY';
    this.capabilityId = capabilityId;
    this.availableCapabilities = [...availableCapabilities];
  }
}

export class ConsumerSceneError extends Error {
  constructor(issues) {
    super(`invalid projected scene for consumer handoff: ${issues.join('; ')}`);
    this.name = 'ConsumerSceneError';
    this.code = 'INVALID_CONSUMER_SCENE';
    this.issues = issues;
  }
}

export function availableCapabilitiesForScene(scene) {
  const elements = elementsOf(scene);
  return [
    ...BASE_HANDOFF_CAPABILITIES,
    ...(elements.some((element) => element.surfaceFrame) ? ['surfaceFrames'] : []),
    ...(elements.some((element) => element.sourceKind === 'paint') ? ['semanticPaint'] : []),
  ];
}

export function negotiateConsumerCapabilities(scene, profile) {
  const availableCapabilities = availableCapabilitiesForScene(scene);
  const available = new Set(availableCapabilities);
  const capabilities = profile.capabilities.map((requested) => {
    if (available.has(requested.id)) return { ...requested, status: 'available' };
    if (requested.policy === 'require') throw new ConsumerCapabilityError(requested.id, availableCapabilities);
    return { ...requested, status: 'omitted' };
  });
  return {
    status: capabilities.some((capability) => capability.status === 'omitted') ? 'degraded' : 'accepted',
    availableCapabilities,
    capabilities,
  };
}

export function createConsumerHandoff(scene, profile) {
  const invalidProfile = profileIssues(profile);
  if (invalidProfile.length) throw new ConsumerProfileError(invalidProfile);
  const invalidScene = sceneIssues(scene);
  if (invalidScene.length) throw new ConsumerSceneError(invalidScene);

  const negotiation = negotiateConsumerCapabilities(scene, profile);
  const maximumIndex = DETAIL_INDEX.get(profile.selection.maximumDetailTier);
  const sourceElements = elementsOf(scene);
  const assignments = sourceElements.map((element) => ({
    elementId: element.id,
    tier: element.semanticDetailTier,
    source: element.semanticDetailSource,
  }));
  const included = new Set(sourceElements
    .filter((element) => DETAIL_INDEX.get(element.semanticDetailTier) <= maximumIndex)
    .map((element) => element.id));
  const includedElementIds = sourceElements.filter((element) => included.has(element.id)).map((element) => element.id);
  const omittedElementIds = sourceElements.filter((element) => !included.has(element.id)).map((element) => element.id);
  const filteredScene = cloneData(scene);
  for (const group of filteredScene.compositingGroups) {
    group.elements = group.elements.filter((element) => included.has(element.id));
  }
  const paletteRoles = [...new Set(elementsOf(filteredScene).map((element) => element.paletteRole))];

  return {
    schema: 'paper-rig/consumer-handoff/1',
    schemaVersion: '1.0.0',
    modelId: scene.modelId,
    consumer: {
      profileId: profile.id,
      profileSchemaVersion: profile.schemaVersion,
    },
    selection: {
      view: scene.view,
      pose: cloneData(scene.pose),
      camera: {
        type: scene.camera.type,
        elevationDegrees: scene.camera.elevationDegrees,
        headingDegrees: scene.camera.headingDegrees,
      },
      maximumDetailTier: profile.selection.maximumDetailTier,
      paletteId: profile.selection.paletteId,
    },
    negotiation,
    semanticDetail: {
      orderedTiers: [...SEMANTIC_DETAIL_TIERS],
      assignments,
      includedElementIds,
      omittedElementIds,
    },
    paletteRoles,
    scene: filteredScene,
  };
}
