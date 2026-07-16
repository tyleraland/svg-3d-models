# Paper Rig repository and consumer contract

Status: working contract for the current repository and planned additive
extensions. The detailed current `paper-rig/1` package reference is
[spec/paper-rig-1.md](./spec/paper-rig-1.md).

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are
normative requirements when capitalized.

## 1. Purpose and boundary

This repository defines reusable semantic 3D paper rigs and compiles them into
deterministic projected vector scenes. Its output is meant to support multiple
uses, including a separate top-down JavaScript game that selects useful poses
and views, applies its own art style, and reduces them to compact 2D SVG assets.

The producer (this repository) MUST own:

- canonical anatomy, hierarchy, proportions, and joint limits;
- reusable plates and other generic model geometry;
- bind poses, clips, motion phases, events, and contact intent;
- model-space through camera-space transforms and orthographic projection;
- visibility and occlusion intent, including deterministic compositing groups;
- typed anchors/slots and generic attachable modules;
- semantic materials, plate-local paint regions, and detail importance;
- structural, directional, temporal, and projection validation;
- stable semantic IDs and traceability from projected output to source data.

The consumer MUST own:

- which model, clip, phase, time, heading, elevation, and LOD its product uses;
- product-specific palette, line treatment, stylization, and final 2D art rules;
- SVG simplification, quantization, deduplication, compression, atlasing, and
  packaging;
- gameplay hitboxes, balance, effects, timing, and runtime behavior;
- decisions to omit or exaggerate producer details for its particular camera.

A consumer MUST NOT need to reverse-engineer anatomy, source IDs, depth intent,
or attachment semantics from a flattened SVG.

## 2. Sources of truth

Source precedence is:

1. raw family and model declarations under `rigs/`;
2. schemas and normative contract documents;
3. pure resolver/compiler output;
4. generated preview and compatibility artifacts.

`paper-rig-workbench.html` is generated and MUST NOT be edited directly.
Fixtures are regression evidence, not authoring sources. A disagreement between
a generated artifact and its source MUST be fixed at the source or compiler
layer, then regenerated.

## 3. Representation pipeline

The canonical data flow is:

```text
family + model overrides
        -> resolved paper-rig/1 rig
        -> posed world transforms
        -> projected-scene/1
        -> consumer-handoff/1
        -> SVG preview/adapter
        -> consumer art and asset pipeline
```

Every transition MUST be deterministic for the same inputs. Pure package code
MUST NOT depend on a DOM, wall clock, network, locale-sensitive formatting, or
randomness.

## 4. Coordinates and transforms

Canonical model axes are:

- origin: ground center between contacts;
- forward: `+x`;
- left/lateral: `+y`;
- up: `+z`;
- units: meters;
- authored transforms: joint-local Euler rotations in degrees unless a field
  explicitly declares another representation.

The transform hierarchy is:

```text
joint local -> model -> posed world -> camera -> token/SVG
```

For every posed joint, the compiler MUST be able to expose:

- its posed world position in meters; and
- a 3 by 3 local-to-world rotation matrix whose columns are its transformed
  local basis axes.

The local-to-world rotation MUST include inherited parent rotations and any
global model rotation. Translation MUST NOT be encoded into that 3 by 3 matrix.
Matrices and positions MUST contain only finite numbers.

The existing positions-only `solve()` API is a compatibility view. New tooling
SHOULD use the full pose result whenever it places modules, paint, normals, or
diagnostic overlays.

A plate with `attachment: "rigid"` and a two-joint `span` establishes a rigid
bone-length invariant. Its posed world-space endpoint distance MUST equal its
bind distance at every clip time. Legacy `poses` deltas on the child endpoint
are interpreted as directional steering: the solver normalizes the resulting
local vector to bind length and composes that swing into the child's inherited
frame. Authors SHOULD prefer explicit rotations for new motion, but old endpoint
controls MUST NOT stretch a rigid plate. A future exception requires an explicit
non-rigid attachment capability; absence of such metadata always means rigid.

## 5. Identity and semantic references

Joint, plate, anchor, slot, module, paint-region, clip, event, and projected
element IDs MUST be stable within the scope documented for that type. IDs MUST
not be assigned from array position or current draw order.

Every reference MUST resolve after family/model normalization. Deleting or
renaming a referenced entity is a breaking authoring change unless every
reference and affected consumer migration is included.

Mirrors, diagonals, spans, contacts, occlusion references, modules, paint
targets, and motion controls are semantic references and MUST be validated.

Name-based `bodyRegion` inference is a convenience, not authoritative semantic
intent. If inference would place a plate attached to a centerline `body`,
`head`, or `neck` joint into camera-relative appendage compositing, validation
MUST fail and identify the plate. The author MUST resolve the ambiguity with an
explicit `bodyRegion`. An explicit region remains authoritative, including when
an intentionally unusual centerline attachment is meant to behave as an
appendage; validators MUST NOT replace that declaration with a preferred visual
interpretation.

## 6. Surfaces and local frames

A plate MAY declare an explicit local surface frame:

```json
{
  "surfaceFrame": {
    "normal": [0, 0, 1],
    "tangent": [1, 0, 0],
    "bitangent": [0, 1, 0]
  }
}
```

Frame vectors are expressed in the owning bone's local space. They MUST be
finite, non-zero, and mutually orthogonal within validator tolerance. The frame
SHOULD be right-handed (`tangent x bitangent = normal`). Validators MAY repair
small normalization error for derived output but MUST report degenerate or
materially non-orthogonal authored frames.

Legacy `surfaceNormal` and `planeAxes` remain supported. When both legacy fields
and `surfaceFrame` exist, `surfaceFrame` is authoritative and validators MUST
warn if the representations conflict.

Surface-aware modules, paint, and visibility MUST use transformed local frames,
not fixed world axes. A plate MAY declare visibility intent such as one-sided or
two-sided; accidental visibility from every camera SHOULD be diagnosed.
When present in `projected-scene/1`, a surface frame MUST include both its
posed-world basis and the same basis expressed in the declared camera axes.

## 7. Slots and modules

An attachment slot is a typed local coordinate frame on a joint or plate. It
MUST declare:

- a stable ID;
- an owning joint or plate;
- a local position and orientation frame;
- a semantic type or compatible type set;
- scale-inheritance behavior;
- optional side, cardinality, and occupancy constraints.

Examples include `face.eye`, `face.nose`, `head.horn`, `head.hat`, `hand.grip`,
and `back.mount`. Names are hierarchical semantic labels, not presentation CSS.

A module MUST declare compatible slot types and its own attachment frame. A
module MAY contain joints, plates, paint, clips, or constraints. The resolver
MUST produce stable instance IDs and MUST NOT mutate either source object.

The implemented capability is `paper-rig/attachment-module-1` versions `1.0.0`
and `1.1.0`. Both support module-local joints and plates attached to authored
joint-owned or plate-owned slots. Version 1.1 additionally requires a measured
overlap mount interface. Module-local paint, clips, and constraints are reserved
capabilities: producers MUST NOT encode them as undocumented fields.

An overlap-mounted module MUST declare `mountInterface.type` as
`overlap-gasket`, a signed module-local axis, a positive gasket radius, a
positive embed depth, and `module-over-owner` compositing. The attachment frame
MUST be exactly one embed depth from the module root along that axis, with no
tangential offset. At least one plate MUST be incident to the root; the gasket
radius MUST fit within an incident plate half-width; and embed depth MUST NOT
exceed radius. These are geometric seam invariants, not aesthetic claims.
Surface details that do not need overlap SHOULD remain 1.0 until another mount
policy is specified.

For a joint-owned slot, `localFrame` is expressed in the owning joint's local
axes. For a plate-owned slot, it is expressed as `[tangent, bitangent, normal]`
coordinates in the plate's explicit right-handed surface frame. Plate-owned
slots MUST declare a finite positive box `region` in that same coordinate
space; a plate without an explicit usable right-handed surface frame (including
the legacy normal/plane-axis pair) cannot own a slot.

Until authored typed slots replace the legacy anchor vocabulary, the resolver
normalizes these exact types:

| Legacy `moduleType` | Slot type |
| --- | --- |
| `weapon` | `hand.grip` |
| `horn` | `head.horn` |
| `hat` | `head.hat` |
| `helmet` | `head.helmet` |
| `backItem` | `back.mount` |
| `collar` | `neck.collar` |
| `saddle` | `back.saddle` |
| `ear` | `head.ear` |
| `wing` | `back.wing` |
| `tail` | `tail.mount` |
| `generic` | `generic` |

Compatibility is exact: a module's `compatibleSlotTypes` MUST contain
the normalized slot type. Assembly MUST also reject missing slot/module
references, occupancy above slot cardinality, non-positive or non-finite
instance scale, target materials absent from the resolved rig, invalid
module-local hierarchy/references, undeclared module palette roles, and any
generated stable-ID collision. These checks describe declared facts and MUST
NOT guess visual suitability from a module or model name.

Module geometry has a deterministic conservative bound: joint-span plates use
their control joints expanded by half-width, joint polygons use their control
positions, and rigid primitives use a sphere derived from their largest size.
A module MAY declare a larger finite `bounds` box, but it MUST contain the
derived geometry. When a slot declares a region, the resolver transforms all
eight module-bound corners through attachment-frame alignment and instance
scale and MUST reject any corner outside the region. Exceptions require a
future explicit contract field; validators MUST NOT silently add tolerance for
a particular model or module name.

Each model attachment declaration identifies an instance, module, slot, and
optional positive scale. Assembly transforms the module attachment frame onto
the slot local frame and emits IDs as `<instance-id>__<module-local-id>`.
`paper-rig/attachment-assembly/1.1` records the source/resolved model IDs, slot
type and owner, local slot frame, scale, generated joint/plate IDs, and any
scaled resolved mount interface with its owner-local axis and root joint. Module
geometry remains ordinary rig geometry after assembly and therefore uses the
same posing, projection, semantic grouping, and rigid-span validation as model
anatomy.

Every projected generated gasket MUST declare the stable IDs of its incident
plates. Its semantic detail tier MUST equal the most essential tier among those
dependencies. A cumulative handoff MUST retain a gasket only when at least one
incident plate is retained. This applies to anatomy connectors and attachment
seams and prevents isolated generated geometry at lower LODs.

Assembly is explicitly additive during the compatibility transition.
`resolveModel()` and `loadModel()` MUST continue to return the base resolved rig
without declared attachments; `resolveModelAssembly()` and
`loadModelAssembly()` return `{ rig, manifest }`. This avoids changing existing
goldens or consumers merely because an author declares optional modules.

`rig render`, `sheet`, `audit`, `audit-all`, and `manifest` accept an explicit
`--attachments` flag. Canonical assembled audits include the assembly manifest,
module geometry in every sampled projection, and authored joint/plate slot
positions in the frame overlay. The flag is required so existing review
baselines never change merely because attachment declarations were added.

Weapons are modules from this repository when they need coherent attachment and
motion. Damage, range, game timing, and effects remain consumer metadata.

## 8. Appearance and paint

Appearance authored here is semantic and surface-local. A paint primitive MUST
target a plate or named surface region and use plate-local coordinates so it
follows every pose without world-space reprojection.

Paint MAY describe paths, regions, spots, stripes, masks, fill roles, or stroke
roles. It SHOULD reference palette roles such as `body.main`, `body.marking`,
`face.eye`, or `equipment.metal`. Concrete product colors and final line style
are consumer choices.

Paint order and masking MUST be deterministic. The projected scene MUST preserve
enough source and palette-role metadata for a consumer to replace, simplify, or
omit paint without parsing arbitrary CSS.

The current additive source contracts are `paper-rig/paint-primitive-1`,
embedded `paper-rig/appearance-plan-1`, and
`paper-rig/appearance-resolution/1`. Version 1 supports one closed absolute
path made from `M`, `L`, `Q`, `C`, and `Z`; all endpoints and Bézier controls
MUST be normalized to `[-1, 1]`. Each instance MUST target an existing rigid
two-axis plate, declare an orthonormal right-handed surface frame and a bounded
plate-local region, and keep its transformed controls inside that region.
These restrictions are intentionally sufficient rather than permissive: true
masks, holes, strokes, relative commands, and arbitrary SVG/CSS require a new
versioned contract.

Appearance resolution is opt-in. A projected paint element MUST retain its
stable instance ID, reusable primitive ID, owning plate ID, semantic role,
semantic palette role, detail tier, and posed surface frame. Front-surface paint
MUST NOT project through the reverse side. Consumers MAY omit or recolor the
element by semantic metadata without parsing its CSS class.

## 9. Motion and clips

Clips MUST remain deterministic functions of normalized time. Looping clips
MUST define their closure behavior. Contact intervals, events, and joint limits
MUST be machine-checkable.

In the current keyframe representation, clip-base references MUST resolve and
form an acyclic graph; keyframe times MUST be finite and strictly increasing;
event times MUST be normalized and nondecreasing; contact intervals MUST be
normalized, ordered, nonempty, and reference existing joints; and every motion
transform MUST be a finite three-vector targeting an existing joint. Until an
explicit alternative closure mode is added, the first and last transform maps
of a looping clip MUST be equivalent (with rotations compared modulo 360
degrees).

Richer motion SHOULD be composed from semantic controls or recipes—such as
stance, weight shift, rear, crouch, reach, head thrust, swing, recoil, and
settle—plus declarative model-specific tuning. Recipes MUST resolve to ordinary
joint transforms before projection; consumers are not required to implement the
motion system.

Action clips SHOULD expose named phases:

- `anticipation`;
- `action`;
- `contact` (instant or interval);
- `recovery`;
- optional `settle`.

Phase boundaries and events MUST use stable normalized times and MUST be ordered.
Whole-body participation is an authoring quality target, while contacts, limits,
loop closure, event order, and discontinuities are deterministic validation
targets.

The implemented additive capability uses `paper-rig/motion-recipe-1` version
`1.0.0` and an embedded `paper-rig/motion-plan-1`. A recipe owns contiguous
normalized phase ranges, one peak per phase, reusable named blocks, one scalar
sample per block/phase, default clip timing, and phase-addressed events. A model
motion plan selects a recipe and supplies named layers. Each layer binds one
recipe block to finite joint-local translation and/or rotation amplitudes.

Resolution MUST multiply each layer amplitude by its block sample and add all
layer contributions at the corresponding phase peak. It MUST then emit an
ordinary `paper-rig/1` clip with keyframes, contacts, events, phase metadata,
`boneLengthPolicy: "preserve"`, and a traceable
`paper-rig/motion-resolution/1` reference. Layer order MUST NOT change the
numeric result. Recipe, block, joint, base-clip, event-phase, and contact
references MUST resolve before composition. Inputs MUST remain immutable.

Explicit action phases MUST appear exactly as `anticipation`, `action`,
`contact`, `recovery`, and optional `settle`; their ranges MUST cover `[0,1]`
without gaps and each peak MUST lie inside its range. Events on phased clips
MUST name a phase and lie inside that phase, and every phased action MUST expose
a contact event. Contact intervals MUST be normalized and ordered. For phased
clips, bend-axis rotations at keyframes MUST remain inside declared joint
limits. Linear interpolation, loop closure, finite transforms, rigid spans, and
declared bone-length preservation remain hard audit invariants.

Root translation MAY participate in weight shift because it cannot change a
parent-child distance. A preserve-policy check MUST measure actual bone lengths;
it MUST NOT reject root translation merely because a translation vector is
nonzero. Translation of a rigid child endpoint remains forbidden unless a later
explicit non-rigid capability says otherwise.

`loadModel()` and ordinary rendering deliberately omit model motion plans for
compatibility. `loadModelMotion()` / `resolveModelMotion()` and CLI `--motion`
opt into composition. `loadModelConfigured()` composes motion and attachments
when both are requested. Compiled clips preserve normalized phase and recipe
traceability so consumers can select semantic poses, but consumers are never
required to evaluate recipes.

## 10. Semantic levels of detail

Detail importance MUST describe meaning, not only path complexity. The target
semantic tiers are:

1. `silhouette` — required to recognize gross anatomy and action;
2. `identity` — species or character-defining features;
3. `expression` — eyes, mouth, pose accents, and readable intent;
4. `texture` — markings and secondary surface details;
5. `micro` — details safe to omit in small game assets.

An element MAY declare more specific consumer hints, but the producer MUST NOT
encode one game's pixel budget as the universal definition of LOD. Omitting a
tier MUST preserve stable IDs and ordering among surviving elements.

Current `paper-rig/1` packages use the legacy vocabulary `silhouette`, `major`,
`detail`, and `micro`. `projected-scene/1.0` preserves those values in `lodTier`.
`projected-scene/1.1` additionally emits `semanticDetailTier` and
`semanticDetailSource`; it does not reinterpret or remove the legacy field.

The initial semantic migration is deliberately conservative:

- authored semantic detail and paint-primitive detail are authoritative;
- generated opaque-core cells and joint gaskets are `silhouette` because
  removing them can create holes or disconnected anatomy;
- shadow, eye/nose, and accessory roles map unambiguously to `texture`,
  `expression`, and `identity` respectively;
- legacy `silhouette` and `major` geometry remains at `silhouette`, legacy
  `detail` becomes `identity`, and legacy `micro` remains `micro`.

Every element MUST identify the assignment source as `authored`,
`authored-paint`, `structural`, `semantic-role`, or `legacy-conservative`.
Conservative fallback is migration evidence, not a claim that a human authored
the classification. Future representative model work SHOULD replace a fallback
with authored meaning when a different tier is genuinely intended. A family or
module plate MAY declare `semanticDetailTier`; a model MAY set it through a
targeted `plateOverride`. Validators MUST reject values outside the five
versioned tiers and MUST NOT silently infer a more aggressive omission merely
to produce smaller output.

## 11. `paper-rig/projected-scene/1`

`projected-scene/1` is the structured 2D handoff. It is a JSON-serializable,
DOM-free scene representing one resolved model at one pose and camera.

The top-level scene MUST include:

- `schema: "paper-rig/projected-scene/1"` and a semantic `schemaVersion`;
- source model ID and pose (`clip`, normalized `time`);
- camera type, heading/elevation where applicable, and basis vectors;
- coordinate-space and view-box definitions;
- projected joints with source IDs, world positions, rotations, screen
  positions, and camera depth;
- ordered compositing groups;
- ordered vector elements with stable projected IDs, source traceability,
  semantic kind/role, depth, detail tier, and structured SVG geometry.

Initial compositing groups are ordered back to front and include shadow, far,
opaque core, core, near, and detail layers. The precise set MAY grow in a minor
schema version; a consumer MUST use the declared group order rather than hard
coding the current count.

Initial vector geometry uses an SVG element name plus a string attribute map.
Attributes MUST NOT contain event handlers, external resource URLs, scripts, or
DOM-dependent state. Numeric strings MUST use deterministic formatting. The
structured representation exists so consumers do not parse an SVG document;
future minor versions MAY add higher-level geometry alongside it.

Generated occlusion geometry MUST identify itself as generated and SHOULD name
the source plate(s) it represents. Every non-generated vector element MUST name
one source entity.

`renderSvg()` is the compatibility and preview adapter. Once M1 is complete, it
MUST serialize `projected-scene/1` rather than independently calculate pose,
projection, or order.

## 12. `paper-rig/consumer-handoff/1`

`consumer-handoff/1` is an additive selection envelope around one
`projected-scene/1.1` scene. A `paper-rig/consumer-profile-1` declares a stable
profile ID, a maximum semantic detail tier, an opaque consumer-owned palette
ID, and requested capabilities. Camera, clip, phase/time, and optional rig
capabilities are selected before projection; the handoff records the resulting
pose and camera exactly.

Tier selection is cumulative in this order: `silhouette`, `identity`,
`expression`, `texture`, `micro`. Selection MUST only remove elements. It MUST
retain every compositing group and its declared order, and MUST preserve the
stable IDs and relative order of surviving elements. The handoff MUST record
the ordered complete assignment list plus included and omitted ID lists, so a
consumer and regression test can reproduce the decision without parsing SVG.
Assignments for generated dependent geometry MUST also record their dependency
element IDs.

The implemented scene capabilities are:

- `structuredVectorGeometry`, `stableElementOrder`,
  `semanticDetailTiers`, `semanticPaletteRoles`, and `jointTransforms` for every
  1.1 scene;
- `surfaceFrames` when the scene contains transformed surface frames; and
- `semanticPaint` when the scene contains projected semantic paint.

Capability availability describes the projected source scene, before detail
filtering. A profile capability with policy `require` MUST fail with stable code
`UNSUPPORTED_CONSUMER_CAPABILITY` when absent. Policy `omit` MUST continue,
record the capability as `omitted`, and mark negotiation `degraded`. Unknown or
absent capabilities MUST NOT be silently treated as available.

`paletteId` records the palette selected by the consumer; the producer MUST NOT
interpret it as a color table. `paletteRoles` lists the producer roles still
needed after detail selection. Applying concrete colors and style remains the
consumer's responsibility.

The versioned profile and handoff JSON Schemas live in `packages/schema/`.
`createConsumerHandoff()` is pure and MUST NOT mutate its scene or profile.
`rig handoff` is the file/CLI adapter. Golden handoffs are consumer-boundary
regression evidence and require the same deliberate review as projected audit
manifests.

## 13. Validation and review

Validation has four responsibilities:

1. source conformance before resolution;
2. resolved structural and directional correctness;
3. temporal and projected invariants across canonical samples;
4. deterministic human-review evidence for genuinely visual judgments.

Diagnostics MUST have stable codes, severity, a concise message, the relevant
entity IDs, and enough context for an agent or human to reproduce the failure.
Warnings MUST NOT be silently converted into errors without a contract or
configuration change.

Hard motion-contract diagnostics affect audit status. Authoring-quality signals
such as limited whole-body participation or use of a supported legacy control
MUST remain warnings unless a later schema capability makes the behavior an
explicit invariant.

`inferred-central-appendage-regions` is a narrow authoring-ambiguity error. It
MUST report only undeclared `bodyRegion` values where centerline attachment and
joint role provide contradictory evidence; it MUST NOT reject an explicit
author decision.

`paper-rig/audit/1` is the machine-readable multi-view review report. It MUST be
deterministic and MUST record its pose/camera sampling manifest, diagnostics,
issues, and per-view evidence. An HTML audit is a self-contained human rendering
of that report and MUST NOT become an alternative model source.

`paper-rig/audit-catalog/1` is the compact CI aggregation of individual audits.
It MUST retain source-model and resolved-model IDs, per-model diagnostics,
issues and warnings, plus aggregate model/view/diagnostic counts. It MAY omit
per-view evidence already available from the corresponding individual audit.

`paper-rig/audit-manifest/1` is optional human-approved projected review
evidence for one model. It records the canonical sampling matrix, normalized
joint transforms, vector geometry, transformed surface/depth data, active
contacts, semantic element fields, and compositing order. Numeric projection
data and numeric SVG geometry tokens are canonicalized to `1e-9`; non-projected
notes and source formatting MUST NOT affect it.

Generating a manifest MUST NOT itself mark the output approved. Approval is a
human/version-control decision made after inspecting the corresponding audit
artifact. A comparison MUST report stable affected IDs and distinguish added or
removed elements, semantic metadata, surface/depth, vector geometry,
compositing, joint transforms, and contacts. A compatible difference is review
evidence, not proof of invalid behavior, and MUST NOT fail by default. Tooling
MAY offer an explicit fail-on-change policy once a project has deliberately
adopted a baseline. Different model IDs, sampling matrices, canonicalization
contracts, or manifest schema versions are incompatible and MUST NOT be compared
as if they were equivalent views.

Each `paper-rig/audit/1` view MAY carry `paper-rig/audit-overlay/1` evidence.
This evidence records ordered compositing membership, traceable plate label
anchors and camera depth, active contact positions, projected attachment
anchors, and explicit or legacy surface normals. Its HTML rendering MUST keep
diagnostic layers separate from compiled asset geometry and MUST allow the
reviewer to toggle joint, contact, plate/depth, compositing, and frame layers
independently. A manifest comparison SHOULD highlight affected current elements
and joints, but missing/removed elements MUST remain described in the machine
diff because they cannot be drawn in the current scene.

Canonical review MUST sample multiple headings, elevations, clips, phases, and
times, including attack anticipation, contact/impact, and recovery even before a
model adopts explicit phase metadata. A single attractive default view is
insufficient evidence of model correctness.

## 14. Resolution provenance and explanations

Resolution provenance is optional authoring evidence and MUST remain separate
from `paper-rig/1`. Enabling it MUST NOT alter the resolved rig, compiled
package, projected scene, or rendered SVG. Consumers that only need assets MUST
NOT be required to retain provenance.

`paper-rig/provenance/1` records semantic leaf writes in resolver order. Target
pointers use stable joint, plate, anchor, and clip IDs in collection positions,
not their current source-array indexes. Every final leaf MUST have one final
origin in exactly one of these categories:

- `family`: copied from the reusable family base;
- `recipe`: produced by a named reusable transformation from declared inputs;
- `model-override`: directly attributable to a model-source pointer; or
- `derived-default`: supplied by a named normalization/defaulting operation.

Write history MAY retain earlier values that were overwritten, but it MUST omit
fields absent from the final resolved rig. `sourcePointer` identifies the
smallest source object that authoritatively supplied the value when a
leaf-for-leaf source mapping does not exist. A derived default has no source
pointer and MUST name its recipe.

`paper-rig/explanation/1` is a selector-scoped view of this sidecar. Selectors
MUST support `rig`, `joint:<id>`, `plate:<id>`, `anchor:<id>`, and `clip:<id>`,
with optional dotted or bracketed field paths. A missing selector is an explicit
`not-found` result. Explanation is read-only diagnostic evidence; it MUST NOT
mutate source files or imply that the current value is visually correct.

`paper-rig/semantic-diff/1` compares two valid declarative model sources after
resolving each with provenance. It MUST list changed source leaves separately
from changed resolved leaves and MUST address joints, plates, anchors, and clips
by stable semantic ID. Each resolved change carries the origin on both sides;
source and target pointers are linked only when an origin's declared source
scope supports that relationship. Derived consequences without a direct source
pointer MUST remain visible and explicitly unlinked rather than receiving a
guessed cause.

Compatible differences are review evidence and MUST NOT fail by default. A
source edit with no resolved effect is `source-only`, not silently discarded.
Different stable model IDs, resolved schema versions, missing sources, or
mismatched provenance are incompatible. The diff is read-only and MUST NOT
apply either source revision.

`paper-rig/model-patch-1` is an authoring artifact, not a compiled consumer
package. Its first supported operation is `append /clipPatches`. The operation
value MUST name one existing clip, one exact existing normalized keyframe time,
and at least one additive joint-local pose or rotation vector keyed by a stable
joint ID. Patch generation and application MUST NOT mutate the source object or
write a source file implicitly.

The first version MUST reject rather than approximate:

- global model transforms or preview-only proportion scaling;
- edits sampled between declared keyframes;
- unknown joints or clips; and
- translation of the child endpoint of a rigid span.

Source-clip patches MUST apply before canonical clip derivation so a patch to
`idleA` or `walkA` can flow into its canonical alias. A patch that names a clip
created by canonical derivation MUST apply afterward and MUST NOT silently
rewrite its source clip. Multiple patch entries compose additively in declared
order. Each resolved leaf written by a patch SHOULD retain the narrowest
corresponding `/clipPatches/.../add/...` provenance pointer.

The workbench MAY preview transforms more broadly than the copied patch applies,
but MUST state that distinction, disable copying for unsupported state, and show
the exact artifact before copying. Applying the artifact to repository source
remains an explicit author or agent action followed by source validation and
semantic review.

Workbench pose-comparison layers are diagnostic and MUST NOT alter source-patch
content, compiled packages, or exported SVG. Adjacent-pose onion skins SHOULD
use declared keyframe times rather than inventing semantic phases. Their DOM IDs
MUST NOT collide with current-pose semantic IDs. A simultaneous current-pose
camera view SHOULD cover all canonical headings at one explicitly selected
review elevation; selecting a comparison tile MAY update the live camera but
MUST NOT mutate model or clip data. Diagnostic multi-view refresh MAY pause
during animation playback for responsiveness if it refreshes at the current
time when playback stops.

The versioned JSON Schemas in `packages/schema/schemas/` are the machine
contract for provenance, explanations, semantic diffs, and model patches.

## 15. Author and agent rules

Authors and automated agents working in this repository MUST:

- change family/model sources or package code, never generated HTML directly;
- run source validation before trusting a resolved/rendered result;
- consider every family edit to affect all dependent models;
- preserve stable IDs unless performing an explicit migration;
- add a deterministic regression for every fixed structural bug;
- inspect more than one camera when changing geometry, surfaces, or depth;
- inspect anticipation, contact, and recovery when changing an action clip;
- explain and review fixture changes rather than accepting them mechanically;
- keep generic reusable meaning here and product-specific art/game policy in the
  consumer.

Agents SHOULD prefer small semantic edits that expose intent in data. They
SHOULD NOT compensate for incorrect 3D anatomy by adding camera-specific SVG
offsets unless the field is explicitly a projection policy.

## 16. Compatibility and versioning

`schemaVersion` follows semantic versioning at the schema level:

- patch: clarification or validation correction that does not change valid
  serialized data;
- minor: backward-compatible optional fields or capabilities;
- major: required-field, meaning, coordinate, or ordering changes that require a
  producer or consumer migration.

Unknown optional fields MAY be rejected by strict source schemas even when a
future version defines them; producers and consumers MUST negotiate supported
schema/capability versions rather than silently discarding semantic data.

During the additive transition, existing `paper-rig/1` output and `solve()`,
`compilePackage()`, `markup()`, and `renderSvg()` APIs remain supported. New
consumers SHOULD prefer the full pose and projected-scene APIs as they stabilize.
