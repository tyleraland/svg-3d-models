import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileMotionClip,
  MotionRecipeError,
  resolveMotionPlan,
  validateMotionConfiguration,
} from '@paper-rig/motion';
import { compilePackage } from '@paper-rig/compiler';
import {
  loadFamily,
  loadModel,
  loadModelMotion,
  loadModelSource,
  loadMotionRecipe,
  loadMotionRecipesForModel,
  resolveModel,
} from '@paper-rig/rigs';
import { validate } from '@paper-rig/validator';
import {
  validateModelMotionConfiguration,
  validateMotionManifest,
  validateMotionRecipeSource,
} from '@paper-rig/validator/motion';

test('versioned motion recipes resolve to ordinary deterministic clip keyframes', () => {
  const recipe = loadMotionRecipe('wholeBodyStrike');
  assert.equal(validateMotionRecipeSource(recipe).status, 'passed');

  for (const name of ['rabbit', 'humanoid']) {
    const base = loadModel(name);
    const snapshot = structuredClone(base);
    const { rig, manifest } = loadModelMotion(name);
    assert.deepEqual(base, snapshot, `${name} base resolution remains immutable`);
    assert.equal(validateMotionManifest(manifest).status, 'passed');
    assert.equal(validate(rig).status, 'passed');
    assert.deepEqual(rig.clips.attack.frames.map((frame) => frame.t), [0, 0.22, 0.5, 0.62, 0.82, 1]);
    assert.deepEqual(rig.clips.attack.phases.map((phase) => phase.id), [
      'anticipation', 'action', 'contact', 'recovery', 'settle',
    ]);
    assert.deepEqual(rig.clips.attack.events.map((event) => [event.name, event.phase, event.t]), [
      ['impact', 'contact', 0.62],
      ['release', 'recovery', 0.82],
    ]);
    assert.equal(rig.clips.attack.boneLengthPolicy, 'preserve');
    assert.equal(rig.clips.attack.motionRecipe.recipeId, 'wholeBodyStrike');

    const compiled = compilePackage(rig).clips.attack;
    assert.deepEqual(compiled.phases.map((phase) => phase.peakNormalized), [0.22, 0.5, 0.62, 0.82, 1]);
    assert.equal(compiled.events[0].phaseId, 'contact');
    assert.equal(compiled.motionRecipe.recipeVersion, '1.0.0');
  }
});

test('quadruped and humanoid proofs compose whole-body layers without duplicating clips', () => {
  const rabbit = loadModelMotion('rabbit').rig;
  const rabbitAnticipation = rabbit.clips.attack.frames.find((frame) => frame.t === 0.22);
  const rabbitContact = rabbit.clips.attack.frames.find((frame) => frame.t === 0.62);
  assert.deepEqual(rabbitAnticipation.rotations.chest, [0, -26, 0]);
  assert.deepEqual(rabbitContact.poses.root, [0.06, 0, 0]);
  assert.deepEqual(rabbitContact.rotations, {
    chest: [0, 16, 0],
    neck: [0, 28, 0],
    head: [0, -12, 0],
  });
  assert.deepEqual(rabbit.clips.attack.contactIntervals[1], {
    ids: ['nearRearPaw', 'farRearPaw'], from: 0, to: 1,
  });

  const humanoid = loadModelMotion('humanoid').rig;
  const contact = humanoid.clips.attack.frames.find((frame) => frame.t === 0.62);
  assert.deepEqual(contact.poses.root, [0, 0.06, 0]);
  for (const id of ['hips', 'spine', 'shoulders', 'nearShoulder', 'nearElbow', 'nearHand']) {
    assert.ok(contact.rotations[id], `${id} participates in the composed swing`);
  }
  assert.deepEqual(contact.rotations.nearShoulder, [0, -25, -70]);
  assert.deepEqual(contact.rotations.nearElbow, [0, 10, 70]);
});

test('motion source validation rejects missing samples and invalid plan references', () => {
  const recipe = loadMotionRecipe('wholeBodyStrike');
  const missingSample = structuredClone(recipe);
  delete missingSample.blocks[0].samples.recovery;
  const recipeReport = validateMotionRecipeSource(missingSample);
  assert.equal(recipeReport.status, 'failed');
  assert.ok(recipeReport.issues.some((issue) => issue.id === 'motion-block-samples'));

  const model = loadModelSource('rabbit');
  const rig = resolveModel(model, loadFamily(model.family));
  const recipes = loadMotionRecipesForModel(model);
  const invalid = structuredClone(model);
  invalid.motion.clips.attack.layers[0].transform.poses.missingJoint = [0.1, 0, 0];
  const report = validateModelMotionConfiguration(invalid, rig, recipes);
  assert.equal(report.status, 'failed');
  assert.ok(report.issues.some((issue) => issue.id === 'motion-plan-transforms'));
  assert.throws(
    () => resolveMotionPlan({ rig, sourceModelId: 'rabbit', plan: invalid.motion, recipes }),
    (error) => error instanceof MotionRecipeError,
  );
  assert.equal(validateMotionConfiguration({ rig, plan: model.motion, recipes }).status, 'passed');
});

test('motion layer declaration order cannot change the resolved clip', () => {
  const recipe = loadMotionRecipe('wholeBodyStrike');
  const declaration = loadModelSource('rabbit').motion.clips.attack;
  const reversed = { ...structuredClone(declaration), layers: [...declaration.layers].reverse() };
  assert.deepEqual(compileMotionClip(recipe, reversed), compileMotionClip(recipe, declaration));
});
