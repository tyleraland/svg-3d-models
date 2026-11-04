// Authoring-time conversion of measured dinosaur fin dihedral to ordinary
// rigid paper geometry and joint-local clips. No runtime deformation evaluator.
import { templateRig } from '../../rigs/family-kit.js';

const round = n => { const v = Math.round(n * 1e8) / 1e8; return v === 0 ? 0 : v; };
const V = p => p.map(round);
const pulse = (t, a, b, c) => t <= a || t >= c ? 0 : t < b
  ? (1 - Math.cos(Math.PI * (t - a) / (b - a))) / 2
  : (1 + Math.cos(Math.PI * (t - b) / (c - b))) / 2;

function periodicCurve(samples) {
  const n = samples.length - 1, drift = samples[n] - samples[0];
  const p = samples.slice(0, n).map((v, i) => v - drift * i / n);
  return t => {
    const x = ((t % 1 + 1) % 1) * n, i = Math.floor(x), u = x - i;
    const a = p[(i + n - 1) % n], b = p[i], c = p[(i + 1) % n], d = p[(i + 2) % n];
    return .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  };
}

export function makeMantaFamily(reference) {
  const curves = Object.fromEntries(Object.entries(reference.fin_dihedral_degrees).map(([k, values]) => [k, periodicCurve(values)]));
  const joints = [], plates = [];
  const J = (id, parent, bind, role = 'body', extra = {}) => {
    joints.push({ id, parent, bind: V(bind), role, ...extra }); return id;
  };
  const vertex = (id, owner, p) => J(id, owner, p, 'geometry', { helper: true });
  function face(id, owner, ids, region = 'core', extra = {}) {
    const points = ids.map(id => joints.find(j => j.id === id).bind);
    const center = points[0].map((_, k) => points.reduce((s, p) => s + p[k], 0) / points.length);
    const bone = J(id + 'Center', owner, center, region === 'head' ? 'head' : region === 'core' ? 'body' : 'fin', { helper: true });
    plates.push({ id: id + 'Plate', bone, points: ids, shape: 'polygon', size: [.02],
      role: region === 'head' ? 'head' : region === 'core' ? 'core' : 'fin', bodyRegion: region,
      attachment: 'rigid', material: 'paperMain', semanticDetailTier: 'silhouette', zBias: 0, ...extra });
  }
  function polygon(id, owner, points, region, extra) {
    face(id, owner, points.map((p, i) => vertex(id + 'Point' + i, owner, p)), region, extra);
  }
  function slab(id, owner, outline, thickness, region = 'limb') {
    const a = outline.map((p, i) => vertex(id + 'TopPoint' + i, owner, [p[0], p[1], p[2] + thickness / 2]));
    const b = outline.map((p, i) => vertex(id + 'BottomPoint' + i, owner, [p[0], p[1], p[2] - thickness / 2]));
    face(id + 'Top', owner, a, region);
    face(id + 'Bottom', owner, [...b].reverse(), region, { role: 'accent', material: 'paperShade' });
    for (let i = 0; i < a.length; i++) face(id + 'Edge' + i, owner, [a[i], b[i], b[(i + 1) % a.length], a[(i + 1) % a.length]], region);
  }
  J('root', null, [0, 0, 0], 'root');
  J('body', 'root', [0, 0, 1.35], 'body');
  J('head', 'body', [.50, 0, 0], 'head', { bendAxis: [0, 1, 0], limits: [-12, 12] });
  J('mouthCenter', 'head', [.22, 0, -.02], 'head', { helper: true });
  // A flattened biconvex central disc, rather than a bird's torso or fish tube.
  const outline = [[.55, .23], [.55, -.23], [.28, -.35], [-.48, -.18], [-.61, 0], [-.48, .18], [.28, .35]];
  const top = outline.map(([x, y], i) => vertex('bodyRimTop' + i, 'body', [x, y, .025]));
  const bottom = outline.map(([x, y], i) => vertex('bodyRimBottom' + i, 'body', [x, y, -.025]));
  const crown = vertex('bodyCrown', 'body', [.05, 0, .13]), belly = vertex('bodyBelly', 'body', [.05, 0, -.075]);
  for (let i = 0; i < outline.length; i++) {
    const k = (i + 1) % outline.length;
    face('bodyUpper' + i, 'body', [crown, top[i], top[k]]);
    face('bodyLower' + i, 'body', [belly, bottom[k], bottom[i]], 'core', { role: 'accent', material: 'paperShade' });
    face('bodyRim' + i, 'body', [top[i], bottom[i], bottom[k], top[k]]);
  }
  slab('head', 'head', [[-.08, .255, 0], [.22, .22, 0], [.22, -.22, 0], [-.08, -.255, 0]], .085, 'head');
  for (const side of ['near', 'far']) {
    const sign = side === 'near' ? 1 : -1, other = side === 'near' ? 'far' : 'near';
    J(side + 'CephalicLobe', 'head', [.17, sign * .16, 0], 'head', { mirror: other + 'CephalicLobe' });
    slab(side + 'Cephalic', side + 'CephalicLobe', [[-.025, -sign * .048, 0], [.27, -sign * .033, -.025],
      [.27, sign * .033, -.025], [-.025, sign * .048, 0]], .04, 'head');
    J(side + 'FinRoot', 'body', [-.05, sign * .17, 0], 'fin', { mirror: other + 'FinRoot', bendAxis: [1, 0, 0], limits: [-40, 40] });
    J(side + 'FinMid', side + 'FinRoot', [-.06, sign * .42, 0], 'fin', { mirror: other + 'FinMid', bendAxis: [1, 0, 0], limits: [-60, 60] });
    J(side + 'FinOuter', side + 'FinMid', [-.08, sign * .34, 0], 'fin', { mirror: other + 'FinOuter', bendAxis: [1, 0, 0], limits: [-60, 60] });
    J(side + 'FinTip', side + 'FinOuter', [-.215, sign * .45, 0], 'fin', { helper: true, mirror: other + 'FinTip' });
    // Adjacent rigid sections overlap around their hinges. The spanwise bend
    // comes from the three roll joints, without translating polygon controls.
    slab(side + 'FinInner', side + 'FinRoot', [[.35, -sign * .035, .012], [.06, sign * .455, .012],
      [-.48, sign * .455, -.012], [-.36, -sign * .035, -.012]], .035);
    slab(side + 'FinMiddle', side + 'FinMid', [[.12, -sign * .035, .01], [-.06, sign * .375, .01],
      [-.35, sign * .375, -.01], [-.42, -sign * .035, -.01]], .025);
    slab(side + 'FinTipSurface', side + 'FinOuter', [[.02, -sign * .035, .006], [-.20, sign * .46, 0],
      [-.23, sign * .46, -.003], [-.27, -sign * .035, -.006]], .015);
    polygon(side + 'Eye', 'head', Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4;
      return [.10 + .025 * Math.cos(a), sign * .19 + .025 * Math.sin(a), .047];
    }), 'head', { role: 'accent', material: 'paperShade', semanticDetailTier: 'identity', zBias: .1 });
  }
  const tail = [['tailBase', 'body', [-.52, 0, 0], .07], ['tailMid', 'tailBase', [-.38, 0, 0], .045],
    ['tailOuter', 'tailMid', [-.42, 0, 0], .022], ['tailEnd', 'tailOuter', [-.45, 0, 0], .01]];
  for (let i = 0; i < tail.length; i++) {
    const [id, parent, bind, width] = tail[i];
    J(id, parent, bind, 'tail', { bendAxis: [0, 1, 0], limits: [-20, 20] });
    const length = i < tail.length - 1 ? -tail[i + 1][2][0] : .38;
    slab(id, id, [[.04, width / 2, 0], [-length - .04, width * .26, 0],
      [-length - .04, -width * .26, 0], [.04, -width / 2, 0]], Math.max(.006, width * .7), 'tail');
  }
  J('tailTip', 'tailEnd', [-.42, 0, 0], 'tail', { helper: true });
  polygon('dorsalFin', 'body', [[-.24, 0, .12], [-.35, 0, .27], [-.43, 0, .04]], 'tail');
  plates.unshift({ id: 'castShadow', bone: 'root', shape: 'ellipse', size: [2.30, 1.45], role: 'shadow',
    bodyRegion: 'groundShadow', attachment: 'rigid', material: 'shadow', zBias: -100,
    surfaceNormal: [0, 0, 1], semanticDetailTier: 'texture' });

  function frame(mode, t) {
    const loop = ['idle', 'swim', 'fastSwim'].includes(mode), phase = loop ? t : 0;
    const amplitude = !loop || mode === 'idle' ? .35 : mode === 'fastSwim' ? 1.10 : 1;
    const drive = mode === 'attack' ? pulse(t, .15, .48, .95) : 0;
    const sink = mode === 'ko' ? (1 - Math.cos(Math.PI * t)) / 2 : 0, fade = 1 - sink;
    const global = ['Top', 'Mid', 'Bottom'].map(k => amplitude * curves[k](phase) * fade - drive * 12);
    const rotations = { body: [sink * 70, -drive * 4, 0], head: [0, -2 * amplitude * Math.sin(2 * Math.PI * phase) * fade - drive * 3, 0] };
    for (const side of ['near', 'far']) {
      const sign = side === 'near' ? 1 : -1;
      rotations[side + 'FinRoot'] = [sign * global[0], 0, 0];
      rotations[side + 'FinMid'] = [sign * (global[1] - global[0]), 0, 0];
      rotations[side + 'FinOuter'] = [sign * (global[2] - global[1]), 0, 0];
      rotations[side + 'CephalicLobe'] = [0, drive * 10, 0];
    }
    for (const [i, [id]] of tail.entries()) rotations[id] = [0, amplitude * .8 * Math.sin(2 * Math.PI * phase - i * .35) * fade, 0];
    return { t, poses: { root: V([drive * .18, 0, -sink * .04]) },
      rotations: Object.fromEntries(Object.entries(rotations).map(([id, v]) => [id, V(v)])) };
  }
  const clips = {};
  const duration = Math.round(1000 * (reference.frame_range[1] - reference.frame_range[0]) / reference.fps);
  for (const [id, mode, ms, loop] of [['idleA', 'idle', 5500, true], ['walkA', 'swim', duration, true],
    ['fastSwim', 'fastSwim', 2800, true], ['attack', 'attack', 1150, false], ['ko', 'ko', 1500, false]]) {
    const frames = Array.from({ length: 97 }, (_, i) => frame(mode, i / 96));
    if (loop) {
      for (const field of ['poses', 'rotations']) for (const [joint, start] of Object.entries(frames[0][field])) {
        const next = frames[1][field][joint], previous = frames[95][field][joint];
        const tangent = next.map((v, k) => (v - previous[k]) / 2);
        frames[1][field][joint] = V(start.map((v, k) => v + tangent[k]));
        frames[95][field][joint] = V(start.map((v, k) => v - tangent[k]));
      }
      frames[96] = { ...structuredClone(frames[0]), t: 1 };
    }
    clips[id] = { base: 'bind', duration: ms, easing: 'linear', loop, frames, contacts: [], contactIntervals: [], boneLengthPolicy: 'preserve',
      motionSemantics: loop ? 'Authored swim synchronous three-stage pectoral-fin roll; spanwise cupping follows measured dihedral, body remains stable and whip tail follows gently; no foot contacts'
        : mode === 'attack' ? 'authored short forward surge with a paired fin drive; not a native attack or tail sting'
          : 'authored relaxed fin posture, side roll and gentle sink; not a native death action', events: [] };
    if (id === 'attack') clips[id].events = [{ t: .48, name: 'impact' }, { t: .95, name: 'release' }];
    if (id === 'ko') clips[id].events = [{ t: .5, name: 'roll' }, { t: 1, name: 'down' }];
  }
  clips.swim = { ...structuredClone(clips.walkA), aliasOf: 'walkA' };
  clips.run = { ...structuredClone(clips.fastSwim), aliasOf: 'fastSwim' };
  return templateRig({ id: 'mantaRayBase', family: 'pectoralFinSwimmer', archetypes: ['manta ray', 'broad-disc ray'],
    height: 2.30, scale: 20, groundY: 55, joints, plates, clips,
    profile: { silhouette: 'flattened broad disc, swept triangular pectoral fins, paired cephalic lobes and a long thin whip tail',
      locomotion: 'three articulated sections per pectoral fin; bilateral cupping and synchronous up/down strokes; quiet body, no feet or propulsive caudal fin',

      } });
}
