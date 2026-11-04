// Authoring-time fish geometry and motion. Outputs ordinary paper-rig/1 data;
// neither the renderer nor consumers evaluate these curves.
import { templateRig } from '../../rigs/family-kit.js';

const round = n => { const value = Math.round(n * 1e8) / 1e8; return value === 0 ? 0 : value; };
const V = v => v.map(round);
const wave = (t, lag = 0) => Math.sin(2 * Math.PI * t - lag);
const pulse = (t, a, b, c) => t <= a || t >= c ? 0 : t < b
  ? (1 - Math.cos(Math.PI * (t - a) / (b - a))) / 2
  : (1 + Math.cos(Math.PI * (t - b) / (c - b))) / 2;

export function makeFishFamily(kind = 'fish') {
  if (!['fish', 'shark'].includes(kind)) throw new Error(`Unknown fish preset: ${kind}`);
  const shark = kind === 'shark';
  const joints = [], plates = [];
  const J = (id, parent, bind, role = 'body', extra = {}) => {
    joints.push({ id, parent, bind: V(bind), role, ...extra });
    return id;
  };
  const P = (id, bone, points, region = 'core', extra = {}) => {
    plates.push({ id, bone, shape: 'polygon', size: [.025], role: region === 'head' ? 'head' : region === 'core' ? 'core' : 'fin',
      bodyRegion: region, attachment: 'rigid', material: 'paperMain', points,
      semanticDetailTier: 'silhouette', zBias: 0, ...extra });
  };
  // Every polygon is rigid in a single owning joint's frame. Face-center owners
  // give the depth sorter real surface depths instead of a shared torso center.
  function face(id, owner, vertices, region = 'core', extra = {}) {
    if (owner === 'upperJaw' || owner === 'lowerJaw') vertices = vertices.map(v => [v[0] + .02, v[1], v[2] + .05]);
    const center = vertices[0].map((_, k) => vertices.reduce((s, v) => s + v[k], 0) / vertices.length);
    const bone = J(id + 'Center', owner, center, region === 'head' ? 'head' : 'body', { helper: true });
    const points = vertices.map((v, i) => J(id + 'Point' + i, owner, v, 'geometry', { helper: true }));
    P(id + 'Plate', bone, points, region, extra);
  }
  function section(id, owner, front, back, region = 'core') {
    // Eight-sided cross sections preserve width in side, frontal and top views.
    const ring = ([x, width, height, z = 0]) => Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4;
      return [x, width * Math.cos(a), z + height * Math.sin(a)];
    });
    const a = ring(front), b = ring(back);
    for (let i = 0; i < 8; i++) face(id + 'Facet' + i, owner,
      [a[i], a[(i + 1) % 8], b[(i + 1) % 8], b[i]], region,
      i >= 4 ? { role: 'accent', material: 'paperShade' } : {});
    face(id + 'FrontCap', owner, a, region);
    face(id + 'RearCap', owner, [...b].reverse(), region);
  }
  function sharkHead(width, height) {
    J('upperJaw', 'head', [-.02, 0, -.05], 'head', { bendAxis: [0, 1, 0], limits: [-10, 0] });
    J('lowerJaw', 'head', [-.02, 0, -.05], 'head', { bendAxis: [0, 1, 0], limits: [0, 45] });
    const ring = ([x,w,h,z]) => Array.from({length:8},(_,i)=>[x,w*Math.cos(i*Math.PI/4),z+h*Math.sin(i*Math.PI/4)]);
    const a=ring([.56,.035,.065,-.04]), b=ring([-.04,width*.87,height*.85,0]);
    // Remove a real mouth gap from the old closed head volume. Each half is
    // independently capped and rigid; no painted mouth hides an intact head.
    const clip=(vs,z,above)=>{const out=[];for(let i=0;i<vs.length;i++){const p=vs[i],q=vs[(i+1)%vs.length],inside=v=>above?v[2]>=z:v[2]<=z;if(inside(p))out.push(p);if(inside(p)!==inside(q)){const u=(z-p[2])/(q[2]-p[2]);out.push(p.map((v,k)=>v+u*(q[k]-v)));}}return out;};
    const split=(id,vs,extra={})=>{const up=clip(vs,-.035,true),lo=clip(vs,-.095,false);if(up.length>=3)face(id,'upperJaw',up,'head',extra);if(lo.length>=3)face(up.length>=3?id+'Lower':id,'lowerJaw',lo,'head',extra);};
    for(let i=0;i<8;i++)split('headFacet'+i,[a[i],a[(i+1)%8],b[(i+1)%8],b[i]],i>=4?{role:'accent',material:'paperShade'}:{});
    split('headFrontCap',a);split('headRearCap',[...b].reverse());
    const edge=(r,z)=>clip(r,z,true).filter(v=>Math.abs(v[2]-z)<1e-8).sort((p,q)=>p[1]-q[1]);
    for(const[owner,z]of [['upperJaw',-.035],['lowerJaw',-.095]]){const f=edge(a,z),r=edge(b,z);face(owner+'Palate',owner,[f[0],f.at(-1),r.at(-1),r[0]],'head',{role:'accent',material:'paperShade'});}
    // Bilateral solid triangular teeth, meeting at the closed bite plane.
    for(const[owner,z,direction]of [['upperJaw',-.035,-1],['lowerJaw',-.095,1]])for(const side of [-1,1])for(let i=0;i<5;i++){
      const x=.08+i*.09,frontWidth=edge(a,z).at(-1)[1],backWidth=edge(b,z).at(-1)[1],y=side*(frontWidth+(backWidth-frontWidth)*(.56-x)/.60-.016),half=.027,tip=[x,y,z+direction*.03],v=[[x-half,y-.007,z],[x+half,y-.007,z],[x+half,y+.007,z],[x-half,y+.007,z]];
      const id=owner+(side===1?'Near':'Far')+'Tooth'+i;face(id+'Base',owner,v,'head',{semanticDetailTier:'identity'});for(let k=0;k<4;k++)face(id+'Face'+k,owner,[v[k],v[(k+1)%4],tip],'head',{semanticDetailTier:'identity'});
    }
    J('upperJawTip','upperJaw',[.58,0,.015],'head',{helper:true});J('lowerJawTip','lowerJaw',[.58,0,-.045],'head',{helper:true});
  }
  function verticalFin(id, owner, origin, outline, extra = {}) {
    J(id, owner, origin, 'fin', { bendAxis: [0, 0, 1], limits: [-55, 55] });
    const left = outline.map(([x, z]) => [x, .009, z]);
    const right = outline.map(([x, z]) => [x, -.009, z]);
    face(id + 'Near', id, left, 'tail', extra);
    face(id + 'Far', id, [...right].reverse(), 'tail', extra);
    for (let i = 0; i < outline.length; i++) face(id + 'Edge' + i, id,
      [left[i], right[i], right[(i + 1) % outline.length], left[(i + 1) % outline.length]], 'tail', extra);
  }
  J('root', null, [0, 0, 0], 'root');
  J('body', 'root', [0, 0, .77], 'body');
  J('head', 'body', [.48, 0, 0], 'head');
  J('rearBody', 'body', [-.16, 0, 0], 'body', { bendAxis: [0, 0, 1], limits: [-20, 20] });
  J('tailBase', 'rearBody', [-.43, 0, 0], 'tail', { bendAxis: [0, 0, 1], limits: [-30, 30] });
  J('tailPeduncle', 'tailBase', [-.36, 0, 0], 'tail', { bendAxis: [0, 0, 1], limits: [-35, 35] });
  const width = shark ? .235 : .225, height = shark ? .25 : .34;
  section('foreBody', 'body', [.50, width * .78, height * .78], [-.22, width, height]);
  if (shark) sharkHead(width, height);
  else section('head', 'head', [.30, .035, .065, -.01], [-.04, width * .87, height * .85], 'head');
  // The overlap is geometric and local: the rotating rear pieces enter the
  // preceding volume, avoiding visible open seams at maximal tail curvature.
  section('rearBody', 'rearBody', [.12, width * .99, height * .98], [-.48, .13, height * .58]);
  section('tailStem', 'tailBase', [.085, .15, height * .64], [-.41, .065, .085]);
  section('peduncle', 'tailPeduncle', [.08, .075, .10], [-.23, .025, .045]);
  verticalFin('tailFin', 'tailPeduncle', [-.18, 0, 0], shark
    ? [[.05, .045], [-.36, .60], [-.49, .67], [-.33, .13], [-.31, -.27], [-.14, -.20], [.05, -.04]]
    : [[.04, .04], [-.38, .36], [-.31, .04], [-.38, -.34], [.04, -.04]]);
  verticalFin('dorsalFin', 'body', [-.10, 0, height * .82], shark
    ? [[.24, -.02], [-.03, .52], [-.13, .57], [-.28, -.02]]
    : [[.27, -.02], [.12, .25], [-.23, .20], [-.31, -.02]]);
  if (shark) verticalFin('rearDorsalFin', 'tailBase', [-.05, 0, .10], [[.10, 0], [-.02, .15], [-.14, -.02]]);
  else verticalFin('analFin', 'rearBody', [-.10, 0, -height * .70], [[.12, 0], [-.18, -.15], [-.24, .03]]);
  for (const side of ['near', 'far']) {
    const s = side === 'near' ? 1 : -1, other = side === 'near' ? 'far' : 'near';
    J(side + 'PectoralFin', 'body', [.29, s * width * .86, -.10], 'fin', { mirror: other + 'PectoralFin', bendAxis: [1, 0, 0], limits: [-20, 20] });
    const fin = shark ? [[.12, 0, .035], [-.08, s * .52, -.12], [-.41, s * .61, -.15], [-.18, 0, -.025]]
      : [[.055, 0, .035], [-.04, s * .22, -.05], [-.20, s * .23, -.07], [-.15, 0, -.025]];
    face(side + 'PectoralTop', side + 'PectoralFin', fin, 'limb');
    face(side + 'PectoralBottom', side + 'PectoralFin', fin.map(v => [v[0], v[1], v[2] - .014]).reverse(), 'limb');
    for (let i = 0; i < fin.length; i++) face(side + 'PectoralEdge' + i, side + 'PectoralFin',
      [fin[i], [fin[i][0], fin[i][1], fin[i][2] - .014],
        [fin[(i + 1) % fin.length][0], fin[(i + 1) % fin.length][1], fin[(i + 1) % fin.length][2] - .014], fin[(i + 1) % fin.length]], 'limb');
    if (shark) {
      J(side + 'PelvicFin', 'rearBody', [-.22, s * .12, -.13], 'fin', { mirror: other + 'PelvicFin' });
      face(side + 'Pelvic', side + 'PelvicFin', [[.08, 0, 0], [-.15, s * .22, -.05], [-.20, 0, -.015]], 'limb');
    }
    const eyeX = shark ? .20 : .13, eyeY = s * width * (shark ? .57 : .66), eyeZ = .075;
    // Surface details are sorted with the head facets, so the far eye cannot
    // show through the opaque body when viewed from the opposite side.
    face(side + 'Eye', shark ? 'upperJaw' : 'head', Array.from({ length: 10 }, (_, i) => {
      const a = 2 * Math.PI * i / 10;
      return [eyeX + .030 * Math.cos(a), eyeY, eyeZ + .030 * Math.sin(a)];
    }), 'head', { role: 'accent', material: 'paperShade', semanticDetailTier: 'identity', zBias: .1 });
    if (shark) for (let i = 0; i < 3; i++) {
      const x = .42 - i * .045;
      face(side + 'Gill' + i, 'body', [[x, s * .203, .10], [x - .012, s * .207, .09],
        [x - .028, s * .217, -.10], [x - .014, s * .216, -.11]], 'core',
      { role: 'accent', material: 'paperShade', semanticDetailTier: 'identity', zBias: .1 });
    }
  }
  J('noseTip', shark ? 'upperJaw' : 'head', shark ? [.58, 0, .03] : [.30, 0, -.02], 'snout', { helper: true });
  J('tailTip', 'tailFin', [shark ? -.49 : -.38, 0, shark ? .67 : .36], 'tail', { helper: true });
  plates.unshift({ id: 'castShadow', bone: 'root', shape: 'ellipse', size: [1.8, .60], role: 'shadow',
    bodyRegion: 'groundShadow', attachment: 'rigid', material: 'shadow', zBias: -100,
    surfaceNormal: [0, 0, 1], semanticDetailTier: 'texture' });

  const sample = (mode, t) => {
    const swim = mode === 'swim' || mode === 'fastSwim', fast = mode === 'fastSwim';
    const amp = swim ? (fast ? 1.25 : 1) : mode === 'idle' ? .35 : .6;
    const impulse = mode === 'attack' ? pulse(t, .20, .45, .90) : 0;
    const recoil = mode === 'hit' ? pulse(t, 0, .28, 1) : 0;
    const sink = mode === 'ko' ? (1 - Math.cos(Math.PI * t)) / 2 : 0;
    const fade = 1 - sink;
    const phase = mode === 'attack' || mode === 'hit' || mode === 'ko' ? 0 : t;
    const rotations = {
      body: [sink * 85, -impulse * 7, (shark ? 0 : -2 * wave(phase)) * amp * fade + recoil * 7],
      head: [0, impulse * 5, (shark ? 0 : 1.2 * wave(phase)) * amp * fade],
      rearBody: [0, 0, (shark ? 9.5 : 2.0) * wave(phase, .10) * amp * fade - impulse * 5],
      tailBase: [0, 0, (shark ? 13 : 9) * wave(phase, .30) * amp * fade + impulse * 12],
      tailPeduncle: [0, 0, (shark ? 5 : 9) * wave(phase, .50) * amp * fade + impulse * 8],
      tailFin: [0, 0, (shark ? 3 : 17) * wave(phase, .70) * amp * fade + impulse * 7],
      dorsalFin: [0, 0, .5 * wave(phase, .40) * amp * fade],
      nearPectoralFin: [(shark ? 3 : 8) * wave(phase, .5) * amp * fade, 0, 0],
      farPectoralFin: [-(shark ? 3 : 8) * wave(phase, .5) * amp * fade, 0, 0],
    };
    if (shark) { const gape = mode !== 'attack' || t <= .12 || t >= .46 ? 0 : t < .32 ? (1-Math.cos(Math.PI*(t-.12)/.20))/2 : t <= .40 ? 1 : (1+Math.cos(Math.PI*(t-.40)/.06))/2; rotations.upperJaw=[0,-8*gape,0]; rotations.lowerJaw=[0,38*gape,0]; rotations.rearDorsalFin = [0, 0, 0]; rotations.nearPelvicFin = [0, 0, 0]; rotations.farPelvicFin = [0, 0, 0]; }
    else rotations.analFin = [0, 0, 0];
    return { t, poses: { root: V([impulse * .22 - recoil * .07, 0, -sink * .28]) },
      rotations: Object.fromEntries(Object.entries(rotations).map(([id, v]) => [id, V(v)])) };
  };
  const clips = {};
  for (const [name, mode, duration, loop] of [['idleA', 'idle', 2200, true], ['walkA', 'swim', shark ? 1250 : 1292, true],
    ['fastSwim', 'fastSwim', 780, true], ['attack', 'attack', 850, false], ['ko', 'ko', 1100, false]]) {
    const times = [...new Set([...Array.from({ length: 97 }, (_, i) => i / 96), ...(shark && mode === 'attack' ? [.12,.32,.40,.46] : [])])].sort((a,b)=>a-b);
    const frames = times.map(t => sample(mode,t));
    // Exact authored seams, rather than relying on approximate source endpoints.
    if (loop) frames[96] = { ...structuredClone(frames[0]), t: 1 };
    clips[name] = { base: 'bind', duration, easing: 'linear', loop, frames, contacts: [], contactIntervals: [],
      boneLengthPolicy: 'preserve', motionSemantics: mode === 'swim' || mode === 'fastSwim'
        ? 'Authored swim lateral yaw wave: stabilized forebody, increasing rear-body sweep, delayed vertical tail-fin yaw; paired pectoral trim; suspended in water, no ground contacts'
        : mode === 'idle' ? 'gentle station-keeping tail sweep; suspended in water'
          : mode === 'attack' ? shark ? 'authored forward lunge with hinged upper/lower jaws: open, hold, rapid bite closure and recovery; no source attack clip' : 'authored short forward body lunge and tail drive; no source attack clip'
            : mode === 'hit' ? 'authored body yaw recoil and recovery; no source hit clip'
              : 'authored side roll and slow sink; no source death clip', events: [] };
    if (name === 'attack') clips[name].events = shark ? [{t:.12,name:'jaw-open-start'},{t:.32,name:'jaw-open'},{t:.40,name:'bite-start'},{t:.46,name:'bite-snap'},{t:.9,name:'release'}] : [{ t: .45, name: 'impact' }, { t: .9, name: 'release' }];
    if (name === 'ko') clips[name].events = [{ t: .5, name: 'roll' }, { t: 1, name: 'down' }];
  }
  // User-facing swim names coexist with the required legacy locomotion slots.
  clips.swim = { ...structuredClone(clips.walkA), aliasOf: 'walkA' };
  clips.run = { ...structuredClone(clips.fastSwim), aliasOf: 'fastSwim' };
  return templateRig({ id: kind + 'Base', family: 'finnedSwimmer', archetypes: shark ? ['shark', 'fusiform predatory fish'] : ['fish', 'bony fish'],
    height: 1.65, scale: shark ? 25 : 26, groundY: 58, joints, plates, clips,
    profile: { silhouette: shark ? 'pointed fusiform snout, hinged upper and lower jaws with tooth rows, broad pectoral fins, tall triangular dorsal and asymmetric vertical caudal fin'
      : 'deep fusiform body, small paired pectoral fins, dorsal and anal fins, forked vertical caudal fin',
    locomotion: 'in-place aquatic swimming; +X is forward, lateral tail sweep is about +Z; no foot contacts',

    } });
}
