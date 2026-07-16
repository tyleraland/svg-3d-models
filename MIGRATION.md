# Migrating from 0.1 to 0.2

The 0.2 line makes the extracted packages and structured consumer boundary the
source of truth. The generated `paper-rig-workbench.html` remains a demo and
review surface; do not import models from it or scrape its SVG.

## Producers in this repository

1. Keep final model declarations in `rigs/models/` and shared geometry in
   `rigs/families/`, `rigs/modules/`, `rigs/motion-recipes/`, and
   `rigs/paint-primitives/`.
2. Resolve ordinary compatibility geometry with `loadModel()`. Opt into
   `loadModelConfigured(name, { motion, attachments, appearance })` only for the
   capabilities under review or export.
3. Give every resolved base plate an authored semantic tier. For broad
   migration, use:

   ```json
   {
     "semanticDetailPolicy": {
       "defaultTier": "silhouette",
       "byRole": { "shadow": "texture" },
       "byId": { "optionalIdentityPlate": "identity" }
     }
   }
   ```

   `byId` wins over `byRole`; those win over an existing plate tier; the
   existing tier wins over `defaultTier`; a later `plateOverride` is final.
   Keep defaults conservative and add higher tiers only after visual review.
4. Use attachment-module 1.1 for overlap-mounted modules. Use 1.2 only when a
   plate needs a terminal geometry control point: mark that non-root leaf joint
   `helper: true`. Helpers cannot own children and do not receive gaskets.
5. Use `rig explain`, `rig diff`, and `rig audit` before changing resolver code
   or accepting a visual candidate. Source patches remain additive,
   exact-keyframe, joint-local edits; the workbench never writes model files.

## Consumers

1. Import from the versioned `@paper-rig/*` packages, not the workbench.
2. Consume `projectScene()` or `rig handoff`; do not infer joints, occlusion,
   palette meaning, detail importance, or attachment ownership from flattened
   SVG.
3. Select a cumulative maximum tier (`silhouette`, `identity`, `expression`,
   `texture`, or `micro`) through a `paper-rig/consumer-profile-1` document.
4. Preserve stable element IDs and relative order through art-style conversion.
   Generated seam elements are dependency-linked to their incident geometry and
   must be retained or omitted atomically.
5. Treat unsupported required capabilities as errors. Optional omissions are
   recorded as a degraded negotiation and should be visible in asset-build logs.
6. Apply game-specific palette conversion, simplification, quantization,
   deduplication, hitboxes, and runtime metadata in the consumer repository.
   This repository owns coherent 3D structure, reusable motion/attachments,
   deterministic projection, and generic semantic metadata.

## Verification

Run `npm run check`, regenerate the workbench, run `npm run test:workbench`, and
review representative `rig sheet`/`rig audit` reports. Resolved-rig fixtures may
change when authored metadata is added; ordinary compiled/SVG fixtures should
change only when geometry or serialization intentionally changes.
