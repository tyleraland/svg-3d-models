# Kangaroo reference study

N9, 2026-10-29. Native Blender 5.1.2 study of WildMesh
`Realistic Animals/Kangaroo/SK_Kangaroo.blend`, mesh
`Eastern_Grey_Kangaroo_Male`. No reference mesh, texture or animation payload
is copied into the runtime SVG model.

## Native evidence

114 bones, 54 actions, 30 FPS. Idle's evaluated world envelope is approximately
.603 m wide × 1.897 m long × 1.580 m high. Idle landmarks (world Z): hips .615,
upper spine 1.095, head 1.313, upper arm 1.083, elbow .896, hand .657, thigh root
.567, knee .684, ankle .051 and toe .018. The knee sits above the hip in this
relaxed stance. Tail root is .550 m high, Tail08 .121, Tail14 .036 and Tail21
.009. Heavy haunches, long shins/feet, small forearms, a rising narrow chest,
small elongated head, leaf ears and a thick tapering tail define the shape.

Inspected actions, sampled at 41 normalized phases with key-pose renders:

- Idle, frames 1–151 (5 s).
- walk_fwd_01, 1–47 (1.533 s): low pentapedal movement; hands and tail brace while
  the paired hind feet advance, then hind feet support the front/tail reset.
- trot_fwd_01, 1–18 (.567 s), and sprint_fwd_01, 1–18: paired hind-foot hopping,
  forward-carried body, airborne intervals, folded arms and an elevated tail.
- aggressive kick fwd, 1–51: upright aggressive movement; this clip name alone
  does not establish a double-foot kick.
- aggressive_attack_stomping_01, 1–71 (2.333 s): the clear double-foot kick.
  Near normalized .275 both toes are at 1.380/1.454 m while Tail21 remains
  .007 m high; hips are 1.096 m and the upper body leans back. The soles turn
  forward/up; arms guard and the feet retract and land.
- agressive_idle_01, 1–201: upright aggressive guard. No separately named punch
  exists in this inventory. The paper punch is authored from that guard and
  the native arm proportions, rather than described as a copied native action.

Other actions include alerts/listening/looking, feeding/drinking, rest/stretch,
turns, transitions, bark, hit, injured/death, jump and mock charge.

Reproduce the inventory, sampled bone/bounds data and native renders:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-kangaroo.py -- /absolute/path/to/SK_Kangaroo.blend Kangaroo
```

Outputs are `/tmp/kangaroo-*`. Aspect-aware orthographic framing retains the
full upright combat pose. The reference scene is never saved.

## Paper shape and motion

Independent `kangaroo` family/model, reproduced by
`scripts/refine-kangaroo.mjs`. 40 joints and 33 plates, approximately 1.72 m
standing height. Broad haunch plates, upward-folded thighs, long shins and
articulated long feet; a slim torso/chest, small two-link arms, small muzzle,
upright ear leaves and a four-section tail. Core/head seam gaskets are sized
and buried through the supported source contract. The model uses the existing
paper palette, stable semantic IDs, rigid spans and directional compositor.

- Idle: 5 s quiet breathing and ear movement over two planted hind feet plus
  the tail support. Hands hang near the belly.
- Walk: 1.55 s low hands-and-tail-assisted advance. Hind feet lift .12–.40;
  hands reset .48–.80 and tail resets .52–.80 over grounded hind feet.
- Run: .57 s paired hopping, hind-foot support 0–.28 followed by suspension.
  Body pitches forward, arms fold, tail rises and feet point down in flight.
- Punch (`attack`): 1.15 s guard lift, near-arm extension, opposite-hand guard,
  recoil and return. Hind feet and tail remain braced throughout.
- Tail-supported kick (`kick`): 1.45 s guard/preload, pelvis shift about .30 m
  backward, backward torso lean and rise, double-foot lift at .20, forward
  extension at .44, retraction and two-foot landing at .76, then recovery.
  Tail contact stays anchored throughout, including before lift and after
  landing. At impact both toes are around .80 m forward / .75 m high and the
  feet turn up to present their soles. Both attacks return exactly to idle.

The kick is an authored dynamic tail brace, not a center-of-mass or rigid-body
physics simulation. Support continuity, planted-tail drift, foot clearance,
backward body shift and recovery timing are verified explicitly.

## Authoring and contact contract

All planar IK is author-time only; consumers receive ordinary joint-local clips.
Upward-pointing thighs cross atan2's branch cut. The local macropod solver wraps
relative angles before enforcing authored joint limits; interpolation is tested
for continuity rather than allowing 360° keyframe jumps. Distal pitch articulates
the long feet without changing bone length or bypassing reach/limit failures.

The compiler measures contact surface offsets from bind. The native low support
posture therefore serves as source bind: hands, hind feet and the tail support
all have true zero-height soles. A deterministic sagittal rebase rotates bind
vectors, subtracts the same local rest angles from clips and joint limits, and
shifts root translation by the rest offset. It preserves world motion and every
bone length; upright idle remains the default preview. No runtime solver,
contact-offset workaround or compiler change is required.

Bake densities: idle 240, walk/run 320, punch 480, kick 960 uniform intervals,
plus exact phase/contact boundaries. Each clip has explicit support metadata;
attack events have anticipation/action/contact/recovery/settle ownership.

## Regression and visual review

Eleven focused tests cover shape, supported bind/contact offsets, fixed idle feet/
tail/shadow, pentapedal support exchange, paired suspended hops, punch/guard,
tail anchor before lift through landing, soles-up kick, bone lengths/limits,
loop closure, angular branch continuity and interpolation clearance.

The contact tests sample 1,201 interpolated phases per clip at .1 mm vertical
tolerance. Kick tail drift is bounded to 2 micrometers. The independent matrix
covers five clips × twelve critical phases × six elevations × sixteen headings
= 5,760 views, including full emitted SVG primitive bounds and transforms. A
head connector deliberately promoted over its incident plates is detected
independently of fixtures/browser parity. An additional head-on overlap oracle
requires both hands to render above the overlapping haunch/pelvis surfaces;
burying a single hand behind the body is detected. Forearms and hands use
chest-relative surface depth, avoiding the legacy near/far tie at head-on views.
Knee connectors are constrained to fit the slender shins. Overlapping depth intervals still need visual review.

The browser parity sweep explicitly includes the new `kick` clip, alongside
punch and locomotion. Native/SVG side/front/top/oblique anatomy, slow support
exchange, hopping suspension and both attacks are reviewed in the workbench.
Final catalog/browser results and the implementation commit are in the roadmap.

Observed interpolation metrics: maximum active-contact error/negative clearance
approximately .0088 mm across the five authored clips; kick tail drift about
.985 micrometers. No center-of-mass stability claim is inferred from those tests.

Final gates passed: eleven Kangaroo tests; all 306 headless tests, 42/42 source/
model validations, ordinary/motion/paint audits and release checks. Kangaroo adds
zero issues/warnings; catalog advisories remain 40/38/40. Browser parity passed
141/141 outputs including `kick`, authoring UI checks and zero console errors.
Workbench left at upright idle, 45° elevation / 225° heading. See the roadmap for
the implementation commit and N10 Monkey resume checkpoint.
