// Authoring-only braced bite. Sagittal IK bakes planted paws and articulated
// jaw/head/body motion into an ordinary clip; consumers need no solver.
import { bindPositions, quadrupedLegs, solveLeg, sagittalBodyPose } from './quadruped-locomotion.js';
const round=n=>Math.abs(n)<1e-10?0:+n.toFixed(10);
function curve(points,t){for(let i=0;i<points.length-1;i++){const[a,x]=points[i],[b,y]=points[i+1];if(t>=a&&t<=b){const u=(t-a)/(b-a),s=u*u*(3-2*u);return x+(y-x)*s;}}return points.at(-1)[1];}
export function applyCanineAttack(rig,plan){
  for(const id of ['jaw','jawTip','spineMid','neck','head'])if(!rig.joints.some(j=>j.id===id))throw new Error(`Canine bite requires ${id}`);
  const jaw=rig.joints.find(j=>j.id==='jaw');
  if(jaw.limits&&(jaw.limits[0]>0||plan.jawOpenDegrees>jaw.limits[1]))throw new Error('Canine jaw opening exceeds authored limits');
  const bind=bindPositions(rig),legs=quadrupedLegs(rig),height=bind.pelvis[2];
  const phases=[{id:'anticipation',from:0,peak:.20,to:.28},{id:'action',from:.28,peak:.38,to:.48},{id:'contact',from:.48,peak:.56,to:.64},{id:'recovery',from:.64,peak:.80,to:.94},{id:'settle',from:.94,peak:1,to:1}];
  const events=[{t:.20,name:'wind-up',phase:'anticipation'},{t:.38,name:'jaws-open',phase:'action'},{t:.56,name:'impact',phase:'contact'},{t:.64,name:'bite-close',phase:'contact'},{t:.80,name:'release',phase:'recovery'},{t:1,name:'settled',phase:'settle'}];
  const times=[...new Set([...Array.from({length:241},(_,i)=>i/240),...phases.flatMap(p=>[p.from,p.peak,p.to]),...events.map(e=>e.t)])].sort((a,b)=>a-b);
  const frames=times.map(t=>{
    const x=height*curve([[0,0],[.20,-.025],[.56,plan.lunge],[.70,plan.lunge*.7],[1,0]],t);
    const z=height*curve([[0,0],[.20,-plan.bodyDip],[.56,-plan.bodyDip*.5],[.80,-plan.bodyDip*.2],[1,0]],t);
    const pitch=curve([[0,0],[.20,-1],[.56,2],[1,0]],t),flex=curve([[0,0],[.20,1],[.56,-1],[1,0]],t);
    const rotations={root:[0,round(pitch),0],pelvis:[0,round(flex),0],spineMid:[0,round(-2*flex),0],
      neck:[0,round(curve([[0,0],[.20,-6],[.38,8],[.56,18],[.70,12],[1,0]],t)),0],
      head:[0,round(curve([[0,0],[.20,-3],[.38,-5],[.56,-8],[.70,-5],[1,0]],t)),0],
      jaw:[0,round(curve([[0,0],[.20,5],[.38,plan.jawOpenDegrees],[.48,plan.jawOpenDegrees],[.64,0],[.80,3],[1,0]],t)),0],
      tailBase:[0,round(-8*Math.sin(Math.PI*t)),0],tailMid:[0,0,round(3*Math.sin(2*Math.PI*t))]};
    const body=sagittalBodyPose(rig,rotations,[x,0,z]);
    for(const leg of legs){const local=solveLeg(leg,body.positions[leg.hip.id],bind[leg.foot.id]);local[leg.hip.id][1]=round(local[leg.hip.id][1]-body.angles[leg.hip.id]);Object.assign(rotations,local);}
    return{t,poses:{root:[round(x),0,round(z)]},rotations};
  });
  rig.clips.attack={id:'attack',base:'bind',duration:plan.durationMs,loop:false,easing:'linear',frames,phases,events,contacts:legs.map(l=>l.foot.id),boneLengthPolicy:'preserve',motionSemantics:'braced canine bite; anticipatory crouch, forward head/neck reach, jaw opening and closure, planted four-paw IK and recovery'};
}
