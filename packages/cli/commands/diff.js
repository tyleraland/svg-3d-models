// `rig diff <baseline-model> <candidate-model> [--json]` — compare two
// declarative sources by their stable-ID resolved effects and link those effects
// back to the source fields and resolver operations that produced them.

import { basename } from 'node:path';
import {
  diffResolvedModels,
  loadFamily,
  loadModelSource,
  resolveModelWithProvenance,
} from '@paper-rig/rigs';
import {
  validateFamilySource,
  validateModelSource,
  validateSourcePair,
} from '@paper-rig/validator/source';
import { parseArgs } from '../lib/args.js';

const SOURCE_ID = /^[A-Za-z][A-Za-z0-9_-]*$/;

function firstIssue(report) {
  const issue = report.issues[0];
  return issue ? `${issue.id}: ${issue.detail}` : 'unknown source error';
}

function sourceIdFor(target, source) {
  const stem = basename(target, '.json');
  return SOURCE_ID.test(stem) ? stem : source.variant?.id || source.family;
}

function loadAnalysis(target) {
  const source = loadModelSource(target);
  const family = loadFamily(source.family);
  const modelReport = validateModelSource(source);
  if (modelReport.status !== 'passed') throw new Error(`${target} is not a valid model source: ${firstIssue(modelReport)}`);
  const familyReport = validateFamilySource(family);
  if (familyReport.status !== 'passed') throw new Error(`${source.family} is not a valid family source: ${firstIssue(familyReport)}`);
  const analysis = resolveModelWithProvenance(source, family, { sourceModelId: sourceIdFor(target, source) });
  const sourceReport = validateSourcePair(source, family, { resolvedRig: analysis.rig });
  if (sourceReport.status !== 'passed') throw new Error(`${target} has invalid resolved references: ${firstIssue(sourceReport)}`);
  return { source, ...analysis };
}

function value(value, present) {
  return present ? JSON.stringify(value) : '(absent)';
}

function originLabel(origin) {
  if (!origin) return '(absent)';
  const source = origin.sourcePointer ? ` ${origin.sourcePointer}` : origin.recipeId ? ` ${origin.recipeId}` : '';
  return `${origin.kind}${source} via ${origin.operation}`;
}

function targetLabel(change) {
  const prefix = change.target.kind === 'rig' ? 'rig' : `${change.target.kind}:${change.target.id}`;
  const field = change.target.fieldPointer
    .split('/')
    .filter(Boolean)
    .map((part) => /^\d+$/.test(part) ? `[${part}]` : `.${part}`)
    .join('');
  return `${prefix}${field}`;
}

function humanDiff(diff) {
  const { summary } = diff;
  const lines = [
    `${diff.baseline.sourceModelId} -> ${diff.candidate.sourceModelId}: ${diff.status}`,
    `${summary.sourceChangeCount} source leaf change(s) -> ${summary.resolvedChangeCount} resolved leaf change(s) across ${summary.affectedEntityCount} semantic entity/entities`,
  ];
  if (summary.unlinkedSourceChangeCount) {
    lines.push(`${summary.unlinkedSourceChangeCount} source change(s) have no resolved effect`);
  }
  if (summary.unlinkedResolvedChangeCount) {
    lines.push(`${summary.unlinkedResolvedChangeCount} derived resolved change(s) have no direct source pointer`);
  }
  for (const change of diff.sourceChanges) {
    lines.push(`\n${change.kind} source ${change.sourcePointer}: ${value(change.before, change.baselinePresent)} -> ${value(change.after, change.candidatePresent)}`);
    lines.push(`  affects ${change.affectedTargetPointers.length} resolved leaf/leaves`);
  }
  for (const change of diff.changes) {
    lines.push(`\n${change.kind} ${targetLabel(change)}: ${value(change.before, change.baselinePresent)} -> ${value(change.after, change.candidatePresent)}`);
    lines.push(`  baseline <- ${originLabel(change.baselineOrigin)}`);
    lines.push(`  candidate <- ${originLabel(change.candidateOrigin)}`);
    if (change.relatedSourcePointers.length) lines.push(`  source change(s): ${change.relatedSourcePointers.join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
}

export function runDiff(argv) {
  const { positionals, flags } = parseArgs(argv);
  if (positionals.length !== 2) {
    console.error('usage: rig diff <baseline-model> <candidate-model> [--json]');
    return 2;
  }
  const [baselineTarget, candidateTarget] = positionals;
  const diff = diffResolvedModels(loadAnalysis(baselineTarget), loadAnalysis(candidateTarget));
  if (flags.json) process.stdout.write(`${JSON.stringify(diff, null, 2)}\n`);
  else if (diff.compatible) process.stdout.write(humanDiff(diff));
  else {
    console.error(`cannot compare ${baselineTarget} and ${candidateTarget}:`);
    for (const incompatibility of diff.incompatibilities) console.error(`  ${incompatibility.code}: ${incompatibility.message}`);
  }
  return diff.compatible ? 0 : 2;
}
