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
`detail`, and `micro`. `projected-scene/1.0` preserves those values rather than
pretending there is a lossless mapping. Consumers MUST treat the `lodTier`
string as the producer-declared ordering until a later compatible capability
adds the richer semantic vocabulary and model data has been migrated.

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

## 12. Validation and review

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

Canonical review MUST sample multiple headings, elevations, clips, phases, and
times. A single attractive default view is insufficient evidence of model
correctness.

## 13. Author and agent rules

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

## 14. Compatibility and versioning

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
