# Triceratops — Quaternius native study

Opened `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Triceratops.blend`
in Blender. Sampled Idle/Walk/Run/Attack/Jump/Death at 41 phases and reviewed side,
frontal and overhead Idle plus attack phases. Native forward -Y maps to +X.
`triceratops-reference.json` preserves world bases/positions and exact timings.

The reference is a stout low quadruped with a short neck, broad tilted frill,
two long brow horns and a smaller nasal horn. Its attack crouches and drives the
head forward in a braced goring action; the horn geometry follows the head.
The tail is shorter and stouter than the sauropod/theropod references. Death
collapses onto the side. Jump was studied but is not separately exposed yet.

The separate paper rig has 114 joints (many rigid vertex/centroid helpers) and
46 plates at .10 m per native unit. A closed extruded octagonal frill has actual
thickness; the three horns use four-sided needles. This preserves volume and
camera-relative depth in front/profile/overhead views. A low beaked muzzle and
continuous barrel retain the paper style. All four idle soles are leveled.
Native meshes/materials remain external; all motion emits ordinary rigid clips.

The wide frill exposed a regression-check gap: checking feet and plate centers
alone missed an extremal polygon vertex passing below the floor during KO. The
shared author-time correction now checks actual polygon points and then fits
all camera bounds to them. It was reapplied to Parasaurolophus, Stegosaurus and
T. rex; a lowered-Stegosaurus mutation reproduces and independently catches the
old tail-spike failure. A 321-phase test checks all relevant KO polygon vertices
between keyframes. Seventeen cumulative dinosaur tests pass. Frill thickness and
three horns also have specific identity checks. Profile/front/oblique views were
compared in the workbench with the native study. Full catalog gates run at batch end.

Chromium: 121/121 outputs match; authoring UI passes, zero console errors.
The composed 480-view audit passes with zero issues or warnings.

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

Centered and connected tail mounts replace the sampled static sideways offset. Legs/feet stay below the opaque anatomy, including the reported front and 45/180 walking views. Two rounded thigh masses retain visible volume when the upper leg foreshortens toward the camera.

Regression coverage now checks centered idle tails, exact socket coincidence,
whole-limb burial across the reported camera sweep, continuous Velociraptor
walking, embedded Stegosaurus plate/spike roots, solid T. rex face geometry and
Triceratops thigh volume. Full validation results are in the roadmap checkpoint.
