# Bull — WildMesh bovine reference study and SVG model

N4, studied and authored 2026-10-29. Selectable model `bull`, labeled
**Bull · curved horns**. This is a cattle bull adaptation, separate from Moose,
Deer and the planned hornless Cow. No named Bull file was found in WildMesh.

## Blender inspection and reference selection

Opened three native scenes read-only in Blender 5.1.2 under
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/`:

| Native scene | Armature / bones | Actions / FPS | Role in this study |
|---|---|---|---|
| Realistic Animals/Cow/SK_Cow.blend | SKM_Cow / 76 | 24 / 24 | Cattle body, muzzle, limbs, long tufted tail and locomotion |
| Realistic Animals/Buffalo/SK_Buffalo.blend | Buffalo / 127 | 106 / 24 | Heavier chest, neck and forequarter weight; gait/body arcs |
| Stylized Animals/Buffalo_Stylized/SK_Buffalo_Stylized.blend | Armature / 45 | 18 / 60 | Actual lowered-head goring/toss attacks and preparation |

Cow is visibly female, with an udder and `Udder*` bones; it is not a bull model.
Realistic Buffalo includes a separate `Buffalo_Antler` mesh, despite that name
being used for horns. Its horn boss and the stylized Buffalo's beard/hair cards
are species/style traits, not cattle-bull requirements. The SVG uses neither
an udder, buffalo boss/beard, nor moose bell/antlers. Bull forequarter/neck mass
and moderate paired cattle horns are authored adaptations of these references.

Native forward is approximately -Y, lateral X, up Z. Skeleton local data is
centimeter-scale under world transforms; measurements below use posed world
meters. `scripts/study-wildmesh-bull.py` reproduces inventories, 21 normalized
bone/bounds samples per selected action, standing side/front/top views and four
side key poses per motion:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-bull.py -- /absolute/reference.blend Cow
# Other supported tags: Buffalo, BuffaloStylized
```

Outputs go to `/tmp/bull-<tag>-*`. No reference scenes are saved, no reference
meshes are imported into the SVG/runtime, and diagnostic cameras/settings exist
only in the separate background Blender process. Solid Workbench renders show
fur/hair cards as opaque facets; use the body envelope and posed skeleton.

Standing world envelopes and controls:

- Cow NeutralStand: 2.651 m long × 0.768 m wide × 1.504 m tall; pelvis 1.240 m,
  skull control 1.283 m. Long near-level cattle barrel, slimmer neck and long tail.
- Buffalo Standstraight_Breathing: 3.292 m long × 1.551 m wide × 1.948 m tall,
  including horns; pelvis 1.390 m, chest 1.349 m, head 1.452 m. Neck/chest mass is
  useful for the bull, while the extreme horn boss is not copied.
- BuffaloStylized Idle: 2.007 m long × 1.090 m wide × 1.396 m tall; pelvis .734 m,
  neck .903 m, head .968 m. Exaggerated stocky proportions and high upward horns.

## Inspected native actions

| Reference | Action | Frames | Duration | Use |
|---|---|---|---|---|
| Cow | NeutralStand | 1–71 | 2.92 s | Standing proportions and quiet breathing |
| Cow | Idle | 1–481 | 20.0 s | Larger head/neck idle gestures; not copied wholesale |
| Cow | Walk_100 | 1–46 | 1.875 s | Four-beat whole-leg stepping and weight shift |
| Cow | Run_600 | 1–15 | .583 s | Fast leg gathering/extension and body arc |
| Cow | Alert | 1–132 | 5.46 s | Neck turning and broad skull behavior |
| Buffalo | Standstraight_Breathing | 1–51 | 2.083 s | Quiet heavy forequarter/neck posture |
| Buffalo | WalkFast_F | 1–31 | 1.25 s | Whole-leg stance and recovery |
| Buffalo | RunFast_F | 1–14 | .542 s | Powerful short-cycle run with body arc |
| Buffalo | GrazingOnspotB2IdleThreat | 1–41 | 1.667 s | Head/neck rise from a lowered position |
| BuffaloStylized | Idle | 1–258 | 4.283 s | Neck/tail/ear character |
| BuffaloStylized | WalkLoop | 1–198 | 3.283 s | Deliberate alternating whole-leg cycle |
| BuffaloStylized | RunLoop | 1–78 | 1.283 s | Gathered/extended running poses |
| BuffaloStylized | Attack, Attack1 | 1–178 | 2.95 s each | Recoil/crouch, lowered horns, rapid upward/sideways toss, recovery |
| BuffaloStylized | AngryAntlers | 1–240 | 3.983 s | Horn-directed threatening motion and foot placement |
| BuffaloStylized | ChargedUp | 1–138 | 2.283 s | Crouched loading gesture |
| BuffaloStylized | LoweredHead | 1–198 | 3.283 s | Low aimed-head posture |

Cow has no named combat clip. Realistic Buffalo has grazing/threat transitions,
locomotion, vocalizations, sitting/lying and hit variants. Stylized Buffalo does
have combat actions: its head descends roughly .66 → .29 m before the rapid
rise to 1.25 m in Attack, and .66 → .27 → 1.44 m in Attack1. The native clips
include traveling recoil/drive, lateral movement and forefoot steps. The SVG
uses their attack structure rather than claiming literal animation retargeting.

## SVG shape and authoring

`scripts/refine-bull.mjs` reuses the established Deer ungulate hierarchy and
pure author-time quadruped grounding/IK helpers, then writes an independent
Bull family and thin model. Existing Horse, Deer and Moose sources/outputs are
unchanged. Consumers receive ordinary geometry and clips; no renderer branch,
procedural runtime motion or runtime solver is added.

- 1.23 m pelvis and 1.275 m chest controls, a deep .84 m barrel, .69 × .82 m
  shoulder plate and .48 m thick neck. Shorter/stronger limbs than Deer/Moose,
  articulated foreleg carpi and opposing rear stifles/hocks, .19 m hooves.
- Broad .42 × .47 m forehead/skull and .34 m muzzle; shallow neck-owned dewlap.
  Long hanging tail with a separate .13 m tuft, and sideways leaf ears.
- Two curved, unbranched skull-owned horns, seven centerline stations each.
  Perpendicular tapered ribbons provide physical thickness and pointed tips
  without segmented capsule end caps. Their forward rake, lateral spread and
  upward/inward tips exist in model space; no permanently foreground layer or
  screen-facing horn geometry is used.
- Scale 22, ground point [50,60]; fixed-export framing reviewed through the full
  action/camera matrix, including diagonal lowered-horn and maximum-toss views.

## Authored clips

| Clip | Duration | Behavior |
|---|---|---|
| idle | 4,000 ms | Heavy quiet breathing, counter-moving neck, ear flicks and tail sway; four fixed hooves |
| walk | 1,600 ms | Deliberate four-beat lateral sequence, .65 stance duty, shoulder/hip plus knee/hock motion |
| run | 600 ms | Powerful four-beat gallop, staggered supports, leg gathering/extension and suspension |
| attack | 1,400 ms | Crouched recoil, lowered horns, braced forward drive, quick upward sweeping toss, recovery |

Walk lies between the native Cow walk and Buffalo fast walk durations; run is
close to Cow Run_600 and realistic Buffalo RunFast_F. These are shared-baker
in-place adaptations, not copied native joint curves.

Gore lowers the head about .30 m by .40, then drives both horn tips forward
into impact at .54. The drive lasts **196 ms**. The tips rise about .70–.79 m
by .64 over **140 ms**, with the head yaw reversing from -6° to +12° through
the drive/toss. It settles back to the exact starting pose. Native traveling
steps are adapted to a four-hoof brace for token stability: only the root
translates, child joints rotate locally, and sagittal IK is baked at 960 uniform
samples plus exact phase boundaries. Horn geometry remains rigid to the skull.
Events have explicit anticipation/action/contact/recovery/settle phase ownership.

## Regression and review

Nine focused tests cover bovine proportions and species distinctions, pointed
3-D horns and skull rigidity, fixed idle contacts and ground shadow, four walk
footfalls, faster run/suspension, whole-leg participation, lengths/limits/loop
closure, interpolated ground support/clearance, and goring thrust/lift/sweep/brace.

Four clips × twelve key phases × six elevations × sixteen headings = **4,608
views** use the independent vector/depth occlusion oracle and fixed-export
framing checks. A flattened coplanar horn mutation must fail the projected-area
invariant; frontmost jaw-seam and far-horn-over-nearer-ear mutations must be
caught independently of golden/browser equality. Crossed depth intervals still
require visual review; the oracle is not a complete 3-D visibility proof.

Contact/clearance is checked across 1,201 intermediate samples per clip to
0.1 mm; fixed idle drift to numerical tolerance and attack braced drift to
2 micrometers. Shadow geometry remains fixed across all four clips. Final
catalog/browser gate results and implementation commit are recorded in the
creature roadmap.

Final gates passed: nine focused tests; all 261 headless tests and 37 model/source
validations; ordinary/motion/paint audits and release checks. Bull contributes
zero audit issues/warnings; pre-existing catalog advisories remain 40 ordinary,
38 motion and 40 paint. Browser comparison passed 121/121 outputs, authoring UI
checks and zero console errors. Actual workbench review included front/top/
oblique/side anatomy, walk support transition, gallop suspension, forward horn
impact and upward toss. Final view is idle, 45° elevation / 225° heading. The
roadmap records the completion commit and N5 hornless Cow resume checkpoint.
