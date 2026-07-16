// @paper-rig/motion — pure recipe composition for paper-rig/1 clips.
// Recipes own reusable phase timing and normalized block curves. Models tune
// those blocks with joint-local transform amplitudes. Resolution emits ordinary
// clip keyframes; renderers and downstream consumers never implement recipes.

import { cloneData } from '@paper-rig/schema';

const EPSILON = 1e-9;
const PHASE_SEQUENCE = ['anticipation', 'action', 'contact', 'recovery', 'settle'];
const pass = (id, detail) => ({ id, pass: true, detail });
const fail = (id, detail) => ({ id, pass: false, detail });
const check = (id, condition, detail) => condition ? pass(id, detail) : fail(id, detail);
const report = (checks) => {
  const issues = checks.filter((item) => !item.pass);
  return { status: issues.length ? 'failed' : 'passed', checks, issues };
};
const stableId = (value) => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);
const vector3 = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const inUnitInterval = (value) => Number.isFinite(value) && value >= 0 && value <= 1;
const unique = (values) => new Set(values).size === values.length;
const close = (left, right) => Math.abs(left - right) <= EPSILON;

export class MotionRecipeError extends Error {
  constructor(reportValue) {
    super(`motion recipe configuration failed: ${reportValue.issues.map((item) => item.detail).join('; ')}`);
    this.name = 'MotionRecipeError';
    this.report = reportValue;
  }
}

export function phaseContractChecks(phases = []) {
  const ids = phases.map((phase) => phase.id);
  const expected = PHASE_SEQUENCE.slice(0, phases.length);
  const finite = phases.every((phase) => (
    stableId(phase.id)
    && inUnitInterval(phase.from)
    && inUnitInterval(phase.peak)
    && inUnitInterval(phase.to)
    && phase.from <= phase.peak
    && phase.peak <= phase.to
  ));
  const contiguous = phases.length > 0
    && close(phases[0].from, 0)
    && close(phases.at(-1).to, 1)
    && phases.slice(1).every((phase, index) => close(phases[index].to, phase.from));
  return [
    check('motion-phase-ids', unique(ids), 'phase IDs are unique'),
    check(
      'motion-phase-sequence',
      phases.length >= 4 && phases.length <= 5 && ids.every((id, index) => id === expected[index]),
      'action phases use anticipation, action, contact, recovery, and optional settle order',
    ),
    check('motion-phase-ranges', finite, 'phase boundaries and peaks are finite, normalized, and ordered'),
    check('motion-phase-coverage', contiguous, 'phase ranges cover normalized time from 0 to 1 without gaps'),
  ];
}

export function validateMotionRecipe(recipe) {
  const phases = Array.isArray(recipe?.phases) ? recipe.phases : [];
  const phaseIds = new Set(phases.map((phase) => phase.id));
  const blocks = Array.isArray(recipe?.blocks) ? recipe.blocks : [];
  const blockIds = blocks.map((block) => block.id);
  const events = Array.isArray(recipe?.events) ? recipe.events : [];
  const checks = [
    check('motion-recipe-schema', recipe?.$schema === 'paper-rig/motion-recipe-1' && recipe?.schemaVersion === '1.0.0', 'recipe declares the supported versioned schema'),
    check('motion-recipe-id', stableId(recipe?.id), `recipe ${recipe?.id || '(missing)'} has a stable ID`),
    check(
      'motion-recipe-clip-defaults',
      stableId(recipe?.clip?.base)
        && Number.isFinite(recipe?.clip?.duration) && recipe.clip.duration > 0
        && typeof recipe?.clip?.easing === 'string' && recipe.clip.easing.length > 0
        && typeof recipe?.clip?.loop === 'boolean',
      'recipe clip defaults declare a base, positive duration, easing, and loop policy',
    ),
    ...phaseContractChecks(phases),
    check('motion-block-ids', unique(blockIds), 'motion block IDs are unique'),
    check(
      'motion-block-samples',
      blocks.length > 0 && blocks.every((block) => stableId(block.id)
        && block.samples && Object.keys(block.samples).length === phaseIds.size
        && Object.entries(block.samples).every(([id, value]) => phaseIds.has(id) && Number.isFinite(value))),
      'every reusable block has one finite sample for every declared phase',
    ),
    check(
      'motion-recipe-events',
      events.every((event) => stableId(event.phase) && phaseIds.has(event.phase) && typeof event.name === 'string' && event.name.length > 0),
      'recipe events reference declared phases',
    ),
  ];
  return report(checks);
}

function transformEntries(layer) {
  return ['poses', 'rotations'].flatMap((kind) => Object.entries(layer.transform?.[kind] || {})
    .map(([jointId, vector]) => ({ kind, jointId, vector })));
}

export function validateMotionConfiguration({ rig, plan, recipes = {} }) {
  const declarations = Object.entries(plan?.clips || {});
  const jointIds = new Set((rig?.joints || []).map((joint) => joint.id));
  const clipIds = new Set(Object.keys(rig?.clips || {}));
  const checks = [check(
    'motion-plan-schema',
    declarations.length === 0 || plan?.$schema === 'paper-rig/motion-plan-1',
    'nonempty motion plans declare paper-rig/motion-plan-1',
  )];
  for (const [clipId, declaration] of declarations) {
    const recipe = recipes[declaration.recipe];
    const recipeReport = recipe ? validateMotionRecipe(recipe) : null;
    const blockIds = new Set((recipe?.blocks || []).map((block) => block.id));
    const layers = declaration.layers || [];
    const entries = layers.flatMap(transformEntries);
    checks.push(check('motion-plan-target', stableId(clipId), `motion clip target ${clipId} has a stable ID`));
    checks.push(check('motion-plan-recipe-reference', Boolean(recipe) && recipe.id === declaration.recipe, `motion clip ${clipId} recipe ${declaration.recipe} resolves by stable ID`));
    if (recipeReport) checks.push(...recipeReport.checks.map((item) => ({
      ...item,
      detail: `${clipId}/${declaration.recipe}: ${item.detail}`,
    })));
    checks.push(check(
      'motion-plan-base-reference',
      (declaration.base || recipe?.clip?.base) === 'bind' || clipIds.has(declaration.base || recipe?.clip?.base),
      `motion clip ${clipId} base resolves`,
    ));
    checks.push(check(
      'motion-plan-clip-options',
      (declaration.duration == null || Number.isFinite(declaration.duration) && declaration.duration > 0)
        && (declaration.easing == null || typeof declaration.easing === 'string' && declaration.easing.length > 0)
        && (declaration.loop == null || typeof declaration.loop === 'boolean')
        && !(declaration.contacts && declaration.contactIntervals),
      `motion clip ${clipId} overrides are finite and contact declarations are unambiguous`,
    ));
    checks.push(check(
      'motion-plan-layer-ids',
      layers.length > 0 && unique(layers.map((layer) => layer.id)),
      `motion clip ${clipId} layer IDs are unique`,
    ));
    checks.push(check(
      'motion-plan-block-references',
      layers.every((layer) => stableId(layer.id) && blockIds.has(layer.block)),
      `motion clip ${clipId} layers reference declared reusable blocks`,
    ));
    checks.push(check(
      'motion-plan-transforms',
      entries.length > 0 && entries.every(({ jointId, vector }) => jointIds.has(jointId) && vector3(vector)),
      `motion clip ${clipId} has finite joint-local transform amplitudes targeting existing joints`,
    ));
    const intervals = declaration.contactIntervals || [];
    const contacts = [
      ...(declaration.contacts || []),
      ...intervals.flatMap((interval) => interval.ids || []),
    ];
    checks.push(check(
      'motion-plan-contacts',
      contacts.every((jointId) => jointIds.has(jointId))
        && intervals.every((interval, index) => (
          inUnitInterval(interval.from)
          && inUnitInterval(interval.to)
          && interval.from <= interval.to
          && (index === 0 || interval.from >= intervals[index - 1].from)
          && Array.isArray(interval.ids) && interval.ids.length > 0
        )),
      `motion clip ${clipId} contact joints resolve and intervals are normalized and ordered`,
    ));
  }
  if (!declarations.length) checks.push(pass('motion-plan-clips', 'model declares no motion recipe clips'));
  return report(checks);
}

const scaledAdd = (target, jointId, vector, scale) => {
  const current = target[jointId] || [0, 0, 0];
  target[jointId] = current.map((value, axis) => value + vector[axis] * scale);
};
const cleanMap = (map) => Object.fromEntries(Object.entries(map)
  .filter(([, vector]) => vector.some((value) => Math.abs(value) > EPSILON))
  .map(([id, vector]) => [id, vector.map((value) => Math.abs(value) <= EPSILON ? 0 : value)]));

export function compileMotionClip(recipe, declaration) {
  const blocks = new Map(recipe.blocks.map((block) => [block.id, block]));
  const layers = [...declaration.layers].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const frames = [{ t: 0, poses: {}, rotations: {} }];
  for (const phase of recipe.phases) {
    if (close(phase.peak, 0)) continue;
    const frame = { t: phase.peak, poses: {}, rotations: {} };
    for (const layer of layers) {
      const scale = blocks.get(layer.block).samples[phase.id];
      for (const kind of ['poses', 'rotations']) {
        for (const [jointId, vector] of Object.entries(layer.transform[kind] || {})) {
          scaledAdd(frame[kind], jointId, vector, scale);
        }
      }
    }
    frame.poses = cleanMap(frame.poses);
    frame.rotations = cleanMap(frame.rotations);
    const existing = frames.find((candidate) => close(candidate.t, frame.t));
    if (existing) Object.assign(existing, frame);
    else frames.push(frame);
  }
  if (!frames.some((frame) => close(frame.t, 1))) frames.push({ t: 1, poses: {}, rotations: {} });
  frames.sort((left, right) => left.t - right.t);

  const clipDefaults = recipe.clip;
  return {
    base: declaration.base || clipDefaults.base,
    duration: declaration.duration || clipDefaults.duration,
    easing: declaration.easing || clipDefaults.easing,
    loop: declaration.loop ?? clipDefaults.loop,
    frames,
    ...(declaration.contacts ? { contacts: cloneData(declaration.contacts) } : {}),
    ...(declaration.contactIntervals ? { contactIntervals: cloneData(declaration.contactIntervals) } : {}),
    events: recipe.events.map((event) => ({
      t: recipe.phases.find((phase) => phase.id === event.phase).peak,
      name: event.name,
      phase: event.phase,
    })),
    phases: cloneData(recipe.phases),
    boneLengthPolicy: 'preserve',
    motionSemantics: 'composed recipe layers resolved to additive joint-local transforms',
    motionRecipe: {
      schema: 'paper-rig/motion-resolution/1',
      recipeId: recipe.id,
      recipeVersion: recipe.schemaVersion,
      layers: layers.map((layer) => ({ id: layer.id, block: layer.block })),
    },
  };
}

export function resolveMotionPlan({ rig, sourceModelId, plan, recipes = {} }) {
  const validation = validateMotionConfiguration({ rig, plan, recipes });
  if (validation.status !== 'passed') throw new MotionRecipeError(validation);
  const resolvedRig = cloneData(rig);
  const clips = [];
  for (const [clipId, declaration] of Object.entries(plan?.clips || {})) {
    const clip = compileMotionClip(recipes[declaration.recipe], declaration);
    resolvedRig.clips[clipId] = clip;
    clips.push({
      id: clipId,
      recipeId: declaration.recipe,
      phaseIds: clip.phases.map((phase) => phase.id),
      layers: cloneData(clip.motionRecipe.layers),
    });
  }
  return {
    rig: resolvedRig,
    manifest: {
      schema: 'paper-rig/motion-resolution/1',
      schemaVersion: '1.0.0',
      sourceModelId,
      resolvedModelId: resolvedRig.id,
      clips,
    },
  };
}
