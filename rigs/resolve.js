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
import { dirname, join } from 'node:path';
import { cloneData } from '@paper-rig/schema';
import {
  quadrupedVariant, tuneQuadrupedLimbs, addMuzzle, addPairedEars,
  setRotationalAttack, rotationalGait, ensureCanonicalClips, inferredAnchorModule,
} from './family-kit.js';

const RIGS_DIR = dirname(fileURLToPath(import.meta.url));
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));

export function loadFamily(name) {
  return readJSON(join(RIGS_DIR, 'families', `${name}.json`));
}
export function loadModel(name) {
  const path = name.endsWith('.json') ? name : join(RIGS_DIR, 'models', `${name}.json`);
  const model = readJSON(path);
  return resolveModel(model, loadFamily(model.family));
}

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

// Resolve `model` against its already-loaded `family` base. Steps run in the same
// order the imperative workbench applied them, so the result is byte-identical.
export function resolveModel(model, family) {
  // 1. Base geometry: a scaled variant of the family, or the raw base itself.
  const rig = model.base
    ? cloneData(family)
    : VARIANT_BUILDERS[model.family](family, model.variant);

  // 2. Proportional limb tuning.
  if (model.limbs) tuneQuadrupedLimbs(rig, model.limbs.upper, model.limbs.lower, model.limbs.paw);

  // 3. Per-plate size overrides (regex-matched).
  for (const o of model.plateSizeOverrides || []) {
    const re = new RegExp(o.match);
    for (const p of rig.plates) if (re.test(p.id)) p.size = [...o.size];
  }

  // 4. Addons (ears, muzzle, ...).
  for (const a of model.addons || []) ADDONS[a.type](rig, a);

  // 5. Clip event overrides.
  for (const [clip, events] of Object.entries(model.clipEvents || {})) {
    rig.clips[clip].events = events.map((e) => ({ ...e }));
  }

  // 6. Rotational attack clip.
  if (model.attack) setRotationalAttack(rig, model.attack.rotations, model.attack.opts || {});

  // 7. Rotational gait (walk) clip.
  if (model.gait) rotationalGait(rig, model.gait.a, model.gait.b, { semantics: model.gait.semantics });

  // 8. Canonical clip derivation (idle/walk/hit/ko) — must follow attack + gait.
  ensureCanonicalClips(rig);

  // 9. Default anchor module inference.
  rig.anchors.forEach((a) => { a.moduleType ??= inferredAnchorModule(a.id); });

  // 10. Occlusion overrides (the declarative form of the workbench's Object.assign sites).
  for (const o of model.occlusion || []) {
    const re = new RegExp(o.match);
    for (const p of rig.plates) if (re.test(p.id)) {
      p.occlusionMode = o.mode;
      p.occlusionReference = occlusionReference(o.reference, p.id);
    }
  }

  return rig;
}
