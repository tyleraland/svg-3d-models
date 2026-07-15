// @paper-rig/validator — structural and directional checks for paper-rig/1.
//
// The check implementations (packageValidation, directionalValidation, and the
// motion/heading passes) live in @paper-rig/compiler because the compiler embeds
// them while building a package. This façade is the stable public surface: it
// runs the full pipeline and returns the merged validation report, and re-exposes
// the individual pure checks for callers that want them in isolation.

import { compilePackage, core } from '@paper-rig/compiler';

export const structuralValidation = core.packageValidation;
export const directionalValidation = core.directionalValidation;
export const preservedClipLengthsPass = core.preservedClipLengthsPass;
export const bilateralHeadingSwapPass = core.bilateralHeadingSwapPass;
export const inferredCentralAppendageConflicts = core.inferredCentralAppendageConflicts;

// Validate a rig end-to-end. Returns the merged report:
//   { status: 'passed'|'failed', checks: [...], issues: [...], ... }
export function validate(rig) {
  return compilePackage(rig).validation;
}

// Convenience: true when the rig passes every structural and directional check.
export function isValid(rig) {
  return validate(rig).status === 'passed';
}
