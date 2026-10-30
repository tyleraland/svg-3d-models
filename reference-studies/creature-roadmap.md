# Creature refinement and expansion plan

Created 2026-10-28. This file is the durable progress record: update it before
pausing and after each creature commit. Work on one creature at a time, in the
order below. Planning does not start implementation automatically.

## Resume checkpoint

- Status: N10 Monkey complete; stopped between creatures.
- Next milestone: N11 Rat.
- Prerequisite completed: horse rear-and-stomp committed separately as
  `83cf5be`. Unrelated `.DS_Store` remains excluded.
- Last completed milestone / commit: N10 Monkey / `f896ed8`.
- Latest follow-up: ungulate muzzle joins, bovine tail mounts and stout Cow / `8a86987`.
- Active creature / stage: none; stopped between creatures.
- Open decisions or blockers: none.
- Next action: inspect the WildMesh Rat reference in Blender when N11 is requested.

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
| R3 | complete | Centaur — Horse and the refined SVG horse | Reuse equine proportions, articulated legs and gait timing; integrate the humanoid torso cleanly. Idle, walk, run and attack with explicit support/weight transfer. Review the torso junction and arm overlap through the turntable. |
| R4 | complete | Flying bird: eagle and crow study — Eagle_Stylized, BaldEagle, Crow | Refined existing flyingBird as Eagle: compact hooked bill, fuller chest, broader secondary chord, short fan and talons. Standing idle, grounded walk/run/hop, powered flight/glide, airborne peck and separate talon strike. Native Crow proportions/actions studied; separate model remains N1. |

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
| N1 | complete | Flying bird: crow | Crow | Separate slim body, straight bill and long narrow tail; grounded idle/walk/run, wing-assisted hop, flight/glide and angular airborne peck. Shared author-time avian baker; Eagle output unchanged. |
| N2 | complete | Deer, without antlers | FemaleDeer primary; Doe and Deer inventories | Antlerless light barrel, long slender legs, leaf ears and short tail; grounded idle, four-beat walk, light gallop and authored bite. |
| N3 | complete | Moose | Moose | Tall shoulders, long muzzle/legs and broad antlers; goring attack. |
| N4 | complete | Bull | Cow, Buffalo as secondary anatomy reference | Heavy forequarters and neck, horns; goring attack. Inspect reference sex/anatomy rather than assuming a folder supplies a bull. |
| N5 | complete | Cow, without horns | Cow | Distinct bovine body; hornless silhouette and shove attack. |
| N6 | complete | Mountain Goat | MountainGoat, Goat | Compact mountain stance, appropriate horns and hooves; head-driven attack. |
| N7 | complete | Boar | WildBoar, Boar, Warthog | Low heavy forequarters, short legs, tusks; charge/tusk attack. |
| N8 | complete | Camel | Camel, Camel_Stylized | Reference-led hump count, long neck and leg proportions; distinct pacing; select attack after action inspection. |
| N9 | complete | Kangaroo | Kangaroo | Upright balance, large hind feet and substantial tail; hop locomotion; separate punch and tail-supported kick attacks. Explicit tail support during kick. |
| N10 | complete | Monkey | Monkey_Stylized | Primate limb/tail proportions and grounded movement; choose attack from inspected reference and document adaptations. |
| N11 | queued | Small rodent: rat | Rat | Low body, small paws and long tail; scurry/walk, run and bite. |
| N12 | queued | Badger | HoneyBadger | Broad low body, short sturdy limbs; walk/run and bite or claw attack selected from reference. Record species differences if adapting honey-badger anatomy. |
| N13 | queued | Ostrich | Ostrich_Stylized | Separate from Chicken; long neck, long articulated legs and reduced wings; walk/run and reference-led kick or peck. |
| N14 | queued | Goose | Goose | Long neck, heavy body, webbed feet, folded wings; grounded walk/run and bite/peck. Flight/swim are optional follow-ups, not prerequisites. |
| N15 | queued | Tortoise | Tortoise_Stylized | Rigid shell enclosing limb roots, low splayed stance; idle, slow/fast travel equivalents and bite. Avoid forcing an implausible mammalian run. |

### Phase 3 — deferred, additional references needed

Do not begin these until Phase 2 is complete or the user changes priorities.

- [ ] Lizard: iguana / Komodo-dragon form. Find suitable anatomy and motion references.
- [ ] Lizard: crocodilian form. Keep distinct from the iguana/Komodo identity;
  WildMesh crocodilians may supplement a broader reference search.
- [ ] Dragon: pause to choose dragon archetypes and obtain suitable references
  before defining model scope. Do not force every dragon into one silhouette.
- [ ] Dinosaurs: choose species/archetypes and suitable references before defining
  individual model milestones.
- [ ] Gorilla: find suitable anatomy and animation references.
- [ ] Walrus: find suitable anatomy and animation references.

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

### R3 Centaur — completed 2026-10-29

- Reference study: [centaur.md](centaur.md). WildMesh Horse inspected in Blender;
  21 samples each of Idle, Walk, Trot, Canter and Gallop, plus top/profile renders.
  The existing refined Horse supplies the equine geometry; its output is preserved.
- Shape: longer level horse barrel, rounded shoulder/haunch masses, articulated
  fore carpi and rear hocks, tapered waist/withers bridge and upright human torso.
- Clips: planted idle, four-beat walk, faster gallop-style run with suspension,
  and a phased braced hand strike with torso twist and right-hand guard. The
  human balance/attack are authored adaptations, not native Horse combat data.
- Forearm/hand sorting references the torso at their height; shoulder/bicep
  sorting references upperShoulders. Fixed a near-arm burial at 45°/225° and
  added a mutation test that reproduces it. Increased idle bake density to meet
  existing strict planted-hoof tolerance without loosening tests.
- Seven Centaur tests pass: 5,376 pose/camera views, 1,201 interpolated samples
  per requested clip, limits/lengths/contacts/loops, gait/strike and authoring
  control mapping. Combined Centaur/Horse grounding run: 17/17 passed.
- Full `npm run check`: 219 tests passed, 33/33 models, source validation,
  ordinary/motion/paint audits and release checks. Catalog warnings: 40 ordinary,
  38 motion, 40 paint; Centaur contributes none.
- Centaur audit: 480 views, zero issues/warnings. Horse/Centaur browser parity:
  262/262 outputs matched, authoring UI passed, zero console errors. Direct review
  included 45°/225° arms/junction, side/overhead and strike windup/contact.
- Shared quadruped authoring now supports upperNeck/upperHead controls. Ordinary
  generated clips still ship without runtime IK. Rebuilt HTML and Centaur
  fixtures included; existing Horse output remained golden-identical.
- Implementation commit: `36bef0c`.
- Next: R4 Eagle / flying-bird refinement and Crow study. No next-creature
  implementation has started; the separate Crow model remains N1.

### Centaur chest recovery follow-up — completed 2026-10-29

- User reported excessive upper-chest pivot near the end of attack.
- Replaced the foreshortened span-driven chest capsule with a rounded chest mass
  on a torso-midpoint helper. Attack curves and hand/foot trajectories unchanged.
- Regression measures silhouette swivel at sixteen headings/five elevations,
  verifies center attachment, and detects restoration of the old faulty span.
- Eight focused Centaur tests, all 220 headless tests, full `npm run check`,
  121/121 browser comparisons and authoring UI passed; zero browser console errors.
  Centaur audit remains 480 views with zero issues/warnings. Catalog warnings
  remain 40 ordinary, 38 motion and 40 paint.
- Implementation commit: `462e480`. Next milestone remains R4 Eagle/Crow study.

### Centaur shoulder alignment follow-up — completed 2026-10-29

- Replaced the screen-aligned upper shoulder ellipse with a rigid bridge between
  the left/right shoulder centers; reviewed attack recovery at 60°/135°.
- Added projected-axis alignment checks across eight phases, six elevations and
  sixteen headings, with a mutation reproducing the old level-plate failure.
- Nine focused tests, all 221 headless tests, full `npm run check`, 480 audit
  views with zero issues/warnings and 121/121 browser comparisons passed.
  Authoring UI passed with zero console errors.
- Implementation commit: `11511b0`. Next milestone remains R4 Eagle/Crow study.

### R4 — Eagle refinement and Crow study — completed 2026-10-29

- Opened native Eagle_Stylized and Crow scenes and imported BaldEagle's complete
  FBX in Blender 5.1.2. Recorded actual FPS, frame ranges, skeletons, 17-phase
  motion samples and side/front/top renders. Reproducible inspection tool saved.
- Eagle now has a fuller chest, compact hooked bill, broad secondary chord,
  short fan tail and articulated toes/hallux. Stable model ID `flyingBird` is
  labeled Eagle in the workbench.
- Added standing folded-wing idle and alternating ground run; refined walk,
  powered wingbeat and glide. Paired hop and sudden airborne peck retained;
  separate airborne talon strike adapts the diving pickup posture.
- Contact-aware author-time bake uses 240 samples (480 for hop), continuous hip
  Euler branches and ordinary local keyframes. Dense-bake workbench framing
  overflow fixed and regression-tested. Browser gate now includes talonStrike
  and avoids rebuilding UI for absent clips without dropping render outputs.
- Crow study saved in `reference-studies/crow.md`: slimmer body, straighter bill,
  longer tail; native walk/flight/look/jump actions inspected. No named attack in
  this scene. No separate Crow SVG authored yet; Raven remains an optional
  secondary reference requiring its own inspection.
- Focused bird/grounding tests: 24/24. Final full `npm run check`: 226 tests,
  33/33 models, source validation, ordinary/motion/paint audits and release checks
  passed. Catalog warnings remain 40 ordinary, 38 motion and 40 paint.
- Directional regression: 8,448 pose/camera views. Eagle audit: 720 views, zero
  issues/warnings. Browser parity: 201/201 outputs, authoring UI passed, zero
  console errors. Direct UI review included standing/run, top wing silhouette,
  peck and talon extension; final workbench left on powered flight at 45°/315°.
- Implementation commit: `1bf5102`. Phase 1 is complete; next is N1 Crow.

### N1 — separate Crow — completed 2026-10-29

- Used R4's native Crow Blender study and rechecked its sampled trajectories:
  Walk/WalkSpeed have matching relative foot excursions; Fly contains two cycles
  over 2.50 seconds. The faster SVG gait and peck are explicit adaptations.
- Authored a separate `crow` family/model and workbench selector: slim horizontal
  body, small head, long straight bill, narrow secondary chord, long narrow tail
  with edge-on quill thickness, slender legs and articulated toes/hallux.
- Added alert grounded idle, alternating walk/run, paired wing-assisted hop,
  symmetric articulated flight, glide and a 75 ms angular airborne peck.
- Extracted the pure shared author-time avian baker. Eagle regeneration and
  resolved output remain exactly golden-identical; no renderer/consumer changes.
- Seven focused Crow tests passed, including 7,392 pose/camera views, 1,201
  interpolated samples per ground clip, loop/length/contact/Euler checks, flight
  symmetry and a bill-gasket occlusion mutation. Baker purity/default parity tested.
- Full `npm run check`: 233 tests and all 34 models passed, including sources,
  ordinary/motion/paint audits and release checks. Catalog warnings remain
  40 ordinary, 38 motion and 40 paint; Crow contributes none.
- Crow audit: 720 views, zero issues/warnings. Browser parity: 181/181 outputs,
  authoring UI passed and zero console errors. Reviewed oblique idle, side run,
  assisted hop, top wing/body/feet and peck. Final workbench left at 45°/270° idle.
- Implementation commit: `ad90c33`. Next is N2 Deer without antlers; no Deer work
  has started. Unrelated `.DS_Store` remains excluded.

### Crow/Eagle wing follow-up — completed 2026-10-29

- Gave folded Crow/Eagle wings a small shoulder and distal-panel cant so their
  surfaces remain visible at frontal/overhead cameras and tips clear the body.
- Crow hop assist now unfolds the elbow/wrist first, then sweeps the shoulder
  outward to a broad apex; tips stay outside the torso throughout the transition.
  Ground contacts and airborne flight/glide/attacks are unchanged.
- Reviewed Chicken, Harpy and Angel frontal silhouettes; their structural wing
  plates retain thickness and required no source changes.
- Added projected-area/body-margin tests through nineteen elevations and both
  frontal headings, 1,201-sample hop reach/clearance checks, and mutations that
  restore the invisible fold and inward-folded apex.
- All 236 tests, full 34-model catalog gates and 382/382 Crow/Eagle browser
  comparisons passed. Authoring UI passed with zero console errors; catalog
  advisory counts remain 40 ordinary, 38 motion and 40 paint.
- Implementation commit: `e2c0407`. Next remains N2 Deer; no Deer work started.

### N2 — antlerless Deer — completed 2026-10-29

- Opened native FemaleDeer, Doe and Deer scenes in Blender 5.1.2. FemaleDeer is
  the antlerless primary: 47 bones, 43 actions, 24 FPS. Sampled 21 phases and
  rendered idle breathing, walk, run and feeding; saved a reproducible study tool.
  Male Deer's antler meshes were identified and not reused.
- Authored separate `deer` family/model: light low barrel, long articulated legs,
  narrow muzzle, prominent canted leaf ears with structural spines and short tail.
  No mane, saddle anchor, antlers or horn geometry. Horse output unchanged.
- Added four-hoof idle with breathing/ears, staggered four-beat walk, light run
  with suspension and an authored braced bite with 92 ms jaw closure. No named
  native attack exists in the primary scene; feeding articulation informed the
  adaptation. All clips use ordinary local rotations and baked contact handling.
- Seven Deer tests passed: anatomy, visible ear leaves, 1,201 interpolated samples
  per clip, lengths/limits/contacts/loops, whole-leg movement and bite behavior.
  Independent occlusion/framing matrix covers 4,224 views; jaw-seam mutation tested.
- Full `npm run check`: all 243 tests and 35/35 models passed, with source,
  ordinary/motion/paint audits and release checks. Deer audit: 480 views, zero
  issues/warnings. Catalog warning counts remain 40 ordinary, 38 motion, 40 paint.
- Browser parity: 121/121 outputs, authoring UI passed, zero console errors.
  Direct review included side/oblique/front/top shape, open jaw, walk and run
  suspension. Workbench left on Deer idle at 45°/270°.
- Implementation commit: `72fa988`. Next is N3 Moose; no Moose work has started.
  Unrelated `.DS_Store` remains excluded.


### N3 — Moose — completed 2026-10-29

- Opened native `Moose/SK_Moose.blend` in Blender 5.1.2: 105 bones, separate
  body/antler meshes, 99 actions at 25 FPS. Sampled 21 phases and rendered idle,
  fast walk/run and grazing/threat transitions; added reproducible study script.
- Authored independent `moose` family/model with tall shoulders/hump, deep barrel,
  long articulated legs, hanging muzzle/bell and short tail. Two rigid skull-owned
  racks have sloped broad palm polygons, five outer tines and a forward brow each.
  Existing Deer and Horse output unchanged.
- Added grounded breathing idle, four-beat walk, fast gallop with suspension and
  a braced antler gore: lower/aim, 224 ms drive, rapid lift and full recovery.
  Native library has no named combat action; the gore is explicitly authored
  from observed neck/threat articulation. All four feet brace through the attack.
- Nine focused tests passed, including 1,201 interpolated support samples per
  clip and a 4,608-view independent order/framing matrix. Antlers retain area in
  front/profile/top and rigid skull distances. Deliberate jaw-seam and far-antler
  order mutations are caught. Dense checks fixed a diagonal antler export crop.
- Full `npm run check`: all 252 tests and 36/36 models, source validation,
  ordinary/motion/paint audits and release checks passed. Moose adds zero audit
  issues/warnings; existing catalog advisories remain 40 ordinary, 38 motion,
  40 paint. Browser gate: 121/121 outputs, authoring UI passed, zero console errors.
- Direct workbench review included side/front/top/oblique anatomy, gallop
  suspension, lowered-rack impact and sharp lift; final view is idle at 45°/225°.
  Study and authoring scripts, declarative sources, regression tests, goldens and
  regenerated workbench are included. Implementation commit: `7722cbe`.
- Next is N4 Bull; no Bull work has started. Unrelated `.DS_Store` stays excluded.


### N4 — Bull — completed 2026-10-29

- Opened Cow, realistic Buffalo and stylized Buffalo in Blender 5.1.2: respectively
  76/127/45 bones, 24/106/18 actions and 24/24/60 FPS. Recorded 21 samples and
  rendered standing/gait/action key poses with a reproducible bovine study tool.
  Cow is visibly female with an udder; no named Bull asset exists. The SVG is an
  authored cattle bull using Cow body proportions, Buffalo mass and actual
  stylized Buffalo horn-attack references, without boss/beard/udder anatomy.
- Added independent `bull` family/model: deep barrel, powerful forequarters,
  short thick neck and shallow dewlap, broad head/muzzle, sideways leaf ears,
  long tufted tail, stocky articulated legs and paired pointed curved horns.
  Perpendicular rigid horn ribbons retain edge-on thickness without capsule
  caps. Existing Horse, Deer and Moose output is unchanged.
- Added four-hoof breathing idle, deliberate four-beat walk, fast gallop with
  suspension, and horn gore/toss: crouch/recoil, lower, 196 ms forward drive,
  140 ms upward toss with yaw sweep, recover. Native traveling attack footsteps
  are explicitly adapted to an in-place four-hoof brace using baked local IK.
- Nine focused tests pass: anatomy, horn area/rigidity, support/clearance and
  shadow stability through 1,201 interpolated samples per clip, lengths/limits/
  loop seams, whole-leg gaits and attack behavior. Dense independent occlusion/
  framing coverage: 4,608 views. Flattened-horn, frontmost-jaw and far-horn-over-
  nearer-ear mutations are detected independently of golden/browser equality.
- Full `npm run check`: all 261 tests, 37/37 source/model validations, ordinary/
  motion/paint audits and release checks passed. Bull adds zero audit issues or
  warnings; existing catalog advisory totals stay 40 ordinary / 38 motion /
  40 paint. Browser comparison: 121/121 outputs, authoring UI passed, zero errors.
- Direct workbench review included front/top/side/oblique anatomy, walk support,
  gallop suspension, goring impact and upward toss. Workbench left at idle,
  45° elevation / 225° heading. Sources, scripts, study, tests, fixtures and
  generated workbench are included. Implementation commit: `c890346`.
- Next is N5 hornless Cow; no Cow implementation has started. Unrelated
  `.DS_Store` remains excluded.


### N5 — hornless Cow — completed 2026-10-29

- Reopened native Cow in Blender 5.1.2 using the reusable bovine study tool:
  76 bones, 24 actions, 24 FPS. Refreshed neutral side/front/top and idle/walk/run/
  alert samples. The visible native small horns are deliberately omitted for
  the requested hornless variant. No native shove action exists.
- Added independent `cow` family/model with near-level long barrel, lighter
  shoulder/neck than Bull, longer face, sideways leaf ears, shallow dewlap,
  low rear udder/teats and long tufted tail. No horn/antler geometry or mounts.
  Existing Bull, Moose, Deer and Horse output remains unchanged.
- Added four-hoof breathing/chewing idle, native-duration four-beat walk, quick
  gallop and authored shove: slight head lowering, whole-body lean and about
  20 cm chest/head advance, 180 ms level contact hold, recovery. Four braced
  hooves stay fixed; ordinary local curves use author-time baked sagittal IK.
- Eight focused tests pass, including 1,201 interpolated support samples per
  clip and 4,608 camera/pose checks. Framing covers emitted SVG primitives and
  transforms as well as joints. Independent overhead underside coverage/order
  checks catch a foreground-udder mutation; a jaw-seam mutation is also caught.
- Full `npm run check`: all 269 tests and 38/38 source/model validations,
  ordinary/motion/paint audits and release checks passed. Cow adds no issues or
  warnings; catalog advisories stay 40 ordinary / 38 motion / 40 paint.
  Browser: 121/121 outputs, authoring UI passed and zero console errors.
- Direct workbench review included side/front/top/oblique anatomy, buried udder,
  walk support, gallop suspension and shove contact. Workbench left at idle,
  45° elevation / 225° heading. Sources, authoring script, study, tests, fixtures
  and regenerated workbench are included. Implementation commit: `323289b`.
- Next is N6 Mountain Goat; no Goat work has started. Unrelated `.DS_Store`
  remains excluded.


### N6 — Mountain Goat — completed 2026-10-29

- Opened native MountainGoat and Goat in Blender 5.1.2: 119/41 bones, 116/11
  actions, 24/60 FPS. Added reproducible inventories, 21-phase motion sampling
  and side/front/top/key-pose renders. Also inspected all 21 opaque MountainGoat
  A_* clips; no clear head-attack was selected from them. Domestic Goat's named
  ram-run supplied a tucked charging posture, not a literal impact clip.
- Added independent `mountainGoat` family/model: compact deep chest, sturdy
  articulated legs, narrow head/muzzle, upright/outward leaf ears, small hooves,
  short tail and narrow swept-back/outward-flaring horns. Rigid orthogonal horn
  ribbons preserve thickness and pointed tips. Other ungulates remain unchanged.
- Added alert breathing idle, four-beat walk, short supported gallop and a sharp
  braced head-butt with recoil/recovery. Walk/run carry the head lower, matching
  the native moving posture. Run stride/body rise respect compact leg reach and
  unchanged joint limits. The forehead advances about 28 cm over 182 ms, with
  a 78 ms contact interval; all four hooves brace through the authored attack.
- Nine focused tests pass: anatomy, projected horn volume/skull rigidity, lower
  moving head carriage, gait participation/footfalls, lengths/limits/loop seams,
  1,201 interpolated support samples per clip, head-butt behavior and a 4,608-view
  independent occlusion/full-SVG-framing matrix. Coplanar-horn, frontmost-jaw and
  far-horn-over-nearer-skull mutations are detected.
- Full `npm run check`: all 278 tests, 39/39 source/model validations, ordinary/
  motion/paint audits and release checks passed. No new Mountain Goat issues or
  warnings; catalog advisories remain 40 ordinary / 38 motion / 40 paint.
  Browser comparison: 121/121 outputs, authoring UI passed, zero console errors.
- Direct review covered native/SVG side/front proportions, horn flare, top
  burial, lower walk neck, gallop suspension and head-butt impact. Workbench left
  at idle, 45° elevation / 225° heading. Sources, study/authoring scripts, tests,
  fixtures and generated workbench are included. Implementation commit: `638995d`.
- Next is N7 Boar; no Boar work has started. Unrelated `.DS_Store` stays excluded.


### N7 — Boar — completed 2026-10-29

- Studied native WildBoar, Boar and Warthog in Blender: 89/110/134 bones,
  84/81/101 actions, 30/24/24 FPS. Reproducible study script inventories actions,
  samples 41 phases, and renders side/front/top and gait/attack key poses.
- Added independent Boar family/model with high shoulders, compact barrel,
  short articulated legs, long flat-ended snout, upright ears and short tail.
  Curved lower tusks follow the jaw; smaller upper canines follow the skull.
  Orthogonal ribbons retain volume; no Warthog warts or oversized tusks.
- Added breathing idle, four-beat walk, fast short gallop and a crouch/lunge with
  open-jaw upward tusk flick. Attack has a velocity-matched parabolic flight,
  fore then hind landing, compression and complete recovery. Four feet are
  grounded in idle; shadow stays fixed. Existing ungulate goldens are unchanged.
- Eight focused tests pass, including 1,201 interpolated contact/clearance
  samples per clip and 4,608 independent occlusion/full-SVG-framing views.
  Flattened tusk and promoted far-tusk mutations are detected. Maximum attack
  stance drift is approximately 5.4 micrometers, below the 10 micrometer bound.
- Full `npm run check`: 286 tests, 40/40 source/model validations, ordinary/
  motion/paint audits and release checks passed. Boar adds no issues/warnings;
  existing catalog advisories remain 40 ordinary / 38 motion / 40 paint.
  Browser comparison passed 121/121 outputs, authoring UI and zero console errors.
- Actual workbench review covered side/front/top/oblique shape, gait poses,
  tusk-lunge impact and playback. Workbench left at idle, 45° / 225°.
  Implementation commit: `b105403`. Study, authoring scripts, tests, fixtures and
  generated workbench are included.
- Next is N8 Camel; no Camel work started. Unrelated `.DS_Store` stays excluded.


### N8 — Camel — completed 2026-10-29

- Inspected native realistic Camel and Camel_Stylized in Blender 5.1.2:
  110/53 bones, 32/18 actions, 24/60 FPS. Reproducible study inventories actions,
  samples 41 phases and renders side/front/top and motion key poses. The realistic
  mesh is two-humped despite its `1hump` skeleton names; the stylized mesh has
  one hump. The SVG follows realistic anatomy and references stylized Bite.
- Added independent Camel family/model: two torso-owned humps, deep barrel,
  long rising S-neck, small head/ears, long muzzle, tall articulated legs, broad
  padded feet and hanging tail. Existing ungulate goldens remain unchanged.
- Added breathing/chewing idle with four fixed pads, a 1.5 s ipsilateral pace
  (hind precedes same-side fore by .12 cycle), .585 s suspended gallop with lower
  neck carriage, and a 1.4 s neck snap/bite. Attack head advances about .45 m and
  drops .44 m from preload; jaw closes 28° to 2° in 56 ms. Four pads brace and
  the ending pose exactly matches the start. Uses ordinary baked local clips.
- Nine focused tests cover anatomy/hump rigidity, chewing, pad/gasket containment,
  actual swing-peak phase coordination, whole-leg motion, lower run neck,
  lengths/limits/loops, 1,201 interpolated support samples per clip, bite behavior
  and 4,608 independent occlusion/full-SVG-framing views. Detached-hump and
  frontmost-jaw-seam mutations are caught. Dense framing caught extended-neck
  clipping; direct head-on review caught oversized circular foot connectors.
  Source fixes and regression checks cover both before final fixtures were saved.
- Final `npm run check`: 295 tests, 41/41 source/model validations, ordinary/
  motion/paint audits and release checks passed. Camel adds no issues/warnings;
  catalog advisories remain 40 ordinary / 38 motion / 40 paint. Browser parity:
  121/121 outputs, authoring UI passed and zero console errors.
- Actual workbench review covered side/front/top/oblique anatomy, foot connector
  symmetry, pacing support, lowered-neck gallop suspension and bite opening/
  closure. Workbench left at idle, 45° elevation / 225° heading. Study/authoring
  scripts, sources, tests, fixtures and generated workbench are included.
  Implementation commit: `2773e43`.
- Next is N9 Kangaroo, with separate punch and tail-supported kick attacks;
  no Kangaroo work started. Unrelated `.DS_Store` remains excluded.


### N9 — Kangaroo — completed 2026-10-29

- Inspected WildMesh native Kangaroo in Blender 5.1.2: 114 bones, 54 actions,
  30 FPS. Reproducible study inventories all actions, samples 41 phases and
  renders side/front/top plus motion key poses with full combat-pose framing.
  Slow walk is hands-and-tail assisted; trot/sprint are paired hops. The clear
  double-foot kick is `aggressive_attack_stomping_01`; `aggressive kick fwd`
  alone does not establish that motion. No named punch exists; boxing is an
  authored adaptation of the aggressive guard and native arm proportions.
- Added an independent 40-joint/33-plate Kangaroo: heavy haunches, upward-folded
  thighs, long shins and feet, narrow rising chest, small forearms/head, upright
  leaf ears and a substantial tapering tail. Existing 41 model goldens unchanged.
- Added upright breathing idle, 1.55 s pentapedal walk, .57 s paired airborne hop,
  separate 1.15 s punch and 1.45 s tail-supported double-foot kick. Punch lifts
  guard, extends one arm and recoils while the opposite hand guards. Kick shifts
  backward, leans/rises, lifts feet at .20, extends at .44 with soles presented,
  retracts, lands at .76 and recovers. Tail stays anchored before lift through
  landing; both attacks return exactly to idle. This is authored dynamic support,
  not a center-of-mass physics simulation.
- A supported low bind puts hand, hind-foot and tail contact offsets on Z=0;
  sagittal rebasing preserves world animation/bone lengths and shifts local
  rotation limits consistently. Upward-thigh atan2 wrapping is handled at
  authoring time and tested against 360° interpolation jumps. No compiler or
  runtime IK changes, reference mesh or reference animation payloads are needed.
- Eleven focused tests pass: anatomy/contact bind, idle support/shadow, slow
  support exchange, paired hop/suspension, guard/punch, anchored-tail kick and
  soles-up feet, lengths/limits/loops/angle continuity, 1,201 interpolated support
  samples per clip and 5,760 independent occlusion/full-SVG-framing views.
  Maximum contact error is approximately .0088 mm; kick tail drift .985 micrometers.
- Visual head-on review found inconsistent hand burial against the haunches.
  Forearms/hands now sort against actual chest surface depth. A direct overlapping
  hand/haunch/pelvis painter-order test catches a single-hand burial mutation;
  a promoted head-seam mutation is independently caught as well. Knee connectors
  fit the slender shins. Side/front/top/oblique anatomy, support exchange, hopping
  feet/suspension, punch and the tail-braced soles-up kick were reviewed in UI.
- Final `npm run check`: 306 tests, 42/42 source/model validations, ordinary/
  motion/paint audits and release checks passed. Kangaroo adds no issues/warnings;
  catalog advisories remain 40 ordinary / 38 motion / 40 paint. Browser parity
  explicitly includes `kick`: 141/141 outputs, authoring UI passed and zero errors.
- Workbench left at upright idle, 45° elevation / 225° heading. Study/authoring
  scripts, source model, tests, fixtures and generated workbench are included.
  Implementation commit: `f3291f6`.
- Next is N10 Monkey; no Monkey work started. Unrelated `.DS_Store` stays excluded.


### Follow-up — ungulate joins and Cow proportions — 2026-10-29

- User-reported broad muzzle triangle bases are now buried internal joins on
  Bull, Boar, Mountain Goat and Cow. The head covers the actual base corners;
  exposed snout geometry remains outside the opaque head/muzzle envelopes.
  Uses source `under-core` declarations rather than camera-specific draw hacks.
- Bull's paired horn ribbons bend slightly farther forward together: final
  center X .205 m instead of .150 m, retaining height/lateral span and skull
  rigidity. Token ground Y 60→59 preserves full SVG margin during the low gore.
- Bull tail root moves from inside the pelvis to its perimeter. A short 4.5 cm
  inset socket replaces the long pelvis-to-root strip; the free shaft/tuft use
  pelvis-relative depth and remain outside the side silhouette through every
  authored gait. Cow receives the corresponding perimeter/socket correction.
- Cow becomes moderately stouter: barrel .76→.88 m, pelvis height 1.24→1.16 m,
  span 1.22→1.16 m, fuller .54 × .72 m shoulders and .32 m neck. The pelvis
  ellipse is an underlying rump cap, covered by the continuous barrel where
  they overlap. Grounded legs and clips are rebaked with unchanged timings;
  udder remains embedded beneath the deeper belly. Other three models' clip
  frames/timings are unchanged; the other 38 model goldens remain byte-identical.
- Forty focused tests pass, including six new join/proportion regression tests.
  Direct corner coverage/painter-order tests cover 2,560 muzzle views; tail-root
  and external-shaft checks cover 976 side poses. Negative controls restore the
  exposed triangle, promote it or the rump, and move the tail root internally.
  Four dense directional matrices remain green; Bull now checks full emitted
  SVG bounds as well as joints. Provenance API comparisons confirm stable-ID
  effects confined to the intended families and Cow's derived clips.
- Actual workbench review covers the reported 45° / 180° muzzle views, Bull's
  left / 90° tail through opposite run phases, horn bend and Cow side/oblique
  body proportions. Workbench left at Cow idle, 45° / 225°.
- Full catalog gate passed: 312 tests, 42/42 source/model validations, ordinary/
  motion/paint audits and release metadata. Existing advisories stay 40/38/40.
  Browser comparison: 484/484 outputs identical, authoring UI checks passed, zero
  console errors. Implementation commit: `8a86987`.
- N10 Monkey remains next; no new creature work started. `.DS_Store` excluded.

### N10 — Monkey — 2026-10-29

- Native `Monkey_Stylized/SK_Monkey_Stylized.blend` studied in Blender in a
  separate appended scene. Loaded all 13 actions, 94 bones, 60 FPS; sampled
  Idle/Idle1/Walk/Run and five attacks at 41 phases with key-pose renders.
  Native ready stance and Attack2 inform the model. Reference study and
  reproducible script: `reference-studies/monkey.md`,
  `scripts/study-wildmesh-monkey.py`.
- Independent Monkey family/model: lean barrel, small round-eared head and
  projecting face, long forearms and broad hands, folded hind limbs and eight
  tapered tail sections with an elevated hook. 33 joints / 36 plates. Reproduced
  with `scripts/refine-monkey.mjs`; no native assets enter the runtime.
- Idle has four fixed ground contacts. Walk is a four-beat palm/foot cycle;
  run is a faster staggered quadrupedal bound with explicit suspension. Attack
  rears onto planted feet, lifts both hands overhead, slams both palms down,
  braces at .62–.74, then releases and returns to the four-point ready stance.
  Tail counterbalance corrects at its root rather than accumulating one body
  correction through all tail joints. All support IK is baked into local clips.
- Ten focused tests pass: anatomy, contacts, upper/lower limb articulation,
  uniform in-place stance speed, flight, slam/recovery, loop seams, bone lengths,
  bend limits, interpolation clearance and stationary ground/shadow. A recovery
  hand dip was caught and corrected before accepting goldens. Dense review is
  4,608 views with full emitted SVG bounds and independent occlusion checks;
  another 960 views cover buried muzzle/socket order and promotion mutations.
- Actual workbench review: moving side-on walk/run, raised slam at side and
  45° / 135°, palm landing with contact overlays, top-down idle burial, and
  45° / 225° silhouette. Workbench left paused at Monkey idle, 45° / 225°.
- All 42 earlier model goldens remain byte-identical. New rig/package fixtures,
  generated workbench, selector and readable clip labels added; catalog is 43.
- Browser gate: 121/121 outputs identical, authoring UI states passed, zero
  console errors. Catalog gate: 322/322 tests, 43/43 source/model validations, ordinary/motion/
  paint audits and release metadata passed. Existing advisory totals remain
  40/38/40; Monkey adds none. Implementation commit: `f896ed8`.
- N11 Rat is next. No next-creature work started; unrelated `.DS_Store` excluded.
