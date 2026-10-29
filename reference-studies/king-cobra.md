# King Cobra: WildMesh reference pass

Milestone R2b, 2026-10-29. Reference:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Stylized Animals/KingCobra_Stylized/SK_KingCobra_Stylized.blend`.

## Native Blender evidence

Inspected with installed Blender 5.1.2 in background mode. The native file was
not modified or saved. It contains `Armature` and `U3DMesh`; playback is 60 FPS.
Initial mesh pose bounds are approximately 1.790 × 2.292 × 1.646 m. These are
posed dimensions, not body length or thickness. The native longitudinal axis is
approximately Y; paper-rig retains +X forward and +Z up.

| Native action | Frames | Duration from frame difference / 60 |
|---|---:|---:|
| Idle | 1–198 | 3.283 s |
| IdleLoop | 1–560 | 9.317 s |
| Steady | 1–240 | 3.983 s |
| GetUp | 1–198 | 3.283 s |
| Attack | 1–288 | 4.783 s |
| Attack2 | 1–178 | 2.950 s |
| Bite | 1–142 | 2.350 s |
| CircleBite | 1–258 | 4.283 s |
| Killed | 1–150 | 2.483 s |

Twenty-one normalized poses were sampled from each action except Killed,
including spine, neck, hood-side, head and mouth landmarks. Neutral top/side
views and raised/get-up/bite/attack poses were rendered and reviewed. Killed was
inventoried by name only. No walk or run action is present.

Observed identity and motion:

- A compact head in front of a broad upper-neck hood, a narrow throat and a
  tapered rear body. The native rig includes left/right hood-side controls.
- Idle holds a raised threat posture (sampled head height approximately
  1.55–1.59 m). Steady is low (head approximately .17–.21 m).
- IdleLoop and GetUp span low and raised attitudes. GetUp includes a very low
  initial state; our transition begins in a supported low pose instead.
- Attacks articulate the raised forebody and mouth. Bite and CircleBite were
  reviewed as alternatives; the authored primary attack is a direct bite.
- Source anatomy informs fresh proportions and rigid plates. Source meshes,
  textures, skeletons and animation channels are not copied into the runtime.

## Authoring and model identity

New independent model: **`kingCobra`**, workbench label **King Cobra · hooded
snake**, family `kingCobra`. The existing Anaconda entry (`serpentine`) and its
resolved golden remain unchanged; a dedicated test asserts this.

The body starts from the established 24-point snake authoring structure, with
shorter/slender proportions and its own family data. The hood comprises two
closed rigid polygon plates on separate hinges. All panel vertices inherit the
same hinge transform, so each panel preserves its shape throughout movement.
The panels flare in threat and fold inward/upward in low travel; this is an
intentional rigid-paper approximation of the flexible native hood. There is no
renderer-specific cobra logic or deforming multi-bone plate.

The hood shares camera-relative core/neck sorting with body and head. It is not
forced into a permanent foreground layer. Small buried gaskets keep the neck
and head connections covered. The lower jaw's bind direction and hinge axis are
aligned to the actual head/snout frame. A frontal review exposed an initial
sideways jaw offset; both geometry and rotation axes were corrected and a
forward-axis/gape assertion now covers it.

`scripts/refine-cobra-motion.mjs` bakes ordinary joint-local clip data using the
same author-time matrix/curve helpers as Anaconda. No runtime IK or native asset
dependency is introduced. The XY shadow remains a fixed ground approximation.

## Authored animation

| Clip | Duration | Behavior |
|---|---:|---|
| idle | 3200 ms | Raised, spread-hood threat with restrained movement |
| idleLow | 4000 ms | Supported low idle, folded hood |
| walk | 2400 ms | Slow front-to-tail travel wave; folded hood |
| run | 1250 ms | Faster, stronger travel wave; folded hood |
| rise | 1700 ms | Low pose to raised threat; spread the hood |
| idleRaised | 3000 ms | Optional raised hold, matching transition endpoints |
| lower | 1500 ms | Raised pose to low; fold the hood |
| attack | 1150 ms | Raised windup, rapid forward bite, jaw closure, raised recovery |

Walk/run are authored adaptations because the source has no locomotion clips.
The bite goes from windup at .28 to contact at .36: **92 ms**. Rear belly
supports remain fixed during that interval. The jaw opens before contact and
snaps shut as the forebody uncoils. Rise/low-idle/raised-idle/lower endpoints
match. Existing generic hit/KO remain available; a dedicated death adaptation
and a separate circular bite are possible later work, outside this milestone.

Contact centers use the existing bind-height surface offsets. Ground travel
intentionally glides along XY; rear supports stay low while the front rises.
Front contacts release at .12 of rise and return by .88 of lower. All motion
preserves segment lengths; only root translation is used to center the body.

## Regression and catalog integration

`test/cobra.test.mjs` covers species identity and unchanged Anaconda, hood
spread/folding, wave propagation, transition continuity, rapid bite/gape and
frontal jaw alignment. It checks body/hood ground clearance and belly support
at 1,201 interpolated samples for each of eight clips. Hood polygon edge lengths
remain rigid throughout those samples.

The camera matrix covers **7,680 views**: eight clips × ten critical times ×
six elevations (0/30/45/60/75/90) × sixteen headings. Checks include the existing
independent occlusion oracle, hood/core screen-bound overlap with strict depth
intervals, and framing of body and hood vertices. A mutation reverses a hood/core
draw-order pair and must fail. Ambiguous overlapping depth intervals are not
claimed to be solved by a per-pixel hidden-surface renderer. Non-rendering root
control framing is excluded, as in Anaconda.

The catalog now has 33 models. Fixed model/family count assertions were replaced
with directory discovery and explicit source/golden catalog coverage. The bundle
keeps the established preferred ordering and includes newly discovered models.
The browser gate checks that every bundled model has a selector option, and
includes idleLow as well as all raised transitions. Default audit poses include
low idle. CLI validation, provenance, semantic diffs and consumer handoff tests
include the new model through their catalog loops.

Direct workbench review includes frontal, side and oblique hood/face views and
bite anticipation. A pre-existing VM test for editor framing needed the newly
used cameraBasis dependency added to its sandbox; the real-browser shadow test
independently checks actual rendered geometry bounds.

Final gate results and commit are recorded in `creature-roadmap.md`.

## Completed headless gates

- Six focused Cobra tests passed, including all 7,680 camera/pose combinations.
- `npm run check`: 212 tests passed; all 33 sources/models validated; ordinary,
  motion and paint audits passed; release metadata passed.
- Default Cobra audit: 960 views, zero issues and zero warnings. Catalog warnings
  are pre-existing elsewhere: 41 ordinary, 39 motion and 41 paint.
- Final browser gate for King Cobra and Anaconda: 382/382 outputs matched;
  full catalog selector coverage, shadow framing and authoring UI checks passed;
  zero console errors. Rebuilt workbench was inspected directly and left open
  on King Cobra's frontal hooded idle.
