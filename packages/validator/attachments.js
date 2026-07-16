// Schema and semantic validation for reusable attachment modules and resolved
// assembly manifests. Geometry/compatibility checks stay pure in the attachment
// package; this façade owns JSON Schema validation.

import Ajv2020 from 'ajv/dist/2020.js';
import moduleSchema from '@paper-rig/schema/schemas/attachment-module-1.schema.json' with { type: 'json' };
import assemblySchema from '@paper-rig/schema/schemas/attachment-assembly-1.schema.json' with { type: 'json' };
import { validateAttachmentConfiguration, validateAttachmentModule } from '@paper-rig/attachments';

const ajv = new Ajv2020({ allErrors: true, strict: true, verbose: false });
const validateModuleSchema = ajv.compile(moduleSchema);
const validateAssemblySchema = ajv.compile(assemblySchema);
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
  const issues = checks.filter((check) => !check.pass);
  return { status: issues.length ? 'failed' : 'passed', checks, issues };
}

export function validateAttachmentModuleSource(module) {
  const schema = schemaChecks('attachment-module', validateModuleSchema, module);
  return report(schema.some((item) => !item.pass)
    ? schema
    : [...schema, ...validateAttachmentModule(module).checks]);
}

export function validateModelAttachmentConfiguration(model, rig, modules) {
  const moduleReports = Object.values(modules || {}).map(validateAttachmentModuleSource);
  const schemaChecksForModules = moduleReports.flatMap((moduleReport) => moduleReport.checks);
  if (moduleReports.some((moduleReport) => moduleReport.status !== 'passed')) return report(schemaChecksForModules);
  const configuration = validateAttachmentConfiguration({
    rig,
    slots: model.slots || [],
    instances: model.attachments || [],
    modules,
  });
  return report([...schemaChecksForModules, ...configuration.checks]);
}

export function validateAttachmentManifest(manifest) {
  return report(schemaChecks('attachment-assembly', validateAssemblySchema, manifest));
}
