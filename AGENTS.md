# paper-rig

SVG-based directional "paper rig" creature tooling. The **paper-rig/1** pipeline —
hierarchy, posing, projection, SVG generation, and structural/directional
validation — is a set of pure, DOM-free ESM packages. `paper-rig-workbench.html`
is a **generated demo**, not the source of truth.

## Layout (npm workspaces, plain ESM, no build step)

```
packages/schema/       paper-rig/1 constants (C), V, plate/joint primitives
packages/attachments/  pure typed-slot normalization + reusable module assembly
packages/motion/       pure phase/block recipe composition to ordinary clips
packages/appearance/   pure plate-local semantic paint resolution
packages/compiler/     pure pipeline: posing, projection, SVG, package compilation
packages/validator/    structural + directional checks (validate/isValid)
packages/cli/          the `rig` command
rigs/families/*.json   raw (pre-normalization) family base per creature
rigs/models/*.json     one thin declarative model per creature (all 31)
rigs/modules/*.json    reusable paper-rig/attachment-module-1 sources
rigs/motion-recipes/   reusable paper-rig/motion-recipe-1 sources
rigs/paint-primitives/ reusable paper-rig/paint-primitive-1 sources
rigs/resolve.js        resolveModel(): family + overrides -> rig, in one pass
rigs/family-kit.js     family-preset + normalization operations
apps/workbench/        template.html + ui.js (DOM layer) + build reassembly
fixtures/              golden oracle captured from the original monolith
test/                  behavior-parity tests (node --test)
```

Dependency direction: `schema <- compiler <- validator`; `schema <- attachments`;
`schema <- motion`; `schema <- appearance`; pure authoring packages feed `rigs`;
`cli`/workbench depend on all.

## CLI

```
rig validate rigs/models/rabbit.json          # resolve + compile + validate
rig render rabbit --clip walk --time .25 --elevation 60 --heading 0
rig render rabbit --attachments               # opt-in declared module assembly
rig render rabbit --motion --clip attack --time .22
rig render rabbit --paint                      # opt-in semantic appearance
rig audit humanoid --motion --attachments --paint # composed candidate review
rig sheet rabbit --attachments                 # 8x4 assembled contact sheet
rig manifest rabbit --attachments -o rabbit-candidate.json
rig audit rabbit --attachments -o rabbit-audit.html
rig explain rabbit plate:headPlate.size       # resolved field origin + history
rig diff rabbit /tmp/rabbit-candidate.json    # source edits -> stable-ID effects
rig validate-all                               # CI gate over rigs/models/
rig build-workbench                            # regenerate paper-rig-workbench.html
```

Run via `npx rig <cmd>` or `npm run rig -- <cmd>`.

## Authoring a creature

A model references a family base and declares overrides — proportions, plate/limb
sizes, addons, clip events, attack/gait, occlusion, plate/anchor field edits. It
never mutates a rig after the fact; `resolveModel` applies everything in one
ordered pass, then auto-derives canonical clips and infers anchor modules. See
`rigs/models/rabbit.json` for the shared-family variant shape, and any other model
(e.g. `horse.json`) for the own-base shape. The one-time migration that generated
the family bases and models from the original workbench is in
`scripts/gen-families.mjs` and `scripts/gen-models.mjs` (kept for provenance).
Use `rig explain <model> <entity[.field]> --history` before searching resolver
code when a resolved value is surprising. Provenance is an opt-in sidecar and
does not alter normal `paper-rig/1` output.
Use `rig diff <baseline-model> <candidate-model>` to review a valid declarative
candidate by its stable-ID resolved effects; compatible differences are
non-failing evidence and the command never writes source files.
The workbench **Patch** tab can copy a `paper-rig/model-patch-1` artifact for
additive joint-local edits at an exact existing keyframe. It deliberately rejects
global/proportion/interpolated or rigid-child-translation edits. Apply the
artifact explicitly with `applyModelPatch`, validate the candidate, and review
it with `rig diff`; the workbench never writes model files.
Use the paused previous/next onion skins and the current-pose eight-heading
turntable for quick animation/occlusion review before opening the full
directional matrix. They are diagnostic UI only and never enter exported SVG.

Reusable motion timing lives in `rigs/motion-recipes/`. Model `motion` plans are
validated declarations but ordinary `loadModel()` resolution deliberately omits
them for compatibility. Use `loadModelMotion()` / `resolveModelMotion()` or CLI
`--motion`; use `loadModelConfigured()` when composing motion, attachments, and
appearance.
Recipes own phase timing and normalized block curves, while models author only
joint-local layer amplitudes. Resolution emits ordinary clips. Never teach a
renderer or consumer to evaluate recipes, and never bypass phase/event/contact/
limit/bone-length audit failures with ad hoc keyframes.

Reusable semantic paint lives in `rigs/paint-primitives/`. Model `appearance`
plans are validated declarations but ordinary `loadModel()` resolution omits
them. Use `loadModelAppearance()` or CLI `--paint`. Every placement targets a
rigid two-axis plate through an explicit right-handed surface frame and bounded
normalized region. The 1.0 grammar is closed absolute `M/L/Q/C/Z` only; do not
bypass containment with arbitrary SVG/CSS or world-space coordinates. Extend
the versioned contract before adding strokes, holes, or true masks.

Reusable attachments live in `rigs/modules/`. Model `attachments` entries are
validated declarations but ordinary `loadModel()` resolution deliberately omits
them for compatibility. Use `loadModelAssembly()` / `resolveModelAssembly()` or
CLI `--attachments` to inspect the assembly. Module geometry uses module-local
coordinates and stable generated IDs `<instance>__<local-id>`; never author a
reusable module in model/world coordinates or patch it into a resolved rig.
Authored model `slots` can be joint- or plate-owned. Plate slots require an
explicit surface frame and bounded plate-local region; module geometry/bounds
must fit that region after scale and attachment-frame alignment. Use
`rig audit <model> --attachments` to review module geometry and slot overlays
across the canonical pose/camera matrix.

## Tests

- `npm test` — headless parity: every captured creature compiles, validates, and
  renders identically to the original workbench, and each declarative model
  resolves byte-identical to its golden rig. No browser; runs in seconds.
- `npm run test:workbench` — regenerates the workbench and asserts it is
  behavior-identical to the current package compiler across all
  models/clips/times/cameras, including patch-preview UI states (needs Chromium).

## Regenerating fixtures / the HTML

`paper-rig-workbench.html` is generated by `rig build-workbench`; edit the sources
(`packages/`, `rigs/`, `apps/workbench/`), not the HTML. The golden fixtures come
from `npm run capture-fixtures` against `fixtures/paper-rig-workbench.baseline.html`.
The one-time extraction that seeded the packages is documented in
`scripts/extract-*.mjs` (kept for provenance).
