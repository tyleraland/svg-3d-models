// Authoring-time anguilliform swimmer. Consumers receive ordinary rigid paper
// faces and sampled joint-local rotations, never a runtime wave evaluator.
import { templateRig } from '../../rigs/family-kit.js';

const round = n => { const v = Math.round(n * 1e8) / 1e8; return v === 0 ? 0 : v; };
const V = p => p.map(round);
const pulse = (t, a, b, c) => t <= a || t >= c ? 0
  : t < b ? (1 - Math.cos(Math.PI * (t - a) / (b - a))) / 2
    : (1 + Math.cos(Math.PI * (t - b) / (c - b))) / 2;

export function makeEelFamily() {
  const joints = [], plates = [], count = 20, step = .16;
  const J = (id, parent, bind, role = 'body', extra = {}) => {
    joints.push({ id, parent, bind: V(bind), role, ...extra }); return id;
  };
  const vertex = (id, owner, p) => J(id, owner, p, 'geometry', { helper: true });
  function face(id, owner, ids, region = 'core', extra = {}) {
    const points = ids.map(id => joints.find(j => j.id === id).bind);
    const center = points[0].map((_, k) => points.reduce((sum, p) => sum + p[k], 0) / points.length);
    const bone = J(id + 'Center', owner, center, region === 'head' ? 'head' : region === 'core' ? 'body' : 'fin', { helper: true });
    plates.push({ id: id + 'Plate', bone, shape: 'polygon', size: [.02], points: ids,
      role: region === 'head' ? 'head' : region === 'core' ? 'core' : 'fin', bodyRegion: region,
      attachment: 'rigid', material: 'paperMain', semanticDetailTier: 'silhouette', zBias: 0, ...extra });
  }
  function polygon(id, owner, points, region, extra) {
    face(id, owner, points.map((p, i) => vertex(id + 'Point' + i, owner, p)), region, extra);
  }
  function tube(id, owner, x0, x1, width0, width1, height0, height1, region = 'core') {
    const ring = (label, x, w, h) => Array.from({ length: 6 }, (_, k) => {
      const a = k * Math.PI / 3;
      return vertex(id + label + k, owner, [x, w * Math.cos(a), h * Math.sin(a)]);
    });
    const a = ring('Front', x0, width0, height0), b = ring('Back', x1, width1, height1);
    for (let k = 0; k < 6; k++) face(id + 'Facet' + k, owner, [a[k], a[(k + 1) % 6], b[(k + 1) % 6], b[k]], region,
      k >= 3 ? { role: 'accent', material: 'paperShade' } : {});
    face(id + 'FrontCap', owner, a, region);
    face(id + 'BackCap', owner, [...b].reverse(), region);
  }
  J('root', null, [0, 0, 0], 'root');
  J('head', 'root', [1.25, 0, .64], 'head', { bendAxis: [0, 0, 1], limits: [-12, 12] });
  tube('head', 'head', .34, -.16, .055, .125, .085, .15, 'head');
  J('noseTip', 'head', [.34, 0, 0], 'snout', { helper: true });
  J('jaw', 'head', [.075, 0, -.075], 'head', { bendAxis: [0, 1, 0], limits: [-5, 45] });
  tube('jaw', 'jaw', .26, -.08, .044, .11, .025, .043, 'head');
  const spine = [];
  for (let i = 0; i < count; i++) {
    const id = 'spine' + String(i + 1).padStart(2, '0'), previous = i ? spine[i - 1] : 'head';
    J(id, previous, [-step, 0, 0], 'body', { bendAxis: [0, 0, 1], limits: [-45, 45] });
    spine.push(id);
    const s0 = i / count, s1 = (i + 1) / count;
    const radius = s => .10 * (1 - .91 * s ** 1.55);
    const height = s => .16 * (1 - .91 * s ** 1.45);
    // Each short shell overlaps the adjacent volume; it never stretches when
    // its parent yaws. Shared ring controls keep the geometry hierarchy small.
    tube(id, id, .035, -step - .035, radius(s0), radius(s1), height(s0), height(s1));
    const finHeight = s => .10 * Math.sin(Math.PI * (.10 + .85 * s)) * (1 - .5 * s);
    for (const [name, sign, start] of [['Dorsal', 1, 1], ['Anal', -1, 4]]) {
      if (i < start) continue;
      const z0 = sign * height(s0) * .82, z1 = sign * height(s1) * .82;
      const crest0 = z0 + sign * finHeight(s0), crest1 = z1 + sign * finHeight(s1);
      // Thin double-sided ribbon panels follow their own spine segment. Each
      // outline is a closed rigid face, including the edge-on thickness strip.
      const a = [[.03, .005, z0], [.03, .005, crest0], [-step - .03, .005, crest1], [-step - .03, .005, z1]];
      const b = a.map(v => [v[0], -.005, v[2]]);
      const near = a.map((p, k) => vertex(id + name + 'NearPoint' + k, id, p));
      const far = b.map((p, k) => vertex(id + name + 'FarPoint' + k, id, p));
      face(id + name + 'Near', id, near, 'tail');
      face(id + name + 'Far', id, [...far].reverse(), 'tail');
      face(id + name + 'Crest', id, [near[1], far[1], far[2], near[2]], 'tail');
    }
  }
  const last = spine.at(-1);
  J('tailTip', last, [-step - .10, 0, 0], 'tail', { helper: true });
  polygon('tailRibbon', last, [[-.05, 0, .07], [-step - .10, 0, 0], [-.05, 0, -.07]], 'tail');
  for (const side of ['near', 'far']) {
    const sign = side === 'near' ? 1 : -1;
    polygon(side + 'Eye', 'head', Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4;
      return [.17 + .026 * Math.cos(a), sign * .085, .035 + .026 * Math.sin(a)];
    }), 'head', { role: 'accent', material: 'paperShade', semanticDetailTier: 'identity', zBias: .1 });
  }
  plates.unshift({ id: 'castShadow', bone: 'root', shape: 'ellipse', size: [3.15, .42], role: 'shadow',
    bodyRegion: 'groundShadow', attachment: 'rigid', material: 'shadow', semanticDetailTier: 'texture',
    zBias: -100, surfaceNormal: [0, 0, 1] });

  function frame(mode, t) {
    const loop = ['idle', 'swim', 'fastSwim'].includes(mode), phase = loop ? t : 0;
    const fast = mode === 'fastSwim', amplitude = !loop || mode === 'idle' ? .36 : fast ? 1.18 : 1;
    const drive = mode === 'attack' ? pulse(t, .12, .48, .96) : 0;
    const sink = mode === 'ko' ? (1 - Math.cos(Math.PI * t)) / 2 : 0;
    const fade = 1 - sink;
    const angle = s => amplitude * (2 + 40 * s ** 1.1) * Math.sin(2 * Math.PI * (phase - 1.05 * s));
    let previous = angle(0);
    const rotations = { head: [sink * 85, -drive * 6, previous * fade], jaw: [0, loop ? 2 + Math.sin(2 * Math.PI * phase) : 2 * fade + drive * 30, 0] };
    for (let i = 0; i < count; i++) {
      const s = (i + 1) / count, yaw = angle(s);
      rotations[spine[i]] = [0, 0, (yaw - previous) * fade + drive * 6 * Math.sin(Math.PI * s)];
      previous = yaw;
    }
    return { t, poses: { root: V([drive * .18, 0, -sink * .15]) },
      rotations: Object.fromEntries(Object.entries(rotations).map(([id, v]) => [id, V(v)])) };
  }
  const clips = {};
  for (const [id, mode, duration, loop] of [['idleA', 'idle', 3000, true], ['walkA', 'swim', 1650, true],
    ['fastSwim', 'fastSwim', 1050, true], ['attack', 'attack', 950, false], ['ko', 'ko', 1300, false]]) {
    const frames = Array.from({ length: 49 }, (_, i) => frame(mode, i / 48));
    if (loop) {
      // A closed position alone leaves different one-sided velocities after
      // linear keyframe interpolation. Project the neighboring samples onto
      // the same centered cyclic tangent, then close the endpoint exactly.
      // Only local rotations/root poses are adjusted; rigid geometry is fixed.
      for (const field of ['poses', 'rotations']) for (const [joint, start] of Object.entries(frames[0][field])) {
        const next = frames[1][field][joint], previous = frames[47][field][joint];
        const tangent = next.map((v, k) => (v - previous[k]) / 2);
        frames[1][field][joint] = V(start.map((v, k) => v + tangent[k]));
        frames[47][field][joint] = V(start.map((v, k) => v - tangent[k]));
      }
      frames[48] = { ...structuredClone(frames[0]), t: 1 };
    }
    clips[id] = { base: 'bind', duration, easing: 'linear', loop, frames, boneLengthPolicy: 'preserve', contacts: [], contactIntervals: [],
      motionSemantics: loop ? 'authored in-place anguilliform swim: lateral curvature travels head to tail across twenty fixed-length spine segments; continuous dorsal/anal ribbon follows the body; no foot contacts'
        : mode === 'attack' ? 'authored short forward lunge with jaw opening, closure and recovery; eel has no source animation'
          : 'authored side roll and gentle sink; eel has no source animation', events: [] };
    if (id === 'attack') clips[id].events = [{ t: .48, name: 'impact' }, { t: .96, name: 'release' }];
    if (id === 'ko') clips[id].events = [{ t: .5, name: 'roll' }, { t: 1, name: 'down' }];
  }
  clips.swim = { ...structuredClone(clips.walkA), aliasOf: 'walkA' };
  clips.run = { ...structuredClone(clips.fastSwim), aliasOf: 'fastSwim' };
  return templateRig({ id: 'eelBase', family: 'anguilliformSwimmer', archetypes: ['eel', 'moray-like elongated fish'],
    height: .95, scale: 19, groundY: 56, joints, plates, clips,
    profile: { silhouette: 'elongated laterally compressed body, small gape, tapering tail and continuous dorsal/anal ribbon; no legs or paired pectoral fins',
      locomotion: 'suspended head-to-tail lateral traveling wave; whole-body undulation distinct from the tail-driven fish/shark presets',

      } });
}
