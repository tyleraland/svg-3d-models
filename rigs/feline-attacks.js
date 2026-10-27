// Authoring-only feline action trajectories. Output is ordinary paper-rig clips.
import { bindPositions, quadrupedLegs, solveLeg, sagittalBodyPose } from './quadruped-locomotion.js';
const round = n => Math.abs(n) < 1e-10 ? 0 : +n.toFixed(10);
function curve(points, t) {
  for (let i = 0; i < points.length - 1; i++) {
    const [from, a] = points[i], [to, b] = points[i + 1];
    if (t >= from && t <= to) {
      const u = (t - from) / (to - from), eased = u * u * (3 - 2 * u);
      return a + (b - a) * eased;
    }
  }
  return points.at(-1)[1];
}
const phase = (id, from, peak, to) => ({ id, from, peak, to });

function bake(rig, config, pounce) {
  const positions = bindPositions(rig), legs = quadrupedLegs(rig), h = positions.pelvis[2];
  const side = (config.side || 'left') === 'left' ? 'near' : 'far';
  const phaseList = pounce
    ? [phase('anticipation', 0, .18, .25), phase('action', .25, .52, .62), phase('contact', .62, .68, .74), phase('recovery', .74, .84, .94), phase('settle', .94, 1, 1)]
    : [phase('anticipation', 0, .20, .28), phase('action', .28, .38, .44), phase('contact', .44, .48, .62), phase('recovery', .62, .80, .94), phase('settle', .94, 1, 1)];
  const eventList = pounce
    ? [{ t: .18, name: 'crouch', phase: 'anticipation' }, { t: .34, name: 'push-off', phase: 'action' }, { t: .52, name: 'suspension', phase: 'action' }, { t: .68, name: 'impact', phase: 'contact' }, { t: .84, name: 'release', phase: 'recovery' }, { t: 1, name: 'settled', phase: 'settle' }]
    : [{ t: .20, name: 'wind-up', phase: 'anticipation' }, { t: .38, name: 'claws-extend', phase: 'action' }, { t: .48, name: 'impact', phase: 'contact' }, { t: .60, name: 'rake', phase: 'contact' }, { t: .80, name: 'release', phase: 'recovery' }, { t: 1, name: 'settled', phase: 'settle' }];
  const contactIntervals = legs.flatMap(leg => {
    if (pounce) return leg.rear
      ? [{ ids: [leg.foot.id], from: 0, to: .34 }, { ids: [leg.foot.id], from: .78, to: 1 }]
      : [{ ids: [leg.foot.id], from: 0, to: .18 }, { ids: [leg.foot.id], from: .68, to: .76 }, { ids: [leg.foot.id], from: .94, to: 1 }];
    return leg.foot.id === side + 'FrontPaw'
      ? [{ ids: [leg.foot.id], from: 0, to: .10 }, { ids: [leg.foot.id], from: .94, to: 1 }]
      : [{ ids: [leg.foot.id], from: 0, to: 1 }];
  }).sort((a, b) => a.from - b.from || a.to - b.to);
  const times = [...new Set([...Array.from({ length: 241 }, (_, i) => i / 240),
    ...phaseList.flatMap(p => [p.from, p.peak, p.to]), ...eventList.map(e => e.t),
    ...contactIntervals.flatMap(c => [c.from, c.to])])].sort((a, b) => a - b);
  const frames = times.map(t => {
    const x = curve(pounce ? [[0, 0], [.18, -.06], [.52, .12], [.68, .06], [.84, .025], [1, 0]]
      : [[0, 0], [.20, -.035], [.48, .04], [.70, .02], [1, 0]], t) * h;
    const z = curve(pounce ? [[0, 0], [.18, -.07], [.34, -.025], [.52, config.height], [.68, -.025], [.84, -.01], [1, 0]]
      : [[0, 0], [.20, -.025], [.48, -.015], [.84, 0], [1, 0]], t) * h;
    const pitch = curve(pounce ? [[0, 0], [.18, 4], [.52, -5], [.68, 3], [1, 0]]
      : [[0, 0], [.20, 3], [.48, -2], [.70, 1], [1, 0]], t);
    const flex = curve([[0, 0], [.20, 2], [.48, -1.5], [.84, .5], [1, 0]], t);
    const rotations = { root: [0, round(pitch), 0], pelvis: [0, round(flex), 0], spineMid: [0, round(-2 * flex), 0],
      neck: [0, round(-pitch * .5), 0], head: [0, round(pitch * .3), 0],
      tailBase: [0, round(-3 * Math.sin(Math.PI * t)), 0], tailMid: [0, 0, round(5 * Math.sin(2 * Math.PI * t))] };
    const body = sagittalBodyPose(rig, rotations, [x, 0, z]);
    for (const leg of legs) {
      const active = !leg.rear && (pounce || leg.foot.id === side + 'FrontPaw');
      let dx = 0, lift = 0;
      if (pounce && leg.rear) {
        dx = curve([[0, 0], [.34, 0], [.52, -.16], [.78, 0], [1, 0]], t) * h;
        lift = curve([[0, 0], [.34, 0], [.52, .20], [.78, 0], [1, 0]], t) * h;
      } else if (active && pounce) {
        dx = curve([[0, 0], [.18, 0], [.40, config.reach * .6], [.68, config.reach], [.76, config.reach], [.94, 0], [1, 0]], t) * h;
        lift = curve([[0, 0], [.18, 0], [.40, .8], [.52, .6], [.68, 0], [.76, 0], [.84, .12], [.94, 0], [1, 0]], t) * h;
      } else if (active) {
        dx = curve([[0, 0], [.10, 0], [.22, -.12], [.30, -.08], [.48, config.reach], [.62, config.reach * .5], [.84, .05], [.94, 0], [1, 0]], t) * h;
        lift = curve([[0, 0], [.10, 0], [.22, config.lift * .5], [.30, config.lift], [.48, config.lift * .65], [.62, config.lift * .25], [.84, config.lift * .18], [.94, 0], [1, 0]], t) * h;
      }
      const target = [...positions[leg.foot.id]]; target[0] += dx; target[2] = lift;
      const local = solveLeg(leg, body.positions[leg.hip.id], target);
      local[leg.hip.id][1] = round(local[leg.hip.id][1] - body.angles[leg.hip.id]);
      Object.assign(rotations, local);
      const worldAngle = body.angles[leg.hip.id] + local[leg.hip.id][1] + local[leg.knee.id][1] + (leg.hock ? local[leg.hock.id][1] : 0);
      const pawPitch = active ? curve(pounce
        ? [[0, 0], [.40, -15], [.68, 10], [.76, 10], [.84, -10], [.94, 0], [1, 0]]
        : [[0, 0], [.30, -20], [.48, 20], [.62, 35], [.94, 0], [1, 0]], t) : 0;
      rotations[leg.foot.id] = [0, round(pawPitch - worldAngle), 0];
    }
    for (const clawSide of ['near', 'far']) for (let digit = 1; digit <= 3; digit++) {
      const active = pounce || clawSide === side;
      const angle = active ? curve([[0, -150], [.18, -150], [.38, 0], [.70, 0], [.94, -150], [1, -150]], t) : -150;
      rotations[clawSide + `FrontClaw${digit}Base`] = [0, round(angle), 0];
    }
    return { t, poses: { root: [round(x), 0, round(z)] }, rotations };
  });
  return { id: pounce ? 'pounce' : 'attack', base: 'bind', duration: config.durationMs, easing: 'linear', loop: false,
    frames, phases: phaseList, events: eventList, contactIntervals, boneLengthPolicy: 'preserve',
    motionSemantics: pounce ? 'two-paw claw pounce with crouch, hind push-off, suspension, fore contact and recovery'
      : 'three-foot-supported claw swipe; shoulder/elbow reach, extended claws and downward rake' };
}

export function applyFelineAttacks(rig, plan) {
  if (!rig.joints.some(j => j.id === 'spineMid')) throw new Error('Feline actions require an authored spineMid joint');
  for (const side of ['near', 'far']) for (let digit = 1; digit <= 3; digit++) {
    const id = side + `FrontClaw${digit}Base`;
    if (!rig.joints.some(j => j.id === id)) throw new Error(`Feline actions require claw joint ${id}`);
  }
  if (plan.swipe) rig.clips.attack = bake(rig, plan.swipe, false);
  if (plan.pounce) rig.clips.pounce = bake(rig, plan.pounce, true);
  foldFelineClaws(rig);
}

export function foldFelineClaws(rig) {
  const folded = Object.fromEntries(['near', 'far'].flatMap(side => [1, 2, 3].map(digit => [side + `FrontClaw${digit}Base`, [0, -150, 0]])));
  for (const clip of Object.values(rig.clips)) for (const frame of clip.frames) {
    frame.rotations = { ...structuredClone(folded), ...(frame.rotations || {}) };
  }
}
