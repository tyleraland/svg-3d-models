# Tortoise reference study

N15, 2026-10-30. WildMesh `Stylized Animals/Tortoise_Stylized/`
`SK_Tortoise_Stylized.blend`, appended as `WildMesh Tortoise reference` without
replacing earlier reference scenes. Native Armature / U3DMesh, 52 bones, 60 FPS,
ten actions. Original action names contain strings such as
`bpy.data.actions['Walk.003']`; the diagnostic script strips the wrapper and
numeric suffix only for its report keys. Per-study action tags prevent
collisions with preserved animals. The native file is never saved; no mesh,
texture or native animation payload enters the paper runtime.

## Native evidence

| Action (normalized report key) | Frames | Duration |
|---|---|---|
| Idle | 1–318 | 5.283 s |
| Idle_2 | 1–198 | 3.283 s |
| Walk | 1–238 | 3.950 s |
| Run | 1–96 | 1.583 s |
| Attack | 1–180 | 2.983 s |
| Attack2 | 1–318 | 5.283 s |
| Attack3 | 1–360 | 5.983 s |
| Hide | 1–312 | 5.183 s |
| Onback | 1–294 | 4.883 s |
| Yawn | 1–598 | 9.950 s |

All ten actions were sampled at 41 phases, with side key-pose renders and
front/top views of both idle variants. Native forward is -Y, lateral X, up Z;
measurements use evaluated world transforms.

Idle_2 is the useful low four-foot reference. At phase zero the envelope is
.521 m wide × .851 m long × .395 m high. Pelvis Z=.117, spine .120, neck chain
.092/.103, head .179. The shell is a tall oval dome with an overhanging lip and
a low plastron. The beaked head has a long extendable-looking articulated neck;
limbs are short and splayed, with broad clawed feet and a tiny pointed tail.
Left fore-hip X=.117, elbow .172, wrist .173; hind hip .149, knee .194, ankle
.180. Feet mostly fit beneath the shell outline instead of spreading far past
it. The fore-elbow also advances forward relative to its shoulder, then the
wrist bends back. Those observations informed the final narrowed paper stance.

Idle is a deliberately raised, almost upright comic pose, with head Z=.414 and
parts below ground at phase zero. Walk retains a fairly steady low shell and
alternates moving limbs; head is around .254–.255 at phases zero/half. Run has
large shell pitch and airborne poses: at half phase the entire mesh envelope
is above Z=.014 and head reaches .471. Attack raises/retracts the neck then
returns forward; Attack2 exaggerates upward motion, and Attack3 includes a
large body turn/spin (the head changes from ahead to behind the pelvis).
The jaw is widely open in the inspected native key poses, including travel.
Hide, Onback and Yawn are distinct follow-up candidates.

The paper model adapts these references: use the low Idle_2 stance, slow whole-
leg crawling, a faster **supported** travel clip, and a readable braced neck
recoil/bite. The snap timing and closed neutral mouth are authored; the native
jumps, upright idle, spins and perpetual open mouth are not copied literally.

Reproduce diagnostics with the appended scene, or:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-tortoise.py -- /absolute/path/SK_Tortoise_Stylized.blend
```

Temporary outputs: `/tmp/tortoise-inventory.json`, `/tmp/tortoise-motion.json`,
and `/tmp/tortoise-*.png`. Blender is left at Idle_2 frame 1. This document
preserves the evidence needed to resume without temporary artifacts.

## Independent paper model

`scripts/refine-tortoise.mjs` writes the separate Tortoise family/model, with
202 joints / 96 plates, .41 m nominal height. Most joints are nonvisible rigid
geometry anchors. The shell is a closed shared-vertex surface: twelve lower
plastron faces, twelve thin rim faces, twelve lower scutes, twelve upper scutes,
a crown and a bottom plastron. It measures .65 m long × .49 m wide, from Z=.082
to .385. Each face has a rigid helper frame at its actual vertex centroid for
ordinary camera-depth sorting. Shared vertices prevent cracks; the entire shell
moves as one rigid body. No renderer changes or view-specific shape tricks.

Four short spatial leg chains have splayed hip/elbow-or-knee/ankle/sole joints.
The final fore-elbows bend forward and the feet remain near the shell perimeter.
Broad six-point pads, crossed narrow sole edges and three short claws per foot
retain visibility in plan and edge-on views. Coplanar foot surfaces share their
real sole owner, the raised instep belongs to the ankle, and claw/geometry tips
are helpers without joint caps. Explicit seam sizes avoid the default .06 m
floor. Limb roots, neck socket, beak/jaw roots and tail socket are buried.

Author-time two-link spatial IK solves to each ankle, with the fixed distal
sole offset and inverse ankle orientation keeping the whole pad level. Reach
failures throw. Only ordinary local rotations/root poses are exported. The
initial fast bake had too much between-key sole tilt; increasing its sample
density fixed the measured error without changing the contact plane/tolerance.

- Idle, 4.6 s: low alert head/breathing motion over four fixed feet.
- Walk, 3.9 s: lateral-sequence four-beat crawl, .80 support duty, .05 m stride,
  .022 m recovery and at least three supports at every phase.
- Fast travel (`run`), 2 s: .085 m stride and .035 m recovery, same supported
  four-beat crawl and rigid shell. It does not gallop or leave the ground.
- Bite, 1.5 s: recoil through neck hinges by .35, forward/down snap at .46,
  jaw closes .51, release .52, recover .76 and settle. Head drops over .10 m
  from windup to strike while moving forward. All four soles stay fixed; first
  and last poses match idle exactly.

## Regression and visual review

Fourteen focused tests cover reference proportions and shell-perimeter stance,
closed shared topology with hole/detachment mutations, rigid shell/centroid
frames, bounded seams/helper caps, fixed real contacts, supported gait timing,
whole-leg articulation, bite/snap/return, lengths/limits/loop continuity,
intermediate pad planarity/clearance, and a stationary shadow.

The dense matrix checks 4,608 pose/camera combinations for structural occlusion
and full emitted SVG bounds. Another 960 check actual skull coverage of beak/jaw
roots, with a promoted-connector mutation. Another 512 top-down views assert
limbs/feet paint below the shell, with a promoted-foot mutation. Foot ownership
has its own mutation check.

A separate geometric surface-order oracle projects each shell vertex, samples
polygon interiors and obtains surface depth by screen barycentrics. At 96
camera orientations it compares the last painted face with the nearest physical
surface. Moving the bottom plastron over the dome deliberately fails this check.
This checks visible surface ordering independently of metadata and goldens.

Workbench review covers side/oblique shell shape, moving slow/fast travel,
neck recoil and bite, top-down burial, front stance, and contact overlays.
Top/front comparison against the native reference caught an overly wide first
stance; the final hip and elbow positions were narrowed before acceptance.

Final actual workbench preview is idle, 45° elevation / 225° heading, overlays
off; screenshot `/tmp/tortoise-workbench.png`. All 47 earlier resolved-model
goldens remain unchanged. Tortoise has separate accepted rig/package fixtures;
workbench source registration/labels and generated HTML are updated together.

Final gates passed: `npm run check` — 386/386 tests, 48/48 source/model
validations, all ordinary/motion/paint audits and release metadata. Advisory
totals remain 40/38/40; Tortoise adds none. Chromium matched 121/121 outputs,
including patch/onion/turntable/independent overlay UI checks, with zero console
errors. No other creature sources or goldens changed.

## Review follow-up, 2026-10-30

The current connector/foot/shape or motion corrections supersede the affected
initial milestone descriptions above. See
[the five-creature follow-up](creature-feedback-2026-10-30.md) for the requested
views, final authoring changes and independent regression checks.
