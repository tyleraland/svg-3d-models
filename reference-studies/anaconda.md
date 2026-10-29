# Anaconda: WildMesh reference pass

Milestone R2a, 2026-10-29. Native reference:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Stylized Animals/Anaconda_Stylized/SK_Anaconda_Stylized.blend`.

## Reference analysis in Blender

The native file was inspected and rendered with installed Blender 5.1.2 in
background mode. The source was not saved or modified. Objects are `Armature`
and `U3DMesh`; native playback is 60 FPS. The initial file-pose mesh bounds are
approximately 1.123 × 3.104 × 1.337 m; these are pose bounds, not straight body
length or neutral thickness. The native longitudinal axis is approximately Y;
our authoring retains paper-rig's +X forward and +Z up convention.

| Native action | Frames | Duration from frame difference / 60 |
|---|---:|---:|
| Idle | 1–400 | 6.650 s |
| Idle2 | 1–600 | 9.983 s |
| WalkSLow | 1–300 | 4.983 s |
| Run | 1–136 | 2.250 s |
| Rise | 1–268 | 4.450 s |
| Rise2 | 1–180 | 2.983 s |
| Strike | 1–278 | 4.617 s |
| Strike2 | 1–178 | 2.950 s |
| Bite | 1–158 | 2.617 s |
| Attack | 1–240 | 3.983 s |

Additional actions present: Bite2, Die, Hiss, Sneaky, Spin, StruckDie, Tired,
Twistrattle. Action names alone do not prove their contents were reviewed.

Twenty-one normalized samples were evaluated from each tabled action, including
world-space spine, tail, neck, head and jaw landmarks. Rendered views included
neutral overhead/side silhouettes, slow/fast travel and both rise/strike actions.
Slow/fast travel were also rendered with a wider camera to inspect the entire
body. Dimensional and motion conclusions use sampled bone positions as well as
these silhouette renders.

Observed features informing the SVG:

- A long body with gradual tail taper and a compact head, rather than an oversized
  head at the end of a short, thick chain.
- Distributed lateral curvature during travel, with the head steadier than the
  following body; a continuous wave rather than two alternating whole-body poses.
- Rise2 transitions from low to raised. Rise includes a sustained high posture.
  Sampled head heights reach approximately 1.71 m while rear-body height remains
  around .085 m. The forebody lifts over a coiled or curved rear support.
- Strikes change the curvature and attitude of the front body and articulate the
  jaw; they do not lengthen the bones. The SVG condenses this into a faster action.
- No cobra hood. Species-specific cobra identity belongs to the next milestone.

## Model identity and shape

The existing `serpentine` model ID and CLI entry are retained; its workbench label
is now **Anaconda · serpentine**. This is the refined Anaconda variant, not a new
alias duplicating the same model. R2b should add an independently selectable
King Cobra, preserving this entry and its clips.

`rigs/families/serpentine.json` now contains a 24-point tapered chain, with the
original tailBase/tailMid/rearSpine/middleSpine/frontSpine/neck/head/snout IDs
retained and intermediate joints inserted. Each visible span remains a rigid
plate on adjacent joints; there are no deforming plates spanning several bends.
The longer chain uses the established capsule/plate style with discrete joints.
It is not a smooth-skinned mesh. The head rests slightly above the ground body
and has a separate hinged lower jaw. Gaskets are small and buried beneath their
incident plates. Body and tail spans share core depth sorting so a generic
appendage group cannot put the tail indiscriminately above the neck or head.

The XY shadow remains a fixed ground-plane approximation. It does not represent
a physically computed cast shadow. The workbench's editor fit now includes
shadow geometry as well as animated joints, fixing shadow cropping in raised
poses. Export framing remains the fixed 100 × 100 contract.

## Authored motion

`scripts/refine-anaconda-motion.mjs` bakes ordinary joint-local rotations from
world heading/pitch curves. Local rotations are derived relative to the parent
frame and unwrapped for interpolation. No consumer evaluates procedural waves
or IK, and no native mesh or animation channel is copied into the project.

| SVG clip | Duration | Behavior |
|---|---:|---|
| idle | 4000 ms | Low resting S, small distributed sway, compact lifted head |
| walk | 2600 ms | Slow traveling curvature from front toward tail |
| run | 1350 ms | Faster, stronger traveling curvature |
| rise | 1800 ms | Coil the rear support and lift the front body |
| idleRaised | 3000 ms | Sustained raised forebody with restrained movement |
| lower | 1600 ms | Reverse the rise into the ground posture |
| attack | 1450 ms | Rise, brace the rear, open the jaw, uncoil forward and snap shut |

The strike moves from windup at .42 to contact at .50: **116 ms**. Recovery returns
all controls to ground idle by .86. Rise/raised-idle/lower share their endpoint
poses. Original hit and KO remain available; replacing them is outside R2a.

Belly contacts use the compiler's existing bind-height surface offsets; joint
centers are above Z=0 by their body thickness. Ground locomotion deliberately
glides those contacts along XY. During rise/attack the front contacts release at
.12; they return by .88 in lower and .86 in attack. Rear support is unchanged
through the rapid .42–.50 strike. Root XY authoring translation keeps the middle
body centered while coiling; the root is a non-rendering control, not an anatomical
point required inside the visible silhouette bounds.

## Independent regression evidence

`test/anaconda.test.mjs` covers:

- Stable IDs, length/thickness and taper, head size and jaw articulation.
- Measured heading-peak delay along the chain proving front-to-tail wave travel.
- Rise/hold/lower continuity, strike extension and timing, jaw snap and recovery.
- Bone-length preservation, loop closure and ground/contact heights at 1,201
  interpolated samples for each of seven requested clips.
- **6,720 views**: seven clips × ten critical times × six elevations
  (0/30/45/60/75/90) × sixteen headings, checking independent occlusion and
  visible-joint framing. The non-rendering root control is excluded from this
  anatomical framing assertion.
- A separate capsule-overlap/depth-interval check for body crossings, including
  a mutation that reverses emitted draw order and must fail. Strictly separated
  depth intervals are checked; ambiguous crossings are not claimed to be solved
  by a per-pixel hidden-surface renderer.

The default audit includes rise, raised idle and lower poses. The browser parity
sweep includes all three optional clips, plus a DOM geometry check that the
editor viewBox contains the actual rendered shadow in traveling, raised and
striking poses at three elevations. This check uses SVG getBBox rather than
repeating the editor-fit implementation.

Final gate results and commit are recorded in `creature-roadmap.md`.
