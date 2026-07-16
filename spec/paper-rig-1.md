# paper-rig/1 specification

Status: initial normative specification for the extracted `paper-rig/1`
pipeline. The keywords **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are used
as requirements.

## Purpose and boundaries

`paper-rig/1` is a style-neutral, directional creature rig format. It describes
a semantic joint hierarchy, opaque paper-like plates, animation clips, attachment
anchors, and the rules needed to project that data into deterministic SVG.

This repository owns authoring, normalization, posing, projection, validation,
and publication of canonical rig packages. A consumer MAY select views, simplify
geometry, apply an art style, and pack the resulting SVG assets, but it MUST NOT
need workbench UI state to interpret a published rig.

The generated `paper-rig-workbench.html` is a viewer/editor demonstration. It is
not an authoring or interchange format.

## Representation layers

The pipeline has four distinct representations:

1. A **family source** in `rigs/families/` supplies reusable joints, plates,
   anchors, clips, and defaults.
2. A **model source** in `rigs/models/` selects one family and declares ordered
   overrides.
3. A **normalized rig** is the deterministic result of resolving one model
   source against its family source.
4. A **published package** is the compiler output consumed outside this
   repository. It includes normalized geometry, animation and projection
   metadata, validation results, and generator identity.

Family and model source schemas are machine-readable in
`packages/schema/schemas/`. Published-package validation remains part of the
compiler/validator until its extracted legacy shape is promoted to a standalone
handoff schema.

## Identity and compatibility

- Every joint, plate, anchor, clip, event, gasket, and resolved paint instance
  MUST have a stable ID within its model.
- IDs MUST be unique within their declared namespace. Published package IDs that
  share one lookup namespace MUST be globally unique in that package.
- References MUST target an existing compatible object.
- Renaming or repurposing a stable ID is a breaking model change.
- `schemaVersion` defines format semantics. Consumers MUST reject unsupported
  major versions.
- `generatorVersion` identifies compiler behavior and does not by itself change
  format compatibility.
- Published assets SHOULD additionally carry a model revision and source content
  hash before they become a cross-repository release boundary.

## Coordinates and transforms

- Units are meters.
- `+X` is model-forward, `+Y` is model-left, and `+Z` is up.
- The ground plane is `Z=0`.
- The origin is centered between the model's canonical ground contacts.
- Joint bind positions and animation deltas are joint-local.
- Local rotations are degrees and use the pipeline's declared XYZ composition
  order.
- Parent transforms MUST be applied before child transforms.
- Camera projection is orthographic unless a future schema version says
  otherwise.
- Left and right are absolute model-space sides. They MUST NOT be redefined from
  the current camera.

All numeric values MUST be finite. Dimensions and scales MUST be positive unless
a field explicitly defines a signed offset or rotation.

## Joint hierarchy

- The hierarchy MUST be acyclic and have exactly one root joint.
- Every non-root joint MUST reference an existing parent.
- Parents MUST precede their children in normalized rig order.
- A mirrored or diagonal counterpart MUST exist when declared.
- Clips declaring `boneLengthPolicy: "preserve"` MUST keep every parent-child
  distance invariant throughout the clip.
- Contact joints MUST name an explicit contact surface and SHOULD remain on the
  ground within a model-relative tolerance while their contact interval is
  active.

## Plates and geometry

- Every plate MUST attach to an existing bone, joint span, or joint polygon.
- Geometry MUST be closed and opaque unless an intentional hole is explicitly
  declared.
- Plate dimensions MUST be positive.
- A span plate MUST reference two existing joints and declare sufficient overlap
  or joint coverage to avoid a visible articulation gap.
- A joint polygon MUST reference at least three existing joints.
- Custom paths MUST be closed SVG paths in their declared local coordinate space.
- Every plate in a published package MUST have an explicit semantic body region,
  palette role, LOD tier, side, and compositing policy. Legacy source data MAY
  obtain these fields from deterministic family defaults or normalization
  inference; newly authored templates SHOULD declare them directly.

The current legacy renderer contains both fully projected spans and 2.5D rigid
plates. A later strict directional profile will require an explicit local plane
basis, surface normal, sidedness, and depth envelope for surface-bound geometry.
Those additions can be backward-compatible source metadata, but consumers MUST
not infer physical orientation from a plate ID.

## Optional semantic appearance

Authored appearance is an additive capability and is absent from ordinary
`loadModel()` output. `paper-rig/paint-primitive-1` stores reusable closed
normalized paths, and a model's `paper-rig/appearance-plan-1` places them on a
rigid two-axis plate with an explicit right-handed local frame, bounded region,
and finite transform. The resolver emits opaque `rig.paint` records and a
`paper-rig/appearance-resolution/1` manifest.

Projected paint is a stable `sourceKind: "paint"` element in the final semantic
compositing group. Its vector metadata retains the owning plate and reusable
primitive IDs, and its semantic fields retain role, palette role, detail tier,
posed surface frame, and camera depth. Reverse-facing surface paint is culled.
Consumers select actual colors and may omit or simplify paint by metadata.

## Occlusion and compositing

Normalized rigs use semantic compositing before stable camera-depth sorting.
The ordered groups are:

1. ground shadow
2. camera-far appendages
3. opaque core occluder
4. core surface plates
5. camera-near appendages
6. paint, details, and accessories

Supported legacy source policies are:

- `semantic-group`: choose the semantic group and then sort by camera depth.
- `under-core`: remain behind the opaque core at every heading.
- `surface-relative`: compare against an explicitly named reference surface or
  bone and change visibility/layering with the camera.

`zBias` MAY break a tie inside a valid semantic policy. It MUST NOT be the only
description of a surface relationship. A feature that is always overlaid MUST be
declared as such by a future explicit policy rather than relying on a large bias.

## Animation

- A normalized model MUST provide canonical `idle`, `walk`, `attack`, `hit`, and
  `ko` clips.
- Keyframe and event times are normalized to `[0,1]` and MUST be monotonic.
- A clip MUST contain at least one frame and have a positive duration.
- Every pose or rotation entry MUST target an existing joint.
- Contact intervals MUST satisfy `0 <= from <= to <= 1`.
- Semantic events such as attack impact SHOULD be named consistently so a
  consumer can select useful frames without understanding a creature's anatomy.

## Validation profiles

Conformance is layered so extracted models can migrate without losing coverage:

- **source**: family and model JSON pass their schemas and all references resolve.
- **structural**: the normalized rig satisfies identity, hierarchy, geometry,
  anchor, clip, and opacity invariants.
- **directional**: required clips and intermediate times project successfully at
  the declared heading/elevation matrix and satisfy contact and compositor rules.
- **visual-approved**: generated diagnostic/contact sheets have an explicit human
  approval baseline for intentional appearance.

A published cross-repository model SHOULD satisfy all four profiles. CI MUST run
the source, structural, and directional profiles. Visual approval is required
when a source or renderer change alters canonical output.

## Determinism

Given identical family source, model source, generator version, supported
runtime, clip, time, camera, and render options, normalization and SVG generation
MUST be byte deterministic. Iteration order MUST NOT depend on filesystem
enumeration or hash map implementation details. Cross-runtime parity checks MAY
compare decimal tokens with an absolute tolerance no larger than `1e-10`; a
published handoff generator SHOULD canonicalize numeric serialization itself.

## Source schema evolution

- Unknown top-level and structural fields are rejected so authoring typos cannot
  silently disappear.
- Free-form descriptive `profile` metadata is intentionally extensible.
- Adding optional fields is backward-compatible.
- Changing coordinate meaning, transform order, default compositing behavior, or
  required fields requires a schema-version review and may require a major bump.
- Legacy normalization inference MUST remain deterministic and SHOULD emit
  provenance/warnings as explicit metadata is introduced.
