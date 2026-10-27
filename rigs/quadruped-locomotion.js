// Authoring-time grounding and planar leg IK. Consumers receive ordinary clips;
// no solver, procedural trajectory, or recipe is required at render time.
const add = (a, b) => a.map((v, i) => v + b[i]);
const angle = ([x, , z]) => Math.atan2(-x, -z);
const degrees = r => r * 180 / Math.PI;
function sampleTransforms(clip, t, excluded) {
  const frames = clip.frames;
  const index = frames.findIndex((frame, i) => i < frames.length - 1 && t >= frame.t && t <= frames[i + 1].t);
  const a = frames[Math.max(0, index)], b = frames[Math.max(0, index) + 1] || a;
  const u = a === b ? 0 : (t - a.t) / (b.t - a.t);
  return Object.fromEntries(['poses', 'rotations'].map(field => [field, Object.fromEntries(
    [...new Set([...Object.keys(a[field] || {}), ...Object.keys(b[field] || {})])]
      .filter(id => !excluded.has(id)).map(id => [id, [0, 1, 2].map(axis => {
        const from = a[field]?.[id]?.[axis] || 0, to = b[field]?.[id]?.[axis] || 0;
        return round(from + (to - from) * u);
      })]),
  )]));
}
const round = n => Math.abs(n) < 1e-12 ? 0 : +n.toFixed(10);

export function bindPositions(rig) {
  const positions = {};
  for (const j of rig.joints) positions[j.id] = add(positions[j.parent] || [0, 0, 0], j.bind);
  return positions;
}

export function quadrupedLegs(rig) {
  const byId = new Map(rig.joints.map(j => [j.id, j]));
  return (rig.clips.idleA.contacts || []).map(id => {
    const foot = byId.get(id), distal = byId.get(foot?.parent);
    const hock = distal && /(?:Hock|Carpus)$/.test(distal.id) ? distal : null;
    const knee = hock ? byId.get(hock.parent) : distal;
    const hip = byId.get(knee?.parent);
    if (!foot || !knee || !hip || !/Hip$|Shoulder$/.test(hip.id)) throw new Error(`Invalid quadruped leg chain: ${id}`);
    return { foot, hock, knee, hip, rear: /Rear/.test(id) };
  });
}

export function solveLeg(leg, origin, target, { distalPitch = 0 } = {}) {
  const { hip, knee, hock, foot, rear } = leg;
  const lower = hock || foot;
  // The distal hoof/paw segment retains its authored world orientation. For a
  // three-link hind leg this leaves the stifle and hock bending oppositely.
  const pitch = distalPitch * Math.PI / 180;
  const distal = hock ? [foot.bind[0] * Math.cos(pitch) + foot.bind[2] * Math.sin(pitch), foot.bind[1],
    -foot.bind[0] * Math.sin(pitch) + foot.bind[2] * Math.cos(pitch)] : [0, 0, 0];
  const dx = target[0] - distal[0] - origin[0];
  const dz = target[2] - distal[2] - origin[2];
  const d = Math.hypot(dx, dz), a = Math.hypot(knee.bind[0], knee.bind[2]), b = Math.hypot(lower.bind[0], lower.bind[2]);
  if (d > a + b + 1e-9 || d < Math.abs(a - b) - 1e-9) throw new Error(`Unreachable quadruped stride: ${foot.id}`);
  const along = (a * a - b * b + d * d) / (2 * d);
  const across = Math.sqrt(Math.max(0, a * a - along * along)) * (rear ? 1 : -1);
  const upper = [dx / d * along - dz / d * across, 0, dz / d * along + dx / d * across];
  const down = [dx - upper[0], 0, dz - upper[2]];
  const hipAngle = angle(upper) - angle(knee.bind);
  const kneeAngle = angle(down) - angle(lower.bind) - hipAngle;
  const rotations = {
    [hip.id]: [0, round(degrees(hipAngle)), 0],
    [knee.id]: [0, round(degrees(kneeAngle)), 0],
  };
  if (hock) rotations[hock.id] = [0, round(distalPitch - degrees(hipAngle + kneeAngle)), 0];
  for (const j of [knee, hock].filter(Boolean)) {
    const bend = rotations[j.id][1];
    if (j.limits && (bend < j.limits[0] - 1e-8 || bend > j.limits[1] + 1e-8)) throw new Error(`Quadruped gait exceeds ${j.id} limits: ${bend}`);
  }
  return rotations;
}

export function applyGroundedQuadruped(rig, plan) {
  const legs = quadrupedLegs(rig);
  if (legs.length !== 4) throw new Error('Grounded quadruped authoring requires four contact chains');
  for (const { hip, knee, hock, foot } of legs) {
    const origin = bindPositions(rig)[hip.id];
    const links = [knee, hock, foot].filter(Boolean);
    const drop = -links.reduce((sum, j) => sum + j.bind[2], 0);
    if (!(origin[2] > 0 && drop > 0)) throw new Error(`Invalid grounded leg height: ${hip.id}`);
    for (const j of links) j.bind[2] = round(j.bind[2] * origin[2] / drop);
  }
  for (const plate of rig.plates.filter(p => p.role === 'shadow')) plate.surfaceNormal = [0, 0, 1];
  if (!plan.walk && !plan.gallop && !plan.run && !plan.trot && !plan.sprint) return;
  if (legs.some(({ knee, hock, foot }) => [knee, hock, foot].filter(Boolean).some(j => Math.abs(j.bind[1]) > 1e-9))) throw new Error('Planar gait requires sagittal leg chains');
  if (plan.gallop) rig.clips.gallop = bakeGallop(rig, legs, plan.gallop);
  if (plan.run) rig.clips.run = plan.run.pattern === 'lateral-sequence'
    ? { ...bakeWalk(rig, legs, plan.run), id: 'run' }
    : bakeGallop(rig, legs, plan.run, { clipId: 'run', spineFlex: plan.run.spineFlexDegrees || 0 });
  if (plan.sprint) rig.clips.sprint = bakeGallop(rig, legs, plan.sprint, { clipId: 'sprint', spineFlex: plan.sprint.spineFlexDegrees || 0 });
  if (plan.trot) rig.clips.trot = { ...bakeWalk(rig, legs, plan.trot), id: 'trot', events: [{t:0,name:'diagonal-a-contact'},{t:.5,name:'diagonal-b-contact'}] };
  if (plan.walk) rig.clips.walkA = bakeWalk(rig, legs, plan.walk);
}

function bakeWalk(rig, legs, plan) {
  const positions = bindPositions(rig), old = rig.clips.walkA;
  const duty = plan.dutyFactor ?? .6, frames = [], intervals = [];
  const legJointIds = new Set(legs.flatMap(({ hip, knee, hock, foot }) => [hip, knee, hock, foot].filter(Boolean).map(j => j.id)));
  const legSettings = legs.map(leg => {
    const origin = positions[leg.hip.id], lower = leg.hock || leg.foot;
    const distal = leg.hock ? leg.foot.bind : [0, 0, 0];
    const reach = Math.hypot(leg.knee.bind[0], leg.knee.bind[2]) + Math.hypot(lower.bind[0], lower.bind[2]);
    const vertical = origin[2] + distal[2];
    const available = Math.sqrt(Math.max(0, reach * reach - vertical * vertical));
    const stride = Math.min(plan.stride * origin[2], available * 1.6);
    const lift = plan.lift * origin[2];
    const offset = plan.pattern === 'lateral-sequence'
      ? (leg.rear ? (leg.foot.id.startsWith('near') ? 0 : .5) : (leg.foot.id.startsWith('near') ? .75 : .25))
      : plan.pattern === 'fore-hind' ? (leg.rear ? .5 : 0) : (/nearFront|farRear/.test(leg.foot.id) ? 0 : .5);
    for (const cycle of [0, 1]) {
      const from = Math.max(0, cycle - offset), to = Math.min(1, round(cycle - offset + duty));
      if (from <= to) intervals.push({ ids: [leg.foot.id], from: round(from), to });
    }
    return { leg, origin, stride, lift, offset, distal };
  });
  // Fixed dense bake bounds interpolation error between IK samples. Phase
  // boundaries are exact samples; contact metadata follows the same trajectory.
  const samples = plan.pattern === 'lateral-sequence' ? 160 : 80;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples, sampled = sampleTransforms(old, t, legJointIds), rotations = sampled.rotations;
    const wave = Math.sin(2 * Math.PI * t), bodyPhase = 2 * Math.PI * (plan.bodyCycles ?? 2) * t;
    const dip = -(plan.bodyBounce || 0) * positions.pelvis[2] * (1 - Math.cos(bodyPhase)) / 2;
    if (plan.bodyBounce) sampled.poses.root = [0, 0, round(dip)];
    if (plan.headNodDegrees) {
      rotations[positions.neckBase ? 'neckBase' : 'neck'] = [0, round(plan.headNodDegrees * Math.sin(bodyPhase)), 0];
      rotations.head = [0, round(-plan.headNodDegrees * .6 * Math.sin(bodyPhase)), 0];
    }
    if (plan.earSwingDegrees) for (const side of ['near', 'far']) {
      rotations[side + 'EarBase'] = [round(plan.earSwingDegrees * .3 * wave * (side === 'near' ? 1 : -1)), round(plan.earSwingDegrees * wave), 0];
    }
    if (plan.tailWaveDegrees && positions.tailMid) {
      rotations.tailMid = [0, 0, round(plan.tailWaveDegrees * Math.sin(2 * Math.PI * t - .6))];
      rotations.tailTip = [0, 0, round(plan.tailWaveDegrees * Math.sin(2 * Math.PI * t - 1.2))];
    }
    if (plan.tailSwingDegrees) rotations.tailBase = [round(plan.tailSwingDegrees * .3 * wave), 0, round(plan.tailSwingDegrees * wave)];
    for (const { leg, origin, stride, lift, offset, distal } of legSettings) {
      const phase = ((i === samples ? 0 : t) + offset) % 1;
      const stance = phase <= duty;
      const u = stance ? phase / duty : (phase - duty) / (1 - duty);
      const x = stance ? stride * (.5 - u) : stride * (-.5 + (1 - Math.cos(Math.PI * u)) / 2);
      const z = stance ? 0 : lift * Math.sin(Math.PI * u) ** 2;
      Object.assign(rotations, solveLeg(leg, [origin[0], origin[1], origin[2] + dip], [origin[0] + distal[0] + x, positions[leg.foot.id][1], z]));
    }
    if (plan.keepPawsLevel) levelPaws(rig, legs, rotations);
    frames.push({ t, poses: sampled.poses, rotations });
  }
  return {
    ...old, base: 'bind', frames, easing: 'linear',
    ...(plan.durationMs ? { duration: plan.durationMs } : {}),
    contacts: undefined,
    contactIntervals: intervals.sort((a, b) => a.from - b.from || a.to - b.to),
    boneLengthPolicy: 'preserve',
    motionSemantics: plan.pattern === 'fore-hind' ? 'baked sagittal IK; fore-pair/hind-pair bound with planted stance and raised swing' : 'baked sagittal IK; shoulder/hip swing, elbow/stifle flexion, opposing hind hock; planted stance and raised swing',
  };
}


// Four staggered contacts followed by extended suspension. Authored in place:
// root translation supplies the body arc; world-space IK keeps stance hooves
// on the fixed ground and is baked entirely into ordinary local rotations.
function bakeGallop(rig, legs, plan, { clipId = 'gallop', spineFlex = 0 } = {}) {
  const bind = bindPositions(rig), height = bind.pelvis[2];
  const leadSide = (plan.lead || 'left') === 'left' ? 'near' : 'far';
  const starts = [0, .12, .32, .44], duty = plan.dutyFactor ?? .22, takeoff = round(.44 + duty);
  const settings = legs.map(leg => {
    const leading = leg.foot.id.startsWith(leadSide);
    const beat = leg.rear ? (leading ? 1 : 0) : (leading ? 3 : 2);
    return { leg, start: starts[beat], beat, origin: bind[leg.hip.id],
      distal: leg.hock ? leg.foot.bind : [0, 0, 0] };
  }).sort((a, b) => a.start - b.start);
  const frames = [], apex = round((takeoff + 1) / 2);
  const samples = clipId === 'sprint' ? 960 : 240;
  const times = [...new Set([...Array.from({ length: samples + 1 }, (_, i) => i / samples),
    ...starts, ...starts.map(start => round(start + duty)), takeoff, apex])].sort((a, b) => a - b);
  for (const time of times) {
    const t = time === 1 ? 0 : time, wave = Math.sin(2 * Math.PI * t);
    const pitch = -(plan.pitchDegrees ?? 3) * wave, radians = pitch * Math.PI / 180;
    const moveZ = t <= takeoff
      ? -(plan.bodyDip ?? .025) * height * Math.sin(Math.PI * t / takeoff) ** 2
      : (plan.bodyRise ?? .08) * height * Math.sin(Math.PI * (t - takeoff) / (1 - takeoff)) ** 2;
    const rotations = { root: [0, round(pitch), 0],
      [bind.neckBase ? 'neckBase' : 'neck']: [0, round((plan.neckPitchDegrees || 0) - 4 * wave), 0],
      head: [0, round((plan.headPitchDegrees || 0) + 2 * wave), 0], tailBase: [round(2 * wave), round((plan.tailPitchDegrees ?? -10) - 6 * wave), 0] };
    if (spineFlex) {
      rotations.pelvis = [0, round(spineFlex * wave), 0];
      rotations.spineMid = [0, round(-2 * spineFlex * wave), 0];
      if (bind.tailMid) rotations.tailMid = [0, 0, round(5 * Math.sin(2 * Math.PI * t - .6))];
    }
    const body = spineFlex ? sagittalBodyPose(rig, rotations, [0, 0, moveZ]) : null;
    for (const { leg, start, origin, distal } of settings) {
      const phase = round((t - start + 1) % 1), stance = phase <= duty;
      const u = stance ? phase / duty : (phase - duty) / (1 - duty);
      const stride = plan.stride * origin[2];
      const x = stance ? stride * (.5 - u) : stride * (-.5 + (1 - Math.cos(Math.PI * u)) / 2);
      const z = stance ? 0 : plan.lift * origin[2] * Math.sin(Math.PI * u) ** 2;
      const posedHip = body?.positions[leg.hip.id] || [origin[0] * Math.cos(radians) + origin[2] * Math.sin(radians), origin[1],
        -origin[0] * Math.sin(radians) + origin[2] * Math.cos(radians) + moveZ];
      const local = solveLeg(leg, posedHip, [origin[0] + distal[0] + x - (leg.rear ? .08 * origin[2] : 0), bind[leg.foot.id][1], z],
        { distalPitch: stance ? 0 : -18 * Math.sin(Math.PI * u) ** 2 });
      local[leg.hip.id][1] = round(local[leg.hip.id][1] - (body?.angles[leg.hip.id] ?? pitch));
      Object.assign(rotations, local);
    }
    if (plan.keepPawsLevel) levelPaws(rig, legs, rotations);
    frames.push({ t: time, poses: { root: [0, 0, round(moveZ)] }, rotations });
  }
  return { id: clipId, base: 'bind', duration: plan.durationMs, loop: true, easing: 'linear', frames,
    contactIntervals: settings.map(({ leg, start }) => ({ ids: [leg.foot.id], from: start, to: round(start + duty) })),
    events: [...settings.map(({ leg, start, beat }) => ({ t: start,
      name: `${leg.rear ? 'hind' : 'fore'}-${beat % 2 ? 'leading' : 'trailing'}-contact` })),
      { t: takeoff, name: 'suspension-start' }, { t: apex, name: 'suspension-apex' }],
    boneLengthPolicy: 'preserve',
    motionSemantics: `baked four-beat ${plan.lead || 'left'}-lead ${clipId}; staggered hind/fore contacts, suspension, body arc and pitch` };
}


// Pure sagittal forward kinematics for body controls used by baked feline
// actions. Leg IK is applied afterward, compensating the parent body angle.
export function sagittalBodyPose(rig, rotations, move = [0, 0, 0]) {
  const positions = {}, angles = {};
  for (const joint of rig.joints) {
    const parent = joint.parent ? positions[joint.parent] : move;
    const angle = joint.parent ? angles[joint.parent] : 0;
    const a = angle * Math.PI / 180, [x, y, z] = joint.bind;
    positions[joint.id] = [parent[0] + Math.cos(a) * x + Math.sin(a) * z, parent[1] + y,
      parent[2] - Math.sin(a) * x + Math.cos(a) * z];
    angles[joint.id] = angle + (rotations[joint.id]?.[1] || 0);
  }
  return { positions, angles };
}

// Plantigrade paws keep their sole plane level while the leg chain articulates.
function levelPaws(rig, legs, rotations) {
  for (const leg of legs) rotations[leg.foot.id] = [0, 0, 0];
  const { angles } = sagittalBodyPose(rig, rotations);
  for (const leg of legs) rotations[leg.foot.id] = [0, round(-angles[leg.foot.id]), 0];
}
