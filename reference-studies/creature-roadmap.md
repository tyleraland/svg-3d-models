# Creature refinement and expansion plan

Created 2026-10-28. This file is the durable progress record: update it before
pausing and after each creature commit. Work on one creature at a time, in the
order below. Planning does not start implementation automatically.

## Resume checkpoint

- Status: R2b King Cobra complete and committed; stopped between creatures.
- Next milestone: R3 Centaur.
- Prerequisite completed: horse rear-and-stomp committed separately as
  `83cf5be`. Unrelated `.DS_Store` remains excluded.
- Last completed milestone / commit: R2b King Cobra / `5d44d9e`.
- Active creature / stage: none.
- Open decisions or blockers: none blocking Centaur. Flying-bird variant handling
  is specified below; source action availability must be inspected per model.
- Next action: review the Centaur source and refined Horse alongside the
  WildMesh Horse reference; refine equine proportions and the torso junction
  before idle, walk, run and attack.

To resume, read this checkpoint, the active creature's study, and `git status`;
continue from recorded evidence instead of restarting the study. Do not mark a
creature complete until its review, checks, documentation and commit are done.

## Scope and sequence

WildMesh root:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/`.
References below are candidate folder names, not promises about their actions.
Inspect the actual mesh, skeleton, action contents, FPS and frame ranges first.
Use the inventory as a starting point; it is not a substitute for inspection.

### Phase 1 — refine existing creatures

| ID | Status | Creature and reference | Shape and animation goals |
|---|---|---|---|
| R1 | complete | Crab — Crab_Stylized; HermitCrab_Stylized as secondary reference | Broad carapace, believable leg stance and hinged claws; one claw distinctly larger. Idle, forward walk/run, sideways walk/run, coordinated support groups, and claw attack. Keep forward and sideways clips separately selectable. |
| R2a | complete | Serpentine: anaconda — Anaconda_Stylized | Heavy continuous silhouette, distributed traveling body waves, grounded travel, raised-head posture, strike and recovery. Establish reusable snake structure without a hood. |
| R2b | complete | Serpentine: king cobra — KingCobra_Stylized | Distinct hood and neck proportions, raised forebody, traveling waves, controlled idle, walk/run equivalents and a sudden strike. Preserve the anaconda variant. |
| R3 | queued | Centaur — Horse and the refined SVG horse | Reuse equine proportions, articulated legs and gait timing; integrate the humanoid torso cleanly. Idle, walk, run and attack with explicit support/weight transfer. Review the torso junction and arm overlap through the turntable. |
| R4 | queued | Flying bird: eagle and crow study — Eagle_Stylized, BaldEagle, Crow/Raven | Refine existing flyingBird as the eagle: hooked beak, head/body ratio, wing folding, span and tail. Compare crow proportions now and identify reusable avian structure. Idle, grounded walk/run, flight/flap/glide, and airborne peck attack. Author the separate crow model in N1. |

R2a and R2b are separate creature milestones and commits. Retain the existing
`serpentine` identity as a compatible entry where practical; choose and document
explicit variant IDs during R2a. R4 does not replace the eagle with a crow.

### Phase 2 — author new models

Each row includes shape/proportions first, then idle, walk, run and attack.
For nonstandard locomotion, name the equivalent clips clearly in the workbench.
Reuse structure where appropriate while keeping each creature independently
selectable. Commit every row before proceeding to the next.

| ID | Status | Creature | Candidate reference | Distinctive requirements |
|---|---|---|---|---|
| N1 | queued | Flying bird: crow | Crow, Raven | Separate eagle/crow silhouettes; crow beak, wings and tail; grounded gaits, flight and peck. Reuse R4's avian structure. |
| N2 | queued | Deer, without antlers | Doe, FemaleDeer, Deer | Slender ungulate proportions, long ears and light gait; bite attack; no antlers. |
| N3 | queued | Moose | Moose | Tall shoulders, long muzzle/legs and broad antlers; goring attack. |
| N4 | queued | Bull | Cow, Buffalo as secondary anatomy reference | Heavy forequarters and neck, horns; goring attack. Inspect reference sex/anatomy rather than assuming a folder supplies a bull. |
| N5 | queued | Cow, without horns | Cow | Distinct bovine body; hornless silhouette and shove attack. |
| N6 | queued | Mountain Goat | MountainGoat, Goat | Compact mountain stance, appropriate horns and hooves; head-driven attack. |
| N7 | queued | Boar | WildBoar, Boar, Warthog | Low heavy forequarters, short legs, tusks; charge/tusk attack. |
| N8 | queued | Camel | Camel, Camel_Stylized | Reference-led hump count, long neck and leg proportions; distinct pacing; select attack after action inspection. |
| N9 | queued | Kangaroo | Kangaroo | Upright balance, large hind feet and substantial tail; hop locomotion; separate punch and tail-supported kick attacks. Explicit tail support during kick. |
| N10 | queued | Monkey | Monkey_Stylized | Primate limb/tail proportions and grounded movement; choose attack from inspected reference and document adaptations. |
| N11 | queued | Small rodent: rat | Rat | Low body, small paws and long tail; scurry/walk, run and bite. |
| N12 | queued | Badger | HoneyBadger | Broad low body, short sturdy limbs; walk/run and bite or claw attack selected from reference. Record species differences if adapting honey-badger anatomy. |
| N13 | queued | Ostrich | Ostrich_Stylized | Separate from Chicken; long neck, long articulated legs and reduced wings; walk/run and reference-led kick or peck. |
| N14 | queued | Goose | Goose | Long neck, heavy body, webbed feet, folded wings; grounded walk/run and bite/peck. Flight/swim are optional follow-ups, not prerequisites. |
| N15 | queued | Tortoise | Tortoise_Stylized | Rigid shell enclosing limb roots, low splayed stance; idle, slow/fast travel equivalents and bite. Avoid forcing an implausible mammalian run. |

### Phase 3 — deferred, outside WildMesh

Do not begin these until Phase 2 is complete or the user changes priorities.

- [ ] Lizard: iguana / Komodo-dragon form. Find suitable anatomy and motion references.
- [ ] Lizard: crocodilian form. Keep distinct from the iguana/Komodo identity;
  WildMesh crocodilians may supplement a broader reference search.
- [ ] Dragon: pause to choose dragon archetypes and obtain suitable references
  before defining model scope. Do not force every dragon into one silhouette.

## Repeatable creature workflow

1. **Reference study.** Open the source in a separate Blender study scene,
   preserving other scenes. Record source path, species, dimensions/ratios,
   coordinate convention, native action names, FPS and key poses in
   `reference-studies/<creature>.md`. Distinguish observed motion from authored
   adaptations; document missing actions. Use references to author our plates
   and curves rather than importing mesh assets into the runtime.
2. **Shape and proportions.** Establish a neutral pose and recognizable top,
   side, front and oblique silhouette in the existing paper-rig style. Review
   joint placement, limb lengths, major masses, appendages and connector burial
   before tuning animation. Keep the detail level comparable to current models.
3. **Idle.** Establish support contacts and grounded anatomy. Ground remains
   fixed on XY; shadows follow the ground rather than body bounce. Flying idle
   and raised snake poses must have explicit support/flight semantics.
4. **Walk, then run.** Author distinct timing, support intervals, recovery arcs
   and whole-limb articulation. Check upper and lower segments, body weight
   transfer, loop closure and intermediate poses. Add the extra locomotion clips
   required by the milestone, including crab sideways motion.
5. **Attack.** Separate anticipation, strike/contact and recovery. Make the
   action legible at token size; articulate appropriate body and limbs. Add
   separate selectable attacks where required, especially Kangaroo. Preserve
   useful existing attacks instead of silently replacing them.
6. **Directional and motion review.** Inspect moving and paused poses, onion
   skins and the turntable; review the matrix described below. Fix geometry,
   layering and support defects before accepting new fixtures.
7. **Validation and delivery.** Run applicable gates below, rebuild the
   workbench, update the creature study and checkpoint, and commit this creature
   with its tests and generated outputs. Only then start the next milestone.

A pause is allowed at any stage. Record exact source files, clips, poses/cameras,
remaining failures, output artifact locations and the next concrete action.
Keep important evidence in the repo; `/tmp` screenshots are disposable and must
not be the only resumption record. A partial-work commit, if needed for handoff,
must be explicitly labeled and does not satisfy the creature completion gate.

## Pipeline and reuse

- Author `rigs/models/*.json` against reusable `rigs/families/*.json`; inspect
  existing family users before changing shared geometry. Add a family only when
  anatomy requires it. Reuse horse structure for Centaur and shared avian/snake
  structure for their variants without coupling species-specific proportions.
- Reuse schema primitives, declarative attachments, motion recipes, grounding
  helpers and author-time clip baking where they fit. Output ordinary joint-local
  clips with contacts/events/limits; do not add runtime IK or recipe evaluation.
- Follow the README authoring workflow. Historical `gen-*` extraction scripts
  are provenance, not a new-model scaffolding interface.
- Add new models to discovery/workbench paths as required by the existing code;
  ensure every new ID, optional clip and variant participates in audits, browser
  parity and fixture coverage. Remove fixed-count assumptions when expanding
  the current 32-model catalog.
- Edit `apps/workbench/`, `packages/` and `rigs/` sources; regenerate
  `paper-rig-workbench.html`. Use `rig explain` for surprising resolved values
  and `rig diff` to review stable-ID effects.

## Regression and completion gates

Every creature needs both independent correctness evidence and visual review.
Browser/compiler parity and golden equality alone can preserve the same bug in
both outputs; see `occlusion-regressions.md` for prior failures.

- Review all clips at bind/idle, support changes, maximum extension, attack
  extremes and recovery. Include interpolated times, not only authored keys.
- At minimum review all eight headings at elevations 0, 45, 60, 75 and 90;
  add intermediate headings around overlap transitions and denser coverage for
  risky anatomy. Top-down review is mandatory for buried legs/connectors;
  side-on review is mandatory for foot contact and body attitude.
- Exercise independent occlusion checks for plates and gaskets; cover limb vs
  torso, near/far swaps, head/neck and species-specific appendages. Add meaningful
  invariant tests and, for a new generic rule, mutation tests showing the defect
  is caught. Do not solve species bugs with arbitrary permanent foreground order.
- Check bone lengths, joint limits, contact heights/sliding, loop seams,
  support/flight intervals, ground penetration, fixed ground/shadow and framing.
  Declare intended asymmetry (Crab's claw size) so it is not mistaken for a bug.
- Run focused creature tests and audits, then `npm run check` per repository
  guidance. Review advisory warnings explicitly; record accepted pre-existing
  warnings rather than claiming a clean audit. A shared compiler/family change
  requires review of affected models beyond the active creature.
- Rebuild with `npm run build-workbench`; run `npm run test:workbench` with the
  affected models covered, including every new optional clip. Broaden browser
  coverage when shared behavior changes. Inspect the actual workbench visually.
- Update goldens only after reviewing intended output changes. Include relevant
  rig/package/render fixtures and generated workbench in the creature commit.
- Record evidence and commit SHA below. Commit after each creature; pushing is
  separate and is not implied by this plan. Do not bundle the next creature.

## Progress log

Append one entry per completed creature, and maintain the resume checkpoint.

```text
Milestone / creature:
Status / stage:
Reference study and source paths:
Shape decisions:
Clips completed / adaptations:
Visual review (poses, headings, elevations):
Checks and results / accepted warnings:
Changed files / durable evidence:
Commit:
Remaining issues:
Next action:
```

### R1 Crab — completed 2026-10-29

- Reference study: [crab.md](crab.md), native Crab_Stylized Blender file.
- Shape: broad horizontal shell cap, rounded lower body, fanned pointed legs,
  eye stalks, larger right claw and hinged pincers; four leg pairs retained.
- Clips: idle, forward walk/run, sideways walk/run, arcing claw strike and snap.
  Faster gaits are authored adaptations because the source has no Run action.
- Evidence: seven focused tests pass, including 6,336 directional/pose views,
  1,201 interpolated samples per requested clip, support speed/contact checks,
  and an overhead occlusion mutation test. Default Crab audit: 800 views,
  zero issues and zero warnings.
- Full `npm run check` passed (197 tests at that run; the two additional Crab
  support/occlusion tests subsequently passed in the focused seven-test suite).
  All 32 models validated; ordinary/motion/paint audits passed. Catalog advisory
  warnings remain: 42 ordinary, 40 motion, 42 paint; Crab contributes none.
- Rebuilt workbench; Crab browser parity passed 161/161 outputs, authoring UI
  checks passed, zero console errors. Direct UI review included overhead and
  oblique neutral/attack poses. Generated fixtures were reviewed and refreshed.
- Implementation commit: `261db53`. Horse prerequisite commit: `83cf5be`.
- Remaining scope: left/right mirrored lateral clip variants and new hit/KO
  behavior are optional follow-ups, not required for R1.
- Next: R2a Anaconda. No implementation of the next creature has started.

### R2a Anaconda — completed 2026-10-29

- Reference study: [anaconda.md](anaconda.md), native Anaconda_Stylized Blender
  file; shape renders and twenty-one pose samples from ten actions reviewed.
- Identity: existing `serpentine` ID retained and labeled Anaconda; King Cobra
  will be a distinct entry. Original spine IDs retained with intermediate joints.
- Shape: long tapered 24-point chain, compact lifted head, separate hinged jaw,
  buried small gaskets; adjacent rigid spans retain the existing paper style.
- Clips: low idle, slow/fast traveling waves, rise, raised idle, lower, and a
  rising/uncoiling strike with jaw closure over 116 ms. Rear belly support stays
  low and braces through the strike; front support releases/returns explicitly.
- Seven focused tests pass: 6,720 pose/camera views, 1,201 interpolated samples
  per requested clip, directional wave-delay and transition checks, and an
  independent body-overlap/depth-order mutation check.
- Full `npm run check` passed: 206 tests, 32/32 model validation, ordinary/motion/
  paint audits and release checks. Catalog advisory warnings: 41 ordinary,
  39 motion, 41 paint; Anaconda contributes none.
- Default Anaconda audit: 840 views, zero issues/warnings. Browser parity:
  181/181 outputs, authoring UI checks and fixed-shadow framing regression passed;
  zero console errors. Direct workbench review included rise/raised idle and
  attack windup/contact. A discovered editor-shadow crop was fixed generically.
- Implementation commit: `de8029e`. Rebuilt HTML and refreshed Anaconda fixtures
  are included. No source mesh, texture or animation channels were imported.
- Next: R2b King Cobra. No implementation of the next creature has started.

### R2b King Cobra — completed 2026-10-29

- Reference study: [king-cobra.md](king-cobra.md), native KingCobra_Stylized
  Blender mesh/actions; eight actions sampled at twenty-one poses each.
- New independent `kingCobra` model/family; workbench label King Cobra · hooded
  snake. Anaconda (`serpentine`) remains byte-identical to its golden.
- Shape: slender tapered chain, compact head, head-aligned jaw and two rigid
  hinged hood panels that spread in threat and fold for ground travel.
- Clips: raised threat idle, low idle, slow/fast ground travel, rise, raised
  hold, lower, rapid hooded bite. Bite windup-to-contact is 92 ms; rear support
  braces and jaw closes. Travel is authored because the native file has no
  Walk/Run action. Native circular bite/death remain optional follow-ups.
- Six focused tests: 7,680 pose/camera views, 1,201 interpolated samples per
  requested clip, hood edge-length preservation, contacts, wave direction,
  transitions, frontal jaw alignment and hood/core draw-order mutation coverage.
- Full `npm run check` passed: 212 tests, 33/33 models, source validation,
  ordinary/motion/paint audits and release checks. Catalog warnings remain
  41 ordinary, 39 motion, 41 paint; King Cobra contributes none.
- Default Cobra audit: 960 views, zero issues/warnings. Final Cobra/Anaconda
  browser parity: 382/382 outputs, selector/shadow/UI checks passed, zero console
  errors. Frontal, side and oblique hood/face views reviewed in the workbench.
- Fixed catalog-size assumptions; the bundle discovers additional models and
  the browser gate checks complete selector coverage. Updated the framing VM
  harness with its cameraBasis dependency. Generated HTML and Cobra fixtures
  are included in the implementation commit.
- Implementation commit: `5d44d9e`.
- Next: R3 Centaur. No implementation of the next creature has started.
