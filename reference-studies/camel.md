# Camel reference study

N8, 2026-10-29. Native Blender 5.1.2 inspection of WildMesh:

- `Realistic Animals/Camel/SK_Camel.blend`
- `Stylized Animals/Camel_Stylized/SK_Camel_Stylized.blend`

No mesh, texture or animation payload is copied into the paper rig.

## Reference evidence

The realistic **mesh has two humps**, despite its skeleton's `Camel_1humpM2015`
names. The stylized mesh has one hump. The SVG follows the realistic two-hump
silhouette; the separate stylized reference supplies a named bite action.

Realistic Camel: 110 bones, 32 actions, 24 FPS. Evaluated idle envelope is
approximately .748 m wide × 2.637 m long × 2.157 m high. World idle landmarks:
pelvis Z 1.468, upper spine 1.490, front upper-leg root 1.322, elbow 1.065,
carpus .525, lower neck 1.360, middle neck 1.559, upper neck 1.824 and head
1.967. Broad pads, slender lower limbs, small ears, long muzzle, hanging tail,
deep barrel and two separate humps were inspected from side/front/top.

Inspected Idle (frames 1–150), Walk_RootMotion (1–37, 1.5 s),
Run_RootMotion (1–15, .583 s), StartEating_RootMotion (1–17), and
Eating_RootMotion (1–80). Walk swings same-side hind and fore legs with a slight
delay, opposite sides half a cycle apart. Run lowers the neck substantially and
has staggered contacts with airborne intervals. The inventory also contains
mount/dismount, back/turn, hit and death clips; no named attack.

Stylized Camel: 53 bones, 18 actions, 60 FPS. Idle envelope approximately
.643 × 2.133 × 1.878 m. Inspected Idle (1–400), SlowWalk (1–238), Run (1–120),
RunFast (1–78), Bite (1–198, 3.283 s) and Buck (1–118). Other actions include
lay/stand, resting, fall, scrape, restless, yell and Wild1. Bite first lifts and
loads the neck with an open jaw, then drives the neck/head forward and down,
closes the mouth and recovers. It includes native body motion and begins in a
slightly crouched posture; our isolated attack adapts this to four planted feet.

Reproduce inventories, 41 normalized motion samples per selected action and
side/front/top/key-pose renders:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-camel.py -- /absolute/path/to/SK_Camel.blend Camel
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-camel.py -- /absolute/path/to/SK_Camel_Stylized.blend Stylized
```

Outputs go to `/tmp/camel-*`; reference scenes are never saved. Realistic fur
cards and stylized mane triangles remain visible in native study renders, but
are intentionally omitted from the paper silhouette.

## Paper adaptation

Independent `camel` family/model, reproduced by `scripts/refine-camel.mjs`.
2.15 m height; pelvis/chest at 1.46/1.48 m; head at 1.98 m. Two torso-owned hump
plates, long legs with articulated knees/carpi/hocks, broad oval foot pads,
long rising S-neck, small head, long muzzle, small ear leaves and hanging tail.
Explicit .09 m foot gaskets fit inside the .19 × .11 m pads, preventing circular
connectors from protruding asymmetrically in head-on compositing.
Existing stable ungulate `Hoof` IDs describe padded camel feet here. Three-link
legs and a three-part neck simplify the native skeleton. Humps use the existing
opaque core plate style and remain rigid to the torso through all clips.

- Idle: 5 s breathing, small lip/chewing motion and ear/tail motion; four fixed
  grounded pads and fixed ground shadow.
- Walk: 1.5 s ipsilateral pacing. Hind contact precedes same-side fore contact by
  .12 cycle; the other side is offset .5. Duty factor .68, short low swing and
  gentle body dip. All three leg segments participate. The stride stays within
  the unchanged joint limits; no limit or reach failures are bypassed.
- Run: .585 s four-beat suspended gallop, with approximately .24 m lower head
  carriage than idle. Uses the existing audited quadruped gallop baker with
  restrained body rise and an additional middle-neck rotation.
- Attack: 1.4 s neck preload, sudden forward/downward neck snap and bite, recoil,
  recovery and exact return to the starting pose. The head advances about .45 m
  and drops .44 m from preload to impact. Jaw closes from 28° to 2° in 56 ms.
  Four pads brace throughout. This is a retimed, isolated adaptation of native
  Bite rather than a direct animation transfer or a new spitting effect.

All IK runs at authoring time. Consumers receive ordinary baked local rotations
and root translations. Walk uses 320 uniform samples plus contact boundaries,
attack 480 plus phase boundaries, idle 240. Export framing uses scale 21 and
ground origin [50,58], leaving room for the full extended neck at every heading.

## Regression and review

Nine focused tests cover anatomy, hump/torso rigidity with a detached-hump
mutation, idle supports/shadow, chewing and rendered pad/gasket containment, actual same-side swing peak timing,
whole-leg motion, faster suspended run/lower head carriage, lengths/limits/loop
closure, interpolated contacts/clearance, attack direction/closure/recovery and
an independently caught foreground jaw-seam mutation.

Ground/clearance uses 1,201 interpolated samples per clip with .1 mm tolerance;
observed maximum contact error is about .0182 mm. Attack stance drift is about
.185 micrometers (2 micrometer bound). The independent directional matrix checks
four clips × twelve phases × six elevations × sixteen headings = 4,608 views,
including full emitted SVG bounds and transforms. This caught an extended-neck
framing problem beyond the canonical audit cameras, fixed in source before the
final fixture capture. Overlapping surface-depth intervals still require visual
review; parity alone does not establish anatomical correctness.

Native/SVG side/front/top and oblique anatomy, paired walk support, gallop
suspension/lower neck and bite opening/closure were reviewed. Final catalog and
browser gates and the implementation commit are recorded in the roadmap.

Final gates passed: nine Camel tests; all 295 headless tests, 41/41 source/model
validations, ordinary/motion/paint audits and release metadata. Camel adds zero
issues/warnings; catalog advisories remain 40/38/40. Browser parity passed
121/121 outputs, authoring UI checks and zero console errors. Workbench left at
idle, 45° elevation / 225° heading. See the roadmap for the implementation commit
and N9 Kangaroo resume checkpoint.
