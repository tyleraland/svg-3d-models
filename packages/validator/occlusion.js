// Independent painter-order oracle. It inspects emitted vector primitives and
// posed joint depths; it does not call the renderer's near/far classifier.
const CORE = new Set(['core', 'head', 'neck']);
const APPENDAGE = new Set(['limb', 'hoof', 'wing', 'tail']);

function localPoint(vector, point) {
  const transform = vector.attributes.transform;
  if (!transform) return point;
  const rotation = /^rotate\(([^)]+)\)$/.exec(transform);
  if (!rotation) return null;
  const [degrees, cx = 0, cy = 0] = rotation[1].trim().split(/[ ,]+/).map(Number);
  const a = -degrees * Math.PI / 180, x = point[0] - cx, y = point[1] - cy;
  return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
}

// Closed world/screen-space line and quadratic paths include joint polygons
// (ears/wings) and tapered spans (tusks/horns). Unsupported grammar is reported.
function pathPolygon(vector) {
  if(vector.tag!=='path'||vector.attributes.transform)return null;
  const tokens=vector.attributes.d?.match(/[A-Za-z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)||[];
  const points=[];let i=0,current=[0,0],closed=false;
  while(i<tokens.length){
    const command=tokens[i++];
    if(command==='Z'){closed=true;continue;}
    if(command==='M'||command==='L'){
      const p=[Number(tokens[i++]),Number(tokens[i++])];if(!p.every(Number.isFinite))return null;
      points.push(p);current=p;
    }else if(command==='Q'){
      const c=[Number(tokens[i++]),Number(tokens[i++])],end=[Number(tokens[i++]),Number(tokens[i++])];
      if(![...c,...end].every(Number.isFinite))return null;
      const start=current;
      for(let n=1;n<=12;n++){const t=n/12;points.push([0,1].map(k=>(1-t)**2*start[k]+2*(1-t)*t*c[k]+t*t*end[k]));}
      current=end;
    }else return null;
  }
  return closed&&points.length>=3?points:null;
}
const polygonCache=new WeakMap();
function polygonFor(vector){if(!polygonCache.has(vector))polygonCache.set(vector,pathPolygon(vector));return polygonCache.get(vector);}
function contains(vector, point) {
  const p = localPoint(vector, point), a = vector.attributes;
  if (!p) return null;
  if (vector.tag === 'ellipse' || vector.tag === 'circle') {
    const rx = Number(a.rx ?? a.r), ry = Number(a.ry ?? a.r);
    return ((p[0] - Number(a.cx)) / rx) ** 2 + ((p[1] - Number(a.cy)) / ry) ** 2 < .96;
  }
  if (vector.tag === 'rect') {
    const x = Number(a.x), y = Number(a.y), w = Number(a.width), h = Number(a.height);
    const rx = Math.min(Number(a.rx || 0), w / 2, h / 2);
    if (p[0] <= x || p[0] >= x + w || p[1] <= y || p[1] >= y + h) return false;
    if (!rx) return true;
    const cx = Math.max(x + rx, Math.min(x + w - rx, p[0]));
    const cy = Math.max(y + rx, Math.min(y + h - rx, p[1]));
    return Math.hypot(p[0] - cx, p[1] - cy) < rx * .98;
  }
  const polygon=polygonFor(vector);
  if(polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside;}
  return null; // Unhandled transforms/curves remain explicitly unverified.
}

// Independent interval oracle: if the entire depth interval of one physical
// head plate is farther away than another, any projected overlap has a definite
// order. Crossing depth intervals are recorded for visual review, not guessed.
export function inspectHeadOcclusion(rig,scene){
  const joints=new Map(scene.joints.map(j=>[j.id,j]));
  const sourceJoints=new Map(rig.joints.map(j=>[j.id,j]));
  const plates=new Map(rig.plates.map(p=>[p.id,p]));
  const elements=scene.compositingGroups.flatMap(g=>g.elements);
  const order=new Map(elements.map((e,i)=>[e.id,i]));
  const headOwner=id=>{let j=sourceJoints.get(id);while(j){if(j.role==='head')return j.id;j=sourceJoints.get(j.parent);}return null;};
  const sourceFor=e=>{
    if(plates.has(e.sourceId))return plates.get(e.sourceId);
    if(e.sourceKind!=='gasket')return null;
    const bone=e.sourceId.replace(/Gasket$/,'');
    const incident=rig.plates.filter(p=>p.bone===bone||(p.span||[]).includes(bone)||(p.points||[]).includes(bone)).sort((a,b)=>(b.zBias||0)-(a.zBias||0));
    return{bone,occlusionMode:incident[0]?.occlusionMode};
  };
  const parts=elements.filter(e=>!e.generated&&['plate','gasket'].includes(e.sourceKind)&&!['eye','nose','shadow'].includes(e.semanticRole)&&headOwner(sourceFor(e)?.bone)&&sourceFor(e)?.occlusionMode!=='under-core'&&!/hat|helmet|equipment|marking|eye|nose/i.test(e.sourceId+' '+e.semanticRole));
  const unsupportedElementIds=[],records=[];
  for(const e of parts){
    const p=sourceFor(e),ids=p.points||p.span||[p.bone],points=ids.map(id=>joints.get(id)).filter(Boolean);
    if(contains(e.vector,[0,0])===null){unsupportedElementIds.push(e.id);continue;}
    const samples=points.map(j=>j.screenPosition);
    const centroid=[0,1].map(k=>samples.reduce((sum,p)=>sum+p[k],0)/samples.length);
    if(p.span){const a=points[0].screenPosition,b=points.at(-1).screenPosition;
      for(const t of [.125,.25,.375,.5,.625,.75,.875])samples.push(a.map((v,k)=>v+t*(b[k]-v)));
    }
    const polygon=polygonFor(e.vector);
    if(polygon)for(const point of polygon)samples.push(point.map((v,k)=>(v+centroid[k])/2));
    samples.push(centroid);
    records.push({e,min:Math.min(...points.map(j=>j.cameraDepth)),max:Math.max(...points.map(j=>j.cameraDepth)),samples});
  }
  const violations=[],ambiguousPairs=[];let checkedPairCount=0;
  for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
    const a=records[i],b=records[j];
    const point=[...a.samples,...b.samples].find(p=>contains(a.e.vector,p)===true&&contains(b.e.vector,p)===true);
    if(!point)continue;
    let far,near;
    if(a.min>b.max+.002){far=a;near=b;}else if(b.min>a.max+.002){far=b;near=a;}else{ambiguousPairs.push([a.e.id,b.e.id]);continue;}
    checkedPairCount++;
    if(order.get(far.e.id)>order.get(near.e.id))violations.push({kind:'head-depth-order',elementId:far.e.id,occluderId:near.e.id,screenPoint:point,farDepthInterval:[far.min,far.max],nearDepthInterval:[near.min,near.max]});
  }
  for(const joint of rig.joints.filter(j=>j.gasket?.underIncidentPlates&&headOwner(j.id))){
    const seam=parts.find(e=>e.sourceId===joint.id+'Gasket');if(!seam)continue;
    const incident=rig.plates.filter(p=>p.bone===joint.id||p.span?.includes(joint.id)||p.points?.includes(joint.id));
    for(const plate of incident){const cover=parts.find(e=>e.sourceId===plate.id);if(cover&&order.get(seam.id)>order.get(cover.id))violations.push({kind:'head-seam-incident-order',elementId:seam.id,occluderId:cover.id});}
  }
  return{violations,checkedPairCount,ambiguousPairs,unsupportedElementIds};
}

export function inspectOcclusion(rig, scene) {
  const joints = new Map(scene.joints.map(j => [j.id, j]));
  const sourceJoints = new Map(rig.joints.map(j => [j.id, j]));
  const plates = new Map(rig.plates.map(p => [p.id, p]));
  const gasketJoints = new Map(rig.joints.map(j => [j.id + 'Gasket', j.id]));
  const elements = scene.compositingGroups.flatMap(g => g.elements);
  const order = new Map(elements.map((e, i) => [e.id, i]));
  const core = elements.filter(e => !e.generated && e.sourceKind === 'plate' && CORE.has(e.bodyRegion) && plates.get(e.sourceId)?.occlusionMode !== 'under-core');
  const supported = core.filter(e => contains(e.vector, [0, 0]) !== null);
  const violations = [];
  // Buried connectors are internal seams, not exposed surfaces. Their layer
  // contract is checked even when their centers lie nearer than the body center.
  const firstCore=scene.compositingGroups.find(g=>g.semanticRole==='opaque core occluder')?.elements[0];
  const coreStart=firstCore?order.get(firstCore.id):-1;
  let checkedConnectorCount=0;
  for(const e of elements){
    if(e.generated)continue;
    const plate=plates.get(e.sourceId),joint=sourceJoints.get(gasketJoints.get(e.sourceId));
    const limbRoot=e.sourceKind==='gasket'&&joint?.role==='limb'&&sourceJoints.get(joint.parent)?.role==='body';
    const explicitOther=limbRoot&&rig.plates.some(p=>(p.bone===joint.id||(p.span||[]).includes(joint.id))&&p.occlusionMode&&p.occlusionMode!=='under-core');
    if(plate?.occlusionMode!=='under-core'&&!(limbRoot&&!explicitOther))continue;
    checkedConnectorCount++;
    if(coreStart>=0&&order.get(e.id)>=coreStart)violations.push({kind:'buried-connector-order',elementId:e.id,occluderId:elements[coreStart].id});
  }
  const appendages = elements.filter(e => !e.generated && APPENDAGE.has(e.bodyRegion));
  const unsupportedAppendageElementIds = appendages.filter(e => contains(e.vector, [0, 0]) === null).map(e => e.id);
  let checkedSampleCount = 0;
  const ownerOf = id => {
    let j = sourceJoints.get(id);
    while (j) {
      if (['body', 'head', 'neck'].includes(j.role)) return j.id;
      j = sourceJoints.get(j.parent);
    }
    return null;
  };
  const sample = (ids, t) => {
    const a = joints.get(ids[0]), b = joints.get(ids.at(-1));
    if (!a || !b) return null;
    return { point: a.screenPosition.map((v, i) => v + (b.screenPosition[i] - v) * t),
      depth: a.cameraDepth + (b.cameraDepth - a.cameraDepth) * t };
  };
  for (const element of appendages) {
    const plate = plates.get(element.sourceId);
    const ids = plate ? plate.span || [plate.bone] : [gasketJoints.get(element.sourceId)];
    const ownerId = ownerOf(ids.at(-1)), owner = joints.get(ownerId);
    if (!owner) continue;
    const covers = supported.filter(e => {
      const p = plates.get(e.sourceId);
      return p.bone === ownerId || p.span?.includes(ownerId);
    });
    for (const t of [.25, .5, .75]) {
      const s = sample(ids, t);
      if (!s || contains(element.vector, s.point) !== true) continue;
      checkedSampleCount++;
      if (s.depth <= owner.cameraDepth + .002) continue;
      for (const cover of covers) {
        if (order.get(element.id) <= order.get(cover.id) || !contains(cover.vector, s.point)) continue;
        const p = plates.get(cover.sourceId);
        let depth = joints.get(p.bone)?.cameraDepth;
        if (p.span) {
          const a = joints.get(p.span[0]), b = joints.get(p.span[1]);
          const delta = b.screenPosition.map((v, i) => v - a.screenPosition[i]);
          const length2 = delta[0] ** 2 + delta[1] ** 2;
          const u = length2 ? Math.max(0, Math.min(1, delta.reduce((v, d, i) => v + d * (s.point[i] - a.screenPosition[i]), 0) / length2)) : 0;
          depth = a.cameraDepth + u * (b.cameraDepth - a.cameraDepth);
        }
        if (s.depth <= depth + .002) continue;
        violations.push({ elementId: element.id, occluderId: cover.id, ownerJointId: ownerId,
          screenPoint: s.point, appendageDepth: s.depth, occluderDepth: depth });
        break;
      }
      if (violations.at(-1)?.elementId === element.id) break;
    }
  }
  const headAssembly=inspectHeadOcclusion(rig,scene);
  return { violations:[...violations,...headAssembly.violations], headAssembly, checkedConnectorCount, checkedSampleCount, unsupportedAppendageElementIds, supportedCoreElementCount: supported.length,
    unsupportedCoreElementIds: core.filter(e => !supported.includes(e)).map(e => e.id) };
}
