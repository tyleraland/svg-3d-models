# Creature refinement and expansion plan

Created 2026-10-28. This file is the durable progress record: update it before
pausing and after each creature commit. Work on one creature at a time, in the
order below. Planning does not start implementation automatically.

## Resume checkpoint

- Status: WildMesh expansion batch authorized 2026-10-31; one creature per commit.
- Active creature / stage: Duck — next reference study.
- Ordered queue: Mink, Crocodile, Beaver, Bighorn Ram, Maned Lion, Mammoth,
  Domestic Cat, Hyena, Duck.
- Completed this batch: Mink (`f82fcbf`), Crocodile (`02ae00e`), Beaver (`f840c2a`), Bighorn Ram (`8401634`), Maned Lion (`372f9fa`), Mammoth (`d05c96f`), Domestic Cat (`130f4cd`), Hyena (sloping profile, gaits/bite, clean audits).
- Batch-end gate: full tests/catalog audits and browser parity for all nine new models.
- Previous checkpoint: all eight Quaternius creatures and review corrections complete.
- Each new creature: inspect native reference, author proportions, idle/walk/run/attack,
  directional review and regression checks, then commit before proceeding.
- Open technical blockers: none.

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
| N11 | complete | Small rodent: rat | Rat | Low body, small paws and long tail; scurry/walk, run and bite. |
| N12 | complete | Badger | HoneyBadger | Broad low body, short sturdy limbs; walk/run and bite or claw attack selected from reference. Record species differences if adapting honey-badger anatomy. |
| N13 | complete | Ostrich | Ostrich_Stylized | Separate from Chicken; long neck, long articulated legs and reduced wings; walk/run and reference-led kick or peck. |
| N14 | complete | Goose | Goose | Long neck, heavy body, webbed feet, folded wings; grounded walk/run and bite/peck. Flight/swim are optional follow-ups, not prerequisites. |
| N15 | complete | Tortoise | Tortoise_Stylized | Rigid shell enclosing limb roots, low splayed stance; idle, slow/fast travel equivalents and bite. Avoid forcing an implausible mammalian run. |

### Phase 3 — deferred, additional references needed

Do not begin these until Phase 2 is complete or the user changes priorities.

- [ ] Lizard: iguana / Komodo-dragon form. Find suitable anatomy and motion references.
- [ ] Lizard: crocodilian form. Keep distinct from the iguana/Komodo identity;
  WildMesh crocodilians may supplement a broader reference search.
- [ ] Dragon: pause to choose dragon archetypes and obtain suitable references
  before defining model scope. Do not force every dragon into one silhouette.
- [ ] Dinosaurs: six Quaternius references selected; implement the individual
  Q3–Q8 milestones below, with a fresh mesh/action study for each.
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

### N11 — Rat — 2026-10-29

- WildMesh `Realistic Animals/Rat/SK_Rat.blend` opened in a separate appended
  Blender scene, preserving prior scenes. 53 bones, 24 actions, 24 FPS. Native
  Idle/NeutralStand/WalkSlow/Walk/Trot/Run/Sprint sampled at 41 phases with
  orthographic renders. Distinct action tags prevent selecting Monkey actions
  with the same names. Native library has no attack; bite is explicitly authored.
  Study: `reference-studies/rat.md`; script: `scripts/study-wildmesh-rat.py`.
- New independent Rat family/model: low arched body, rounded rump, tapering chest,
  pointed muzzle and jaw, round ears, short folded legs and broad tiny paws,
  long thin six-section tail. 34 joints / 37 plates, .132 m nominal height.
  Reproduced by `scripts/refine-rat.mjs`, no native assets in runtime outputs.
- Idle uses a four-paw quiet sniff/breath stance. Walk is a four-beat scurry;
  Run a .38 s quadrupedal bound with back flexion and .63–1 suspension, raised
  tail and whole-limb articulation. Authored .85 s bite opens the jaw, makes a
  short forward thrust and snaps shut, then returns exactly to idle over four
  fixed paws. Ground and shadow stay fixed.
- Independent checks caught a rigid torso span crossing the bending spine and
  oversized default seam circles. Body spans now meet at the hinge; small
  authored gasket sizes fit the rat. Oblique workbench review also caught the
  jaw triangle base over the skull; the internal bridge is now buried.
- Ten focused tests: proportions, seam scale and fallback mutations, real contact
  surfaces, support continuity, upper/lower articulation, flight/spine motion,
  bite timing/fixed paws/idle matching, lengths/limits/clearance/seams and shadow.
  Dense matrix covers 4,608 views plus emitted SVG bounds; another 960 views
  verify muzzle AND jaw base-corner coverage, painter order and buried tail
  socket. Promoting the muzzle is caught independently of regenerated goldens.
- Actual workbench review: oblique idle and corrected jaw at 45° / 225°;
  moving side-on scurry/run; open bite, closed bite with four-paw contact overlays
  at 45° / 135°; overhead idle burial and head-on silhouette.
- Browser gate passed: 121/121 outputs identical; authoring UI states passed;
  zero console errors. Catalog: 332/332 tests, 44/44 source/model validations, ordinary/motion/paint
  audits and release metadata passed. Advisory totals stay 40/38/40; Rat adds
  none. Existing 43 model goldens unchanged. Workbench left at Rat idle,
  45° / 225°, overlays off.
- Implementation commit: `5f7979d`. N12 Badger is next; no next-creature work
  started. Unrelated `.DS_Store` excluded.

### N12 — Badger / honey badger — 2026-10-30

- WildMesh HoneyBadger opened in a separate Blender study scene, preserving
  earlier scenes. 87 bones, 63 actions, 24 FPS. Eight native actions sampled at
  41 phases, including Idle, walk/trot/run, foraging and threat transitions.
  Study: `reference-studies/badger.md`; script:
  `scripts/study-wildmesh-badger.py`. Source has no dedicated bite or claw strike.
- Independent Badger family/model retains the honey-badger reference identity:
  broad long barrel, powerful forequarters, thick neck, small ears, short bent
  limbs, short down-curved tail and six paw-local foreclaws. 43 joints / 40 plates,
  .46 m nominal height. Selector explicitly says honey badger; no European badger
  markings or species claim. Reproduced by `scripts/refine-badger.mjs`.
- Idle carries an alert raised head over four planted paws. Walk is a strong
  four-beat cycle with lower travel head; Run a short .5 s bound with spine flex,
  tucked recovery and .64–1 suspension. Attack is an authored braced bite,
  informed by native anatomy/threat posture: neck preload, jaw opening, short
  forward thrust, fast closure, release and complete recovery. Four paws remain
  fixed; ground and shadow stay stationary.
- Walk's .6875 duty factor aligns support boundaries with the existing bake grid.
  Rigid body spans meet at the spine hinge. Authored seam sizes fit the anatomy;
  muzzle/jaw bases and tail socket are buried. Leveled paw frames retain ground
  clearance of rigid digging claws throughout all motions.
- Twelve focused tests pass: proportions, bounded seams/fallback mutations,
  contact surfaces, whole-limb movement, support, flight/spine motion, bite/jaw/
  fixed-paw recovery, lengths/limits/loop seams/interpolation, shadow, lower
  travel head, side exchange and claw-frame clearance. Dense matrix: 4,608 views
  with independent occlusion and full SVG bounds; another 960 views verify actual
  head coverage of muzzle/jaw base corners and buried tail socket. Promotion
  mutations fail independently of regenerated goldens.
- Actual workbench review: oblique idle at 45° / 225°; moving side-on walk/run;
  open bite from side, closed bite/contact overlays at 45° / 135°; overhead burial
  and head-on ear/shoulder/paw/claw silhouette. No shared compiler/family changes;
  all earlier 44 model goldens are unchanged.
- Browser gate: 121/121 outputs identical, authoring UI states passed, zero
  console errors. Catalog gate: 344/344 tests, 45/45 source/model validations, all ordinary/
  motion/paint audits and release metadata passed. Advisory totals stay 40/38/40;
  Badger adds none. Workbench left at Badger idle, 45° / 225°, overlays off.
  Implementation commit: `76738a6`.
- N13 Ostrich remains next. No next-creature work started; `.DS_Store` excluded.

### N13 — Ostrich — 2026-10-30

- WildMesh `Stylized Animals/Ostrich_Stylized/SK_Ostrich_Stylized.blend` opened
  in a separate Blender scene, preserving earlier studies. 56 bones, 10 actions,
  60 FPS; Idle/Walk/Run and all four attacks sampled at 41 phases with key-pose
  renders. Attack4 is the jumping double-foot kick reference. Study and script:
  `reference-studies/ostrich.md`, `scripts/study-wildmesh-ostrich.py`.
- Independent Ostrich family/model: broad feather barrel, thin long S-neck,
  small head/bill, four-link legs (true thigh/knee/backward hock/ankle), two
  forward toes, reduced folded wings and short feather tail. 33 joints / 31
  plates, 2.3 m nominal height. Chicken/Eagle/Crow remain distinct and unchanged.
  Reproduced by `scripts/refine-ostrich.mjs`, no native runtime assets.
- Idle has two planted feet. Walk is alternating with .625 duty/double support;
  Run is faster with .40 duty, long recovery and brief suspension. Attack
  crouches, takes off .28, kicks both upturned feet forward above the pelvis at
  .46, retracts, lands .72 and returns exactly to idle. Reduced wings assist
  outward; ground/shadow remain stationary. The .4 m parabolic jump over .572 s
  has near-9.8 m/s² implied acceleration and matched launch/landing velocity.
- Fourteen focused tests pass: proportions, four-link anatomy/two toes, seam
  bounds and mutations, contacts, gait support/articulation/flight, kick/landing,
  jump arc/velocity joins, lengths/limits/loop seams/clearance, fixed shadow,
  bill-base coverage, head-on wing visibility/outward assist and endpoint/sole
  attachment invariants. Dense matrix is 4,608 views with full SVG bounds and
  independent occlusion; another 960 views verify buried bill/jaw/socket joins.
- Review caught an unnecessary wing-tip seam cap; the non-articulating tip is
  now a helper anchor, with a mutation check for exposed caps. Browser parity
  caught three coplanar foot-order differences: helper-owned toe plates now
  share the real sole joint, and the raised instep belongs to the ankle. A
  mutation guards sole ownership. No shared compositor or sort-tolerance change.
- Actual workbench review covers moving side walk/run, high double kick from
  side and 45° / 135°, separation above the fixed shadow, paired landing with
  contact overlays, top-down burial and head-on wing/toe visibility. Workbench
  left at idle, 45° / 135°, overlays off.
- Browser gate: 121/121 outputs identical, authoring UI states passed, zero
  console errors. Catalog: 358/358 tests, 46/46 source/model validations, all ordinary/motion/
  paint audits and release metadata passed. Advisory totals stay 40/38/40;
  Ostrich adds none. Final rebuilt-selector browser check passed (121/121, zero console errors).
  All earlier 45 model goldens unchanged.
- Implementation commit: `7b56391`. N14 Goose remains next; no next-creature work
  started. Unrelated `.DS_Store` excluded.

### N14 Goose — accepted implementation, 2026-10-30

- Studied `Realistic Animals/Goose/SK_Goose.blend` in Blender, preserving earlier
  scenes. Native Goose has 156 bones, 24 FPS and 33 actions. Sampled eight actions
  at 41 phases, with native side/front/top and key-pose renders. WalkMedium and
  RunFast inform the locomotion; grazing supplies neck/jaw articulation. There
  is no native attack; the braced bite is explicitly authored. Evidence and
  reproducible diagnostics: `reference-studies/goose.md`,
  `scripts/study-wildmesh-goose.py`.
- Independent Goose family/model, 59 joints / 33 plates, .62 m nominal height:
  heavy low barrel, tall curved neck, small rounded head, flat broad bill,
  folded long wings, pointed tail and short four-link legs. Nine-point webbed
  soles have three lobes, thin crossed edges and shared real sole owners.
  `scripts/refine-goose.mjs` reproduces shape and baked clips. No licensed
  runtime assets or shared compositor changes; other birds remain distinct.
- Idle keeps two full webs planted. Walk uses alternating short steps, .65 duty,
  double support and compensated lateral weight transfer. Run is faster/longer,
  .42 duty, brief suspension and lowered neck. Bite recoils, lunges through neck
  hinges, opens then snaps the bill, and recovers over two planted soles.
  Shadow stays fixed; clips preserve lengths and actual Z=0 contact surfaces.
- Fourteen focused tests include independent proportions, support/articulation,
  bite/return, web planarity/clearance, seam bounds and mutations, lengths/limits,
  loop continuity, shadow and edge-on visibility. 4,608 pose/camera views check
  occlusion and full SVG bounds; 960 check buried bill/jaw roots; 1,344 top views
  ensure feet paint behind the torso, with a promoted-web mutation. Front/rear
  bill-tip and buried-thigh tests guard those visible boundaries.
- Actual browser review caught/fixed short-neck gaps, edge-on sole disappearance,
  an attack framing extreme, jaw-root exposure, hidden head-on bill, and thigh
  roots showing through the chest. Final preview is idle, 45° / 225°, overlays
  off. All 46 earlier model goldens remain unchanged.
- `npm run check`: 372/372 tests, 47/47 sources/models, all ordinary/motion/paint
  audits and release metadata passed. Advisories unchanged at 40/38/40; Goose
  adds none. Chromium: 121/121 outputs identical, authoring UI checks passed,
  zero console errors. Implementation commit: `4f856a3`. N15 Tortoise remains
  queued and has not been started. Unrelated `.DS_Store` excluded.

### N15 Tortoise — accepted implementation, 2026-10-30

- Opened `Stylized Animals/Tortoise_Stylized/SK_Tortoise_Stylized.blend` in a
  separate Blender scene, preserving earlier studies. Native has 52 bones,
  60 FPS and ten actions. Sampled all actions at 41 phases, side key poses and
  front/top views of both idle variants. Low Idle_2 guides the stance; the
  native upright idle, airborne Run and spinning attacks are documented as
  exaggerated adaptations rather than copied literally. Study and diagnostics:
  `reference-studies/tortoise.md`, `scripts/study-wildmesh-tortoise.py`.
- Separate Tortoise family/model, reproduced by `scripts/refine-tortoise.mjs`:
  202 joints / 96 plates, .41 m nominal height. Most joints are rigid geometry
  helpers. Closed oval domed shell has fifty scute/rim/plastron faces and shared
  vertices; each face owns its actual centroid depth frame. The shell remains
  rigid through all clips. Low belly, blunt beaked head, articulated neck,
  small pointed tail, short splayed legs and three claws per foot.
- Final stance was narrowed against the native top/front proportions, with
  fore-elbows bending forward and feet near the shell perimeter. Spatial
  author-time IK preserves limb lengths and keeps the entire sole level. No
  renderer changes or native runtime mesh/action data. Idle and bite have four
  fixed feet. Walk and faster travel use a supported four-beat crawl, .80 duty,
  at least three supports and low foot recovery; no gallop or aerial run.
- Bite has visible neck recoil by .35, a fast forward/down angular strike .46,
  jaw closure .51, release .52 and full return to idle. Fixed shadow and actual
  Z=0 contact surfaces. Increasing fast-bake density corrected intermediate
  pad tilt without moving the ground or weakening the test tolerance.
- Fourteen focused tests pass. Dense matrix: 4,608 poses/cameras for occlusion
  and full SVG bounds, 960 views for actual beak/jaw-root coverage and 512 top
  views for shell-over-limb ordering. A separate physical surface-depth oracle
  checks fifty shell facets at 96 cameras; painting the bottom plastron over
  the dome fails independently of metadata/goldens. Other mutations cover
  shell holes/detachment, seam halos, promoted connectors/feet and sole owners.
- Actual workbench review covers side/front/top/oblique shape, moving slow/fast
  travel, neck recoil and bite, contact overlays and the narrowed final stance.
  Final preview: idle, 45° / 225°, overlays off. All 47 earlier model goldens
  unchanged; Tortoise has separate accepted rig/package fixtures.
- Final gates: 386/386 tests, 48/48 sources/models, all ordinary/motion/paint
  audits and release metadata passed. Advisories unchanged at 40/38/40; Tortoise
  adds none. Chromium matched 121/121 outputs, authoring UI checks passed and
  zero console errors. Implementation commit: `2dcccca`. Phase 2 is complete.
  Unrelated `.DS_Store` remains excluded. Deferred Phase 3 work has not started.

### Five-creature review follow-up — 2026-10-30

- Kangaroo: buried muzzle/tail roots, consistent ear leaf/spine order and a
  straight, nearly level airborne tail counterbalance. Ground-support tail
  behavior for walk/kick is retained.
- Rat: 440 ms scurry and 230 ms alternating supported run, replacing the
  exaggerated body bound; lower spine/back envelope and clearer clip label.
- Goose: simpler rounded bill, contained 6 mm sole profile, buried fan/socket
  under a genuinely opaque rump, outstretched running wings and separate
  articulated powered flight. Extended native Goose study with TakeOff_RunUp
  and FlyFlapping. Folded ground/KO wings remain compact.
- Tortoise: neck under every shell facet; individual claw/sole strips combined
  into one toe outline per foot. Reduced from 202/96 to 178/76 joints/plates.
- Ostrich: single rigid two-toed sole per foot, buried fan/socket and opaque
  rump, thigh/calf roots behind the body at the reported high/oblique views.
- Details and native flight evidence: `reference-studies/creature-feedback-2026-10-30.md`.
  New `test/creature-feedback.test.mjs` supplements the existing camera matrices
  with actual root coverage/order, ear/foot consistency, cadence/support and
  flight articulation/clearance checks. Deliberate promotions fail independent
  of accepted goldens. All 43 unrelated model goldens remain unchanged.
- Actual workbench review covers the reported views plus moving Rat scurry/run,
  Kangaroo hop and Goose run/fly. Final checks: 393/393 tests, 48/48 sources/models,
  all ordinary/motion/paint audits and release metadata passed. Advisories stay
  40/38/40. Chromium matched 645/645 outputs, authoring UI checks passed, zero
  console errors. Implementation commit: `5e8ed96`. No next-creature work started.

### Pose/layering review follow-up — 2026-10-30

- Goose: rigid wing-surface centroid frames prevent folded primary/covert order
  flips during waddling. Bill tip is a true projected face rather than a
  screen-facing oval.
- Rat: workbench labels are walk/creep and run/scurry; rear upper legs remain
  behind an opaque rump throughout motion.
- Tortoise: slow/faster crawl cycles shortened to 3200/1650 ms (about 21% faster).
- Kangaroo: forward/outside arm guard and shoulder caps; explicit validated
  over-core paper layering keeps upright/punch arms readable across cameras.
  New once-only single upright hop has a crouch, ballistic rise, paired landing
  and quiet settle, separate from the fast traveling hop.
- Details: `reference-studies/creature-pose-followup-2026-10-30.md`. Independent
  temporal/geometric and deliberate-mutation tests supplement golden parity;
  inherited foreground seams are checked too. The other 44 fixture sets remain
  byte-identical.
- Validation: 402/402 tests, 48/48 sources/models, ordinary/motion/paint audits
  and release metadata passed; advisory counts unchanged at 40/38/40. Chromium
  matched 544/544 outputs, authoring UI checks passed, zero console errors.
  Implementation commit: `2e1b3fe`. Phase 2 remains complete; deferred Phase 3
  work has not started. Unrelated `.DS_Store` remains excluded.

### Kangaroo elbow-direction correction — 2026-10-30

- Corrected the arm bend after user review: elbows sit lower/back, forearms
  reach forward, and punching extends from that guard. Original arm bind
  directions and lengths are restored; foreground visibility is retained.
- A new dense forearm-direction test supplements visibility checks. Kangaroo
  length/limit/contact/framing/occlusion checks and all 48 source validations
  pass. The side/oblique workbench pose and punch were reviewed directly.
- Browser/package parity passed 161/161 outputs, authoring UI checks passed and
  zero console errors. No other creature sources were changed in this correction.


## Quaternius expansion — requested 2026-10-30

Use native `.blend` files under `~/models/quaternius/`. Work one creature at a
time: inspect mesh proportions and actual action content in Blender, author
shape then idle/movement/attack (plus useful supplied states), review cameras,
validate and commit before proceeding. The existing deferred WildMesh/outside-
WildMesh items remain on the list; this is the currently requested sequence.

| ID | Status | Creature | Native Blender reference | Available actions |
|---|---|---|---|---|
| Q1 | complete | Frog | Easy Animated Enemy Pack / Frog.blend | Idle, Jump, Attack, Death; no Walk. Authored crawl is explicitly separate. |
| Q2 | complete | Wasp | Easy Animated Enemy Pack / Wasp.blend | Flying, Attack, Death; authored hover/cruise/dart, abdominal sting and side-rest KO. |
| Q3 | complete | Apatosaurus | Dinosaur Animated Pack / Apatosaurus.blend | Idle, Walk, Run, Jump, Attack; death is unusually named Stegosaurus_Death in this file. Inspect its contents. |
| Q4 | complete | Parasaurolophus | Dinosaur Animated Pack / Parasaurolophus.blend | Idle, Walk, Run, Jump, Attack, Death. |
| Q5 | complete | Stegosaurus | Dinosaur Animated Pack / Stegosaurus.blend | Idle, Walk, Run, Jump, Attack, Death. |
| Q6 | complete | T. rex | Dinosaur Animated Pack / Trex.blend | Idle, Walk, Run, Jump, Attack, Death. |
| Q7 | complete | Triceratops | Dinosaur Animated Pack / Triceratops.blend | Idle, Walk, Run, Jump, Attack, Death. |
| Q8 | complete | Velociraptor | Dinosaur Animated Pack / Velociraptor.blend | Idle, Walk, Run, Jump, Attack, Death. |

Exact pack directory names, 24 fps action ranges and object inventories are in
`quaternius-inventory.json`. Each dinosaur will receive its own shape/action
study before implementation; the inventory is not a substitute for that study.
The shipped Dinosaur pack license text states CC0 1.0. External native files
remain reference assets and are not copied into the workbench.


### Quaternius Frog review checkpoint — 2026-10-30

- Opened Frog.blend in Blender, sampled all four actions, compared front/top/
  profile phases, and authored a separate 60-joint / 27-plate SVG model.
- Idle, authored slow crawl, native-informed paired hop and rear-braced
  forelimb strike, plus a roll-over KO. Reference/action gaps are documented;
  native mesh assets remain external.
- Ten focused anatomy, projection, motion/contact and mutation regressions;
  final full suite 413/413 tests passed. All 49 sources/models and all catalog
  audit modes/release metadata passed. Advisories unchanged at 40/38/40; Frog
  contributes none. Final composed Frog audit: 480 views, zero issues/warnings.
- Final Chromium comparison: 121/121 outputs, authoring UI passed and zero
  console errors. Existing 48 rig/package fixture sets unchanged. Implementation
  commit: `1e057eb`. Q2 Wasp and Q3–Q8 dinosaurs remain queued, unimplemented.


### Quaternius Wasp review checkpoint — 2026-10-30

- Opened Wasp.blend in Blender and sampled Flying, Attack and Death. Separate
  93-joint / 55-plate model with six articulated legs, cambered wings and hooked
  banded abdomen; native meshes remain external.
- Hover, slow cruising flight, fast dart, articulated abdominal sting with
  continuous wingbeat, and side-rest KO. No fabricated grounded walk/run.
- Nine focused tests include projected wing/needle area, internal stem burial,
  independent ordering/mutation checks, limb lengths, clearance and KO settling.
- Full suite 422/422; all 50 sources/models, catalog audit modes and release
  metadata pass. Advisories unchanged at 40/38/40; Wasp contributes none.
  Final composed Wasp audit: 480 views, zero issues/warnings.
- Chromium 121/121 outputs and authoring UI pass; zero console errors. Existing
  49 rig/package fixture sets unchanged. Implementation commit: `b894529`.
- Q3 Apatosaurus is next; Q3–Q8 dinosaurs remain unimplemented.

- Q3 Apatosaurus committed as `c96f8c4`; Q4 Parasaurolophus complete with four
  focused tests, 480-view composed audit and 121 browser outputs passing.

- Q4 Parasaurolophus committed as `bebc996`; Q5 Stegosaurus complete: eight
  cumulative dinosaur tests, 480-view composed audit and 121 browser outputs pass.

- Q5 Stegosaurus committed as `8aea0ab`; Q6 T. rex complete: 12 cumulative
  dinosaur tests, 480-view composed audit and 121 browser outputs pass.

- Q6 T. rex committed as `0ce878d`; Q7 Triceratops complete: 17 cumulative
  dinosaur tests, 480-view composed audit and 121 browser outputs pass. Shared
  all-vertex KO regression/correction also updates Q4–Q6, with no shape changes.

- Q7 Triceratops committed as `28a9c80`; Q8 Velociraptor complete: 21 cumulative
  dinosaur tests and 480-view composed audit pass. Full suite 448/448 and all-six
  Chromium outputs 726/726 pass, with authoring UI checks and zero console errors.


### Quaternius batch complete — 2026-10-30

All eight requested creatures are implemented. Each native model was opened in
Blender and studied, with per-creature evidence retained in this directory.
Every new dinosaur includes idle, walk, run, attack and KO. Native Jump actions
were studied but are not separately exposed in this first batch.

| Creature | Implementation commit |
|---|---|
| Frog | `1e057eb` |
| Wasp | `b894529` |
| Apatosaurus | `c96f8c4` |
| Parasaurolophus | `bebc996` |
| Stegosaurus | `8aea0ab` |
| T. rex | `0ce878d` |
| Triceratops | `28a9c80` |
| Velociraptor | `9da7d4e` |

Shared support correction: `e8ef390`. The root-height bake preserves native
rotation curves and run airtime, while walk and grounded attacks retain a
supporting sole between reference keys. Actual supported phases declare contact
intervals. Independent mutations cover hovering walks and polygon-only KO floor
penetration; solid identity checks cover thick dorsal plates, frill and horns.

Final verification after this correction:

- `npm run check`: 450/450 tests; all 56 sources/models pass validation; standard,
  motion and paint catalog audits pass with 0 issues. Existing advisory totals
  remain 40/38/40, with no dinosaur advisories. Release metadata passes.
- All-six Chromium comparison: 726/726 package/browser outputs match; patch UI,
  onion skins, turntable and independent overlay toggles pass; zero console errors.
- Existing 50 rig/package fixture sets from before the dinosaur expansion remain
  byte-identical. Only the six new dinosaur fixture pairs were introduced.
- All six were visually reviewed in oblique, profile and overhead comparison
  views. Individual native Blender actions, bite/stride poses and supported-walk
  contact overlays informed the additional checks.
- `quaternius-dinosaur-review.html` is a generated three-view silhouette review;
  regenerate with `node scripts/build-quaternius-review.mjs`. The workbench is
  regenerated from source and remains the animation/authoring interface.

Work is committed locally on main. No push was requested for this batch.


### Frog/dinosaur user-review checkpoint — 2026-10-30

Frog's first correction was committed as `fdc0a74`; final shared and shape
corrections are in `3630ebb`. All reported review items are addressed:

- Frog: fixed-length folding tongue lash with four braced feet, .12 m crawl
  stride at 1250 ms, actual chest-oval containment for front hip roots at every
  overhead heading, and lower legs/feet below the body/thigh stack.
- Dinosaur centerlines: canonical bind/idle tails are centered; every tail
  segment meets its actual supporting socket. The same correction applies to
  Apatosaurus, which shared the authoring pattern.
- Dinosaur limb depth: legs, feet, toes and their gaskets remain below the
  opaque torso/head, including front/45-degree walking and overhead views.
- Velociraptor: native Walk's held latter half removed. Its active first half
  loops in 1208 ms; supported foot frames are leveled after resampling.
- T. rex: beveled volumetric skull and lower jaw replace the visible capsule
  face, with physical eyes/nostrils and simplified teeth. Existing overlap IDs
  remain as internal fallback geometry.
- Triceratops: head stays in front of forelegs; rounded thigh masses retain
  apparent volume during foreshortening.
- Stegosaurus: broad pentagonal plates distributed across body/neck/tail;
  lower vertices embed in their actual supporting spans. Tail-spike roots fit
  inside the tail cylinder, preventing the reported floating bases.

Validation evidence:

- Full `npm run check`: 458/458 tests; all 56 model/source validations, catalog
  audit modes and release metadata pass. Advisories remain 40/38/40.
- Final T. rex bevel follow-up: all 29 dinosaur tests pass, fresh resolver/
  pipeline parity passes, and composed audit passes 480 views with 0 issues or
  warnings. This was performed after the final small face-shape adjustment.
- Final generated workbench: 847/847 package/browser outputs match for all
  seven affected models; patch/review UI and independent overlays pass, zero
  console errors. A browser run that had loaded the previous face geometry was
  discarded and restarted against the final build.
- The 49 unrelated model fixture pairs remain unchanged from feedback baseline
  `f4bb0cc`. Consumer/compiler contracts are unchanged.
- Actual reported Frog and Triceratops camera views, Stegosaurus side profile,
  and side/top/oblique six-creature comparisons were visually checked.

`creature-feedback-review.html` provides the comparison, including Frog at
mid-tongue-strike. Regenerate with
`node scripts/build-quaternius-review.mjs --feedback`. The workbench remains the
animation interface. Changes are committed locally on main; ready for feedback
or the next deferred-creature planning checkpoint.
