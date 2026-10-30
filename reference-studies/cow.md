# Hornless Cow — WildMesh reference and SVG model

N5, studied and authored 2026-10-29. Selectable `cow`, labeled **Cow · hornless**.
This is a separate female cattle model, with its own family and clips; Bull,
Moose, Deer and Horse output is unchanged.

## Reference study

Primary native scene:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/Cow/SK_Cow.blend`.
The bovine study in [bull.md](bull.md) records the original inventory and
comparison with both Buffalo references. Reopened Cow read-only in Blender
5.1.2 for this milestone using the same reproducible study tool:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-bull.py -- /absolute/SK_Cow.blend Cow
```

Armature `SKM_Cow`, body `SKM_Cow.001`, **76 bones / 24 actions / 24 FPS**.
The mesh is visibly female with an udder and associated `Udder*` bones. Its
small horns, visible above the ears in the native front render, are deliberately
omitted for the requested hornless variant. Buffalo combat is not used as a
Cow shove claim. Native forward is -Y, lateral X, up Z; posed world-space dimensions
are approximately **2.651 m long × .768 m wide × 1.504 m tall**. Neutral pelvis
height is 1.240 m and head control height 1.283 m. The reference shows a long
near-level barrel, lighter neck/forequarters, long face, sideways ears, low rear
udder and a long hanging tufted tail.

The tool inventories all actions, samples 21 normalized phases of each selected
clip and renders neutral side/front/top plus four side key poses per motion.
Diagnostic outputs are `/tmp/bull-Cow-*`. No source scene is saved and no mesh
or native animation data is embedded in the SVG/runtime.

| Native action inspected | Frames | Duration | Application |
|---|---|---|---|
| NeutralStand | 1–71 | 2.92 s | Standing proportions and quiet weight/breathing |
| Idle | 1–481 | 20.0 s | Neck lowering, feeding/resting gestures and jaw hierarchy |
| Walk_100 | 1–46 | 1.875 s | Whole-leg four-beat stepping and body/head counter-motion |
| Run_600 | 1–15 | .583 s | Quick gathering/extension and body arc |
| Alert | 1–132 | 5.46 s | Neck/head posture and alert turning |

Other native actions include slow walking, trot, sprint, turns, locomotion
starts/stops, sitting/lying, damage and death. **There is no native shove/attack
clip.** The requested shove is explicitly authored from the cattle anatomy,
with restrained head movement and a body-driven press. It does not copy the
Bull's horn toss or claim a combat retarget.

## Shape and authoring

`scripts/refine-cow.mjs` reuses the established raw Deer ungulate hierarchy and
pure author-time quadruped grounding/IK helpers, then writes an independent
Cow family and thin model. Consumers see ordinary declared geometry and clips;
there is no Cow renderer branch or runtime IK.

- Hip 1.24 m, chest 1.22 m and 1.22 m body span: near-level back and long .76 m
  barrel. .49 m shoulder and .30 m neck widths are lighter than Bull's .69/.48 m.
- Smaller .28 × .36 m head with .32 m forward muzzle span, sideways leaf ears,
  shallow neck dewlap, long hanging tail and a separate tuft. No horn/antler
  joints, plates, mounts, mane, moose bell or buffalo boss.
- Slender articulated forelegs/carpus and rear stifle/hock chains, .17 m hooves;
  all four idle endpoints lie on fixed XY ground at Z=0.
- A low rear udder and four simple teat plates use body-owned rigid local
  geometry. The upper udder embeds into the belly. Explicit core regions and
  camera-relative depth bury the underside below the barrel from above; it is
  not assigned a permanent foreground accessory layer.
- Scale 22, ground point [50,57] leaves room for the forward press and complete
  muzzle envelope. Regression checks cover actual emitted ellipse/rect/path
  bounds (including rotation/matrix transforms), beyond joint-only framing.

## Authored clips

| Clip | Duration | Behavior |
|---|---|---|
| idle | 4,000 ms | 8 mm breathing, gentle 3° chewing, neck counter-motion, ears/tail sway, four fixed hooves |
| walk | 1,875 ms | Native-duration four-beat lateral sequence, .65 stance duty, whole-leg articulation |
| run | 600 ms | Quick four-beat gallop, staggered support and suspension, body arc and gathering/extension |
| attack | 1,500 ms | Gather weight, lower forehead slightly, forward shoulder/head press, hold and recover |

Walk matches the native Walk_100 cycle duration; run is close to Run_600. Both
are in-place adaptations through the shared ungulate baker, rather than literal
native keyframe retargets. Upper and lower limbs participate, with explicit
support intervals and foot clearance.

The shove has anticipation at .20, press start .34, impact .56, release .68,
recovery and settle .94. A 3° whole-body lean and .14 m root advance produce
about **.20 m chest/head advance** from the starting pose. The head lowers
about .16 m and remains level through the **180 ms contact hold**, rather than
throwing upward. The forward action lasts 330 ms. All four feet stay fixed;
root translation and local rotations are baked with sagittal IK at 960 uniform
samples plus exact phase boundaries. Bone lengths and joint limits are retained,
and the ending pose exactly matches the starting pose. Events belong to explicit
anticipation/action/contact/recovery/settle phases.

## Regression and review

Eight focused tests cover anatomy and absence of horns; body/neck distinction
from Bull; underside burial and footprint coverage; breathing/chewing and fixed
idle feet/shadow; four walk footfalls, faster run/suspension and whole-leg
participation; lengths/limits/loops; shove advance, level contact hold, brace and
recovery; and dense directional/frame checks.

The independent occlusion/framing matrix covers four clips × twelve critical
phases × six elevations × sixteen headings = **4,608 views**. It checks both
joint margins and conservative bounds of the emitted SVG geometry, including
muzzle/foot extents and transformed shapes. Unsupported vector/transform types
fail explicitly. Ground support/clearance is checked at 1,201 intermediate poses
per clip to .1 mm; idle drift is numerical and shove braced drift is bounded to
2 micrometers. Ground shadow geometry remains fixed across all four clips.

A separate overhead regression checks all sixteen headings, four clips and
seven phases: underside centers/envelope fit within the real barrel coverage
and underside plates draw before their covering barrel. Moving an udder plate
to the foreground must fail this test. A frontmost jaw-seam mutation is also
caught by the existing independent head oracle. These tests are independent of
golden/browser equality; ambiguous crossing depth intervals still need visual
review, rather than being treated as a complete 3-D visibility proof.

Final catalog/browser gate results, actual workbench review and implementation
commit are recorded in the creature roadmap.

Final gates passed: eight focused tests; all 269 headless tests and 38 source/
model validations; ordinary/motion/paint audits and release checks. Cow adds
zero audit issues/warnings; existing catalog advisories remain 40 ordinary,
38 motion and 40 paint. Browser comparison passed 121/121 outputs, authoring UI
checks and zero console errors. Actual workbench review included native and SVG
side/front proportions, overhead underside burial, oblique shape, walk support,
gallop suspension and the braced shove. Final view is idle, 45° elevation / 225°
heading. See the roadmap for the commit and N6 Mountain Goat resume checkpoint.

## Follow-up — stout barrel and buried rump cap (2026-10-29)

The current Cow is fuller than the initial milestone: pelvis height 1.16 m
(previously 1.24), body span 1.16 m (1.22), barrel width/depth .88 m (.76),
shoulder .54 × .72 m and neck .32 m. Barrel centers sit .12 m below pelvis/chest.
The barrel-to-hip-height ratio increases about 24%, while the back stays level.
The udder remains embedded beneath the belly at .56 m; grounded leg chains and
clips are rebaked through the existing author-time solver at the same timings.

The rump ellipse is an underlying silhouette cap, covered by the continuous
barrel wherever they overlap (`under-core`). It no longer draws a complete oval
on top of the torso. The muzzle bridge is likewise buried beneath the face.
The tail root follows the fuller rump perimeter, with a short inset socket and
pelvis-relative free shaft/tuft, matching the Bull attachment correction.

`test/ungulate-joins.test.mjs` checks stout proportions, rump burial, concealed
muzzle bases, external tail geometry and deliberately broken painter orders.
The roadmap records the corrective commit and final catalog/browser gates.
