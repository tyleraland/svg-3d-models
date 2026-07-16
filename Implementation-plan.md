# Paper Rig implementation plan

Last updated: 2026-07-15

This is the project handoff document. It records the intended implementation
order, the state of each milestone, the invariants that must survive the work,
and the checks needed before a future contributor can call a milestone done.
The normative data and API contract lives in [spec.md](./spec.md); day-to-day
commands and authoring guidance live in [README.md](./README.md).

## Goal

Turn this repository into a deterministic semantic rig compiler for reusable
creature assets. It should be efficient to author and revise more than one
hundred animals and monsters, detect structural and directional mistakes
automatically, make the remaining visual judgments cheap, and hand a stable
structured projection to one or more 2D consumers.

The repository owns anatomy, reusable geometry, posing, animation, projection,
occlusion intent, semantic appearance information, modular attachment points,
and diagnostic evidence. A game repository owns its art style, gameplay camera
selection, final SVG simplification and packing, hitboxes, balance, effects, and
runtime asset policy.

## Non-negotiable invariants

- `paper-rig-workbench.html` is generated. Its sources are under
  `apps/workbench/`, `packages/`, and `rigs/`.
- The compiler, schema, validator, and rig resolver remain pure, DOM-free ESM.
- Identifiers are stable semantic identifiers, not transient draw-order
  positions.
- Current `paper-rig/1` packages and SVG output remain backward compatible while
  new contracts are introduced additively.
- Existing models must not change visually without an intentional fixture
  review.
- Validation must produce machine-readable diagnostics with stable codes.
- Every model remains independently resolvable from a family plus declarative
  overrides; authoring must never depend on post-resolution mutation.
- A generated render is evidence, not the source of truth. Semantic model data
  must remain available to downstream tools.

## Status at a glance

| Milestone | Status | Outcome |
| --- | --- | --- |
| M0: extract and harden the current pipeline | Complete | 31 models are factored into families/models, validated, parity-tested, and CI-ready |
| M1: semantic projection foundation | Complete | World/camera transforms, explicit surface frames, and `projected-scene/1` |
| M2: automated audit and review artifact | Complete | JSON diagnostics, approved-manifest diffs, and inspectable multi-view HTML |
| M2.5: authoring round-trip | Complete | Provenance, semantic diffs, source patches, and adjacent-pose/multi-camera review |
| M3A: modular attachment foundation | Complete | Typed joint/surface slots, bounded reusable modules, assembly validation, and canonical review |
| M4: composable motion system | Complete | Versioned phases/recipes, representative whole-body attacks, and hard motion checks |
| M3B: appearance and paint | Complete | Versioned plate-local paint, bounded placement, semantic palette roles, and projected traceability |
| M5: LOD and consumer handoff | Complete | Semantic detail tiers, capability negotiation, and stable export fixtures |
| M6: representative migration and release | Planned | Fully exercise the contract on contrasting rigs, then publish/version it |

## M0 — extract and harden the current pipeline

Status: complete.

Delivered:

- 31 thin model declarations under `rigs/models/` and reusable family bases
  under `rigs/families/`.
- Pure schema, compiler, validator, CLI, resolver, and workbench packages.
- JSON Schema validation for authoring sources via `rig validate-sources`.
- Structural and directional validation through `rig validate-all`.
- Golden package, rig, and SVG parity fixtures for all current creatures.
- Headless Chromium parity for the generated workbench.
- A CI gate that runs the deterministic checks.
- A corrected dangling harpy diagonal reference and regression coverage.
- Fixture capture that treats the historical baseline as immutable unless a
  reset is explicitly requested.

Exit criteria met:

- `npm run check` passes.
- `npm run test:workbench` passes with Chromium available.
- The generated workbench is behavior-equivalent to the package implementation.

## M1 — semantic projection foundation

Status: complete.

Purpose: expose the semantic information already computed by the compiler
before investing in modules, richer animation, or paint. Those later features
need full transforms and a structured handoff; adding them directly to SVG
would make them difficult to validate and reuse.

Implementation order:

1. Document `projected-scene/1`, posed joint transforms, surface frames, stable
   compositing groups, and compatibility rules.
2. Expose each posed joint's world position and local-to-world rotation matrix.
   Keep the existing positions-only `solve()` API as a compatibility wrapper.
3. Permit explicit plate-local surface-frame metadata in family sources and
   model plate patches. Preserve legacy `surfaceNormal` and `planeAxes` data.
4. Add a JSON Schema for `paper-rig/projected-scene/1`.
5. Add `projectScene()` as a structured, DOM-free projection API. It must retain
   source IDs, semantic roles, depth, compositing group, and serializable SVG
   vector geometry.
6. Refactor the current SVG renderer to serialize the projected scene instead
   of independently recomputing it.
7. Add parity tests proving that the adapter produces the existing SVG byte for
   byte.

Delivered:

- full posed-world positions and local-to-world rotation matrices through
  `solvePose()`, with `solve()` preserved;
- explicit, source-validated, right-handed plate `surfaceFrame` metadata;
- `paper-rig/projected-scene/1` JSON Schema;
- `projectScene()` with schema-valid output for all 31 models, exact legacy
  vector order, source traceability, depth, compositing groups, and transformed
  surface frames;
- a local Chrome/Chromium/Edge fallback for headless workbench parity; and
- a cross-V8 numeric comparator proven over all 3,131 browser/package outputs.
- rigid joint-span enforcement and a catalog-wide clip regression, so legacy
  endpoint pose controls steer bones without stretching their plates; and
- explicit correction of central/core compositing semantics where camera-near
  inference incorrectly placed geometry above the head (initially the harpy
  shoulder mass).

The renderer dependency has now been inverted: `projectedRenderPlan()` owns
projection, semantic grouping, source traceability, and vector order;
`projectScene()` publishes it and `svgMarkup()` only serializes it. Equivalence
was proven against the pre-inversion browser renderer over all 3,131 model/clip/
time/camera outputs before regenerating the workbench.

Exit criteria met:

- Consumers can project a model without parsing an SVG string.
- Every projected element can be traced to a source joint, plate, gasket, or
  generated occluder cell.
- Posed rotations compose through the hierarchy and include the model transform.
- Surface frames can be projected into world and camera spaces deterministically.
- Current package and SVG fixtures do not change unintentionally.
- `projected-scene/1` has schema-validation and deterministic serialization
  tests.

## M2 — automated audit and review artifact

Status: complete.

Add `rig audit <model>` and `rig audit-all`. Each audit should emit machine
readable JSON and, when requested, one self-contained HTML report containing:

- canonical headings and elevations;
- bind, idle, gait, attack anticipation, attack contact, and recovery samples;
- bone, joint, plate ID, normal, anchor, contact, depth, and occlusion overlays;
- invariant failures and warnings linked to the relevant model component;
- a concise diff against an approved visual manifest where one exists.

Delivered in the first M2 slice:

- `rig audit <model> --json` with deterministic `paper-rig/audit/1` diagnostics;
- `rig audit <model> -o report.html` with one self-contained 240-view artifact;
- ten canonical poses—including attack anticipation, impact, and recovery—
  across eight headings and three review elevations;
- joint, bone, contact, compositing, traceability, finite-coordinate, and rigid
  span evidence;
- `rig audit-all --json` with a compact `paper-rig/audit-catalog/1` envelope,
  source-model IDs, aggregate counts, and CI exit status;
- hard motion diagnostics for clip-base graphs, keyframe/event order, contact
  intervals, finite transforms, and loop closure;
- advisory-only warnings for attacks without root/body participation and rigid
  chains still using legacy endpoint steering;
- a catalog-wide semantic-region diagnostic that rejects silent inferred
  appendage compositing on centerline body/head/neck joints while preserving
  explicit author intent;
- schema-valid `paper-rig/audit-manifest/1` projected review evidence with
  cross-runtime numeric canonicalization and source-ID-level change categories;
- `rig manifest <model>` candidate generation plus `rig audit --against` JSON
  and HTML comparisons, with incompatible baselines rejected and compatible
  changes non-failing unless `--fail-on-change` is explicitly selected;
- regressions proving non-projected notes do not create review churn and that
  geometry and compositing edits identify affected semantic IDs without
  declaring the reviewed change intrinsically wrong;
- deterministic `paper-rig/audit-overlay/1` evidence for plate IDs and camera
  depth, compositing membership, active contacts, attachment anchors, and
  explicit or legacy surface normals;
- independently toggleable HTML layers for joints, contacts, plate/depth labels,
  compositing tint, anchors/normals, and manifest-change highlighting;
- stable diagnostic codes and API/CLI/HTML regression coverage; and
- successful visual QA of the harpy report layout.

Exit criteria met:

- `rig audit-all --json` is a CI-suitable command with warnings separated from
  hard issues.
- One self-contained artifact covers the canonical model, camera, and motion
  review matrix with machine-linked diagnostic evidence.
- Approved changes can be located by semantic ID without making historical
  output an implicit correctness assertion.

Next action completed: M3A now has a typed attachment/module schema and a narrow
humanoid-plus-quadruped proof. The remaining M3A work is recorded in that
milestone rather than being folded into the review-audit contract.

Candidate future hard checks—surface-facing plausibility, projected-bound
stability, abrupt acceleration, and suspicious always-on-top behavior—remain
deliberately deferred until their semantic intent and exception mechanism are
unambiguous. They are not M2 exit blockers and MUST NOT be promoted from review
evidence to failures merely because a heuristic is easy to compute.

## M2.5 — authoring round-trip

Status: complete.

Make resolved data explainable and make safe workbench experimentation produce
small editable-source patches rather than compiled-package dumps.

Implementation order:

1. Preserve field provenance through resolution: family source, recipe,
   model override, or derived default.
2. Add `rig explain <model> <entity>` and a semantic `rig diff` surface.
3. Add workbench actions that copy the smallest valid model override or clip
   keyframe patch for the current local edits.
4. Add clip-phase/keyframe selection, previous/next onion skins, and a small set
   of simultaneous representative cameras.

The projected manifest/diff surface is delivered. M2.5 now has an opt-in,
schema-valid provenance sidecar without changing normal resolution, attributes
every final leaf across all 31 models, exposes selector-scoped history through
`rig explain`, and compares valid candidate model sources through a
schema-valid, provenance-linked `rig diff`. The workbench can also emit a
schema-valid additive local-transform patch for an exact existing keyframe. It
refuses ambiguous preview states and never writes a source file. Declared
keyframes are directly selectable; while paused, previous and next declared
keys appear as diagnostic onion-skin outlines. A current-pose turntable renders
all eight canonical headings simultaneously at a selectable 45°, 60°, or 75°
comparison elevation. These review layers never enter exported SVG.

Exit criteria:

- An agent can explain why a resolved field has its current value without
  searching the resolver's operation order.
- A human can tune a pose in the workbench and copy a schema-valid source patch.
- Generated patches contain stable semantic IDs and never mutate source files
  implicitly.

Exit criteria met.

## M3A — modular attachment foundation

Status: complete.

Add typed local frames and compatibility declarations for slots such as eyes,
nose, mouth, horn, hat, hand-held, back-mounted, and body-surface details. A
module is reusable semantic rig geometry, not a flattened decorative SVG.

Delivered in the foundation slice:

- a pure `@paper-rig/attachments` package that normalizes legacy anchor module
  names to hierarchical slot types and resolves module instances without
  mutating the rig, model, or module source;
- strict `paper-rig/attachment-module-1` and
  `paper-rig/attachment-assembly/1` JSON Schemas;
- model-source attachment declarations, exact slot compatibility, cardinality,
  owner/reference, positive-scale, target-material, local-geometry,
  palette-role, and stable-ID validation;
- deterministic instance IDs in the form `<instance>__<module-local-id>` and an
  assembly manifest that records slot type, owner, frame, scale, and emitted
  geometry IDs;
- an opt-in `loadModelAssembly()` / `resolveModelAssembly()` API, preserving
  byte-identical ordinary `loadModel()` resolution;
- `rig render|sheet --attachments` for immediate multi-camera inspection; and
- one source-native `travelPack` module attached to the humanoid and rabbit
  back slots at different instance scales, with tests for posed owner-frame
  tracking and rigid geometry across idle, walk, and attack samples.

Delivered in the completion slice:

- model-authored typed slots with joint or plate owners, complete local frames,
  explicit scale behavior, cardinality, and optional counterparts;
- plate-owned slots resolved through explicit right-handed surface frames, with
  required finite plate-local box regions;
- conservative module geometry bounds derived from joint/plate geometry, plus
  optional declared bounds that must contain that geometry;
- a deterministic containment check that rejects a scaled/rotated module when
  its bounds escape a declared owner-local region;
- a shared `simpleHat` on authored humanoid and rabbit `head.hat` slots and an
  `eyeGlint` aligned to a bounded humanoid eye-plate surface slot;
- `rig audit|audit-all|manifest --attachments`, so assembled geometry enters
  canonical review evidence and authored slots appear in frame overlays; and
- schema, source, assembly, rigid-motion, bounds, projection, audit, and CLI
  regressions while ordinary resolution/render goldens remain byte-identical.

Exit criteria:

- The same eye, horn, hat, weapon, or body-mounted module can attach to compatible models
  without model-specific world coordinates.
- Validators reject incompatible slots, missing required frames, invalid paint
  references, and geometry that escapes a declared plate-local region.
- At least one humanoid and one quadruped use attachment modules without
  changing unrelated rig anatomy.

Exit criteria met. A workbench assembly toggle is deliberately deferred: the
assembled contact sheet and 240-view audit provide deterministic review now,
and the UI should only grow another mode when direct module authoring needs it.

Seam hardening follow-up delivered:

- `paper-rig/attachment-module-1.1` adds a measured overlap-gasket mount
  interface: module-local axis, radius, embed depth, and compositing policy;
- validation proves exact root/frame alignment, incident mount geometry, a
  gasket radius contained by that geometry, and bounded embed depth;
- assembly manifests expose the scaled interface and owner-local axis, while
  posed tests prove its contact point remains fixed on the slot;
- projected gaskets declare incident-element dependencies and inherit their
  most essential semantic tier, preventing orphan seam dots after LOD
  filtering; and
- one `simpleHorn` module attaches to both wolf and leopard `head.horn` slots,
  alongside upgraded hat and pack seams. The surface eye glint stays on 1.0
  because it is not an overlap mount.

## M4 — composable motion system

Status: complete.

Move from whole-clip handcrafted rotations toward semantic controls and motion
recipes while retaining authored override layers. Examples include stance,
weight shift, rear, crouch, reach, head thrust, arm swing, recoil, settle, and
look/focus.

Clips declare meaningful phases such as anticipation, action, contact, recovery,
and settle. Recipes coordinate pelvis/torso/head participation and planted
contacts; per-model tuning remains declarative.

Delivered:

- pure `@paper-rig/motion` composition plus strict
  `paper-rig/motion-recipe-1`, `paper-rig/motion-plan-1`, and
  `paper-rig/motion-resolution/1` contracts;
- contiguous semantic phases and reusable normalized block curves that combine
  model-local amplitudes into ordinary deterministic clip keyframes;
- an opt-in rabbit whole-body strike with weight shift, rear/body drive, head
  strike, and explicit rear-foot contact intent;
- an opt-in humanoid swing coordinating root/stance, hips, spine, shoulders,
  lead shoulder, elbow, and hand;
- `loadModelMotion()` and composable `loadModelConfigured()`, plus CLI
  `--motion` for render/sheet/audit/audit-all/manifest and a catalog
  `npm run audit-motion` gate;
- compiled phase/recipe traceability and phase-aware canonical audit sampling;
- hard diagnostics for phase coverage/order, event-phase alignment, contact
  order/references, phased joint limits, finite transforms, bone-length
  preservation, rigid spans, and loop closure; and
- a corrected bone-length invariant that permits root weight shift when actual
  parent-child distances remain fixed.

Exit criteria:

- A representative quadruped attack contains anticipation, whole-body movement,
  contact, and recovery without duplicating an entire clip.
- A representative humanoid swing coordinates stance, torso, shoulder, and hand.
- New clips can be composed from reusable motion blocks and tuned per model.
- Contact, limits, loop closure, and phase/event checks run in the audit gate.

Exit criteria met. Ordinary `loadModel()` output and existing SVG goldens remain
byte-identical; recipe candidates are explicit until broader clip migration is
reviewed model by model.

Next action completed by M3B below.

## M3B — appearance and paint

Status: complete.

Add plate-local paint primitives that remain coherent through animation:
regions, paths, spots, stripes, masks, and palette roles. Paint data should use
semantic colors such as `body.main`, `body.marking`, `face.eye`, or
`equipment.metal`; concrete game colors remain a consumer concern.

Delivered:

- pure `@paper-rig/appearance` resolution for `paper-rig/paint-primitive-1`,
  embedded `paper-rig/appearance-plan-1`, and
  `paper-rig/appearance-resolution/1` manifests;
- a deliberately conservative closed-path grammar (`M`, `L`, `Q`, `C`, `Z`),
  normalized curve controls, right-handed surface frames, positive transforms,
  exact region containment, target-shape checks, and stable-ID collision checks;
- opt-in `loadModelAppearance()` / `loadModelConfigured()` and `--paint`
  rendering, sheets, manifests, audits, and a full-catalog `audit-paint` gate;
- projected paint elements with owner/primitive traceability, semantic palette
  roles, posed surface frames, deterministic ordering, and reverse-surface
  culling; and
- one reusable `faceBlaze` identity marking shared by humanoid and rabbit and
  exercised through animated attack poses and canonical consumer evidence.

Exit criteria:

- Paint follows owning plate frames through every canonical pose.
- Validators reject invalid targets, open geometry, and paint escaping declared
  plate-local regions.
- A humanoid and quadruped share at least one reusable semantic paint primitive.

Exit criteria met. Ordinary `loadModel()` resolution, legacy package fixtures,
and SVG goldens remain unchanged because authored appearance is opt-in. The 1.0
primitive intentionally admits only closed solid paths; strokes, holes, and
true masking require a later versioned contract rather than ambiguous CSS.

Next action completed by M5 below.

## M5 — LOD and consumer handoff

Status: complete.

Add semantic importance tiers such as silhouette, identity, expression, texture,
and micro-detail. Do not define LOD only as geometric point count: consumers need
to know which information can disappear while preserving the creature's identity
and action.

Stabilize `projected-scene/1` as the handoff representation and support explicit
consumer capabilities. A consumer selects cameras, poses, phases, palettes, and
detail tiers, then applies its own stylization, vector reduction, deduplication,
packing, and game metadata.

Delivered:

- `projected-scene/1.1` semantic detail tier and provenance fields while
  retaining the legacy `lodTier` vocabulary for compatibility;
- conservative structural/role/legacy assignment rules that never hide an
  inference behind authored truth;
- schema-backed family/module plate declarations and model plate overrides for
  explicit authored semantic tiers;
- pure `@paper-rig/handoff` cumulative filtering that preserves compositing
  groups, stable IDs, and relative element order;
- strict `paper-rig/consumer-profile-1` and
  `paper-rig/consumer-handoff-1` contracts with palette selection and explicit
  `require`/`omit` capability policies;
- `rig handoff` with composable motion, attachment, and paint inputs;
- dependency-linked generated gaskets that stay atomic with at least one
  incident plate at every selected semantic tier; and
- full silhouette and expression golden handoffs for the same painted rabbit
  attack scene, including negotiation and vector geometry.

Exit criteria:

- The same scene can be deterministically emitted at multiple semantic detail
  tiers.
- Unsupported optional capabilities fail clearly or degrade according to a
  declared rule.
- Golden consumer fixtures demonstrate stable IDs and ordering across releases.

Exit criteria met. Unsupported required capabilities fail with stable code
`UNSUPPORTED_CONSUMER_CAPABILITY`; declared omission produces an explicit
degraded negotiation record. Ordinary SVG/package output remains unchanged.

Next action: begin M6 with the representative quadruped, head-striker,
humanoid, and winged/non-bilateral set, replacing conservative LOD migration
evidence with authored tiers where visual review justifies it.

## M6 — representative migration and release

Status: in progress.

Before broad migration, use a small set that stresses different needs:

- one shared-family quadruped;
- one long-necked or head-striking animal;
- one humanoid or weapon-bearing creature;
- one winged, radial, or otherwise non-bilateral creature.

Use what those models reveal to tighten the contract, then migrate the remaining
models family by family. Publish packages only after the schemas, diagnostics,
and compatibility rules have survived those examples.

Representative matrix:

| Stress case | Model | Current M6 state |
| --- | --- | --- |
| shared-family quadruped | rabbit | first slice complete |
| long-necked/head striker | elephant | second slice complete |
| humanoid/weapon-bearing | humanoid | next |
| winged/non-bilateral compositor | harpy | queued |

The rabbit first slice authors every base plate's semantic tier, including its
addon-generated ears, instead of relying on conservative inference. A combined
motion + attachment + paint expression-tier handoff is locked as a golden, so
the representative boundary exercises transforms, phases, modules, seams,
surface paint, stable IDs, and LOD together. The resolved-rig and one SVG fixture
change only by newly authored metadata; the legacy compiled `paper-rig/1`
gasket surface remains byte-compatible.

The elephant second slice authors every base plate's tier, preserves the entire
head-and-trunk action chain at silhouette detail, treats paired tusks as
identity geometry, and keeps the cast shadow in the texture tier. Its impact
pose is locked as an identity-tier consumer golden, with regression evidence
that the rotation-authored head strike moves the head and successive trunk
joints without requiring a consumer to understand the source clip. This slice
also tightened structural LOD dependencies: when a generated core gasket joins
a core plate to a non-core plate, its projected occluder dependency now falls
back to the real incident plate instead of naming an occluder cell that does not
exist in that view.

Next action: migrate and review humanoid tiers and weapon-bearing evidence, then
apply the same process to harpy before family-wide rollout.

Exit criteria:

- Representative models use transforms, frames, modules, phases, paint, and LOD.
- The entire model catalog passes source, structural, directional, audit, and
  workbench parity gates.
- Versioning and migration notes exist for producers and consumers.

## Testing layers

Keep the layers distinct so a failure says what broke:

1. Source schema tests validate raw family and model declarations.
2. Resolver tests compare normalized rigs with golden rigs.
3. Compiler tests compare packages and SVG output with golden fixtures.
4. Structural/directional tests validate semantic correctness.
5. Projected-scene tests validate IDs, transforms, geometry, order, and schema.
6. Audit tests exercise known-bad miniature rigs for every diagnostic.
7. Workbench tests use headless Chromium to compare the generated browser app
   with the pure package implementation.
8. A small approved image set may later catch raster-level visual regressions;
   it should supplement semantic checks, not replace them.

## Pickup procedure

If work stops unexpectedly, resume in this order:

1. Read `AGENTS.md`, this file, `spec.md`, and `README.md`.
2. Run `git status --short`; preserve unrelated or uncommitted user changes.
3. Run `npm run check` to establish the deterministic baseline.
4. If Chromium is installed, run `npm run test:workbench`.
5. Continue the first unfinished item in the active milestone above.
6. Add or update tests before regenerating fixtures.
7. Run `npm run build-workbench` after compiler, schema, rig, or workbench-source
   changes.
8. Treat a fixture change as a review event: explain why the semantic or visual
   output changed and inspect representative views before accepting it.
9. Update this document's status and next action in the same change as a
   completed milestone slice.

## Decision log

- 2026-07-15: keep `paper-rig/1` compatible and add new metadata optionally
  until representative migrations justify a breaking schema version.
- 2026-07-15: use a structured projected scene as the principal consumer
  boundary; SVG is an adapter and preview format.
- 2026-07-15: keep art-style transformation and final asset packing in the
  consumer repository.
- 2026-07-15: represent attachable details as typed modules on local frames,
  rather than embedding model-specific decorative coordinates.
- 2026-07-15: represent reusable hard-mount seams as measured overlap
  interfaces; generated seam geometry inherits incident LOD instead of acting
  as an independent detail.
- 2026-07-15: represent appearance in plate-local semantic paint data so it
  remains coherent through poses.
- 2026-07-15: define LOD by semantic importance, not only geometry complexity.
- 2026-07-15: introduce reusable motion recipes underneath declarative clip
  tuning, with explicit anticipation/action/contact/recovery phases.
- 2026-07-15: finish a lean catalog audit, then add an authoring round-trip
  milestone; split attachment slots from paint so a representative motion slice
  can happen before broad appearance work.
