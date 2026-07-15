// Canonical projected-scene approval manifests and change-focused comparisons.
// A manifest is review evidence, not a claim that its contents are inherently
// correct. Comparisons report changes without assigning them error severity.

import { compilePackage, core, projectScene } from '@paper-rig/compiler';
import Ajv2020 from 'ajv/dist/2020.js';
import auditManifestSchema from '@paper-rig/schema/schemas/audit-manifest-1.schema.json' with { type: 'json' };
import { DEFAULT_AUDIT_ELEVATIONS, DEFAULT_AUDIT_HEADINGS, defaultAuditPoses } from './audit.js';

const NUMERIC_PRECISION = 1e-9;
const NUMERIC_DIGITS = 9;
const NUMBER = '-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const FULL_NUMBER = new RegExp(`^${NUMBER}$`);
const NUMBER_TOKEN = new RegExp(NUMBER, 'g');
const TOKENIZED_GEOMETRY_ATTRIBUTES = new Set(['d', 'points', 'transform']);
const validateManifestSchema = new Ajv2020({ allErrors: true, strict: true }).compile(auditManifestSchema);

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));

export function validateAuditManifest(manifest) {
  const valid = validateManifestSchema(manifest);
  return {
    valid,
    errors: valid ? [] : (validateManifestSchema.errors || []).map((error) => ({
      path: error.instancePath || '/',
      message: error.message,
    })),
  };
}

function canonicalNumber(value) {
  const rounded = Number(Number(value).toFixed(NUMERIC_DIGITS));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function canonicalNumberString(value) {
  return String(canonicalNumber(Number(value)));
}

function canonicalAttribute(name, value) {
  const text = String(value);
  if (FULL_NUMBER.test(text)) return canonicalNumberString(text);
  if (TOKENIZED_GEOMETRY_ATTRIBUTES.has(name)) {
    return text.replace(NUMBER_TOKEN, (token) => canonicalNumberString(token));
  }
  return text;
}

function canonicalValue(value) {
  if (typeof value === 'number') return canonicalNumber(value);
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
}

function canonicalVector(vector) {
  return {
    tag: vector.tag,
    attributes: Object.fromEntries(Object.keys(vector.attributes).sort().map((name) => (
      [name, canonicalAttribute(name, vector.attributes[name])]
    ))),
  };
}

function manifestElement(element) {
  return {
    id: element.id,
    semantic: {
      sourceId: element.sourceId,
      sourceKind: element.sourceKind,
      kind: element.kind,
      generated: element.generated,
      semanticRole: element.semanticRole,
      bodyRegion: element.bodyRegion,
      side: element.side,
      paletteRole: element.paletteRole,
      lodTier: element.lodTier,
      depthBias: canonicalNumber(element.depthBias),
    },
    projection: {
      cameraDepth: canonicalNumber(element.cameraDepth),
      surfaceFrame: element.surfaceFrame ? canonicalValue(element.surfaceFrame) : null,
    },
    vector: canonicalVector(element.vector),
  };
}

function manifestView(scene, activeContactIds) {
  const elements = scene.compositingGroups
    .flatMap((group) => group.elements.map(manifestElement))
    .sort((left, right) => left.id.localeCompare(right.id));
  return {
    id: `${scene.pose.clipId}@${scene.pose.timeNormalized}@${scene.camera.elevationDegrees}@${scene.camera.headingDegrees}`,
    poseId: null,
    clipId: scene.pose.clipId,
    timeNormalized: canonicalNumber(scene.pose.timeNormalized),
    elevationDegrees: canonicalNumber(scene.camera.elevationDegrees),
    headingDegrees: canonicalNumber(scene.camera.headingDegrees),
    activeContactIds: sorted(activeContactIds),
    joints: scene.joints.map((joint) => ({
      id: joint.id,
      parentId: joint.parentId,
      worldPositionMeters: canonicalValue(joint.worldPositionMeters),
      localToWorldRotation: canonicalValue(joint.localToWorldRotation),
      screenPosition: canonicalValue(joint.screenPosition),
      cameraDepth: canonicalNumber(joint.cameraDepth),
    })),
    compositingGroups: scene.compositingGroups.map((group) => ({
      id: group.id,
      semanticRole: group.semanticRole,
      order: group.order,
      elementIds: group.elements.map((element) => element.id),
    })),
    elements,
  };
}

export function createAuditManifest(rig, options = {}) {
  const pkg = compilePackage(rig);
  const headings = [...(options.headings || DEFAULT_AUDIT_HEADINGS)];
  const elevations = [...(options.elevations || DEFAULT_AUDIT_ELEVATIONS)];
  const poses = (options.poses || defaultAuditPoses(rig, pkg)).map((pose) => ({ ...pose }));
  const views = [];

  for (const pose of poses) {
    for (const elevation of elevations) {
      for (const heading of headings) {
        const scene = projectScene(rig, {
          clip: pose.clip,
          time: pose.t,
          elevation,
          heading,
        });
        const activeContactIds = pose.clip === 'bind'
          ? pkg.groundContacts
          : core.contactIds(rig, pose.clip, pose.t);
        const view = manifestView(scene, activeContactIds);
        view.id = `${pose.id}@${elevation}@${heading}`;
        view.poseId = pose.id;
        views.push(view);
      }
    }
  }

  return {
    schema: 'paper-rig/audit-manifest/1',
    schemaVersion: '1.0.0',
    modelId: rig.id,
    canonicalization: {
      numericPrecision: NUMERIC_PRECISION,
      geometryNumberFormat: 'normalized-decimal-tokens',
    },
    sampling: {
      headingsDegrees: headings.map(canonicalNumber),
      elevationsDegrees: elevations.map(canonicalNumber),
      poses: poses.map((pose) => ({
        id: pose.id,
        clip: pose.clip,
        t: canonicalNumber(pose.t),
      })),
    },
    views,
  };
}

function emptySummary(approved, current) {
  return {
    approvedViewCount: Array.isArray(approved?.views) ? approved.views.length : 0,
    currentViewCount: Array.isArray(current?.views) ? current.views.length : 0,
    changedViewCount: 0,
    unchangedViewCount: 0,
    addedElementOccurrenceCount: 0,
    removedElementOccurrenceCount: 0,
    semanticChangeCount: 0,
    projectionChangeCount: 0,
    geometryChangeCount: 0,
    compositingChangeCount: 0,
    jointTransformChangeCount: 0,
    contactChangeCount: 0,
  };
}

function incompatibleDiff(approved, current, incompatibilities) {
  return {
    schema: 'paper-rig/audit-manifest-diff/1',
    schemaVersion: '1.0.0',
    approvedModelId: approved?.modelId ?? null,
    currentModelId: current?.modelId ?? null,
    compatible: false,
    status: 'incompatible',
    summary: emptySummary(approved, current),
    incompatibilities,
    changes: [],
  };
}

function indexById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function compositingPositions(view, includedIds) {
  const positions = new Map();
  for (const group of view.compositingGroups) {
    group.elementIds.filter((id) => includedIds.has(id)).forEach((id, elementOrder) => positions.set(id, {
      groupId: group.id,
      semanticRole: group.semanticRole,
      groupOrder: group.order,
      elementOrder,
    }));
  }
  return positions;
}

function changedIds(ids, approved, current, select = (value) => value) {
  return ids.filter((id) => !same(select(approved.get(id)), select(current.get(id))));
}

export function diffAuditManifests(approved, current) {
  const incompatibilities = [];
  const approvedValidation = validateAuditManifest(approved);
  const currentValidation = validateAuditManifest(current);
  if (!approvedValidation.valid) {
    const first = approvedValidation.errors[0];
    incompatibilities.push({ code: 'manifest.approved-document', message: `approved manifest is invalid at ${first.path}: ${first.message}` });
  }
  if (!currentValidation.valid) {
    const first = currentValidation.errors[0];
    incompatibilities.push({ code: 'manifest.current-document', message: `current manifest is invalid at ${first.path}: ${first.message}` });
  }
  if (incompatibilities.length) return incompatibleDiff(approved, current, incompatibilities);
  if (approved?.schema !== 'paper-rig/audit-manifest/1') {
    incompatibilities.push({ code: 'manifest.approved-schema', message: 'approved input is not paper-rig/audit-manifest/1' });
  }
  if (current?.schema !== 'paper-rig/audit-manifest/1') {
    incompatibilities.push({ code: 'manifest.current-schema', message: 'current input is not paper-rig/audit-manifest/1' });
  }
  if (approved?.schemaVersion !== current?.schemaVersion) {
    incompatibilities.push({ code: 'manifest.schema-version', message: `schema versions differ: ${approved?.schemaVersion ?? 'missing'} vs ${current?.schemaVersion ?? 'missing'}` });
  }
  if (approved?.modelId !== current?.modelId) {
    incompatibilities.push({ code: 'manifest.model-id', message: `model IDs differ: ${approved?.modelId ?? 'missing'} vs ${current?.modelId ?? 'missing'}` });
  }
  if (!same(approved?.canonicalization, current?.canonicalization)) {
    incompatibilities.push({ code: 'manifest.canonicalization', message: 'numeric canonicalization contracts differ' });
  }
  if (!same(approved?.sampling, current?.sampling)) {
    incompatibilities.push({ code: 'manifest.sampling', message: 'pose/camera sampling manifests differ' });
  }
  if (!Array.isArray(approved?.views) || !Array.isArray(current?.views)) {
    incompatibilities.push({ code: 'manifest.views', message: 'both manifests must contain view arrays' });
  } else if (!same(approved.views.map((view) => view.id), current.views.map((view) => view.id))) {
    incompatibilities.push({ code: 'manifest.view-ids', message: 'ordered canonical view IDs differ' });
  }
  if (incompatibilities.length) return incompatibleDiff(approved, current, incompatibilities);

  const summary = emptySummary(approved, current);
  const changes = [];
  const approvedViews = indexById(approved.views);

  for (const currentView of current.views) {
    const approvedView = approvedViews.get(currentView.id);
    const approvedElements = indexById(approvedView.elements);
    const currentElements = indexById(currentView.elements);
    const approvedElementIds = new Set(approvedElements.keys());
    const currentElementIds = new Set(currentElements.keys());
    const addedElementIds = sorted([...currentElementIds].filter((id) => !approvedElementIds.has(id)));
    const removedElementIds = sorted([...approvedElementIds].filter((id) => !currentElementIds.has(id)));
    const commonElementIds = sorted([...currentElementIds].filter((id) => approvedElementIds.has(id)));
    const semanticChangedElementIds = changedIds(commonElementIds, approvedElements, currentElements, (element) => element.semantic);
    const projectionChangedElementIds = changedIds(commonElementIds, approvedElements, currentElements, (element) => element.projection);
    const geometryChangedElementIds = changedIds(commonElementIds, approvedElements, currentElements, (element) => element.vector);

    const commonElementIdSet = new Set(commonElementIds);
    const approvedCompositing = compositingPositions(approvedView, commonElementIdSet);
    const currentCompositing = compositingPositions(currentView, commonElementIdSet);
    const compositingChangedElementIds = changedIds(commonElementIds, approvedCompositing, currentCompositing);

    const approvedJoints = indexById(approvedView.joints);
    const currentJoints = indexById(currentView.joints);
    const jointIds = sorted(new Set([...approvedJoints.keys(), ...currentJoints.keys()]));
    const jointTransformChangedIds = changedIds(jointIds, approvedJoints, currentJoints);
    const contactChanged = !same(approvedView.activeContactIds, currentView.activeContactIds);

    const categories = [];
    if (addedElementIds.length) categories.push('elements-added');
    if (removedElementIds.length) categories.push('elements-removed');
    if (semanticChangedElementIds.length) categories.push('semantic-metadata');
    if (projectionChangedElementIds.length) categories.push('surface-or-depth');
    if (geometryChangedElementIds.length) categories.push('vector-geometry');
    if (compositingChangedElementIds.length) categories.push('compositing-order');
    if (jointTransformChangedIds.length) categories.push('joint-transform');
    if (contactChanged) categories.push('active-contacts');
    if (!categories.length) continue;

    changes.push({
      viewId: currentView.id,
      poseId: currentView.poseId,
      elevationDegrees: currentView.elevationDegrees,
      headingDegrees: currentView.headingDegrees,
      categories,
      addedElementIds,
      removedElementIds,
      semanticChangedElementIds,
      projectionChangedElementIds,
      geometryChangedElementIds,
      compositingChangedElementIds,
      jointTransformChangedIds,
      contactChanged,
      approvedContactIds: contactChanged ? approvedView.activeContactIds : [],
      currentContactIds: contactChanged ? currentView.activeContactIds : [],
    });
    summary.addedElementOccurrenceCount += addedElementIds.length;
    summary.removedElementOccurrenceCount += removedElementIds.length;
    summary.semanticChangeCount += semanticChangedElementIds.length;
    summary.projectionChangeCount += projectionChangedElementIds.length;
    summary.geometryChangeCount += geometryChangedElementIds.length;
    summary.compositingChangeCount += compositingChangedElementIds.length;
    summary.jointTransformChangeCount += jointTransformChangedIds.length;
    summary.contactChangeCount += Number(contactChanged);
  }

  summary.changedViewCount = changes.length;
  summary.unchangedViewCount = current.views.length - changes.length;
  return {
    schema: 'paper-rig/audit-manifest-diff/1',
    schemaVersion: '1.0.0',
    approvedModelId: approved.modelId,
    currentModelId: current.modelId,
    compatible: true,
    status: changes.length ? 'changed' : 'unchanged',
    summary,
    incompatibilities: [],
    changes,
  };
}
