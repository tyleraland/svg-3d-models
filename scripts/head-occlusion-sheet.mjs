#!/usr/bin/env node
// Visual companion to the independent depth oracle. Crossing depth intervals
// need human review; stable SVG snapshots alone cannot establish correctness.
// node scripts/head-occlusion-sheet.mjs elephant /tmp/elephant-heads.html
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadModel } from '@paper-rig/rigs';
import { projectScene, markup } from '@paper-rig/compiler';
import { inspectHeadOcclusion } from '@paper-rig/validator/occlusion';
const model = process.argv[2] || 'elephant';
const output = resolve(process.argv[3] || `/tmp/${model}-head-occlusion.html`);
const rig = loadModel(model), source = new Map(rig.joints.map(j => [j.id,j]));
const isHead = id => { let j=source.get(id); while(j){if(j.role==='head')return true;j=source.get(j.parent);}return false; };
const poses = ['idle','walk','trot', 'sprint', 'fly', 'glide','run','attack','pounce'].filter(clip => rig.clips[clip])
  .map(clip => ({clip,time:clip==='attack'?(rig.clips[clip].events?.find(e=>e.name==='impact')?.t??.62):clip==='pounce'?.52:.375}));
const headings = Array.from({length:16},(_,i)=>i*22.5);
const elevations = [0,30,45,60,75,90];
const cells=[];
for(const pose of poses) for(const elevation of elevations){
  cells.push(`<h2>${pose.clip} · t=${pose.time} · elevation ${elevation}°</h2><section>`);
  for(const heading of headings){
    const options={...pose,elevation,heading},scene=projectScene(rig,options);
    const evidence=inspectHeadOcclusion(rig,scene);
    const points=scene.joints.filter(j=>isHead(j.id)).map(j=>j.screenPosition);
    if(!points.length)throw new Error(`${model} has no head joints`);
    const margin=Math.max(...rig.plates.filter(p=>isHead(p.bone)).map(p=>Math.max(...p.size)))*rig.tokenScale/2+2;
    const min=[0,1].map(k=>Math.min(...points.map(p=>p[k]))-margin);
    const size=[0,1].map(k=>Math.max(...points.map(p=>p[k]))+margin-min[k]);
    const body=markup(rig,options);
    cells.push(`<figure><svg viewBox="${[...min,...size].join(' ')}" role="img" aria-label="${model} ${pose.clip} elevation ${elevation} heading ${heading}">${body}</svg><figcaption>${heading}° · ${evidence.checkedPairCount} definite overlaps · ${evidence.ambiguousPairs.length} crossing intervals · ${evidence.violations.length} errors · ${evidence.unsupportedElementIds.length} unverified</figcaption></figure>`);
  }
  cells.push('</section>');
}
writeFileSync(output,`<!doctype html><meta charset="utf-8"><title>${model} head occlusion review</title><style>body{background:#faf6e9;color:#39362e;font:14px system-ui;margin:20px}section{display:grid;grid-template-columns:repeat(8,minmax(140px,1fr));gap:8px}figure{margin:0;background:#fffdf7;border:1px solid #d6ceb9}svg{width:100%;height:190px}figcaption{font-size:11px;padding:6px}.paperPlate{fill:#d7c39c;stroke:#39362e;stroke-width:1.2;vector-effect:non-scaling-stroke}.plateShade{fill:#b99d73}.paperPlate[data-palette-role=shadow]{fill:#9d927d}.coreOccluderCell,.jointGasket{fill:#d7c39c;stroke:#d7c39c;stroke-width:1.5;vector-effect:non-scaling-stroke}.faceEye{fill:#fffdf7}.faceNose,.wingMembrane{fill:#b99d73}</style><h1>${model}: head assembly review</h1><p>Six elevations, sixteen headings, all available locomotion/attack clips. Definite overlaps are checked independently. Crossing depth intervals and unsupported paths require visual review.</p>${cells.join('')}`);
console.log(output);
