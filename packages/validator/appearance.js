// JSON Schema and semantic validation for reusable plate-local paint sources
// and resolved appearance manifests.

import Ajv2020 from 'ajv/dist/2020.js';
import primitiveSchema from '@paper-rig/schema/schemas/paint-primitive-1.schema.json' with { type: 'json' };
import resolutionSchema from '@paper-rig/schema/schemas/appearance-resolution-1.schema.json' with { type: 'json' };
import { validateAppearanceConfiguration, validatePaintPrimitive } from '@paper-rig/appearance';

const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: false });
const validatePrimitiveSchema = ajv.compile(primitiveSchema);
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

export function validatePaintPrimitiveSource(primitive) {
  const schema = schemaChecks('paint-primitive', validatePrimitiveSchema, primitive);
  return report(schema.some((item) => !item.pass)
    ? schema
    : [...schema, ...validatePaintPrimitive(primitive).checks]);
}

export function validateModelAppearanceConfiguration(model, rig, primitives) {
  const primitiveReports = Object.values(primitives || {}).map(validatePaintPrimitiveSource);
  const checks = primitiveReports.flatMap((primitiveReport) => primitiveReport.checks);
  if (primitiveReports.some((primitiveReport) => primitiveReport.status !== 'passed')) return report(checks);
  return report([
    ...checks,
    ...validateAppearanceConfiguration({ rig, plan: model.appearance || { instances: [] }, primitives }).checks,
  ]);
}

export function validateAppearanceManifest(manifest) {
  return report(schemaChecks('appearance-resolution', validateResolutionSchema, manifest));
}
