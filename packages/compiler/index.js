// @paper-rig/compiler — public API over the pure pipeline in ./core.js.
//
// The core functions read a module-scoped render context (`core.state`) in place
// of the workbench's UI state. These wrappers set that context from explicit
// arguments — a rig plus optional camera/pose/proportion overrides — so the same
// compiler runs headless in the CLI and, once flattened, inside the workbench.

import * as core from './core.js';

export { core };
export const state = core.state;

const IDENTITY_MODEL_TRANSFORM = () => ({ move: [0, 0, 0], rot: [0, 0, 0] });

// Point the injected context at `rig`, applying camera/pose/proportion/overlay
// options with identity defaults that reproduce the original fresh-load output.
export function useRig(rig, opts = {}) {
  const key = rig.id || 'current';
  const s = core.state;
  s.rig = rig;
  s.model = key;
  s.modelTransforms = { [key]: opts.modelTransform || IDENTITY_MODEL_TRANSFORM() };
  s.jointTransforms = { [key]: opts.jointTransforms || {} };
  s.height = opts.height ?? 1;
  s.width = opts.width ?? 1;
  s.elev = opts.elevation ?? rig.camera?.elevation ?? 90;
  s.az = opts.heading ?? rig.camera?.azimuth ?? 0;
  s.clip = opts.clip ?? 'idle';
  s.t = opts.time ?? 0;
  s.bones = opts.bones ?? false;
  s.contacts = opts.contacts ?? false;
  return s;
}

// Compile a rig to its full paper-rig/1 package (the pure equivalent of the
// workbench's rigPayload()). Structural + directional validation is included in
// the package exactly as in the original pipeline.
export function compilePackage(rig, opts = {}) {
  useRig(rig, opts);
  return core.rigPayload();
}

// Render a rig to a standalone SVG string (the pure equivalent of exportedSvg()).
export function renderSvg(rig, opts = {}) {
  useRig(rig, opts);
  return core.exportedSvg();
}

// Render just the projected SVG markup for a pose/camera (no wrapping <svg>).
export function markup(rig, opts = {}) {
  useRig(rig, opts);
  return core.svgMarkup(rig, core.state.t, core.state.clip, opts.view || 'projected', {
    clean: opts.clean ?? true,
  });
}

// Solve posed world-space joint positions for a clip/time.
export function solve(rig, opts = {}) {
  useRig(rig, opts);
  return core.worldJoints(rig, core.state.t, core.state.clip);
}
