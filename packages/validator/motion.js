// JSON Schema and semantic validation for reusable motion recipes and resolved
// motion manifests. Composition itself remains pure in @paper-rig/motion.

import Ajv2020 from 'ajv/dist/2020.js';
import recipeSchema from '@paper-rig/schema/schemas/motion-recipe-1.schema.json' with { type: 'json' };
import resolutionSchema from '@paper-rig/schema/schemas/motion-resolution-1.schema.json' with { type: 'json' };
import { validateMotionConfiguration, validateMotionRecipe } from '@paper-rig/motion';

const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: false });
const validateRecipeSchema = ajv.compile(recipeSchema);
const validateResolutionSchema = ajv.compile(resolutionSchema);
const pass = (id, detail) => ({ id, pass: true, detail });
const fail = (id, detail, path = '') => ({ id, pass: false, detail, path });

function schemaChecks(kind, validateSchema, value) {
  if (validateSchema(value)) return [pass(`${kind}-json-schema`, `${kind} matches its JSON Schema`)];
  return (validateSchema.errors || []).map((error) => fail(
    `${kind}-json-schema`,
    `${error.instancePath || '/'} ${error.message}`,
    error.instancePath || '/',
  ));
}

function report(checks) {
  const issues = checks.filter((item) => !item.pass);
  return { status: issues.length ? 'failed' : 'passed', checks, issues };
}

export function validateMotionRecipeSource(recipe) {
  const schema = schemaChecks('motion-recipe', validateRecipeSchema, recipe);
  return report(schema.some((item) => !item.pass)
    ? schema
    : [...schema, ...validateMotionRecipe(recipe).checks]);
}

export function validateModelMotionConfiguration(model, rig, recipes) {
  const recipeReports = Object.values(recipes || {}).map(validateMotionRecipeSource);
  const checks = recipeReports.flatMap((recipeReport) => recipeReport.checks);
  if (recipeReports.some((recipeReport) => recipeReport.status !== 'passed')) return report(checks);
  return report([
    ...checks,
    ...validateMotionConfiguration({ rig, plan: model.motion || { clips: {} }, recipes }).checks,
  ]);
}

export function validateMotionManifest(manifest) {
  return report(schemaChecks('motion-resolution', validateResolutionSchema, manifest));
}
