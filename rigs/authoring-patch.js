// Pure workbench-to-source patch generation. This module is DOM-free and is
// also flattened into the generated workbench, so browser and Node tests share
// one exact patch contract.

import { cloneData } from '@paper-rig/schema';

const PATCH_EPSILON = 1e-9;

export class AuthoringPatchError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthoringPatchError';
    this.code = code;
  }
}

function patchCanonicalNumber(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) {
    throw new AuthoringPatchError('invalid-transform', 'local transform components must be finite numbers');
  }
  return Object.is(number, -0) ? 0 : number;
}

function patchVector(value) {
  return [0, 1, 2].map((index) => patchCanonicalNumber(value?.[index]));
}

function patchVectorIsZero(value) {
  return value.every((component) => Math.abs(component) <= PATCH_EPSILON);
}

function patchTransformChanged(current, baseline) {
  return ['move', 'rot'].some((kind) => {
    const left = patchVector(current?.[kind]);
    const right = patchVector(baseline?.[kind]);
    return left.some((value, index) => Math.abs(value - right[index]) > PATCH_EPSILON);
  });
}

function patchEditedJoints(rig, jointTransforms = {}) {
  const jointIds = new Set(rig.joints.map((joint) => joint.id));
  const edits = [];
  for (const jointId of Object.keys(jointTransforms).sort()) {
    if (!jointIds.has(jointId)) {
      throw new AuthoringPatchError('unknown-joint', `local edit targets unknown joint ${jointId}`);
    }
    const move = patchVector(jointTransforms[jointId]?.move);
    const rot = patchVector(jointTransforms[jointId]?.rot);
    if (!patchVectorIsZero(move) || !patchVectorIsZero(rot)) edits.push({ jointId, move, rot });
  }
  return edits;
}

function patchRigidChildIds(rig) {
  return new Set(rig.plates
    .filter((plate) => plate.attachment === 'rigid' && plate.span?.length === 2)
    .map((plate) => plate.span[1]));
}

export function createClipKeyframePatch({
  sourceModelId,
  source,
  rig,
  clipId,
  time,
  jointTransforms = {},
  modelTransform = { move: [0, 0, 0], rot: [0, 0, 0] },
  baselineModelTransform = { move: [0, 0, 0], rot: [0, 0, 0] },
  heightScale = 1,
  widthScale = 1,
}) {
  if (!source || source.$schema !== 'paper-rig/model-1') {
    throw new AuthoringPatchError('missing-model-source', 'the declarative model source is unavailable');
  }
  if (patchTransformChanged(modelTransform, baselineModelTransform)) {
    throw new AuthoringPatchError('model-transform', 'global model transforms cannot be represented as a local clip keyframe patch');
  }
  if (Math.abs(heightScale - 1) > PATCH_EPSILON || Math.abs(widthScale - 1) > PATCH_EPSILON) {
    throw new AuthoringPatchError('preview-proportions', 'preview proportion scaling has no exact model-source mapping');
  }

  const edits = patchEditedJoints(rig, jointTransforms);
  if (!edits.length) throw new AuthoringPatchError('no-local-edits', 'make a local joint edit to create a source patch');

  const clip = rig.clips[clipId];
  if (!clip) throw new AuthoringPatchError('unknown-clip', `clip ${clipId} does not exist on ${rig.id}`);
  const keyframeIndex = clip.frames.findIndex((frame) => Math.abs(frame.t - time) <= PATCH_EPSILON);
  if (keyframeIndex < 0) {
    throw new AuthoringPatchError('not-a-keyframe', 'select an existing keyframe before copying a source patch');
  }

  const rigidChildren = patchRigidChildIds(rig);
  const rigidTranslations = edits.filter((edit) => rigidChildren.has(edit.jointId) && !patchVectorIsZero(edit.move));
  if (rigidTranslations.length) {
    throw new AuthoringPatchError(
      'rigid-child-translation',
      `rotate parent joints instead of translating rigid-span children: ${rigidTranslations.map((edit) => edit.jointId).join(', ')}`,
    );
  }

  const poses = {};
  const rotations = {};
  for (const edit of edits) {
    if (!patchVectorIsZero(edit.move)) poses[edit.jointId] = edit.move;
    if (!patchVectorIsZero(edit.rot)) rotations[edit.jointId] = edit.rot;
  }
  const add = {};
  if (Object.keys(poses).length) add.poses = poses;
  if (Object.keys(rotations).length) add.rotations = rotations;
  const frame = clip.frames[keyframeIndex];

  return {
    $schema: 'paper-rig/model-patch-1',
    schemaVersion: '1.0.0',
    sourceModelId,
    resolvedModelId: rig.id,
    kind: 'clip-keyframe',
    context: {
      clipId,
      timeNormalized: frame.t,
      keyframeIndex,
      editedJointIds: edits.map((edit) => edit.jointId),
    },
    operation: {
      op: 'append',
      path: '/clipPatches',
      value: {
        clip: clipId,
        t: frame.t,
        add,
      },
    },
  };
}

export function inspectClipKeyframePatch(input) {
  try {
    return { status: 'ready', code: null, message: 'schema-valid clip keyframe patch ready to copy', patch: createClipKeyframePatch(input) };
  } catch (error) {
    if (!(error instanceof AuthoringPatchError)) throw error;
    return {
      status: error.code === 'no-local-edits' ? 'empty' : 'unsupported',
      code: error.code,
      message: error.message,
      patch: null,
    };
  }
}

export function applyModelPatch(source, patch, { sourceModelId } = {}) {
  if (patch?.$schema !== 'paper-rig/model-patch-1' || patch.kind !== 'clip-keyframe') {
    throw new AuthoringPatchError('invalid-patch', 'expected a paper-rig/model-patch-1 clip-keyframe patch');
  }
  if (patch.operation?.op !== 'append' || patch.operation?.path !== '/clipPatches') {
    throw new AuthoringPatchError('unsupported-operation', 'only append /clipPatches is supported');
  }
  if (sourceModelId && patch.sourceModelId !== sourceModelId) {
    throw new AuthoringPatchError('source-model-mismatch', `patch targets source model ${patch.sourceModelId}, not ${sourceModelId}`);
  }
  if (source?.variant?.id && patch.resolvedModelId !== source.variant.id) {
    throw new AuthoringPatchError('resolved-model-mismatch', `patch targets resolved model ${patch.resolvedModelId}, not ${source.variant.id}`);
  }
  const value = patch.operation.value;
  if (patch.context?.clipId !== value?.clip
      || !Number.isFinite(patch.context?.timeNormalized)
      || !Number.isFinite(value?.t)
      || Math.abs(patch.context.timeNormalized - value.t) > PATCH_EPSILON) {
    throw new AuthoringPatchError('patch-context-mismatch', 'patch context does not match its clip keyframe operation');
  }
  const operationJointIds = [...new Set([
    ...Object.keys(value?.add?.poses || {}),
    ...Object.keys(value?.add?.rotations || {}),
  ])].sort();
  const contextJointIds = [...(patch.context?.editedJointIds || [])].sort();
  if (!operationJointIds.length || JSON.stringify(operationJointIds) !== JSON.stringify(contextJointIds)) {
    throw new AuthoringPatchError('patch-context-mismatch', 'patch context joint IDs do not match its local transform operation');
  }
  const candidate = cloneData(source);
  candidate.clipPatches ||= [];
  candidate.clipPatches.push(cloneData(value));
  return candidate;
}
