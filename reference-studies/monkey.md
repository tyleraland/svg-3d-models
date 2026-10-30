# Monkey reference study

N10, 2026-10-29. WildMesh `Stylized Animals/Monkey_Stylized/`
`SK_Monkey_Stylized.blend`, opened in Blender in a separate appended scene named
`WildMesh Monkey reference`, preserving the existing scene. Native mesh
`U3DMesh`, 94 bones, 60 FPS. The source does not establish a species; this is a
small stylized long-tailed monkey, not the deferred Gorilla archetype. No native
mesh, texture or action payload enters the runtime rig.

## Observed reference

Loaded all 13 library actions, not just the action linked by the source scene:

| Action | Frames | Duration at 60 FPS |
|---|---|---|
| Idle | 1–600 | 9.983 s |
| Idle1 | 1–178 | 2.950 s |
| Idle2 | 1–498 | 8.283 s |
| Idle3 | 1–600 | 9.983 s |
| Walk | 1–120 | 1.983 s |
| Run | 1–78 | 1.283 s |
| Attack1, Attack2 | 1–118 | 1.950 s each |
| Attack3 | 1–240 | 3.983 s |
| Attack4 | 1–232 | 3.850 s |
| B2Attack | 1–258 | 4.283 s |
| Die | 1–220 | 3.650 s |
| Monkeyb1 | 1–180 | 2.983 s |

Sampled Idle, Idle1, Walk, Run and all five attacks at 41 normalized phases;
rendered side key poses plus idle front/top. Native forward is -Y, lateral X,
up Z; armature bone-local numbers are centimeter-scale and must be transformed
through the object matrix before measuring world proportions.

- Idle is a deep crouch/sit: hips around .131 m, upper spine .262 m, head .325 m;
  long bent arms hang between raised knees, tail curls above the back. Evaluated
  mesh envelope at phase zero is approximately .269 × .533 × .475 m.
- Idle1 is the supported quadrupedal ready stance used to guide our default:
  hips .266 m, upper spine .257 m, head .278 m. It has a narrow torso, folded
  hind legs, long articulated forearms and broad hands/feet. The elevated hooked
  tail accounts for much of the .725 m overall height. It is not a short stub or
  a weight-bearing kangaroo tail.
- Walk has alternating palm/foot steps with a nearly level back; head about
  .305 m and hips .332 m at phase zero. At .25 one hand has landed while a hind
  foot recovers; the side pairs exchange roles at .75. Tail remains raised.
- Run lowers the chest relative to the pelvis, articulates upper/lower limbs,
  recovers the hind legs together more closely and includes airborne poses.
- Attack1 rises and alternates large arm swings. Attack2 clearly raises both
  hands overhead, then drives them down: at .375 hands are .840/.832 m high,
  at .625 they are .021/.029 m high. Head rises from .278 m to .624 m and drops
  to .241 m. Attack4 is a low forward-reaching swipe/lunge. B2Attack includes
  more upright arm gestures. These are observations from poses, not semantics
  inferred from generic action names.

Reproduce the study with `scripts/study-wildmesh-monkey.py` through the Blender
connector in the appended scene, or:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-monkey.py -- /absolute/path/SK_Monkey_Stylized.blend
```

Diagnostics and native key-pose renders are written to `/tmp/monkey-*`; the
reference file is never saved. This document retains the measurements and
interpretation needed to resume without those disposable files.

## Paper model

Independent `monkey` family/model authored by `scripts/refine-monkey.mjs` using
existing schema primitives and author-time support IK. 33 joints, 36 rigid
plates. Approximately .9 m overall height including the tail. A lean .24 m
trunk, compact head/muzzle, round ears, long two-link forearms plus wrists/palms,
flexed thighs/shins plus ankles/feet, and eight tapering tail sections retain
the reference silhouette. The tail socket and muzzle bridge are buried internal
joins, with camera-relative ordering for the external tail, ears and arms.
The paper palette and existing detail level are retained.

- Idle, 3.6 s: quiet quadrupedal ready crouch, all four palms/feet fixed to Z=0,
  small breath/head movement and a propagated tail wave. Seated Idle is not an
  additional clip in this milestone.
- Walk, 1.98 s: staggered four-beat movement with .72 duty factor, two or three
  supports, .055 m recovery arcs and whole-arm/whole-leg articulation. Every
  stance has the same backward ground speed in this in-place presentation.
- Run, .9 s: faster hind/hind/hand/hand contacts at 0/.12/.38/.50, .22 duty
  factor, .10 m recovery and suspension .72–1. It compresses native timing for
  the simplified model rather than copying exact native curves.
- Attack, 1.96 s: Attack2-informed crouch, rear onto hind feet, two-hand overhead
  windup, rapid downward slam, both palms braced at .62–.74, release/lift and
  complete quadrupedal recovery. At .42 hands reach about .773 m above a .656 m
  head; at impact both palms are on the fixed ground patch X=.27. Hind feet
  remain fixed throughout. The eight-section tail counterbalances from its root
  without accumulating the root correction repeatedly through every segment.

Curves are authored adaptations guided by native proportions and motion. The
model is not a physics simulation or a mesh retarget. Runtime consumers receive
ordinary joint-local clips. Reach and bend limits are enforced at bake time;
continuous Euler representation and dense sampling keep interpolation stable.
Ground and shadow remain fixed. The run has explicit support/flight intervals;
attack has anticipation/action/contact/recovery/settle phases and impact/release
events. Existing hit/KO behavior is inherited from the canonical pipeline, not
claimed as a newly studied death adaptation.

## Independent regression evidence

Ten focused tests cover proportions, actual zero contact surfaces, breathing
support, four-beat support continuity, arm/leg articulation, uniform treadmill
stance speed, run suspension, overhead-to-ground slam and recovery, length/limit
preservation, loop closure, clearance, continuous angles, and stationary shadow.
The attack's fixed feet are verified to sub-micron accuracy through interpolated
poses; slam recovery lifts the palms rather than briefly dipping below Z=0.

The dense directional test checks 4 clips × 12 extreme/intermediate poses × 6
camera elevations × 16 headings = 4,608 views, including emitted SVG bounds and
independent occlusion validation. Buried muzzle/socket ordering receives another
960 views and deliberate promotion mutations to prove failures are detected
independently of regenerated goldens. Side, head-on, top and oblique silhouette
sheets were reviewed before accepting fixtures. Workbench review and final
catalog/browser gate results are recorded in the roadmap checkpoint.

Final gates passed: 322/322 tests, 43/43 source/model validations, all catalog
ordinary/motion/paint audits and release metadata. Existing advisory totals
remain 40/38/40; Monkey adds none. Browser comparison passed 121/121 outputs
with authoring UI checks and zero console errors. All 42 previous goldens are
unchanged. Monkey is committed separately; N11 Rat remains next.
