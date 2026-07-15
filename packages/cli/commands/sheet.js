// `rig sheet <model> [--attachments] [--clip idle --time 0] [-o out.html]` — render an 8-heading x
// 4-elevation contact sheet of projected markup. Exits non-zero if any cell has a
// non-finite coordinate (NaN/Infinity), which signals a broken projection.

import { writeFileSync } from 'node:fs';
import { loadModel, loadModelAssembly } from '@paper-rig/rigs';
import { markup } from '@paper-rig/compiler';
import { parseArgs } from '../lib/args.js';

const HEADINGS = [0, 45, 90, 135, 180, 225, 270, 315];
const ELEVATIONS = [30, 45, 60, 75];

export function runSheet(argv) {
  const { positionals, flags } = parseArgs(argv, { o: 'out' });
  const target = positionals[0];
  if (!target) { console.error('usage: rig sheet <model> [--attachments] [--clip --time] [-o out.html]'); return 2; }

  const rig = flags.attachments ? loadModelAssembly(target).rig : loadModel(target);
  const clip = flags.clip ?? 'idle';
  const time = flags.time !== undefined ? Number(flags.time) : 0;

  let bad = 0;
  const rows = ELEVATIONS.map((elev) => {
    const cells = HEADINGS.map((az) => {
      const m = markup(rig, { clip, time, elevation: elev, heading: az });
      if (/NaN|Infinity/.test(m)) { bad++; console.error(`non-finite projection at elev=${elev} heading=${az}`); }
      return `<figure><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${m}</svg><figcaption>${az}°</figcaption></figure>`;
    }).join('');
    return `<section><h2>elevation ${elev}°</h2><div class="row">${cells}</div></section>`;
  }).join('');

  const html = `<!doctype html><meta charset="utf8"><title>${rig.id} contact sheet</title>
<style>body{background:#2b2822;color:#e9dcc0;font:14px system-ui;margin:16px}h1{font-weight:600}
.row{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;text-align:center}
svg{width:100%;background:#3a352c;border-radius:6px}figcaption{font-size:11px;opacity:.7}
.paperPlate{fill:#d7c39c;stroke:#39362e;stroke-width:1.2;vector-effect:non-scaling-stroke}.plateShade{fill:#b99d73}
.paperPlate[data-palette-role="shadow"]{fill:#9d927d}.coreOccluderCell,.jointGasket{fill:#d7c39c;stroke:#d7c39c;stroke-width:1.5;vector-effect:non-scaling-stroke}
.faceEye{fill:#fffdf7;stroke:#39362e;stroke-width:.8}.faceNose,.wingMembrane{fill:#b99d73;stroke:#39362e;stroke-width:.8;stroke-linejoin:round}</style>
<h1>${rig.id} — contact sheet${flags.attachments ? ' with attachments' : ''} (clip ${clip}, t ${time})</h1>${rows}`;

  const out = flags.out || `${rig.id}-contact-sheet.html`;
  writeFileSync(out, html);
  console.log(`contact sheet for ${rig.id}${flags.attachments ? ' with attachments' : ''}: ${HEADINGS.length * ELEVATIONS.length} tiles -> ${out}`);
  if (bad) { console.error(`${bad} tile(s) had non-finite coordinates`); return 1; }
  return 0;
}
