// Structured, deterministic overlay evidence for audit review artifacts.
// The evidence is machine-readable; SVG markup is a self-contained rendering
// adapter and does not participate in model compilation.

import { axisVector } from '@paper-rig/schema';

const GROUP_CLASS = (order) => `auditGroup${order}`;

const finitePoint = (point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);
const average = (points) => points.length
  ? [
      points.reduce((sum, point) => sum + point[0], 0) / points.length,
      points.reduce((sum, point) => sum + point[1], 0) / points.length,
    ]
  : null;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const rounded = (value, digits = 6) => {
  const result = Number(value.toFixed(digits));
  return Object.is(result, -0) ? 0 : result;
};
const dot = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);
const matrixVector = (matrix, vector) => matrix.map((row) => dot(row, vector));
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function vectorCenter(vector) {
  const attributes = vector.attributes;
  if (vector.tag === 'circle' || vector.tag === 'ellipse') {
    const point = [Number(attributes.cx), Number(attributes.cy)];
    return finitePoint(point) ? point : null;
  }
  if (vector.tag === 'rect') {
    const point = [
      Number(attributes.x) + Number(attributes.width) / 2,
      Number(attributes.y) + Number(attributes.height) / 2,
    ];
    return finitePoint(point) ? point : null;
  }
  return null;
}

function plateAnchor(plate, jointById, element) {
  const references = plate?.span?.length
    ? plate.span
    : plate?.points?.filter((id) => typeof id === 'string') || [];
  const referencePoints = references.map((id) => jointById.get(id)?.screenPosition).filter(finitePoint);
  if (referencePoints.length) return average(referencePoints);
  const bonePoint = jointById.get(plate?.bone)?.screenPosition;
  return finitePoint(bonePoint) ? bonePoint : vectorCenter(element.vector);
}

function labelPlacement(anchor, collisionIndex) {
  const placeLeft = anchor[0] > 64;
  return {
    position: [
      rounded(clamp(anchor[0] + (placeLeft ? -3.5 : 3.5), 2, 98)),
      rounded(clamp(anchor[1] - 3 + collisionIndex * 2.4, 2, 98)),
    ],
    textAnchor: placeLeft ? 'end' : 'start',
  };
}

function projectWorld(scene, rig, worldPosition) {
  const { right, up, forward } = scene.camera.basis;
  return {
    screenPosition: [
      rounded(50 + dot(worldPosition, right) * rig.tokenScale),
      rounded(scene.coordinateSpaces.screen.groundY - dot(worldPosition, up) * rig.tokenScale),
    ],
    cameraDepth: rounded(dot(worldPosition, forward)),
  };
}

function anchorEvidence(rig, scene, jointById) {
  const legacy = [...rig.anchors].flatMap((anchor) => {
    const joint = jointById.get(anchor.bone);
    if (!joint) return [];
    const offset = matrixVector(joint.localToWorldRotation, anchor.offset || [0, 0, 0]);
    const worldPosition = joint.worldPositionMeters.map((value, index) => value + offset[index]);
    const projected = projectWorld(scene, rig, worldPosition);
    return [{
      id: anchor.id,
      boneId: anchor.bone,
      moduleType: anchor.moduleType || null,
      worldPositionMeters: worldPosition.map((value) => rounded(value)),
      screenPosition: projected.screenPosition,
      cameraDepth: projected.cameraDepth,
    }];
  });
  const authored = (rig.attachmentSlots || []).flatMap((slot) => {
    const joint = jointById.get(slot.resolvedParentJointId);
    const localPosition = slot.resolvedJointFrame?.positionMeters;
    if (!joint || !Array.isArray(localPosition)) return [];
    const offset = matrixVector(joint.localToWorldRotation, localPosition);
    const worldPosition = joint.worldPositionMeters.map((value, index) => value + offset[index]);
    const projected = projectWorld(scene, rig, worldPosition);
    return [{
      id: slot.id,
      boneId: slot.resolvedParentJointId,
      moduleType: slot.type,
      owner: slot.owner,
      worldPositionMeters: worldPosition.map((value) => rounded(value)),
      screenPosition: projected.screenPosition,
      cameraDepth: projected.cameraDepth,
    }];
  });
  const authoredIds = new Set(authored.map((slot) => slot.id));
  return [...legacy.filter((anchor) => !authoredIds.has(anchor.id)), ...authored]
    .sort((left, right) => left.id.localeCompare(right.id));
}

function surfaceNormalEvidence(rig, scene, jointById, plateLabels) {
  const plateById = new Map(rig.plates.map((plate) => [plate.id, plate]));
  const labelById = new Map(plateLabels.map((label) => [label.sourceId, label]));
  const elementBySourceId = new Map(scene.compositingGroups.flatMap((group) => group.elements
    .filter((element) => element.sourceKind === 'plate' && !element.generated)
    .map((element) => [element.sourceId, element])));
  return [...plateById.values()].sort((left, right) => left.id.localeCompare(right.id)).flatMap((plate) => {
    const element = elementBySourceId.get(plate.id);
    const label = labelById.get(plate.id);
    if (!element || !label || (!element.surfaceFrame && !plate.surfaceNormal)) return [];
    let cameraNormal = element.surfaceFrame?.camera?.normal;
    if (!cameraNormal) {
      const joint = jointById.get(plate.bone);
      if (!joint) return [];
      const worldNormal = matrixVector(joint.localToWorldRotation, axisVector(plate.surfaceNormal));
      cameraNormal = [
        dot(worldNormal, scene.camera.basis.right),
        dot(worldNormal, scene.camera.basis.up),
        dot(worldNormal, scene.camera.basis.forward),
      ];
    }
    const screenDirection = [cameraNormal[0], -cameraNormal[1]];
    const length = Math.hypot(...screenDirection);
    const endpoint = length > 1e-9
      ? label.anchor.map((value, index) => rounded(value + screenDirection[index] / length * 5))
      : [...label.anchor];
    return [{
      sourceId: plate.id,
      anchor: [...label.anchor],
      endpoint,
      cameraNormal: cameraNormal.map((value) => rounded(value)),
      cameraFacing: rounded(cameraNormal[2]),
    }];
  });
}

export function buildAuditOverlayEvidence(rig, scene, activeContactIds = []) {
  const jointById = new Map(scene.joints.map((joint) => [joint.id, joint]));
  const plateById = new Map(rig.plates.map((plate) => [plate.id, plate]));
  const collisions = new Map();
  const plateLabels = [];

  for (const group of scene.compositingGroups) {
    group.elements.forEach((element, elementOrder) => {
      if (element.sourceKind !== 'plate' || element.generated || element.bodyRegion === 'groundShadow') return;
      const anchor = plateAnchor(plateById.get(element.sourceId), jointById, element);
      if (!finitePoint(anchor)) return;
      const key = anchor.map((value) => rounded(value, 3)).join(',');
      const collisionIndex = collisions.get(key) || 0;
      collisions.set(key, collisionIndex + 1);
      const placement = labelPlacement(anchor, collisionIndex);
      plateLabels.push({
        elementId: element.id,
        sourceId: element.sourceId,
        groupId: group.id,
        groupOrder: group.order,
        elementOrder,
        cameraDepth: rounded(element.cameraDepth),
        anchor: anchor.map((value) => rounded(value)),
        labelPosition: placement.position,
        textAnchor: placement.textAnchor,
        label: `${element.sourceId} · g${group.order} · z${rounded(element.cameraDepth, 3)}`,
      });
    });
  }

  const contacts = [...new Set(activeContactIds)].sort().flatMap((jointId) => {
    const position = jointById.get(jointId)?.screenPosition;
    return finitePoint(position) ? [{ jointId, screenPosition: position.map((value) => rounded(value)) }] : [];
  });
  const anchors = anchorEvidence(rig, scene, jointById);
  const surfaceNormals = surfaceNormalEvidence(rig, scene, jointById, plateLabels);

  return {
    schema: 'paper-rig/audit-overlay/1',
    schemaVersion: '1.0.0',
    compositingGroups: scene.compositingGroups.map((group) => ({
      id: group.id,
      semanticRole: group.semanticRole,
      order: group.order,
      elementIds: group.elements.map((element) => element.id),
    })),
    plateLabels,
    contacts,
    anchors,
    surfaceNormals,
  };
}

function vectorMarkup(element, className) {
  const attributes = Object.entries(element.vector.attributes)
    .filter(([name]) => !['id', 'class', 'data-palette-role', 'fill', 'stroke'].includes(name))
    .map(([name, value]) => `${name}="${escapeXml(value)}"`)
    .join(' ');
  return `<${element.vector.tag} class="${className}" ${attributes}/>`;
}

export function renderAuditOverlaySvg(scene, evidence, changes = {}) {
  const elementById = new Map(scene.compositingGroups.flatMap((group) => group.elements.map((element) => [element.id, element])));
  const groupOrderByElement = new Map(evidence.compositingGroups.flatMap((group) => group.elementIds.map((id) => [id, group.order])));
  const compositing = [...elementById.values()].map((element) => vectorMarkup(
    element,
    `auditElementOutline ${GROUP_CLASS(groupOrderByElement.get(element.id))}`,
  )).join('');
  const plateLabels = evidence.plateLabels.map((label) => (
    `<line class="auditPlateLeader ${GROUP_CLASS(label.groupOrder)}" x1="${label.anchor[0]}" y1="${label.anchor[1]}" x2="${label.labelPosition[0]}" y2="${label.labelPosition[1]}"/>`
    + `<text class="auditPlateLabel ${GROUP_CLASS(label.groupOrder)}" x="${label.labelPosition[0]}" y="${label.labelPosition[1]}" text-anchor="${label.textAnchor}">${escapeXml(label.label)}</text>`
  )).join('');
  const contacts = evidence.contacts.map((contact) => (
    `<circle class="auditContactRing" cx="${contact.screenPosition[0]}" cy="${contact.screenPosition[1]}" r="3.2"/>`
    + `<text class="auditContactLabel" x="${contact.screenPosition[0] + 3.8}" y="${contact.screenPosition[1] - 2.6}">${escapeXml(contact.jointId)}</text>`
  )).join('');
  const anchors = evidence.anchors.map((anchor) => (
    `<path class="auditAnchorMark" d="M ${anchor.screenPosition[0] - 1.8} ${anchor.screenPosition[1]} L ${anchor.screenPosition[0] + 1.8} ${anchor.screenPosition[1]} M ${anchor.screenPosition[0]} ${anchor.screenPosition[1] - 1.8} L ${anchor.screenPosition[0]} ${anchor.screenPosition[1] + 1.8}"/>`
    + `<text class="auditAnchorLabel" x="${anchor.screenPosition[0] + 2.3}" y="${anchor.screenPosition[1] + 2.3}">${escapeXml(anchor.id)}${anchor.moduleType ? ` · ${escapeXml(anchor.moduleType)}` : ''}</text>`
  )).join('');
  const normals = evidence.surfaceNormals.map((normal) => (
    `<line class="auditNormalLine" x1="${normal.anchor[0]}" y1="${normal.anchor[1]}" x2="${normal.endpoint[0]}" y2="${normal.endpoint[1]}"/>`
    + `<circle class="auditNormalTip" cx="${normal.endpoint[0]}" cy="${normal.endpoint[1]}" r=".8"><title>${escapeXml(normal.sourceId)} normal · camera ${normal.cameraFacing}</title></circle>`
  )).join('');

  const changedElementIds = new Set(changes.elementIds || []);
  const changedElements = [...changedElementIds].flatMap((id) => {
    const element = elementById.get(id);
    return element ? [vectorMarkup(element, 'auditChangedElement')] : [];
  }).join('');
  const changedLabelByElement = new Map(evidence.plateLabels.map((label) => [label.elementId, label]));
  const changedLabels = [...changedElementIds].flatMap((id) => {
    const label = changedLabelByElement.get(id);
    return label ? [`<text class="auditChangedLabel" x="${label.labelPosition[0]}" y="${label.labelPosition[1]}" text-anchor="${label.textAnchor}">${escapeXml(label.sourceId)}</text>`] : [];
  }).join('');
  const jointById = new Map(scene.joints.map((joint) => [joint.id, joint]));
  const changedJoints = [...new Set(changes.jointIds || [])].sort().flatMap((id) => {
    const joint = jointById.get(id);
    if (!joint) return [];
    return [`<circle class="auditChangedJoint" cx="${joint.screenPosition[0]}" cy="${joint.screenPosition[1]}" r="2.3"/><text class="auditChangedLabel" x="${joint.screenPosition[0] + 2.8}" y="${joint.screenPosition[1] + 2.8}">${escapeXml(id)}</text>`];
  }).join('');
  const changedContacts = [...new Set(changes.contactIds || [])].sort().flatMap((id) => {
    const joint = jointById.get(id);
    return joint ? [`<circle class="auditChangedContact" cx="${joint.screenPosition[0]}" cy="${joint.screenPosition[1]}" r="4.2"/>`] : [];
  }).join('');

  return `<g class="auditCompositingOverlay">${compositing}</g><g class="auditPlateDepthOverlay">${plateLabels}</g><g class="auditContactOverlay">${contacts}</g><g class="auditFrameOverlay">${anchors}${normals}</g><g class="auditChangedOverlay">${changedElements}${changedLabels}${changedJoints}${changedContacts}</g>`;
}
