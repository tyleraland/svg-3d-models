# Changelog

## 0.2.0 — 2026-07-15

This is the first consumer-ready source release of the extracted paper-rig
pipeline.

### Added

- DOM-free schema, compiler, validator, attachment, motion, appearance, handoff,
  rig resolver, and CLI workspaces.
- Declarative family/model authoring for all 31 catalog models, with stable-ID
  provenance, semantic diffs, exact-keyframe patches, and generated workbench
  parity.
- Structural, directional, rigid-span, contact, compositing, attachment-seam,
  appearance-placement, motion-phase, and consumer-handoff checks.
- Versioned attachment modules and typed joint/plate slots, including measured
  overlap seams and `attachment-module-1.2` terminal helper joints.
- Composable whole-body motion recipes, plate-local semantic paint, cumulative
  semantic-detail tiers, capability negotiation, and structured projected
  consumer handoffs.
- A model-level `semanticDetailPolicy` for catalog-scale authored tier defaults,
  with exact provenance and validation of explicit ID/role selectors.
- Representative M6 consumer goldens for rabbit, elephant, humanoid, and harpy.

### Compatibility

- Ordinary model loading still excludes declared attachments, motion recipes,
  and appearance plans unless the corresponding configured loader or CLI flag
  is used.
- Legacy `paper-rig/1` compilation and SVG serialization retain stable IDs and
  ordering; new consumer data is additive through projected-scene and handoff
  contracts.
- Internal workspace dependencies are pinned to the compatible `^0.2.0` line.
