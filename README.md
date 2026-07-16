# Paper Rig

Paper Rig is a deterministic, DOM-free toolchain for authoring semantic 3D
creature rigs and projecting them into SVG-compatible 2D scenes. The current
catalog contains 31 animals and monsters. They are factored into reusable family
bases and one thin declarative model file per creature; they no longer live as
model definitions inside the workbench HTML.

The browser workbench is a generated inspection UI. The reusable product is the
schema, resolver, compiler, validator, CLI, model catalog, and—incrementally—the
structured projected scene consumed by downstream art pipelines.

Release changes and consumer upgrade guidance live in
[CHANGELOG.md](CHANGELOG.md), [MIGRATION.md](MIGRATION.md), and
[RELEASE.md](RELEASE.md).

## Start here

Requirements: a current Node.js release and npm. A Chromium-compatible browser
is only required for the browser parity test. The test prefers Playwright's
pinned Chromium and falls back to Chrome, Chromium, or Edge installed in the
standard macOS application locations; `PLAYWRIGHT_EXECUTABLE_PATH` can specify
another executable.

```sh
npm ci
npm run check
npm run test:workbench
```

`npm run check` is the normal fast gate. It validates raw sources, runs all
headless Node tests, compiles and validates every model, and requires no browser.
`npm run test:workbench` launches headless Playwright/Chromium and verifies that
the generated browser app behaves like the package implementation.

## Common commands

```sh
# Resolve, compile, and validate one declarative model
npx rig validate rigs/models/rabbit.json

# Validate every raw family/model source against JSON Schema
npx rig validate-sources

# Resolve, compile, and validate the entire catalog
npx rig validate-all

# Render a single pose to SVG
npx rig render rabbit --clip walk --time .25 --elevation 60 --heading 0

# Render model-declared reusable modules as part of the pose
npx rig render rabbit --attachments --clip walk --time .25 --elevation 60 --heading 0

# Resolve the model's reusable motion recipe candidate before rendering
npx rig render rabbit --motion --clip attack --time .22 --elevation 60 --heading 0

# Capabilities compose: inspect recipe motion with declared modules attached
npx rig audit humanoid --motion --attachments -o humanoid-motion-audit.html

# Resolve versioned semantic paint and review it across animation/cameras
npx rig audit rabbit --paint -o rabbit-paint-audit.html

# Motion, modules, and paint compose in one candidate
npx rig render humanoid --motion --attachments --paint --clip attack --time .62 --elevation 60 --heading 180

# Emit a negotiated, tier-filtered projected scene for a downstream consumer
npx rig handoff rabbit --profile fixtures/consumer/topDownExpression.profile.json --paint --clip attack --time .62 --elevation 60 --heading 180 -o rabbit-handoff.json

# Render the canonical heading/elevation contact sheet
npx rig sheet rabbit --attachments

# Write a self-contained canonical-pose/multi-view review artifact
npx rig audit rabbit --attachments -o rabbit-audit.html

# Emit the same audit as deterministic machine-readable diagnostics
npx rig audit rabbit --json

# Run the compact catalog audit used by CI; advisory warnings do not fail it
npx rig audit-all --json -o paper-rig-audit.json

# Generate projected review evidence (a candidate is not approved automatically)
npx rig manifest rabbit --attachments -o rabbit-manifest-candidate.json

# Compare an audit with a reviewed manifest; changes are reported, not failed
npx rig audit rabbit --against approved/rabbit.json -o rabbit-audit.html

# Optional CI policy after a project has explicitly approved that manifest
npx rig audit rabbit --json --against approved/rabbit.json --fail-on-change

# Explain where a resolved field came from and show overwritten values
npx rig explain rabbit plate:nearRearUpperPlate.size --history

# Emit the same explanation as stable, schema-valid JSON
npx rig explain horse clip:attack.frames[1].rotations.neckBase --json

# Compare a valid candidate model source by its stable-ID resolved effects
npx rig diff rabbit /tmp/rabbit-candidate.json --json

# Regenerate the browser workbench from its sources
npx rig build-workbench
```

The equivalent npm form is `npm run rig -- <command>`.

## Repository layout

```text
packages/schema/       paper-rig constants, primitives, and JSON Schemas
packages/attachments/  pure typed-slot normalization and module assembly
packages/motion/       pure phase/block recipe composition to ordinary clips
packages/appearance/   pure plate-local semantic paint resolution
packages/compiler/     pure posing, projection, scene, SVG, and package compiler
packages/handoff/      pure semantic-detail selection and capability negotiation
packages/validator/    raw-source, structural, and directional validation
packages/cli/          the `rig` command
rigs/families/*.json   raw reusable family bases
rigs/models/*.json     one thin declarative model per creature
rigs/modules/*.json    reusable source-native attachment modules
rigs/motion-recipes/   reusable versioned phase timing and block curves
rigs/paint-primitives/ reusable versioned semantic paint paths
rigs/resolve.js        family + overrides -> one normalized rig
rigs/family-kit.js     family presets and normalization operations
apps/workbench/        browser template, UI source, and build reassembly
fixtures/              golden rigs/packages/SVGs and historical browser oracle
scripts/               extraction provenance, capture, and parity checks
test/                  Node behavior and regression tests
spec/                  detailed versioned package references
```

Dependency direction is `schema <- compiler <- validator`,
`schema <- attachments`, `schema <- motion`, `schema <- appearance`, and
`schema <- handoff`; `rigs` depends on the pure authoring packages, while the
CLI and workbench depend on the full pipeline. Packages are plain ESM npm
workspaces with no transpile or bundle step.

## Authoring or changing a creature

Start in `rigs/models/<id>.json`. A model references a family and declares only
its differences: proportions, plate/limb sizes, addons, clip events, attack or
gait tuning, occlusion, and targeted plate/anchor edits. `resolveModel()` applies
the family plus overrides in one ordered pass, then derives canonical clips and
anchor modules. Models do not mutate a resolved rig after the fact.

Use `rigs/models/rabbit.json` as a compact shared-family example. Models such as
`horse.json` demonstrate own-base variants. The extraction/generation scripts
are retained for provenance; they are not the normal authoring interface.

Plate IDs may supply harmless defaults, but names are not semantic authority.
When a plate's intended region is ambiguous—especially on a centerline body,
neck, or head joint—declare `bodyRegion` explicitly. Validation rejects only a
silent inferred appendage classification; an explicit declaration is treated as
intentional and is not second-guessed.

A practical edit loop is:

1. Make the smallest semantic change in a model, family, resolver, or package.
2. Run `npx rig validate-sources`.
3. Run `npx rig validate <model-file>` and the relevant Node tests.
4. Render a contact sheet or inspect the workbench across multiple headings,
   elevations, and animation phases.
5. Add a regression test for a bug or new invariant.
6. Run `npm run check`.
7. If package/workbench sources changed, run `npm run build-workbench`, then
   `npm run test:workbench`.

A family change can affect every model that inherits from it. Search model
references and review representative variants before accepting new fixtures.

### Authoring reusable attachments

Reusable equipment and details live in `rigs/modules/` as strict
`paper-rig/attachment-module-1` sources. A module declares compatible
hierarchical slot types, an attachment frame, semantic palette roles, and
module-local rig joints/plates. Model `attachments` entries select a module and
slot and may provide a positive per-instance scale. Generated geometry IDs are
stable and namespaced as `<instance>__<local-id>`.

Versions 1.0 and 1.1 support authored joint- and plate-owned slots plus
module-local joints/plates. Version 1.1 is for hard mounts that need an overlap
seam: declare a signed module-local axis, gasket radius, embed depth, and
`module-over-owner` compositing, then place the attachment frame exactly one
embed depth from the root along that axis. Validation rejects tangential offset,
missing root contact geometry, a gasket larger than the incident plate, or
embed depth larger than its radius. Do not use this contract for a surface decal
merely to make it pass.

Legacy anchors are normalized to typed slots—for example,
`backItem` becomes `back.mount` and `weapon` becomes `hand.grip`. Plate slots use
the plate's explicit `[tangent, bitangent, normal]` surface frame and require a
bounded plate-local region. Module bounds are conservatively derived from their
geometry; optional authored bounds may enlarge, never understate, that envelope.
Compatibility and region containment are exact, and source validation checks
owner/module/slot references, occupancy, scale, target materials, palette roles,
local geometry, and ID collisions. Do not bypass a rejection with model-specific
world coordinates; either fix the declaration or extend the versioned contract.

Attachments are intentionally opt-in while existing `paper-rig/1` consumers
remain byte-compatible. `loadModel()` and ordinary renders omit a model's
attachment declarations. Use `loadModelAssembly()` or `--attachments` when the
assembled asset is wanted. The current proofs attach the same `travelPack` and
`simpleHat` modules to humanoid and rabbit slots at different scales, plus an
`eyeGlint` to a bounded humanoid eye-plate slot. `simpleHorn` proves the same
measured horn module and seam on wolf and leopard, while `simpleSword` follows a
typed humanoid hand grip and remains reusable on compatible normalized grips.
Generated gaskets carry
incident plate dependencies and disappear at the same semantic LOD boundary as
their accessory, so lower tiers cannot retain orphan seam dots. Use
`rig audit <model> --attachments` for the full 240-view review; its frame overlay includes authored
joint and plate slots, and its machine report embeds the assembly manifest.

Free geometry endpoints that exist only to control a module plate use
`attachment-module-1.2` terminal joints with `helper: true`. Do not label them
as accessory anchors merely to suppress a gasket: helpers must be non-root
leaves referenced by geometry and cannot own children.

### Authoring composable motion

Reusable motion timing lives in `rigs/motion-recipes/` as strict
`paper-rig/motion-recipe-1` sources. A recipe declares normalized
anticipation/action/contact/recovery/settle ranges and reusable block curves.
A model's `paper-rig/motion-plan-1` declaration assigns joint-local transform
amplitudes to named layers such as weight shift, rear, body drive, strike, and
flex. The resolver adds the scaled layers at each phase peak and emits an
ordinary clip; projection and consumers do not implement the recipe system.

Recipe motion is opt-in for review while legacy rigs and SVG goldens remain
byte-compatible. Use `loadModelMotion()` or CLI `--motion`; use
`loadModelConfigured(name, { motion: true, attachments: true })` when composing
capabilities. Rabbit proves an anticipation/rear/head-strike sequence with rear
contacts, and humanoid proves a stance/torso/shoulder/elbow/hand swing. The
audit samples their declared phase peaks and treats malformed phase coverage,
misaligned events, invalid contacts, phased joint-limit violations, bone-length
changes, and loop discontinuities as hard failures. `npm run audit-motion` runs
the opt-in candidate audit over the complete catalog.

### Authoring semantic paint

Reusable paint lives in `rigs/paint-primitives/` as strict
`paper-rig/paint-primitive-1` sources. A model's
`paper-rig/appearance-plan-1` instances target a rigid two-axis plate, declare a
right-handed plate-local surface frame and bounded normalized region, and place
the primitive with a finite translate/rotate/positive-scale transform. Use
namespaced semantic roles such as `face.marking` and `body.marking`; do not put
product colors, line style, or arbitrary CSS in these sources.

The 1.0 grammar accepts a single closed absolute path using only `M`, `L`, `Q`,
`C`, and `Z`. Every endpoint and curve control must stay in `[-1, 1]`, and the
transformed controls must fit the declared owner region. This conservative
contract makes open geometry and region escapes deterministic errors. Add a new
versioned primitive contract before introducing strokes, holes, true masks,
relative commands, or arbitrary SVG.

Appearance is opt-in so existing rigs and SVG goldens do not change merely
because a model declares paint. Use `loadModelAppearance()`,
`loadModelConfigured(name, { appearance: true })`, or CLI `--paint`. The
projected scene emits paint in the details group with stable instance and
primitive IDs, owner-plate metadata, semantic palette roles, posed surface
frames, and reverse-surface culling. Humanoid and rabbit share the reusable
`faceBlaze` proof. Run `npm run audit-paint` for the catalog gate.

### Explaining resolved fields

Resolution provenance is opt-in and additive. Normal `loadModel()` and
`resolveModel()` calls do not collect it, so `paper-rig/1` output stays
byte-identical and consumers do not pay a tracking cost. Agents and authoring
tools can call `loadModelWithProvenance()` or use `rig explain` when they need to
understand a result.

Selectors address stable semantic IDs rather than source-array indexes:

```text
rig
joint:neck.bind
plate:headPlate.size
anchor:nearHornMount.moduleType
clip:attack.frames[1].rotations.neckBase
```

Each final leaf is attributed to exactly one of four origin categories: the
family base, a named reusable recipe, an explicit model override, or a derived
default. `--history` also shows values superseded later in the ordered resolver
pass. This is diagnostic evidence, not a mutation API: explaining a field never
edits a model, and generated or suggested patches still require validation and
review.

`rig diff <baseline-model> <candidate-model>` validates and resolves two
declarative sources, then reports ordinary source-pointer changes alongside the
stable joint, plate, anchor, clip, or rig fields they affect. It distinguishes
effective changes from `source-only` edits, rejects comparisons that silently
change the stable model ID, and exits successfully for compatible differences;
a difference is evidence to review, not an assertion that either revision is
correct. `--json` emits the schema-valid `paper-rig/semantic-diff/1` document.

The linkage is deliberately conservative. Direct model overrides and named
recipe inputs point back to their changed source scope. Downstream values
created by a derived-default operation remain identified as derived and are
counted when no direct source pointer can be claimed; the tool does not invent a
causal mapping merely to make every row look linked.

### Copying a pose edit back to source

The workbench's **Patch** tab turns a narrow, unambiguous editor experiment into
a `paper-rig/model-patch-1` artifact. Select a joint, make a local transform
edit, and select an existing keyframe with the keyframe buttons. When the patch
is ready, **Copy source patch** emits an append operation for the model's
`clipPatches` array. It never edits a repository file.

The first round-trip intentionally supports only additive joint-local
translation and rotation at an exact existing keyframe. It rejects global model
transforms, preview-only height/width scaling, interpolated times, unknown joint
IDs, and translation of a rigid-span child. These cases need a more specific
authoring decision and are not guessed. Workbench overrides preview globally;
the copied operation applies the same delta only to the named clip keyframe, so
reset the preview after recording an edit.

An agent can apply a copied artifact without mutating the original object:

```js
import { applyModelPatch, resolveModel } from '@paper-rig/rigs';

const candidateSource = applyModelPatch(source, copiedPatch, {
  sourceModelId: 'rabbit',
});
const candidateRig = resolveModel(candidateSource, family);
```

Validate the candidate source and use `rig diff` before committing it. Patches
to source clips such as `idleA` or `walkA` run before canonical clip derivation;
patches naming generated clips such as `idle` or `walk` apply only to that
canonical clip. Multiple patches compose additively in source order.

### Comparing poses and cameras in the workbench

The timeline exposes every declared keyframe and previous/next navigation.
While playback is paused, the adjacent declared keys appear behind the current
pose as blue/red outline onion skins. They are diagnostic workbench layers only:
they use prefixed DOM IDs, do not affect source-patch generation, and never enter
the exported SVG.

The **Current pose turntable** renders the selected clip/time and current editor
transforms at all eight canonical headings. Its comparison elevation is
independent of the live camera and can be switched among 45°, 60°, and 75°.
Clicking one cell applies that camera to the main view. This gives geometry,
occlusion, and animation edits an immediate multi-angle check without opening
the full 192-view directional matrix. Playback pauses the diagnostic onion and
turntable refreshes so animation remains responsive; pausing refreshes both at
the current time.

Audit diagnostics distinguish contract errors from review guidance. Invalid
references, timelines, transforms, contacts, rigid spans, and loop closure fail
the command. Motion-quality observations such as limited whole-body attack
participation are warnings and remain visible in JSON/HTML without changing the
exit status.

### Reviewing intentional projected changes

`rig manifest <model>` captures the canonical 240-view projected contract at a
numeric precision of `1e-9`: full joint transforms, vector geometry, surface and
depth data, active contacts, semantic element classifications, and compositing
order. The matrix includes attack anticipation, impact, and recovery in addition
to bind, idle, gait contacts, hit, and knockout samples. It deliberately omits
notes and other data that cannot affect the structured projection.

Treat generated manifests as candidates. Inspect the corresponding audit HTML,
then move or commit a candidate as an approved baseline only through an explicit
review decision. `rig audit --against <file>` reports changed views and affected
semantic IDs by category. A compatible change does not alter the audit exit code
unless `--fail-on-change` is supplied; a mismatched model, sampling matrix, or
schema is always reported as incompatible rather than compared misleadingly.

No catalog baseline is approved merely because it matches today's output. This
keeps historical mistakes from becoming silent correctness assertions while
still making later, reviewed changes cheap to locate.

Audit HTML exposes independent toggles for joints, active contact IDs, plate IDs
with camera depth, compositing-group tint, and anchor/surface-normal frames.
When an approved-manifest comparison changes, affected current elements and
joints are highlighted separately and changed view tiles are outlined. Overlay
records also remain in `paper-rig/audit/1` JSON as deterministic
`paper-rig/audit-overlay/1` evidence, so an agent does not have to scrape labels
from the HTML.

## Using the compiler from JavaScript

All core operations are synchronous, pure, and DOM-free once a rig is resolved.

```js
import {
  loadModel,
  loadModelAssembly,
  loadModelConfigured,
  loadModelMotion,
} from '@paper-rig/rigs';
import {
  compilePackage,
  projectScene,
  renderSvg,
  solve,
  solvePose,
} from '@paper-rig/compiler';
import { createConsumerHandoff } from '@paper-rig/handoff';

const rig = loadModel('rabbit');
const pose = solvePose(rig, { clip: 'walk', time: 0.25 });
const scene = projectScene(rig, {
  clip: 'walk',
  time: 0.25,
  elevation: 60,
  heading: 0,
});
const svg = renderSvg(rig, { clip: 'walk', time: 0.25 });
const pkg = compilePackage(rig);

// Compatibility API: world positions only.
const positions = solve(rig, { clip: 'walk', time: 0.25 });

// Opt-in module assembly; source model/module/base-rig objects are not mutated.
const { rig: equippedRig, manifest: attachmentManifest } = loadModelAssembly('rabbit');
const equippedScene = projectScene(equippedRig, {
  clip: 'walk', time: 0.25, elevation: 60, heading: 0,
});

// Opt-in motion composition; the manifest traces recipe, phases, and layers.
const { rig: motionRig, manifest: motionManifest } = loadModelMotion('rabbit');

// Capabilities compose without mutating the ordinary resolved rig.
const configured = loadModelConfigured('humanoid', {
  motion: true,
  attachments: true,
});

// Consumer selection removes detail but never renumbers or reorders survivors.
const handoff = createConsumerHandoff(scene, {
  $schema: 'paper-rig/consumer-profile-1',
  schemaVersion: '1.0.0',
  id: 'gameSprites',
  selection: { maximumDetailTier: 'expression', paletteId: 'gameDefault' },
  capabilities: [
    { id: 'semanticDetailTiers', policy: 'require' },
    { id: 'semanticPaint', policy: 'omit' },
  ],
});
```

`projectScene()` produces the ordered, structured, traceable 2D vector scene.
`createConsumerHandoff()` applies a versioned consumer profile to that stable
boundary. `renderSvg()` remains the convenient preview and compatibility
adapter. See [spec.md](./spec.md) for ownership and semantic guarantees and
[spec/paper-rig-1.md](./spec/paper-rig-1.md) for current resolved package fields.

## Downstream consumer workflow

A typical game asset pipeline should:

1. select a model and whether its declared module assembly is required, then
   select clip/phase/time, heading, elevation, and semantic detail tier;
2. request `projected-scene/1.1` from this repository's compiler and retain the
   attachment, motion, or appearance manifests when requested;
3. apply a versioned consumer profile to negotiate capabilities and select a
   cumulative semantic detail tier;
4. preserve source IDs while applying the profile's consumer-owned palette and
   art treatment;
5. simplify/quantize paths for the target screen size;
6. deduplicate, pack, and version the resulting game assets;
7. add game-specific hitboxes, effects, balance, and runtime metadata there.

Semantic detail tiers are `silhouette`, `identity`, `expression`, `texture`,
and `micro`. Each projected element also records whether its tier was authored,
structurally required, role-derived, or conservatively migrated from legacy LOD.
Generated gaskets also name their incident plate dependencies and use the most
essential dependency tier, so they cannot survive as isolated seam dots.
Treat `legacy-conservative` as a review target when refining a representative
model; author `semanticDetailTier` on a family/module plate or through a model
`plateOverride` when review justifies a different tier. Do not silently make the
mapping more aggressive in consumer code.

For broad family migration, prefer a model `semanticDetailPolicy` with a
conservative `defaultTier`, role defaults such as `shadow: texture`, and only
the visually reviewed `byId` exceptions. This gives every resolved plate an
authored tier without maintaining a regex copy of the family's plate IDs;
explicit plate/addon tiers and later `plateOverride` entries remain available
for exceptions.

Do not infer bones, attachment points, occlusion, or semantic importance from a
flattened SVG when the projected scene provides those fields directly. If the
consumer needs missing generic semantics, extend the producer contract here
instead of adding a private guess in the game repository.

## Generated files and fixtures

`paper-rig-workbench.html` is generated by `rig build-workbench`; edit
`apps/workbench/`, packages, or rigs instead. The workbench parity script compares
the generated browser implementation with the package implementation over all
models, clips, sampled times, and cameras.

Golden rig/package/SVG fixtures use the Node package implementation's byte
format. Fixture capture first smoke-loads the generated workbench; the separate
headless parity sweep proves package/browser equivalence while tolerating only
last-bit cross-V8 numeric spelling differences.
Use `npm run capture-fixtures -- --node-only` when an intentional pure-data or
metadata change only needs deterministic Node fixtures; it skips the smoke load
but does not replace the required `npm run test:workbench` parity gate.
`fixtures/paper-rig-workbench.baseline.html` is the historical oracle from the
original monolith and is intentionally immutable during normal work. Resetting
that baseline is an exceptional migration requiring explicit intent and review.

Fixture diffs are not routine formatting noise. Before accepting one, determine
whether it represents an intended semantic/visual change, inspect affected
models from multiple views, and describe why the new result is correct.

## Notes for future agents and maintainers

- Read `AGENTS.md`, [Implementation-plan.md](./Implementation-plan.md), and
  [spec.md](./spec.md) before changing architecture.
- Preserve unrelated work in a dirty worktree. Do not regenerate or rewrite
  files simply because they are already modified.
- Stable IDs are part of the consumer contract. Renames need an explicit
  migration.
- Prefer declarative semantic data over model-specific projection offsets or
  post-resolution mutation.
- A correct default camera does not prove a correct model. Check side/back and
  low/high elevations, plus anticipation/contact/recovery for action clips.
- Bugs such as disconnected spans, stale references, inverted surface frames,
  and always-on-top details should become deterministic validator regressions.
- Keep reusable anatomy, modules, motion, paint semantics, and projection here.
  Keep the consuming game's art style, packing, hitboxes, and gameplay policy in
  the game repository.
- Do not weaken validation merely to admit a model. If a valid exception exists,
  encode its semantic intent and scope explicitly.
- The current SVG renderer is parity-sensitive. Introduce structured APIs
  additively, then make SVG an adapter only when byte-for-byte tests protect the
  refactor.

## Project documents

- [Implementation-plan.md](./Implementation-plan.md) — milestones, status,
  exit criteria, and pickup procedure.
- [spec.md](./spec.md) — repository/consumer responsibilities and forward
  contract.
- [spec/paper-rig-1.md](./spec/paper-rig-1.md) — detailed current package format.
- `AGENTS.md` — concise repository instructions loaded by coding agents.
