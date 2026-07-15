// @paper-rig/rigs — resolveModel: turn a thin declarative model (a family
// reference plus proportion/plate/anchor/clip overrides) into a fully normalized
// paper-rig/1 rig, in ONE ordered pass. This replaces the workbench's pattern of
// defining a rig and mutating it later with scattered Object.assign calls: every
// override is an explicit input to a single traceable fold.
//
//   import { resolveModel, loadModel } from '@paper-rig/rigs';
//   const rig = loadModel('rabbit');            // reads rigs/models/rabbit.json
//   const rig = resolveModel(modelObj, familyObj);

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import { cloneData } from '@paper-rig/schema';
import { resolveAttachmentAssembly } from '@paper-rig/attachments';
import { createProvenanceTracker } from './provenance.js';
import {
  quadrupedVariant, tuneQuadrupedLimbs, addMuzzle, addPairedEars,
  setRotationalAttack, rotationalGait, ensureCanonicalClips, inferredAnchorModule,
} from './family-kit.js';

const RIGS_DIR = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(RIGS_DIR, 'modules');
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));

export function loadFamily(name) {
  return readJSON(join(RIGS_DIR, 'families', `${name}.json`));
}
export function loadModelSource(name) {
  const path = name.endsWith('.json') ? name : join(RIGS_DIR, 'models', `${name}.json`);
  return readJSON(path);
}
export function loadModel(name) {
  const model = loadModelSource(name);
  return resolveModel(model, loadFamily(model.family));
}
export function loadAttachmentModule(name) {
  const path = name.endsWith('.json') ? name : join(MODULES_DIR, `${name}.json`);
  return readJSON(path);
}
export function loadAttachmentModulesForModel(model) {
  const moduleIds = [...new Set((model.attachments || []).map((instance) => instance.moduleId))];
  return Object.fromEntries(moduleIds.map((id) => [id, loadAttachmentModule(id)]));
}
export function loadModelAssembly(name) {
  const model = loadModelSource(name);
  return resolveModelAssembly(model, loadFamily(model.family), {
    sourceModelId: basename(name, '.json'),
    modules: loadAttachmentModulesForModel(model),
  });
}
export function loadModelWithProvenance(name) {
  const model = loadModelSource(name);
  const sourceModelId = basename(name, '.json');
  return resolveModelWithProvenance(model, loadFamily(model.family), { sourceModelId });
}
export { diffResolvedModels, explainProvenance, provenanceSelectorPrefix } from './provenance.js';
export {
  applyModelPatch,
  createClipKeyframePatch,
  inspectClipKeyframePatch,
} from './authoring-patch.js';

const ADDONS = {
  pairedEars: (rig, a) => addPairedEars(rig, a),
  muzzle: (rig, a) => addMuzzle(rig, a),
};

// Build the family-base variant for a model. Each family maps to its variant
// constructor; a model with `base: true` uses the raw family base directly.
const VARIANT_BUILDERS = {
  quadruped: (family, variant) => quadrupedVariant(family, variant),
};

function occlusionReference(ref, id) {
  if (ref == null || typeof ref === 'string') return ref;
  return new RegExp(ref.ifMatch).test(id) ? ref.then : ref.else;
}

const modelOverride = (sourcePointer) => ({
  kind: 'model-override',
  sourcePointer,
});
const derivedDefault = (recipeId) => ({
  kind: 'derived-default',
  recipeId,
  sourcePointer: null,
});

function variantOrigin(model, targetPointer) {
  const parts = targetPointer.split('/').slice(1);
  const rootSources = {
    id: 'id',
    archetypes: 'archetypes',
    heightMeters: 'height',
    tokenScale: 'scale',
    tokenGroundY: 'groundY',
  };
  if (rootSources[parts[0]] && Object.hasOwn(model.variant, rootSources[parts[0]])) {
    return modelOverride(`/variant/${rootSources[parts[0]]}${parts.slice(1).length ? `/${parts.slice(1).join('/')}` : ''}`);
  }
  if (parts[0] === 'profile' && Object.hasOwn(model.variant.profile || {}, parts[1])) {
    return modelOverride(`/variant/profile/${parts.slice(1).join('/')}`);
  }
  if (parts[0] === 'joints' && parts[2] === 'bind' && Object.hasOwn(model.variant.jointTweaks || {}, parts[1])) {
    return modelOverride(`/variant/jointTweaks/${parts[1]}${parts.slice(3).length ? `/${parts.slice(3).join('/')}` : ''}`);
  }
  if (parts[0] === 'plates' && parts[2] === 'size' && Object.hasOwn(model.variant.plateTweaks || {}, parts[1])) {
    return modelOverride(`/variant/plateTweaks/${parts[1]}${parts.slice(3).length ? `/${parts.slice(3).join('/')}` : ''}`);
  }
  return {
    kind: 'recipe',
    recipeId: `${model.family}.variant`,
    sourcePointer: '/variant',
  };
}

function mutateWithProvenance(rig, tracker, descriptor, mutation) {
  if (!tracker) {
    mutation();
    return;
  }
  const before = cloneData(rig);
  mutation();
  tracker.recordTransition(before, rig, descriptor);
}

function applyClipPatch(rig, patch) {
  const clip = rig.clips[patch.clip];
  if (!clip) throw new Error(`clip patch targets unknown clip ${patch.clip}`);
  const frame = clip.frames.find((candidate) => Math.abs(candidate.t - patch.t) <= 1e-9);
  if (!frame) throw new Error(`clip patch targets missing keyframe ${patch.clip}@${patch.t}`);
  const jointIds = new Set(rig.joints.map((joint) => joint.id));
  for (const field of ['poses', 'rotations']) {
    for (const [jointId, delta] of Object.entries(patch.add[field] || {})) {
      if (!jointIds.has(jointId)) throw new Error(`clip patch targets unknown joint ${jointId}`);
      frame[field] ||= {};
      const current = frame[field][jointId] || [0, 0, 0];
      frame[field][jointId] = current.map((value, axis) => value + delta[axis]);
    }
  }
}

function applyTrackedClipPatches(rig, tracker, patches, indexes) {
  for (const index of indexes) {
    const patch = patches[index];
    const frameIndex = rig.clips[patch.clip].frames
      .findIndex((frame) => Math.abs(frame.t - patch.t) <= 1e-9);
    const targetPrefix = `/clips/${patch.clip}/frames/${frameIndex}/`;
    mutateWithProvenance(rig, tracker, {
      operation: 'clips.keyframe-patch',
      origin: (targetPointer) => {
        if (!targetPointer.startsWith(targetPrefix)) return modelOverride(`/clipPatches/${index}`);
        const fieldPointer = targetPointer.slice(targetPrefix.length);
        return modelOverride(`/clipPatches/${index}/add/${fieldPointer}`);
      },
    }, () => applyClipPatch(rig, patch));
  }
}

// Resolve `model` against its already-loaded `family` base. Steps run in the same
// order the imperative workbench applied them, so the result is byte-identical.
function resolveModelInternal(model, family, tracker) {
  // 1. Base geometry: a scaled variant of the family, or the raw base itself.
  tracker?.recordInitial(family);
  const rig = model.base
    ? cloneData(family)
    : VARIANT_BUILDERS[model.family](family, model.variant);
  if (!model.base) tracker?.recordTransition(family, rig, {
    operation: `variant.${model.family}`,
    origin: (targetPointer) => variantOrigin(model, targetPointer),
  });

  // 2. Proportional limb tuning.
  if (model.limbs) mutateWithProvenance(rig, tracker, {
    operation: 'limbs.tune',
    origin: modelOverride('/limbs'),
  }, () => tuneQuadrupedLimbs(rig, model.limbs.upper, model.limbs.lower, model.limbs.paw));

  // 3. Per-plate size overrides (regex-matched).
  for (const [index, o] of (model.plateSizeOverrides || []).entries()) {
    mutateWithProvenance(rig, tracker, {
      operation: 'plates.size-override',
      origin: modelOverride(`/plateSizeOverrides/${index}`),
    }, () => {
      const re = new RegExp(o.match);
      for (const p of rig.plates) if (re.test(p.id)) p.size = [...o.size];
    });
  }

  // 4. Addons (ears, muzzle, ...).
  for (const [index, a] of (model.addons || []).entries()) mutateWithProvenance(rig, tracker, {
    operation: `addon.${a.type}`,
    origin: modelOverride(`/addons/${index}`),
  }, () => ADDONS[a.type](rig, a));

  // 5. Clip event overrides.
  for (const [clip, events] of Object.entries(model.clipEvents || {})) {
    mutateWithProvenance(rig, tracker, {
      operation: 'clips.events-override',
      origin: modelOverride(`/clipEvents/${clip}`),
    }, () => { rig.clips[clip].events = events.map((e) => ({ ...e })); });
  }

  // 5b. Full clip overrides (normalized attack/gait clips supplied as data). These
  // replace the base's source clips before canonical derivation runs.
  for (const [clip, def] of Object.entries(model.clips || {})) {
    mutateWithProvenance(rig, tracker, {
      operation: 'clips.full-override',
      origin: modelOverride(`/clips/${clip}`),
    }, () => { rig.clips[clip] = cloneData(def); });
  }

  // 6. Rotational attack clip.
  if (model.attack) mutateWithProvenance(rig, tracker, {
    operation: 'motion.rotational-attack',
    origin: modelOverride('/attack'),
  }, () => setRotationalAttack(rig, model.attack.rotations, model.attack.opts || {}));

  // 7. Rotational gait (walk) clip.
  if (model.gait) mutateWithProvenance(rig, tracker, {
    operation: 'motion.rotational-gait',
    origin: modelOverride('/gait'),
  }, () => rotationalGait(rig, model.gait.a, model.gait.b, { semantics: model.gait.semantics }));

  // 7b. Patch source clips before canonical aliases are derived so edits to
  // idleA/walkA flow into idle/walk. Patches for generated canonical clips run
  // immediately after derivation below.
  const clipPatches = model.clipPatches || [];
  const preCanonicalClipIds = new Set(Object.keys(rig.clips));
  const preCanonicalPatchIndexes = clipPatches
    .map((patch, index) => preCanonicalClipIds.has(patch.clip) ? index : -1)
    .filter((index) => index >= 0);
  applyTrackedClipPatches(rig, tracker, clipPatches, preCanonicalPatchIndexes);

  // 8. Canonical clip derivation (idle/walk/hit/ko) — must follow attack + gait.
  mutateWithProvenance(rig, tracker, {
    operation: 'clips.ensure-canonical',
    origin: derivedDefault('ensureCanonicalClips'),
  }, () => ensureCanonicalClips(rig));

  // 8b. Canonical-only patch targets (idle/walk/hit/ko).
  const postCanonicalPatchIndexes = clipPatches
    .map((patch, index) => preCanonicalClipIds.has(patch.clip) ? -1 : index)
    .filter((index) => index >= 0);
  applyTrackedClipPatches(rig, tracker, clipPatches, postCanonicalPatchIndexes);

  // 9. Default anchor module inference.
  mutateWithProvenance(rig, tracker, {
    operation: 'anchors.infer-module',
    origin: derivedDefault('inferredAnchorModule'),
  }, () => rig.anchors.forEach((a) => { a.moduleType ??= inferredAnchorModule(a.id); }));

  // 10. Occlusion overrides (the declarative form of the workbench's Object.assign sites).
  for (const [index, o] of (model.occlusion || []).entries()) {
    mutateWithProvenance(rig, tracker, {
      operation: 'plates.occlusion-override',
      origin: modelOverride(`/occlusion/${index}`),
    }, () => {
      const re = new RegExp(o.match);
      for (const p of rig.plates) if (re.test(p.id)) {
        p.occlusionMode = o.mode;
        p.occlusionReference = occlusionReference(o.reference, p.id);
      }
    });
  }

  // 11. General plate field overrides, matched by id or regex (covers tusk role +
  // occlusion, under-core appendages, and any other post-normalization plate edit).
  for (const [index, o] of (model.plateOverrides || []).entries()) {
    mutateWithProvenance(rig, tracker, {
      operation: 'plates.field-override',
      origin: modelOverride(`/plateOverrides/${index}`),
    }, () => {
      const re = o.match ? new RegExp(o.match) : null;
      for (const p of rig.plates) if (o.id ? p.id === o.id : re.test(p.id)) Object.assign(p, cloneData(o.set));
    });
  }

  // 12. Anchor field overrides (rare explicit module-type or metadata edits).
  for (const [index, o] of (model.anchorOverrides || []).entries()) {
    mutateWithProvenance(rig, tracker, {
      operation: 'anchors.field-override',
      origin: modelOverride(`/anchorOverrides/${index}`),
    }, () => {
      for (const a of rig.anchors) if (a.id === o.id) Object.assign(a, cloneData(o.set));
    });
  }

  return rig;
}

export function resolveModel(model, family) {
  return resolveModelInternal(model, family, null);
}

export function resolveModelAssembly(model, family, { sourceModelId, modules = {} } = {}) {
  return resolveAttachmentAssembly({
    rig: resolveModel(model, family),
    sourceModelId: sourceModelId || model.variant?.id || family.id,
    instances: model.attachments || [],
    modules,
  });
}

export function resolveModelWithProvenance(model, family, options = {}) {
  const tracker = createProvenanceTracker({
    sourceModelId: options.sourceModelId || model.variant?.id || family.id,
    familyId: model.family,
  });
  const rig = resolveModelInternal(model, family, tracker);
  return { rig, provenance: tracker.finalize(rig) };
}
