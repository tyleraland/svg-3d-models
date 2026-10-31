# T. rex — Quaternius native study

Opened `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Trex.blend`
in Blender. Native `TRex_*` actions (Idle/Walk/Run/Attack/Jump/Death) were sampled
at 41 phases with side renders plus frontal/overhead Idle. Forward -Y maps to
paper +X. `trex-reference.json` records world positions/bases and exact timings.

A heavy large skull and short strong neck lead a sloping barrel. Tiny forearms
contrast with the large bent hind legs and long balancing tail. Run uses long
bipedal strides; Attack crouches/lunges and lowers the open mouth. Death collapses
to its side. The mesh has no shape keys and the skeleton has no separate jaw
bone; native head/neck skin articulation implies the opening in the mesh.

The separate 94-joint / 31-plate paper rig uses .075 m per native unit, a deep
skull, an authored hinged lower jaw, two simplified tooth ribbons per jaw, and
two fingers per hand. Teeth are simplified expression detail rather than many
individual micro-plates. The native neck/head/body motion is retargeted, while
the paper jaw adds an explicit 36-degree opening and fast closure at .56 impact.
This jaw curve is an authored adaptation, not an extracted native jaw track.

Idle plants both hind soles; walk/run move entire limbs, with fixed lengths and
no runtime rig additions. The terminal KO holds. Native meshes remain external.
Twelve cumulative dinosaur tests pass, including world leg articulation and a
specific open-then-snap bite check. Final composed audit: 480 views, zero issues
or warnings. Closed and open bite profiles were inspected in the workbench
against the native Blender phase renders. Full catalog gates run at batch end.

Chromium: 121/121 outputs match; authoring UI passes, zero console errors.

Batch correction during Triceratops review: KO floor correction now includes
all polygon vertices, not only centers/spans; related fixtures were recaptured.
The shared 321-phase polygon clearance test passes, including a mutation check.

Final support correction: native rotation curves are retained, while walk and
grounded-attack root height is baked at four subdivisions per reference interval.
This removes brief all-feet hover introduced by retargeting/interpolation. Contact
intervals are declared only where a sole is actually on the support plane at both
ends of the interval; run airtime is unchanged. A 641-phase support test and a
raised-root mutation supplement golden/browser parity. All 28 focused dinosaur
tests pass; final full-catalog results are recorded in the batch checkpoint.

Final corrected batch: `npm run check` passes 450/450 tests, all 56 models,
all three catalog audit modes and release metadata. All-six Chromium passes
726/726 outputs and authoring UI checks with zero console errors. Support
correction commit: `e8ef390`; see `creature-roadmap.md` for the complete checkpoint.

## Directional user-review corrections

The face was rebuilt as a closed beveled wedge skull with a flat muzzle, cheek/brow volume, eyes/nostrils and a solid beveled articulated lower jaw. Simplified tooth ribbons follow the jaw. The previous capsule is retained only as an internal overlap/fallback. Centered tail mounts and below-body limbs prevent overhead feet/thighs from painting over hips.

Regression coverage now checks centered idle tails, exact socket coincidence,
whole-limb burial across the reported camera sweep, continuous Velociraptor
walking, embedded Stegosaurus plate/spike roots, solid T. rex face geometry and
Triceratops thigh volume. Full validation results are in the roadmap checkpoint.

The final face uses a seven-point beveled profile (nine skull faces) and a
five-point lower-jaw profile (seven jaw faces), avoiding the initial box-like
three-quarter silhouette while retaining a blunt muzzle and real thickness.
