# Velociraptor — Quaternius native study

Opened `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Velociraptor.blend`
in Blender. Sampled Idle/Walk/Run/Attack/Jump/Death at 41 phases, and compared side,
front/top Idle and action phases. Native forward -Y becomes paper +X. World
positions/bases/timings are recorded in `velociraptor-reference.json`.

Compared with T. rex, this reference has a small narrow skull, taller curved
neck, slimmer body, longer grasping forearms/hands, and long slender balancing
tail. Fast run alternates long hind-leg strides. Attack reaches the hands and
lunges head/body forward; this first paper version does not invent an airborne
sickle-claw slash absent from that action. Death falls to a side-rest.

The native FrontFoot.L/R are actual articulated hand bones under the forearms,
not ground-foot controls. They are retained in this retarget, in contrast to the
root-parented rear IK foot controls. The independent 92-joint / 44-plate paper
rig has three hooked fingers per hand, slim hinged jaws, two forward toe plates
and a raised two-part sickle claw on each foot. Scale is .17 m per source unit.

An author-time inverse foot frame keeps the paper toes aligned to the ground
while the shins rotate during walk/run/attack. KO retains the native falling
orientation; actual vertex/span envelope clearance is corrected separately.
Both idle soles remain planted; jaw opening/closure is an explicit small authored
adaptation over native head motion. Native meshes remain external. Only root
translations and ordinary joint-local rotations enter the runtime.

Twenty-one cumulative dinosaur tests pass, including specific hand ancestry,
slim-skull proportions, six hooked fingers, raised sickle claws and ground-level
toe orientation. Final composed audit: 480 views, zero issues or warnings.
The running profile was reviewed in the workbench against the Blender render.
Full catalog and all-six browser gates are recorded in the batch checkpoint.

Final batch headless suite: 448/448 tests. All-six Chromium: 726/726 outputs
match; authoring UI passes and zero console errors. Gallery side/top/oblique
views and the running workbench profile were visually reviewed.

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

The native Walk range 0–58 contains a held leg pose in its second half. The active 0–29 portion now loops in 1208 ms; a ten-window travel test rejects the old pause. Tail mounts are centered and connected, toes/legs stay below the opaque body, and foot frames are leveled again after resampling.

Regression coverage now checks centered idle tails, exact socket coincidence,
whole-limb burial across the reported camera sweep, continuous Velociraptor
walking, embedded Stegosaurus plate/spike roots, solid T. rex face geometry and
Triceratops thigh volume. Full validation results are in the roadmap checkpoint.
