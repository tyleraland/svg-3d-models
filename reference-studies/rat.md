# Rat reference study

N11, 2026-10-29. WildMesh `Realistic Animals/Rat/SK_Rat.blend`, opened
in Blender as an appended `WildMesh Rat reference` scene. Existing scenes,
including the Monkey study, are preserved. Native `SKM_Rat` armature and mesh,
53 bones, 24 FPS. No reference mesh, texture or action payload enters the
runtime SVG model.

## Native evidence

All 24 actions were inventoried. Rat action handles are tagged when appended so
names such as Idle/Walk/Run cannot silently select the preserved Monkey actions.

| Actions | Native frames |
|---|---|
| Idle | 1–93 |
| NeutralStand00 / 01 / 02 | 1–64 / 1–193 / 1–65 |
| WalkSlow / Walk / WalkStop | 1–40 / 1–25 / 1–31 |
| Trot / Run / Sprint | 1–15 / 1–10 / 1–8 |
| TurnL90 / TurnR90 | 1–36 each |
| Sit00 / Sit01 / Sit02 | 1–64 / 1–193 / 1–192 |
| IdleToSit / SitToStand | 1–61 / 1–46 |
| Lying00 / Lying01 / Lying02 | 1–64 / 1–193 / 1–128 |
| IdleToLying / LyingToStand | 1–65 / 1–56 |
| Damage / Death | 1–30 / 1–41 |

There is **no native attack**. Bite is an explicitly authored adaptation using
the reference head/jaw/neck proportions, not a claimed copied animation.

Sampled Idle, NeutralStand01, WalkSlow, Walk, Trot, Run and Sprint at 41 normalized
phases. Rendered side key poses and idle front/top. Coordinates are native world
meters: forward -Y, lateral X, up Z. At Idle phase zero the evaluated mesh
bounds are approximately .0984 m wide × .4849 m long × .1279 m high. Pelvis Z is
.0746 m, upper spine .0865 m and head .0867 m. The arched back and rounded rump
sit above the small head; the pointed snout narrows toward the nose. Upper arms
and thighs fold into short lower limbs and small broad paws. Ears are rounded,
and the tail is thin and long: Tail1 Y=.0889/Z=.0555, Tail8 Y=.2935/Z=.0064,
with the mesh extending farther toward Y=.3233.

- Idle is not just breathing: it rears and sniffs, with the hands about .129 m
  high at .25 and the head .172 m high. We instead use the four-paw NeutralStand
  posture to guide the default quiet idle; no new rearing clip is required here.
- Walk is 1.0 s and alternates fore/hind recovery. At .5 the left hand is .0369 m
  high while the right is .0097; the opposite hands exchange roles at phase zero.
  The back remains low, head around .079 m, while the tail sways laterally.
- Run is .375 s, with more closely grouped hind/fore beats, back flexion, tucked
  hind recovery and suspension. At .25 the full evaluated mesh is above ground
  (minimum Z around .0148 m); hips are .1151 m while head remains .0776 m.
  At .5 the forepaws are low and hind feet tucked. Tail rises: Tail8 Z=.0981 m
  at .25 versus about .0064 m in quiet Idle phase zero.
- Sprint is .292 s and exaggerates the same fast travel. WalkSlow and Trot sit
  between the inspected slow and fast extremes; they are references, not extra
  selectable clips in this milestone.

Reproduce diagnostics and native renders with `scripts/study-wildmesh-rat.py`
through the connector in the appended scene, or:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-rat.py -- /absolute/path/SK_Rat.blend
```

Outputs are `/tmp/rat-inventory.json`, `/tmp/rat-motion.json` and native PNGs.
The reference file is never saved. Measurements and interpretation above are
retained here so the temporary outputs are not required for resumption.

## Paper model and authoring

Independent `rat` family/model, reproduced by `scripts/refine-rat.mjs`. 34 joints,
37 rigid plates. Nominal height .132 m; low body, arched back cap, rounded rump,
tapered chest, pointed wedge muzzle, small nose/jaw, round ears, four folded
three-link legs with broad paws and a six-section thin tapering tail. Tail
length is close to head/body length. Palette and structure match existing rigs.

The rear and front barrel spans meet at `spineMid`. A single rigid plate across
that articulating hinge would stretch as the run flexes the back; independent
rigid-span validation caught it before acceptance. Every seam has an explicit
small-animal diameter: the legacy automatic .06 m floor would otherwise make
ears, shoulders and ankles much wider than their incident geometry. This is a
Rat source correction, not a shared compiler behavior change.

Muzzle, head connector, jaw base and tail socket are internal buried joins.
Actual workbench oblique review caught the jaw triangle base over the skull;
its internal bridge now sits beneath the opaque head, while the projecting
jaw still opens outside it. Camera-relative ears, proximal limbs and external
tail keep appropriate near/far depth. No arbitrary permanent foreground order
is assigned to limbs or ears.

- Idle, 3.2 s: low sniffing/breathing with all four paws fixed at Z=0, small ear
  motion and a lateral wave through the long tail.
- Walk, 1.0 s: four-beat scurry, .68 support duty, raised paw recovery and
  articulated upper/lower/distal limbs.
- Run, .38 s: short quadrupedal bound, .19 support duty, staggered hind/hind/
  fore/fore contacts, back flexion, tucked paw recovery and suspension .63–1.
  Tail rises and sways while the ground and shadow remain fixed.
- Attack, .85 s: authored four-paw braced bite. Crouch/jaw opening, a short
  forward neck/body thrust, rapid jaw closure at .48, release and recovery.
  Jaw goes from 30° open at .42 to 1° at .48. Both ends match quiet idle exactly,
  including tail pose; planted paws do not drift as the body moves.

The existing author-time quadruped gait and sagittal support IK tools emit
ordinary local clips. Reach, bend limits and bone lengths are enforced; there
is no runtime IK or native action retargeting. The bite is an authored gesture,
not a contact-physics simulation. Canonical hit/KO remain inherited behavior;
the native Death action was inventoried but is not claimed as a new adaptation.

## Regression evidence

Ten focused tests cover anatomy, seam scale, four true contact surfaces, quiet
support, scurry support continuity, full limb articulation, run suspension/back
flex, bite thrust/jaw timing/fixed paws/idle matching, lengths/limits/loop seams,
interpolation clearance and fixed ground/shadow. Removing the ear/carpus/hock
seam sizes deliberately restores the oversized default and fails the independent
fit predicate.

The dense matrix covers 4 clips × 12 key/intermediate times × 6 elevations × 16
headings = 4,608 views, checking independent occlusion and full emitted SVG
bounds. Another 960 views check actual muzzle and jaw base-corner coverage by
the head ellipse plus painter order and buried tail socket order. A promoted
muzzle mutation fails the coverage predicate and occlusion oracle. Goldens are
recorded only after this review. Final actual workbench and catalog/browser
results are recorded in the roadmap completion checkpoint.

Final gates passed: 332/332 tests, 44/44 source/model validations, all ordinary/
motion/paint catalog audits and release metadata; existing advisory totals
remain 40/38/40, Rat adds none. Browser comparison passed 121/121 outputs with
authoring UI checks and zero console errors. All 43 earlier model goldens are
unchanged. Actual workbench review covered moving side scurry/run, open bite,
closed bite with contact overlays, overhead burial, head-on silhouette and
45° / 225° corrected jaw. Workbench left at that oblique idle view.
