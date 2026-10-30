# Ostrich reference study

N13, 2026-10-30. WildMesh `Stylized Animals/Ostrich_Stylized/`
`SK_Ostrich_Stylized.blend`, appended in Blender as `WildMesh Ostrich reference`
without replacing earlier scenes. Native U3DMesh / Armature, 56 bones, 60 FPS.
All ten actions were loaded and tagged per study so shared names cannot select
another animal's action. No native mesh, texture or animation payload enters
the SVG runtime.

## Native inventory and observation

| Action | Frames | Duration |
|---|---|---|
| Idle | 1–178 | 2.950 s |
| Idle2 | 1–240 | 3.983 s |
| Idle3 | 1–660 | 10.983 s |
| Walk | 1–120 | 1.983 s |
| Run | 1–78 | 1.283 s |
| Attack / Attack2 | 1–138 each | 2.283 s each |
| Attack3 | 1–198 | 3.283 s |
| Attack4 | 1–186 | 3.083 s |
| Die | 1–180 | 2.983 s |

Sampled Idle, Walk, Run and all four attacks at 41 normalized phases, with side
renders at .25/.5/.75 and front/top idle views. Coordinate convention: native
forward -Y, lateral X, up Z, measured through object world transforms.

Idle phase-zero evaluated envelope is approximately .575 m wide × 1.018 m
long × 1.034 m high. Hips Z=.691, upper chest/spine .661, head .924. The short
true thigh runs from .692 to .538; the visible backward hock is at .318, ankle
at .089 and toe near .029. The leg has a short proximal thigh plus long calf
and metatarsus, not a two-segment human leg. There are two forward toes per foot.
The body is broad and feathered; neck is thin with a low forward curve and an
upright upper section; head is small with a flat bill. The wings are reduced
in folded posture, and the tail is a short feather plume.

- Idle has an open bill at some phases and variable neck/head carriage; it is
  not a perfectly static upright pose. The paper idle also draws from Walk's
  taller head carriage rather than copying the entire native idle performance.
- Walk alternates support/recovery at roughly half-cycle offsets. At .25 one
  ankle is .259 m high while the other remains .080; roles swap by .75. Head is
  around 1.02–1.07 m high over hips about .69. Upper/lower/distal joints all move.
- Run has a longer recovery, extension behind the body and brief airborne poses.
  Reduced wings and head help balance the torso; it is not a flight animation.
- Attack and Attack2 include neck/bill/display gestures. Attack3 has a stronger
  spread-wing display. Attack4 clearly crouches, launches, brings both legs
  forward/up, then lands: at .5 hips are .893 m, left ankle .950 and left toe
  .974, with the whole mesh envelope above Z=.616. The feet project about .5 m
  forward of the pelvis, wings spread, and the neck remains elevated. This is
  the selected combat reference.

Reproduce diagnostics and native key-pose renders through the connector in the
appended scene, or:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-ostrich.py -- /absolute/path/SK_Ostrich_Stylized.blend
```

Outputs are `/tmp/ostrich-*`; the source file is never saved. This document keeps
the inventory and measurements needed to resume without temporary artifacts.

## Separate paper model

Independent `ostrich` family/model, produced by `scripts/refine-ostrich.mjs`.
33 joints / 31 rigid plates, 2.3 m nominal height, using roughly twice the native
stylized reference's dimensions while retaining the major ratios. Chicken,
Eagle and Crow remain separate and unchanged.

A broad feather barrel sits above long legs; a four-section thin S-neck leads
to a small head/flat bill. The short thigh is independently articulated. An
explicit true knee, backward hock, ankle and toe retain the four-link anatomy.
Two forward toe spans share a sole joint. The short tail is a feather fan;
reduced wing coverts and rounded folded feather spans retain a small visible
width from head-on views. The attack opens these short wings for balance rather
than retargeting the full native display-wing span or adding a fly clip.

The true thigh has an authored phase-dependent angle; analytic author-time IK
solves calf/metatarsus plus prescribed foot pitch. Reach and bend limits are
enforced. An initially excessive run body rise failed reach and was reduced
before accepting the bake. Consumers receive ordinary joint-local clips; no
runtime solver or native mesh/action data is needed.

- Idle, 4.2 s: upright quiet neck/head/tail movement, reduced folded wings and
  two fixed two-toed feet on Z=0.
- Walk, 1.98 s: alternating long strides, .625 support duty and double support;
  true thigh, knee, hock and ankle all articulate. Foot recovery clears the
  ground while the neck/head remain relatively stable.
- Run, .9 s: faster alternating .78 m strides, .40 duty and suspension gaps
  .40–.50 / .90–1; long raised recovery and small wing trim. Body rise is bounded
  by actual limb reach rather than stretched segments.
- Attack, 1.3 s: two-foot crouch, takeoff .28, forward/upward double kick at .46,
  feet retracted after .54, paired landing .72 and recovery to exactly idle.
  Both toes reach X=.95/Z=1.8, above the pelvis at impact; the feet turn up to
  present their soles. Wings assist outward, the head remains aloft, and ground
  and shadow stay fixed.

The jump body follows a .4 m parabolic arc over .572 s; implied acceleration is
about 9.78 m/s². Hermite preload/landing sections match its takeoff and landing
velocity. This is authored animation, not a rigid-body simulation. Timing is
compressed from the native Attack4 while preserving its defining pose sequence.
Canonical hit/KO are inherited; native Die is inventoried, not retargeted here.

## Review findings and regression checks

- Explicit head/neck regions avoid misclassifying centerline neck and lower-bill
  parts from their names. Bill bases and tail socket remain buried joins.
- Actual workbench review caught a circular seam cap extending past the rounded
  wing tip. The tip is a non-articulating geometry anchor, now marked helper;
  it no longer emits a joint cap. A mutation restores the exposed cap and fails
  the independent endpoint predicate.
- Browser parity caught three coplanar foot-order mismatches between Node and
  Chromium. Toe plates had separate helper tips as their attachment owners,
  so tiny floating-point depth differences changed ordering. Both toe plates
  now share the actual sole joint; the raised instep belongs to the ankle.
  The camera still controls near/far ordering. A mutation restores the separate
  helper owner and fails the sole-frame invariant. No shared sort tolerance,
  forced foreground layer or renderer change was introduced.

Fourteen focused tests cover proportions, four-link leg anatomy, two toes,
bounded seams with oversized-cap mutations, true contact surfaces, fixed idle,
walk support/articulation, run suspension, the high forward kick/landing/idle
recovery, parabolic body arc and velocity joins, lengths/limits/angle continuity,
intermediate clearance, fixed shadow, head-on wing visibility, outward wing
assist, terminal caps and shared sole ownership. Contact/interpolation error
is bounded to .00005 m (well below a rendered pixel).

The dense matrix covers 4 clips × 12 key/intermediate times × 6 elevations × 16
headings = 4,608 views with independent occlusion and full emitted SVG bounds.
Another 960 views check actual opaque-head coverage of both bill bases plus
painter order and buried tail socket order. Promoting the bill fails both the
coverage predicate and independent occlusion oracle. Final workbench and catalog/
browser evidence is recorded in the roadmap checkpoint.

Final gates passed: 358/358 tests, 46/46 source/model validations, all ordinary/
motion/paint catalog audits and release metadata. Existing advisories remain
40/38/40; Ostrich adds none. Final browser comparison passed 121/121 outputs
with authoring UI states and zero console errors, including the workbench entry
grouped beside Chicken and the other birds. All earlier 45 model goldens are
unchanged. Actual workbench review covered side walk/run, side and oblique
jumping kick, paired landing with contact overlays, overhead burial and head-on
wing/toe visibility. Workbench left at idle, 45° / 135°, overlays off.
