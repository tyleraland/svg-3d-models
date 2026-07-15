#!/usr/bin/env node
// One-time generator for rigs/families/quadruped.json — the RAW quadruped family
// base (pre-normalization), serialized from the verbatim workbench construction so
// it exactly matches what the imperative build started from. After this runs, the
// JSON is the family source of truth; this script documents its provenance.
//
//   node scripts/gen-family.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { V, joint, plate, spanPlate } from '@paper-rig/schema';
import { templateRig, clipPack } from '../rigs/family-kit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- verbatim from paper-rig-workbench.html (quadrupedJoints, quadruped) -------
const quadrupedJoints = [joint('root', null, V(0, 0, 0), { role: 'root' }), joint('pelvis', 'root', V(-.34, 0, .62), { role: 'body' }), joint('chest', 'pelvis', V(.66, 0, .12), { role: 'body' }), joint('neck', 'chest', V(.25, 0, .12), { role: 'neck' }), joint('head', 'neck', V(.28, 0, .04), { role: 'head' }), joint('nearHornMount', 'head', V(-.02, .12, .14), { role: 'accessoryAnchor', mirror: 'farHornMount' }), joint('farHornMount', 'head', V(-.02, -.12, .14), { role: 'accessoryAnchor', mirror: 'nearHornMount' }), joint('tailBase', 'pelvis', V(-.28, 0, .03), { role: 'tail' }), joint('tailTip', 'tailBase', V(-.34, 0, -.12), { role: 'tail' }),
joint('nearFrontHip', 'chest', V(-.05, .22, -.02), { role: 'limb', mirror: 'farFrontHip', diagonal: 'farRearHip' }), joint('nearFrontKnee', 'nearFrontHip', V(.02, 0, -.32), { role: 'limb', mirror: 'farFrontKnee', diagonal: 'farRearKnee', bendAxis: V(0, 1, 0), limits: [-30, 120] }), joint('nearFrontPaw', 'nearFrontKnee', V(.04, 0, -.31), { role: 'limb', mirror: 'farFrontPaw', diagonal: 'farRearPaw', ik: 'nearFrontLeg' }), joint('farFrontHip', 'chest', V(-.05, -.22, -.02), { role: 'limb', mirror: 'nearFrontHip', diagonal: 'nearRearHip' }), joint('farFrontKnee', 'farFrontHip', V(.02, 0, -.32), { role: 'limb', mirror: 'nearFrontKnee', diagonal: 'nearRearKnee', bendAxis: V(0, 1, 0), limits: [-30, 120] }), joint('farFrontPaw', 'farFrontKnee', V(.04, 0, -.31), { role: 'limb', mirror: 'nearFrontPaw', diagonal: 'nearRearPaw', ik: 'farFrontLeg' }),
joint('nearRearHip', 'pelvis', V(-.04, .23, -.02), { role: 'limb', mirror: 'farRearHip', diagonal: 'farFrontHip' }), joint('nearRearKnee', 'nearRearHip', V(-.05, 0, -.32), { role: 'limb', mirror: 'farRearKnee', diagonal: 'farFrontKnee', bendAxis: V(0, 1, 0), limits: [-120, 30] }), joint('nearRearPaw', 'nearRearKnee', V(.03, 0, -.30), { role: 'limb', mirror: 'farRearPaw', diagonal: 'farFrontPaw', ik: 'nearRearLeg' }), joint('farRearHip', 'pelvis', V(-.04, -.23, -.02), { role: 'limb', mirror: 'nearRearHip', diagonal: 'nearFrontHip' }), joint('farRearKnee', 'farRearHip', V(-.05, 0, -.32), { role: 'limb', mirror: 'nearRearKnee', diagonal: 'nearFrontKnee', bendAxis: V(0, 1, 0), limits: [-120, 30] }), joint('farRearPaw', 'farRearKnee', V(.03, 0, -.30), { role: 'limb', mirror: 'nearRearPaw', diagonal: 'nearFrontPaw', ik: 'farRearLeg' })];

const quadruped = templateRig({ id: 'quadrupedBase', family: 'quadruped', archetypes: ['generic canid', 'lion', 'raccoon', 'bear'], height: 1.05, scale: 29, groundY: 70, profile: { torso: 'medium', neck: 'short', locomotion: 'diagonal gait', modularHornMounts: ['nearHornMount', 'farHornMount'] }, joints: quadrupedJoints,
  plates: [plate('castShadow', 'root', 'ellipse', [1.34, .70], 'shadow', -99), spanPlate('torsoPlate', 'pelvis', 'chest', .58, 'body', 3), plate('pelvisPlate', 'pelvis', 'ellipse', [.58, .54], 'body', 3.1), spanPlate('neckPlate', 'chest', 'neck', .34, 'body', 4), spanPlate('headConnectorPlate', 'neck', 'head', .30, 'body', 4.7), plate('headPlate', 'head', 'ellipse', [.38, .42], 'accent', 5), spanPlate('tailPlate', 'tailBase', 'tailTip', .13, 'accent', 2), ...['nearFront', 'farFront', 'nearRear', 'farRear'].flatMap(n => [spanPlate(n + 'UpperPlate', n + 'Hip', n + 'Knee', .17, 'body', 1), spanPlate(n + 'LowerPlate', n + 'Knee', n + 'Paw', .14, 'body', 1.2), plate(n + 'PawPlate', n + 'Paw', 'ellipse', [.20, .15], 'accent', 0)])],
  anchors: [{ id: 'collarAnchor', bone: 'neck', offset: V(0, 0, .14), inheritScale: false }, { id: 'backAnchor', bone: 'chest', offset: V(-.12, 0, .25), inheritScale: false }, { id: 'nearHornAnchor', bone: 'nearHornMount', offset: V(0, 0, 0), counterpart: 'farHornAnchor', moduleType: 'horn', inheritScale: false }, { id: 'farHornAnchor', bone: 'farHornMount', offset: V(0, 0, 0), counterpart: 'nearHornAnchor', moduleType: 'horn', inheritScale: false }],
  clips: clipPack({ idle: { head: [.01, 0, .02], tailTip: [0, .04, 0] }, moveA: { nearFrontPaw: [.17, 0, .06], farRearPaw: [.15, 0, .05], farFrontPaw: [-.13, 0, 0], nearRearPaw: [-.13, 0, 0] }, moveB: { nearFrontPaw: [-.13, 0, 0], farRearPaw: [-.13, 0, 0], farFrontPaw: [.17, 0, .06], nearRearPaw: [.15, 0, .05] }, attack: { head: [.25, 0, .04], neck: [.16, 0, .02] }, contacts: ['nearFrontPaw', 'farFrontPaw', 'nearRearPaw', 'farRearPaw'], intervals: [{ ids: ['farFrontPaw', 'nearRearPaw'], from: 0, to: .48 }, { ids: ['nearFrontPaw', 'farRearPaw'], from: .5, to: .98 }] }) });

writeFileSync(join(ROOT, 'rigs/families/quadruped.json'), JSON.stringify(quadruped, null, 2) + '\n');
console.log('Wrote rigs/families/quadruped.json');
