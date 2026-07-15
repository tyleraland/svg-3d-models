# Paper Rig

Paper Rig is a deterministic, DOM-free toolchain for authoring semantic 3D
creature rigs and projecting them into SVG-compatible 2D scenes. The current
catalog contains 31 animals and monsters. They are factored into reusable family
bases and one thin declarative model file per creature; they no longer live as
model definitions inside the workbench HTML.

The browser workbench is a generated inspection UI. The reusable product is the
schema, resolver, compiler, validator, CLI, model catalog, and—incrementally—the
structured projected scene consumed by downstream art pipelines.

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

# Render the canonical heading/elevation contact sheet
npx rig sheet rabbit

# Write a self-contained canonical-pose/multi-view review artifact
npx rig audit rabbit -o rabbit-audit.html

# Emit the same audit as deterministic machine-readable diagnostics
npx rig audit rabbit --json

# Run the compact catalog audit used by CI; advisory warnings do not fail it
npx rig audit-all --json -o paper-rig-audit.json

# Generate projected review evidence (a candidate is not approved automatically)
npx rig manifest rabbit -o rabbit-manifest-candidate.json

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
packages/compiler/     pure posing, projection, scene, SVG, and package compiler
packages/validator/    raw-source, structural, and directional validation
packages/cli/          the `rig` command
rigs/families/*.json   raw reusable family bases
rigs/models/*.json     one thin declarative model per creature
rigs/resolve.js        family + overrides -> one normalized rig
rigs/family-kit.js     family presets and normalization operations
apps/workbench/        browser template, UI source, and build reassembly
fixtures/              golden rigs/packages/SVGs and historical browser oracle
scripts/               extraction provenance, capture, and parity checks
test/                  Node behavior and regression tests
spec/                  detailed versioned package references
```

Dependency direction is `schema <- compiler <- validator`; `rigs` depends on
schema, while the CLI and workbench depend on the full pipeline. Packages are
plain ESM npm workspaces with no transpile or bundle step.

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
import { loadModel } from '@paper-rig/rigs';
import {
  compilePackage,
  projectScene,
  renderSvg,
  solve,
  solvePose,
} from '@paper-rig/compiler';

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
```

`projectScene()` is the intended long-term consumer boundary: an ordered,
structured, traceable 2D vector scene. `renderSvg()` remains the convenient
preview and compatibility adapter. See [spec.md](./spec.md) for ownership and
semantic guarantees and [spec/paper-rig-1.md](./spec/paper-rig-1.md) for the
current resolved package fields.

## Downstream consumer workflow

A typical game asset pipeline should:

1. select a model, clip/phase/time, heading, elevation, and semantic detail tier;
2. request `projected-scene/1` from this repository's compiler;
3. preserve source IDs while applying the game's palette and art treatment;
4. simplify/quantize paths for the target screen size;
5. deduplicate, pack, and version the resulting game assets;
6. add game-specific hitboxes, effects, balance, and runtime metadata there.

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
