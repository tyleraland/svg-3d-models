// `rig explain <model> <entity[.field]> [--json] [--history]` — explain the
// ordered source/recipe writes that produced resolved semantic fields.

import { explainProvenance, loadModelWithProvenance } from '@paper-rig/rigs';
import { parseArgs } from '../lib/args.js';

function displayField(field) {
  const parts = field.target.fieldPointer.split('/').filter(Boolean);
  if (!parts.length) return '(entity value)';
  return parts.map((part, index) => /^\d+$/.test(part) ? `[${part}]` : `${index ? '.' : ''}${part}`).join('');
}

function originLabel(origin) {
  const source = origin.sourcePointer ? ` ${origin.sourcePointer}` : origin.recipeId ? ` ${origin.recipeId}` : '';
  return `${origin.kind}${source} via ${origin.operation}`;
}

function humanExplanation(explanation, history) {
  const lines = [
    `${explanation.selector} in ${explanation.sourceModelId} -> ${explanation.resolvedModelId}`,
    `${explanation.summary.fieldCount} leaf field(s); ${explanation.summary.overwrittenFieldCount} overwritten during resolution`,
  ];
  for (const field of explanation.fields) {
    lines.push(`\n${displayField(field)} = ${JSON.stringify(field.value)}`);
    lines.push(`  <- ${originLabel(field.origin)}`);
    if (history && field.history.length > 1) {
      lines.push('  history:');
      for (const write of field.history) lines.push(`    ${write.sequence}: ${originLabel(write.origin)} => ${JSON.stringify(write.value)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function runExplain(argv) {
  const { positionals, flags } = parseArgs(argv);
  if (positionals.length !== 2) {
    console.error('usage: rig explain <model> <rig|joint:id|plate:id|anchor:id|clip:id>[.field] [--json] [--history]');
    return 2;
  }
  const [model, selector] = positionals;
  const { provenance } = loadModelWithProvenance(model);
  const explanation = explainProvenance(provenance, selector);
  if (flags.json) process.stdout.write(`${JSON.stringify(explanation, null, 2)}\n`);
  else if (explanation.status === 'found') process.stdout.write(humanExplanation(explanation, Boolean(flags.history)));
  else console.error(`no resolved fields match ${selector} in ${model}`);
  return explanation.status === 'found' ? 0 : 2;
}
