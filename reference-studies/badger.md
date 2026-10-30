# Badger / HoneyBadger reference study

N12, 2026-10-30. Source: WildMesh `Realistic Animals/HoneyBadger/`
`SK_HoneyBadger.blend`. Appended into a separate `WildMesh HoneyBadger reference`
Blender scene, preserving existing scenes and studies. Native HoneyBadger
armature / Badger mesh, 87 bones, 24 FPS, 63 native actions. Action handles are
tagged per study so shared names such as Idle cannot select another animal's
animation. No native mesh, texture or animation payload enters the SVG model.

## Species and scope

The separate SVG ID is `badger`, labeled **Badger · honey badger**. It retains the
reference honey-badger proportions: long broad barrel, powerful forequarters,
thick neck, small ears, short bent limbs and a short down-curved tail. It does
not claim to be a species-accurate European badger or introduce that animal's
face markings. The existing neutral paper palette is retained. A different
badger species can be an independently referenced follow-up rather than silently
changing this model's identity.

The library supplies no dedicated bite or claw strike. Our attack is an authored
braced bite guided by the native neck/jaw anatomy and threat posture; it is not
presented as a copied native combat action. The six small foreclaws are rigid
anatomical silhouette details, not a separate claw attack in this milestone.

## Native inventory

Source action names are recorded as provided; names containing Grazing are
asset labels, not a claim about diet.

| Action group | Count | Native frame ranges |
|---|---:|---|
| WalkSlow F/L/R | 3 | 1–61 |
| WalkMedium F/L/R | 3 | 1–31 |
| WalkFast F/L/R, ordinary and `_2` | 6 | 1–17 |
| TrotSlow F/L/R, ordinary and `_2` | 6 | 1–17 / 1–19 |
| TrotFast F/L/R, ordinary and `_2` | 6 | 1–17 / 1–16 |
| RunSlow F/L/R, ordinary and `_2` | 6 | 1–15 / 1–16 |
| RunFast F/L/R, ordinary and `_2` | 6 | 1–11 / 1–13 |
| Idle | 1 | 1–201 |
| Idle2GrazingOnspot A/B | 2 | 1–81 |
| GrazinStepsLookat | 1 | 1–221 |
| GrazingWalk Slow/Medium/Fast F/L/R | 9 | 1–61 / 1–31 / 1–15 |
| GrazingSteps_1 | 1 | 1–221 |
| GrazingOnSpot A/B, variants 1/2/3 | 6 | 1–181 / 1–221 / 1–171 |
| GrazingOnspot A/B to IdleThreat/IdleCalm | 4 | 1–29 / 1–71 |
| A_GrazingOnSpot2Frighten F/L/R | 3 | 1–6 |

Sampled eight actions at 41 normalized phases with native orthographic renders:
Idle, WalkMedium_F, TrotSlow_F_2, RunSlow_F_2, RunFast_F_2, GrazingOnSpotA_1,
GrazingOnspotB2IdleThreat and A_GrazingOnSpot2Frighten_F. Idle also received front
and overhead renders.

World coordinates are forward -Y, lateral X and up Z. Evaluate the armature and
mesh through their world transforms; their object-local dimensions use different
orientations. Idle phase-zero evaluated envelope is about .293 m wide × .929 m
long × .534 m high, including the native bounding envelope below Z=0. Pelvis
head Z=.257, Chest=.304, Head=.409, Nose=.389; the nose sits approximately .167 m
forward of the head. Tail1 is at Y=.248/Z=.303 and Tail3 Y=.329/Z=.201. Small ears
sit close to the skull, shoulders are substantial, and forepaws have digging
claws. The lower body and bent limbs remain compact beneath the broad trunk.

- Idle (8.333 s) carries the head well above the back and barely moves its four
  supports. The source stance is asymmetric; the SVG ready stance uses symmetric
  lengths and truly grounded soles instead of copying native mesh penetration.
- WalkMedium_F (1.25 s) lowers the head to about .24–.26 m while hips/chest stay
  around .24–.26 m. Fore/hind recovery alternates, with upper and lower segments
  moving. The tail remains short and downward-curved.
- RunFast_F_2 (.5 s) groups fore/hind recovery more closely, changes back attitude
  and draws the hind legs beneath the trunk. It supplies the fast locomotion
  reference; the SVG uses explicit authored support and suspension intervals.
- GrazingOnspotB2IdleThreat (1.167 s) raises the head/neck from a low ground-sniff
  posture toward alert Idle. Head Z grows from .132 to .409. It informs the
  authored preload/recovery gesture, not a claim of a native bite.

Reproduce the study through the connector in the appended scene, or:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-badger.py -- /absolute/path/SK_HoneyBadger.blend
```

Diagnostics and native renders are `/tmp/badger-*`. The reference file is never
saved. This document retains inventory, measurements and interpretation for
resumption without those disposable files.

## Paper shape and motion

Independent family/model authored by `scripts/refine-badger.mjs`, using existing
schema primitives and quadruped author-time gait/support tools. 43 joints,
40 rigid plates, .46 m nominal height. Rear/front barrel spans meet at the
articulating spine, with broad rump/back/chest masses, a thick two-part neck,
compact head, blunt tapering muzzle, small round ears and a three-section short
tail. Muzzle/jaw bases and tail socket are buried internal joins. Proximal limbs,
ears and tail use the existing camera-relative compositor. Six paw-local foreclaw
spans add digging anatomy without importing reference geometry or texture.

All seams have bounded authored diameters, including the small ears and ankles.
They avoid oversized automatic connector circles. No shared compiler, shared
family or motion helper changes are required; earlier models remain independent.

- Idle, 4.2 s: raised alert head, quiet neck/ear/tail movement and breathing over
  four fixed paws. Feet and foreclaws keep a level sole frame.
- Walk, 1.25 s: strong four-beat gait with articulated shoulders, elbows, wrists,
  hips, knees and hocks. Head lowers for travel. Duty factor .6875 aligns contact
  boundaries with the existing 160-sample author-time grid, avoiding a small
  pre-lift before the declared support boundary.
- Run, .5 s: short bound with spine flexion, tucked recovery, staggered hind/hind/
  fore/fore support and explicit suspension .64–1. Head remains lower than idle;
  the short tail counterbalances. Joint-local paw rotations keep claw tips clear.
- Attack, 1.1 s: authored neck preload, opening to 32°, short forward thrust,
  sudden jaw closure at .48, release at .56 and complete recovery. Four paws stay
  planted, and the end pose exactly matches idle, including tail/ear poses.

Every clip is an ordinary baked local-transform clip. Reach, limits, bone length,
rigid span lengths, contacts and phase/event contracts are enforced; no runtime
IK or physics simulation is required. Canonical hit/KO are inherited behavior,
not new native death adaptations.

## Regression evidence

Twelve focused tests cover reference proportions, seam scale with default-size
failure mutations, true contact surfaces, planted idle, four-beat support and
whole-limb articulation, fast suspension/spine flex, bite/jaw/fixed-paw recovery,
loop seams, limits, lengths, intermediate clearance, fixed shadow, near/far
exchange and lowered travel head. Foreclaw frames and tip clearance are checked
through all four clips. Proximal limbs are allowed to be buried together from
above; side-to-side exchange is checked in side-facing camera directions.

The dense matrix covers 4 clips × 12 key/intermediate times × 6 elevations × 16
headings = 4,608 views. It checks independent occlusion and full emitted SVG
bounds. Another 960 views verify actual muzzle and jaw base-corner coverage by
the opaque head, painter order and tail socket burial. Promoting the muzzle
fails both the coverage predicate and independent occlusion oracle. Fixtures
are accepted after reviewing the intended silhouette and extreme poses.
Final workbench and catalog/browser evidence is recorded in the roadmap.

Final gates passed: 344/344 tests, 45/45 source/model validations, all ordinary/
motion/paint catalog audits and release metadata. Existing advisory totals
remain 40/38/40; Badger adds none. Browser comparison passed 121/121 outputs,
authoring UI states and zero console errors. All earlier 44 model goldens are
unchanged. Actual workbench review covered moving side walk/run, side open bite,
closed bite with contact overlays at 45° / 135°, top-down burial and head-on
silhouette. Workbench left at idle, 45° / 225°, overlays off.
