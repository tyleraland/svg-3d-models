# Parasaurolophus — Quaternius native study

Opened `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Parasaurolophus.blend`
in Blender; sampled all six actions at 41 phases and compared side, front and top
Idle plus side Attack/Run phase renders. Native forward -Y becomes paper +X.
Exact world bases, positions and timings are in `parasaurolophus-reference.json`.

The reference has a tall curved neck, small duck-billed head and swept-back crest,
short forearms, powerful bent hind legs and a long upward-curving balancing tail.
Its Walk/Run are bipedal. Attack is a low preload and forward head/body lunge with
reaching arms, not a crest-goring action. Death falls to a persistent side-rest.
Jump was studied but is not a separately exposed clip in this first version.

The independent 65-joint / 25-plate paper rig uses .18 m per source unit, native
rigid-joint motion and an authored continuous barrel, thick crest, bill and feet.
Native mesh/materials remain external. Idle fixes both hind soles while the
neck/head/tail retain native motion; walk/run retain whole-leg articulation.
The terminal KO is held after phase .8 and paper floor penetration is corrected.
All geometry and animation resolve to ordinary paper-rig/1 plates and clips.

Four focused tests pass: identity proportions, supported idle and gait cadence,
length preservation and KO, and the multi-elevation/eight-heading motion matrix.
All 22 structural checks pass. Final composed audit: 480 views, zero issues or
warnings. Chromium: 121/121 outputs match; authoring UI passes, zero console
errors. Profile silhouette reviewed in the workbench against the Blender renders.
Full catalog gates will run after this six-dinosaur batch.

Batch correction during Triceratops review: KO floor correction now includes
all polygon vertices, not only centers/spans; related fixtures were recaptured.
The shared 321-phase polygon clearance test passes, including a mutation check.
