import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadFamily,loadModelSource,loadModel} from '@paper-rig/rigs';
import {solve,core,projectScene,compilePackage} from '@paper-rig/compiler';
import {validateSourcePair} from '@paper-rig/validator/source';
import {inspectOcclusion} from '@paper-rig/validator/occlusion';
const ids=(process.env.WILDMESH_MODELS||'mink,crocodile,beaver,bighornRam,lion,mammoth,cat,hyena,duck').split(',').filter(id=>fs.existsSync(`rigs/models/${id}.json`));
const elements=s=>s.compositingGroups.flatMap(g=>g.elements),distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
for(const id of ids){const r=loadModel(id),feet=r.clips.idle.contacts||r.clips.idle.contactIntervals?.[0]?.ids||[];
 test(`${id}: four core actions compile, idle contacts hold, spans and looping seams stay rigid`,()=>{
  const source=loadModelSource(id);assert.equal(validateSourcePair(source,loadFamily(source.family)).status,'passed');assert.equal(compilePackage(r).validation.status,'passed');assert.ok(feet.length>=2);const rest=solve(r,{clip:'idle',time:0});
  for(let i=0;i<=100;i++){const p=solve(r,{clip:'idle',time:i/100});for(const foot of feet){assert.ok(distance(p[foot],rest[foot])<.00005,foot+' fixed idle');assert.ok(Math.abs(p[foot][2])<.00005,foot+' grounded idle');}}
  for(const clip of ['idle','walk','run','attack']){const c=r.clips[clip];assert.ok(c,clip);assert.ok(core.preservedClipLengthsPass(r,clip),clip+' lengths');if(c.loop)assert.deepEqual(solve(r,{clip,time:0}),solve(r,{clip,time:1}));
   for(let i=0;i<=160;i++){const time=i/160,p=solve(r,{clip,time});for(const foot of feet)assert.ok(p[foot][2]>-.0001,`${clip}/${time}/${foot} floor`);for(const foot of core.contactIds(r,clip,time))assert.ok(Math.abs(p[foot][2])<.00005,`${clip}/${time}/${foot} contact`);}
  }
  assert.ok(r.clips.run.duration<r.clips.walk.duration);assert.ok(r.clips.attack.events.some(e=>/impact|snap|strike|contact/i.test(e.name)));
 });
 test(`${id}: all actions, top/profile/oblique directions retain occlusion policy and a stationary XY shadow`,()=>{
  for(const clip of ['idle','walk','run','attack'])for(const time of [0,.22,.36,.48,.65,.82,1])for(const elevation of [0,45,60,75,90])for(let heading=0;heading<360;heading+=45){const s=projectScene(r,{clip,time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${clip}/${time}/${elevation}/${heading}`);const shadow=elements(s).find(e=>!e.generated&&e.sourceId==='castShadow'),ref=elements(projectScene(r,{clip:'idle',time:0,elevation,heading})).find(e=>!e.generated&&e.sourceId==='castShadow');assert.deepEqual(shadow?.vector,ref?.vector);}
 });
}
test('Mink has a long slim mustelid barrel and tapered tail distinct from the broad badger',()=>{if(!ids.includes('mink'))return;const r=loadModel('mink'),b=solve(r,{clip:'bind'});assert.ok(b.chest[0]-b.pelvis[0]>.39);assert.ok(r.plates.find(p=>p.id==='torsoPlate').size[0]<.15);assert.ok(b.tailBase[0]-b.tail3[0]>.35);assert.ok(r.plates.find(p=>p.id==='tailSegment3Plate').size[0]<.02);});
test('Crocodile has broad flat jaws, a long tail, earless skull and supported high walk',()=>{if(!ids.includes('crocodile'))return;const r=loadModel('crocodile'),b=solve(r,{clip:'bind'});assert.deepEqual(r.archetypes,['crocodile','crocodilian']);assert.ok(b.muzzle[0]-b.tail3[0]>3.3);assert.ok(b.muzzle[0]-b.head[0]>.5);assert.ok(!r.joints.some(j=>/Ear/.test(j.id)));assert.ok(r.plates.find(p=>p.id==='snoutTopPlate').points.length>=6);for(let i=0;i<=160;i++)assert.ok(core.contactIds(r,'run',i/160).length>=2);assert.ok(r.clips.attack.frames.some(f=>f.rotations.jaw[1]>=42));});
