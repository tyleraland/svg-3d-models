// @paper-rig/rigs family kit — the family-preset and normalization operations a
// model composes, extracted VERBATIM from paper-rig-workbench.html so a resolved
// model is byte-identical to the workbench's imperative build. The only change is
// that quadrupedVariant takes the family base as an argument instead of reading a
// module global, so the family lives in data (rigs/families/*.json), not code.

import { V, C, joint, plate, spanPlate, taperedSpanPlate, polygonPlate, pathPlate, cloneData } from '@paper-rig/schema';

export const topCamera = (groundY) => ({ type: 'orthographic', direction: [0, 0, -1], elevation: 90, azimuth: 0, preset: 'canonicalTop', orientation: 'camera is above +Z and looks straight down -Z; +X points toward token top', framing: `fixed scale with ground origin at token [50,${groundY}]`, depthOrder: 'far-to-near camera depth; stable semantic-id tie break' });

export const clipPack = ({ idle = {}, moveA = {}, moveB = {}, attack = {}, contacts = [], intervals = [], moveDuration = 960, attackDuration = 680, moveEventA = 'phase-a', moveEventB = 'phase-b' }) => ({
  idleA: { base: 'bind', duration: 1800, easing: 'ease-in-out', loop: true, frames: [{ t: 0, poses: {} }, { t: .5, poses: idle }, { t: 1, poses: {} }], contacts },
  walkA: { base: 'idleA', duration: moveDuration, easing: 'linear', loop: true, frames: [{ t: 0, poses: moveA }, { t: .5, poses: moveB }, { t: 1, poses: moveA }], contactIntervals: intervals, events: [{ t: 0, name: moveEventA }, { t: .5, name: moveEventB }] },
  attack: { base: 'idleA', duration: attackDuration, easing: 'cubic-bezier(.2,.8,.2,1)', loop: false, frames: [{ t: 0, poses: {} }, { t: .62, poses: attack }, { t: 1, poses: {} }], contacts, events: [{ t: .62, name: 'impact' }, { t: .84, name: 'release' }] },
});

export const templateRig = ({ id, family, archetypes, height, scale, groundY = 72, joints, plates, anchors = [], clips, profile = {} }) => ({ ...C, id, family, archetypes, heightMeters: height, tokenScale: scale, tokenGroundY: groundY, surfaceConvention: { outward: '+z', groundPlane: 'z=0', canonicalModelRotation: [0, 0, 0] }, camera: topCamera(groundY), profile, joints, plates, anchors, clips });

export const cloneClipsScaled = (rig, sx, sy, sz) => Object.fromEntries(Object.entries(rig.clips).map(([name, c]) => [name, { ...c, frames: c.frames.map(f => ({ t: f.t, poses: Object.fromEntries(Object.entries(f.poses).map(([id, v]) => [id, V(v[0] * sx, v[1] * sy, v[2] * sz)])) })), contacts: c.contacts ? [...c.contacts] : undefined, contactIntervals: c.contactIntervals?.map(x => ({ ...x, ids: [...x.ids] })), events: c.events?.map(x => ({ ...x })) }]));

// quadrupedVariant(familyBase, params): the workbench's quadrupedVariant with the
// global `quadruped` replaced by the passed-in family base.
export function quadrupedVariant(familyBase, { id, archetypes, height, scale, groundY = 70, sx = 1, sy = 1, sz = 1, thickness = 1, profile = {}, jointTweaks = {}, plateTweaks = {} }) {
  const joints = familyBase.joints.map(j => ({ ...j, bind: jointTweaks[j.id] ? [...jointTweaks[j.id]] : V(j.bind[0] * sx, j.bind[1] * sy, j.bind[2] * sz) })),
    plates = familyBase.plates.map(p => { let size = p.span ? p.size.map(v => v * thickness) : p.size.map((v, i) => v * (i ? sx : sy)); if (plateTweaks[p.id]) size = [...plateTweaks[p.id]]; return { ...p, size, span: p.span ? [...p.span] : undefined }; }),
    anchors = familyBase.anchors.map(a => ({ ...a, offset: V(a.offset[0] * sx, a.offset[1] * sy, a.offset[2] * sz) })),
    clips = cloneClipsScaled(familyBase, sx, sy, sz);
  return { ...templateRig({ id, family: 'quadrupedVariant', archetypes, height, scale, groundY, joints, plates, anchors, clips, profile: { ...profile, locomotion: 'diagonal gait', modularHornMounts: ['nearHornMount', 'farHornMount'] } }), variantOf: 'quadrupedBase' };
}

export function tuneQuadrupedLimbs(rig, upper, lower, paw) { for (const p of rig.plates) { if (p.id.endsWith('UpperPlate')) p.size = [upper]; if (p.id.endsWith('LowerPlate')) p.size = [lower]; if (p.id.endsWith('PawPlate')) p.size = [...paw]; } }

export function addMuzzle(rig, { length = .22, width = .24, height = .28, id = 'muzzle', z = 0 } = {}) { rig.joints.push(joint(id, 'head', V(length, 0, z), { role: 'snout', facing: '+x' })); rig.plates.push(spanPlate(id + 'ConnectorPlate', 'head', id, width, 'body', 5.3), plate(id + 'Plate', id, 'ellipse', [width, height], 'accent', 5.4)); rig.anchors.push({ id: id + 'TipAnchor', bone: id, offset: V(length * .25, 0, 0), inheritScale: false }); }

export function addPairedEars(rig, { baseX = -.04, baseY = .11, baseZ = .09, tipX = -.10, tipY = .13, tipZ = .08, width = .11, style = 'ear', semanticDetailTier } = {}) { rig.joints.push(joint('nearEarBase', 'head', V(baseX, baseY, baseZ), { role: 'ear', mirror: 'farEarBase' }), joint('nearEarTip', 'nearEarBase', V(tipX, tipY, tipZ), { role: 'ear', mirror: 'farEarTip' }), joint('farEarBase', 'head', V(baseX, -baseY, baseZ), { role: 'ear', mirror: 'nearEarBase' }), joint('farEarTip', 'farEarBase', V(tipX, -tipY, tipZ), { role: 'ear', mirror: 'nearEarTip' })); const ears = [spanPlate('nearEarPlate', 'nearEarBase', 'nearEarTip', width, 'accent', 5.5), spanPlate('farEarPlate', 'farEarBase', 'farEarTip', width, 'accent', 5.5)]; if (semanticDetailTier) for (const ear of ears) ear.semanticDetailTier = semanticDetailTier; rig.plates.push(...ears); rig.anchors.push({ id: 'nearEarTipAnchor', bone: 'nearEarTip', offset: V(0, 0, 0), counterpart: 'farEarTipAnchor', style, inheritScale: false }, { id: 'farEarTipAnchor', bone: 'farEarTip', offset: V(0, 0, 0), counterpart: 'nearEarTipAnchor', style, inheritScale: false }); }

export function setRotationalAttack(rig, rotations, { impact = .62, events } = {}) { const old = rig.clips.attack; rig.clips.attack = { ...old, boneLengthPolicy: 'preserve', motionSemantics: 'joint-local rotation; no child-bone translation', frames: [{ t: 0, poses: {}, rotations: {} }, { t: impact, poses: {}, rotations: cloneData(rotations) }, { t: 1, poses: {}, rotations: {} }], events: cloneData(events || old.events || [{ t: impact, name: 'impact' }, { t: .84, name: 'release' }]) }; }

export const rotationalGait = (rig, rotationsA, rotationsB, { posesA = {}, posesB = {}, policy = 'preserve', semantics = 'parent-joint rotation moves upper and lower limb plates together' } = {}) => { const old = rig.clips.walkA; rig.clips.walkA = { ...old, boneLengthPolicy: policy, motionSemantics: semantics, frames: [{ t: 0, poses: cloneData(posesA), rotations: cloneData(rotationsA) }, { t: .5, poses: cloneData(posesB), rotations: cloneData(rotationsB) }, { t: 1, poses: cloneData(posesA), rotations: cloneData(rotationsA) }] }; };

export function ensureCanonicalClips(rig) { const ground = [...new Set(Object.values(rig.clips).flatMap(c => [...(c.contacts || []), ...(c.contactIntervals || []).flatMap(i => i.ids)]))], idle = cloneData(rig.clips.idleA), walk = cloneData(rig.clips.walkA); rig.clips.idle = { ...idle, id: 'idle', aliasOf: 'idleA', base: 'bind' }; rig.clips.walk = { ...walk, id: 'walk', aliasOf: 'walkA', base: 'idle' }; rig.clips.hit = { id: 'hit', base: 'idle', duration: 460, easing: 'cubic-bezier(.2,.8,.3,1)', loop: false, frames: [{ t: 0, poses: {}, rotations: {} }, { t: .35, poses: { root: V(-.06, 0, 0) }, rotations: {} }, { t: 1, poses: {}, rotations: {} }], contacts: ground, events: [{ t: .05, name: 'hit-start' }, { t: .35, name: 'recoil' }, { t: .82, name: 'recover' }] }; rig.clips.ko = { id: 'ko', base: 'bind', duration: 900, easing: 'ease-in', loop: false, frames: [{ t: 0, poses: {}, rotations: {} }, { t: 1, poses: { root: V(0, .10, .04) }, rotations: { root: V(0, 72, 0) } }], contactIntervals: ground.length ? [{ ids: ground, from: 0, to: .05 }] : [], events: [{ t: .5, name: 'fall' }, { t: 1, name: 'down' }] }; }

export function inferredAnchorModule(id) { const s = id.toLowerCase(); return /grip|weapon/.test(s) ? 'weapon' : /horn|antler/.test(s) ? 'horn-or-antler' : /headgear|hat/.test(s) ? 'hat' : /helmet/.test(s) ? 'helmet' : /ear/.test(s) ? 'ear' : /saddle|rider/.test(s) ? 'saddle' : /collar/.test(s) ? 'collar' : /wing/.test(s) ? 'wing' : /tail/.test(s) ? 'tail' : /back/.test(s) ? 'backItem' : 'generic'; }
