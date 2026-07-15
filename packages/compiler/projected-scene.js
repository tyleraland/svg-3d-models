// paper-rig/projected-scene/1 public document assembly. Projection, semantic
// grouping, source traceability, and structured vector geometry are calculated
// once by core.projectedRenderPlan(); both this document and svgMarkup() consume
// that plan.

import * as core from './core.js';

export function buildProjectedScene(rig, time, clipId, view = 'projected') {
  const plan = core.projectedRenderPlan(rig, time, clipId, view);
  const { pose, basis, projectedJoints } = plan;

  return {
    schema: 'paper-rig/projected-scene/1',
    schemaVersion: '1.0.0',
    modelId: rig.id,
    view,
    pose: { clipId, timeNormalized: time },
    camera: {
      type: 'orthographic',
      elevationDegrees: view === 'projected' ? core.state.elev : null,
      headingDegrees: view === 'projected' ? core.state.az : null,
      basis: {
        right: [...basis.right],
        up: [...basis.up],
        forward: [...basis.fwd],
      },
    },
    coordinateSpaces: {
      world: { units: 'meters', forwardAxis: '+x', leftAxis: '+y', upAxis: '+z' },
      screen: { units: 'token', origin: 'top-left', xAxis: '+right', yAxis: '+down', viewBox: [0, 0, 100, 100], groundY: rig.tokenGroundY },
    },
    joints: rig.joints.map((joint) => ({
      id: joint.id,
      parentId: joint.parent ?? null,
      worldPositionMeters: [...pose.positions[joint.id]],
      localToWorldRotation: pose.rotations[joint.id].map((row) => [...row]),
      screenPosition: projectedJoints[joint.id].slice(0, 2),
      cameraDepth: projectedJoints[joint.id][2],
    })),
    compositingGroups: plan.groups.map(({ id, semanticRole, order, elements }) => ({
      id, semanticRole, order, elements,
    })),
  };
}
