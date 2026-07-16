import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModel, loadModelAppearance, loadModelAssembly, loadModelConfigured } from '@paper-rig/rigs';
import { projectScene } from '@paper-rig/compiler';
import {
  ConsumerCapabilityError,
  ConsumerSceneError,
  SEMANTIC_DETAIL_TIERS,
  createConsumerHandoff,
} from '@paper-rig/handoff';
import { validateConsumerHandoff, validateConsumerProfile } from '@paper-rig/validator/handoff';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fixture = (name) => join(ROOT, 'fixtures/consumer', name);
const silhouetteProfile = readJSON(fixture('topDownSilhouette.profile.json'));
const identityWithoutPaintProfile = readJSON(fixture('topDownIdentity.profile.json'));
const expressionProfile = readJSON(fixture('topDownExpression.profile.json'));
const sceneOptions = { clip: 'attack', time: 0.62, elevation: 60, heading: 180 };
const configuredSceneOptions = { ...sceneOptions, time: 0.22 };

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
  const legacyPlate = projectScene(loadModel('wolf'), sceneOptions).compositingGroups
    .flatMap((group) => group.elements)
    .find((element) => element.sourceKind === 'plate' && element.semanticDetailSource === 'legacy-conservative');

  assert.deepEqual([paint.semanticDetailTier, paint.semanticDetailSource], ['identity', 'authored-paint']);
  assert.deepEqual([gasket.semanticDetailTier, gasket.semanticDetailSource], ['silhouette', 'structural']);
  assert.deepEqual([shadow.semanticDetailTier, shadow.semanticDetailSource], ['texture', 'authored']);
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

test('generated seam elements are atomic with their incident accessory detail tier', () => {
  const rabbitScene = projectScene(loadModelAssembly('rabbit').rig, sceneOptions);
  const elements = rabbitScene.compositingGroups.flatMap((group) => group.elements);
  const byId = new Map(elements.map((element) => [element.id, element]));
  for (const id of ['travelPack__rootGasket', 'simpleHat__rootGasket']) {
    const seam = byId.get(id);
    assert.equal(seam.semanticRole, 'attachmentSeam');
    assert.equal(seam.semanticDetailTier, 'identity');
    assert.ok(seam.detailDependencyIds.every((dependencyId) => byId.get(dependencyId).semanticDetailTier === 'identity'));
  }

  const silhouette = createConsumerHandoff(rabbitScene, silhouetteProfile);
  const expression = createConsumerHandoff(rabbitScene, identityWithoutPaintProfile);
  assert.equal(silhouette.semanticDetail.includedElementIds.some((id) => id.startsWith('simpleHat__') || id.startsWith('travelPack__')), false);
  assert.equal(expression.semanticDetail.includedElementIds.some((id) => id === 'simpleHat__body'), true);
  assert.equal(expression.semanticDetail.includedElementIds.some((id) => id === 'simpleHat__rootGasket'), true);

  const glintElements = projectScene(loadModelAssembly('humanoid').rig, sceneOptions).compositingGroups
    .flatMap((group) => group.elements)
    .filter((element) => element.id.startsWith('leftEyeGlint__'));
  assert.ok(glintElements.length > 0);
  assert.ok(glintElements.every((element) => element.semanticDetailTier === 'micro'));

  const invalidScene = structuredClone(rabbitScene);
  const invalidSeam = invalidScene.compositingGroups.flatMap((group) => group.elements)
    .find((element) => element.id === 'simpleHat__rootGasket');
  invalidSeam.semanticDetailTier = 'silhouette';
  assert.throws(() => createConsumerHandoff(invalidScene, identityWithoutPaintProfile), ConsumerSceneError);
});

test('M6 starts with an authored-tier configured rabbit consumer boundary', () => {
  const rig = loadModelConfigured('rabbit', { motion: true, attachments: true, appearance: true }).rig;
  const scene = projectScene(rig, configuredSceneOptions);
  const elements = scene.compositingGroups.flatMap((group) => group.elements);
  const basePlates = elements.filter((element) => element.sourceKind === 'plate'
    && !element.generated
    && !element.id.includes('__'));
  assert.ok(basePlates.length > 0);
  assert.ok(basePlates.every((element) => element.semanticDetailSource === 'authored'));
  const handoff = createConsumerHandoff(scene, expressionProfile);
  assert.equal(validateConsumerHandoff(handoff).valid, true);
  assert.ok(handoff.negotiation.availableCapabilities.includes('semanticPaint'));
  assert.ok(handoff.semanticDetail.includedElementIds.includes('simpleHat__body'));
  assert.ok(handoff.semanticDetail.includedElementIds.includes('faceBlaze'));
  assert.equal(
    `${JSON.stringify(handoff, null, 2)}\n`,
    readFileSync(fixture('rabbitAttackConfiguredExpression.handoff.json'), 'utf8'),
  );
});

test('M6 elephant keeps its complete head-strike silhouette and adds tusks at identity tier', () => {
  const bindScene = projectScene(loadModel('elephant'), { ...sceneOptions, time: 0 });
  const impactScene = projectScene(loadModel('elephant'), sceneOptions);
  const impactElements = impactScene.compositingGroups.flatMap((group) => group.elements);
  const basePlates = impactElements.filter((element) => element.sourceKind === 'plate'
    && !element.generated
    && !element.id.includes('__'));
  assert.ok(basePlates.length > 0);
  assert.ok(basePlates.every((element) => element.semanticDetailSource === 'authored'));
  assert.deepEqual(
    impactElements.find((element) => element.id === 'trunkTipGasketOccluderCell').detailDependencyIds,
    ['trunkLowerPlate', 'trunkTipPlateOccluderCell'],
  );

  const bindJoints = new Map(bindScene.joints.map((joint) => [joint.id, joint]));
  const impactJoints = new Map(impactScene.joints.map((joint) => [joint.id, joint]));
  for (const jointId of ['head', 'trunkBase', 'trunkMid', 'trunkTip']) {
    assert.notDeepEqual(
      impactJoints.get(jointId).worldPositionMeters,
      bindJoints.get(jointId).worldPositionMeters,
      `${jointId} must participate in the impact pose`,
    );
  }

  const silhouette = createConsumerHandoff(impactScene, silhouetteProfile);
  for (const plateId of ['headPlate', 'trunkConnectorPlate', 'trunkUpperPlate', 'trunkLowerPlate', 'trunkTipPlate']) {
    assert.ok(silhouette.semanticDetail.includedElementIds.includes(plateId), `${plateId} must survive silhouette LOD`);
  }
  assert.equal(silhouette.semanticDetail.includedElementIds.includes('nearTuskPlate'), false);
  assert.equal(silhouette.semanticDetail.includedElementIds.includes('farTuskPlate'), false);
  assert.equal(silhouette.semanticDetail.includedElementIds.includes('castShadow'), false);

  const identity = createConsumerHandoff(impactScene, identityWithoutPaintProfile);
  assert.equal(validateConsumerHandoff(identity).valid, true);
  assert.ok(identity.semanticDetail.includedElementIds.includes('nearTuskPlate'));
  assert.ok(identity.semanticDetail.includedElementIds.includes('farTuskPlate'));
  assert.equal(identity.semanticDetail.includedElementIds.includes('castShadow'), false);
  assert.equal(
    `${JSON.stringify(identity, null, 2)}\n`,
    readFileSync(fixture('elephantAttackIdentity.handoff.json'), 'utf8'),
  );
});

test('M6 humanoid keeps anatomy at silhouette and carries a rigid weapon through a whole-body strike', () => {
  const configured = loadModelConfigured('humanoid', { motion: true, attachments: true, appearance: true });
  const bindScene = projectScene(configured.rig, { ...sceneOptions, time: 0 });
  const impactScene = projectScene(configured.rig, sceneOptions);
  const impactElements = impactScene.compositingGroups.flatMap((group) => group.elements);
  const basePlates = impactElements.filter((element) => element.sourceKind === 'plate'
    && !element.generated
    && !element.id.includes('__'));
  assert.ok(basePlates.length > 0);
  assert.ok(basePlates.every((element) => element.semanticDetailSource === 'authored'));

  const weapon = configured.attachmentManifest.instances.find((instance) => instance.id === 'simpleSword');
  assert.deepEqual([weapon.slotType, weapon.owner.id], ['hand.grip', 'nearHand']);
  assert.deepEqual(weapon.mountInterface.ownerLocalAxis, [1, 0, 0]);
  const swordElements = impactElements.filter((element) => element.id.startsWith('simpleSword__'));
  assert.ok(swordElements.length > 0);
  assert.ok(swordElements.every((element) => element.semanticDetailTier === 'identity'));
  assert.equal(swordElements.some((element) => element.id === 'simpleSword__tipGasket'), false);

  const bindJoints = new Map(bindScene.joints.map((joint) => [joint.id, joint]));
  const impactJoints = new Map(impactScene.joints.map((joint) => [joint.id, joint]));
  assert.notDeepEqual(impactJoints.get('root').worldPositionMeters, bindJoints.get('root').worldPositionMeters);
  for (const jointId of ['hips', 'spine', 'shoulders', 'nearHand', 'simpleSword__tip']) {
    assert.notDeepEqual(
      impactJoints.get(jointId).localToWorldRotation,
      bindJoints.get(jointId).localToWorldRotation,
      `${jointId} must participate in the composed strike`,
    );
  }

  const silhouette = createConsumerHandoff(impactScene, silhouetteProfile);
  for (const plateId of ['pelvisSpinePlate', 'chestPlate', 'nearBicepPlate', 'nearForearmPlate', 'nearHandPlate']) {
    assert.ok(silhouette.semanticDetail.includedElementIds.includes(plateId), `${plateId} must survive silhouette LOD`);
  }
  assert.equal(silhouette.semanticDetail.includedElementIds.some((id) => id.startsWith('simpleSword__')), false);
  assert.equal(silhouette.semanticDetail.includedElementIds.includes('leftEyePlate'), false);

  const expression = createConsumerHandoff(impactScene, expressionProfile);
  assert.equal(validateConsumerHandoff(expression).valid, true);
  assert.ok(expression.semanticDetail.includedElementIds.includes('simpleSword__blade'));
  assert.ok(expression.semanticDetail.includedElementIds.includes('simpleSword__rootGasket'));
  assert.ok(expression.semanticDetail.includedElementIds.includes('leftEyePlate'));
  assert.ok(expression.semanticDetail.includedElementIds.includes('nosePlate'));
  assert.ok(expression.semanticDetail.includedElementIds.includes('faceBlaze'));
  assert.equal(expression.semanticDetail.includedElementIds.includes('leftEyeGlint__disc'), false);
  assert.equal(expression.semanticDetail.includedElementIds.includes('castShadow'), false);
  assert.equal(
    `${JSON.stringify(expression, null, 2)}\n`,
    readFileSync(fixture('humanoidAttackConfiguredExpression.handoff.json'), 'utf8'),
  );
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
