import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModel, loadModelAppearance } from '@paper-rig/rigs';
import { projectScene } from '@paper-rig/compiler';
import {
  ConsumerCapabilityError,
  SEMANTIC_DETAIL_TIERS,
  createConsumerHandoff,
} from '@paper-rig/handoff';
import { validateConsumerHandoff, validateConsumerProfile } from '@paper-rig/validator/handoff';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fixture = (name) => join(ROOT, 'fixtures/consumer', name);
const silhouetteProfile = readJSON(fixture('topDownSilhouette.profile.json'));
const expressionProfile = readJSON(fixture('topDownExpression.profile.json'));
const sceneOptions = { clip: 'attack', time: 0.62, elevation: 60, heading: 180 };

function paintedRabbitScene() {
  return projectScene(loadModelAppearance('rabbit').rig, sceneOptions);
}

const elementIds = (scene) => scene.compositingGroups.flatMap((group) => group.elements.map((element) => element.id));

test('consumer profiles select deterministic cumulative semantic tiers without changing source order', () => {
  assert.equal(validateConsumerProfile(silhouetteProfile).valid, true);
  assert.equal(validateConsumerProfile(expressionProfile).valid, true);
  const scene = paintedRabbitScene();
  const before = structuredClone(scene);
  const silhouette = createConsumerHandoff(scene, silhouetteProfile);
  const expression = createConsumerHandoff(scene, expressionProfile);
  const micro = createConsumerHandoff(scene, {
    ...expressionProfile,
    id: 'topDownMicro',
    selection: { ...expressionProfile.selection, maximumDetailTier: 'micro' },
  });

  assert.deepEqual(scene, before, 'handoff selection must not mutate the projected scene');
  assert.deepEqual(silhouette.semanticDetail.orderedTiers, SEMANTIC_DETAIL_TIERS);
  assert.ok(silhouette.semanticDetail.includedElementIds.length < expression.semanticDetail.includedElementIds.length);
  assert.ok(expression.semanticDetail.includedElementIds.length < micro.semanticDetail.includedElementIds.length);
  assert.deepEqual(micro.semanticDetail.includedElementIds, elementIds(scene));
  assert.deepEqual(elementIds(silhouette.scene), silhouette.semanticDetail.includedElementIds);
  assert.deepEqual(elementIds(expression.scene), expression.semanticDetail.includedElementIds);
  assert.deepEqual(
    elementIds(scene).filter((id) => new Set(expression.semanticDetail.includedElementIds).has(id)),
    expression.semanticDetail.includedElementIds,
    'surviving IDs retain original compositing order',
  );
  assert.deepEqual(createConsumerHandoff(scene, expressionProfile), expression, 'identical inputs are deterministic');
});

test('semantic detail provenance separates structural rules, authored paint, and conservative migration defaults', () => {
  const scene = paintedRabbitScene();
  const elements = scene.compositingGroups.flatMap((group) => group.elements);
  const paint = elements.find((element) => element.sourceKind === 'paint');
  const gasket = elements.find((element) => element.sourceKind === 'gasket');
  const shadow = elements.find((element) => element.semanticRole === 'shadow');
  const legacyPlate = elements.find((element) => element.sourceKind === 'plate' && element.semanticDetailSource === 'legacy-conservative');

  assert.deepEqual([paint.semanticDetailTier, paint.semanticDetailSource], ['identity', 'authored-paint']);
  assert.deepEqual([gasket.semanticDetailTier, gasket.semanticDetailSource], ['silhouette', 'structural']);
  assert.deepEqual([shadow.semanticDetailTier, shadow.semanticDetailSource], ['texture', 'semantic-role']);
  assert.equal(legacyPlate.semanticDetailTier, 'silhouette');

  const authoredRig = structuredClone(loadModel('rabbit'));
  const authoredPlate = authoredRig.plates.find((plate) => plate.id === 'torsoPlate');
  authoredPlate.semanticDetailTier = 'identity';
  const authoredElements = projectScene(authoredRig, sceneOptions).compositingGroups.flatMap((group) => group.elements);
  const authoredElement = authoredElements.find((element) => !element.generated && element.sourceId === authoredPlate.id);
  const authoredOccluder = authoredElements.find((element) => element.generated && element.sourceId === authoredPlate.id);
  assert.deepEqual([authoredElement.semanticDetailTier, authoredElement.semanticDetailSource], ['identity', 'authored']);
  assert.deepEqual([authoredOccluder.semanticDetailTier, authoredOccluder.semanticDetailSource], ['silhouette', 'structural']);
});

test('capability negotiation fails required absences and records declared optional degradation', () => {
  const scene = paintedRabbitScene();
  const degraded = createConsumerHandoff(scene, silhouetteProfile);
  assert.equal(degraded.negotiation.status, 'degraded');
  assert.deepEqual(degraded.negotiation.capabilities.at(-1), {
    id: 'vectorGradients',
    policy: 'omit',
    status: 'omitted',
  });

  assert.throws(
    () => createConsumerHandoff(scene, {
      ...expressionProfile,
      capabilities: [{ id: 'vectorGradients', policy: 'require' }],
    }),
    (error) => error instanceof ConsumerCapabilityError
      && error.code === 'UNSUPPORTED_CONSUMER_CAPABILITY'
      && error.capabilityId === 'vectorGradients',
  );

  const duplicateProfile = structuredClone(expressionProfile);
  duplicateProfile.capabilities.push(structuredClone(duplicateProfile.capabilities[0]));
  assert.equal(validateConsumerProfile(duplicateProfile).valid, false);
});

test('golden consumer handoffs lock stable IDs, ordering, negotiation, and vector output', () => {
  const scene = paintedRabbitScene();
  for (const [profile, goldenName] of [
    [silhouetteProfile, 'rabbitAttackSilhouette.handoff.json'],
    [expressionProfile, 'rabbitAttackExpression.handoff.json'],
  ]) {
    const handoff = createConsumerHandoff(scene, profile);
    assert.equal(validateConsumerHandoff(handoff).valid, true);
    const actual = `${JSON.stringify(handoff, null, 2)}\n`;
    assert.equal(actual, readFileSync(fixture(goldenName), 'utf8'));

    const reordered = structuredClone(handoff);
    reordered.semanticDetail.includedElementIds.reverse();
    assert.equal(validateConsumerHandoff(reordered).valid, false, 'semantic validation rejects reordered survivor IDs');
  }
});
