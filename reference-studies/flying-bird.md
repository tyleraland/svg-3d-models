# Flying bird: eagle reference study

Reference: `Stylized Animals/Eagle_Stylized/SK_Eagle_Stylized.blend` in the local WildMesh3D library. Inspected the existing separate reference scene and its `FlyLoop` action (frames 1–70), sampling nine phases and rendering the posed mesh. Reference measurements are diagnostic only; the SVG geometry and animation are independently authored.

The left/right wing tips rise and fall together. Sampled left wing-tip height ranges roughly 0.52–1.47 m while the chest ranges 0.89–1.00 m; the distal wing lags the shoulder and folds on recovery. The broad secondary surface and separated outer primaries are much more characteristic than the previous rounded struts.

The SVG now has closed articulated upper/secondary panels, a serrated primary fan, a fan tail, compact head and tapered hooked beak. Mirrored shoulder, elbow and wrist rotations produce a fast power stroke and a slower folded recovery. `fly` is a 920 ms powered loop; `glide` and idle use small trim motions. The canonical `walk` is a grounded waddle; `hop` supplies paired-foot ground locomotion. All clips use ordinary joint-local keyframes; no runtime procedural evaluation or mesh data is required. Bone lengths remain fixed. The shadow projects onto a fixed XY ground plane.

Regression checks cover loop closure, synchronous mirrored wing motion, inter-frame bone lengths, ground clearance, token framing and head/body stacking through six elevations and eight headings. This is a paper-panel approximation: edge-on wings are thin, and the depth-interval oracle leaves truly intersecting surfaces for visual review.


## Ground locomotion and airborne peck

`attack` is now a 920 ms airborne peck with the complete synchronous wingbeat and tucked legs. The head/neck strike reaches its downward impact at phase 0.62 while the wings continue their recovery stroke.

`walk` uses folded wings, alternating thigh/knee/ankle articulation, lateral body weight transfer and planted foot height/lateral position during stance. `hop` uses paired support, preparatory crouch, takeoff at 0.18, an airborne apex at 0.48, and paired landing at 0.78. The bind skeleton has feet on the XY ground plane; airborne clips lift the root and tuck the legs. Hit/fall defaults inherit contact assumptions from idle rather than every action, allowing one rig to have both airborne and grounded clips.

`scripts/refine-flying-bird-ground-clips.mjs` is the author-time regeneration tool. It bakes ordinary local Euler rotations and root translations into the model/family sources, with exact contact boundaries and a dense IK bake. Runtime consumers still only evaluate keyframes. Tests check the peck's wingbeat against flight, foot clearance and contact accuracy between keys, lateral stance planting, waddle weight transfer, paired hopping support, bone lengths, all-angle stacking and framing.

## Peck articulation and beak seam review

The peck now pivots only the neck relative to its connector: a -14° wind-up at 0.54 snaps to +55° at impact 0.62 (about 74 ms), briefly holds, then recovers. Body, head-local rotation, root trajectory and wingbeat match flight; no endpoint translation fakes extension. The hook drops only 22 mm. A narrow 35 mm beak gasket is explicitly buried beneath its two incident plates, rather than appearing as a large round nose cap. The generic optional joint `gasket` authoring contract declares `diameterMeters` and `underIncidentPlates`; compiled gasket records preserve the incident plate IDs for consumers. The independent head oracle checks that seam contract even when endpoint depth intervals overlap. Regression coverage includes a mutation restoring the frontmost seam, 16 headings, six elevations, wind-up/impact/recovery and no-translation peck checks.

## R4 — Eagle refinement and separate Crow study (2026-10-29)

This pass opens the native `Eagle_Stylized/SK_Eagle_Stylized.blend` and
`Crow/SK_Crow.blend`, and imports realistic
`BaldEagle/BaldEagle_AllAnimations.fbx` into Blender 5.1.2. The installed Blender
executable runs in background mode. Reference files are never saved. The
repeatable inspection/render tool is `scripts/study-wildmesh-birds.py`:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-birds.py -- /absolute/reference.blend eagle
```

Use tags `eagle`, `bald-eagle` or `crow`. It records inventory, 17 normalized
landmark samples per selected action, and side/front/top renders in `/tmp/r4-*`.
The FBX contains paired shape-key and object actions: the armature must use
`RigRoot|RigRoot|…`, not the similarly named `Key|RigRoot|…` tracks. Measurements
use posed world coordinates; root travel is subtracted when comparing relative
wing/foot motion. The FBX's numeric scale is approximately 100 times meters;
proportion ratios are the reliable comparison. Solid Workbench rendering makes
some feather-card edges look ragged; it is a silhouette/pose diagnostic.

### Inspected Eagle actions

Stylized scene: 60 FPS, 54 bones. The inspected actions are Idle (1–148),
FlyLoop (1–70), GlideLoop (1–106), Strike1/Strike2 (1–142). Also available:
EggSteal (1–178), FloatDown (1–78), FloattUp (1–118), IdleNest (1–400), Landing
and Shot (1–180), TakeOff (1–130). FlyLoop is about 1.15 seconds. Strike poses
lift/reach with the feet as well as changing wing posture.

Realistic scene: 30 FPS, 73 bones. Inspected object actions:

| Action | Frames | Observation used |
|---|---|---|
| Stand_Ground_00 | 1–542 | Folded-wing upright chest and compact head; paired planted feet |
| Loco_Walk | 1–122 | Alternating feet, body weight transfer, quiet folded wings |
| Loco_Run | 1–112 | Faster whole-leg cycles and more vertical body excursion |
| Fly_Heavy | 1–42 | Strong symmetric power stroke, elbow/wrist recovery lag |
| Fly_Light | 1–182 | Lighter flight/trim; less body motion |
| Fly_Glide | 1–102 | Broad secondary chord, slotted primaries, short spread fan |
| Eating_01 | 1–502 | Neck-driven downward head action |
| Diving_PickUp / Diving_PickUp_PivotInLegs | 1–72 | Legs reach down/forward for a talon pickup, then tuck |

The realistic glide's initial posed bounds have span/length approximately
200.95/85.36 = **2.35**. The standing mesh has a much fuller breast and shorter
bill/neck extension than the previous SVG. These are proportion and timing
references, not frame-for-frame retargeting: native locomotion tracks include
multiple steps and root travel, whereas the SVG uses one in-place gait cycle.

### Authored Eagle changes

- `flyingBird` remains the stable ID; the selector now calls it **Eagle · flying
  bird**. Crow will be a separate selectable creature.
- Fuller 0.40 m chest, thicker short neck, compact 0.13 m hooked bill, lighter
  head plate, broader secondary chord and less jagged short fan tail.
- Existing articulated wing panels and slotted primary outline remain. The
  1,160 ms powered loop now uses a stronger synchronous shoulder stroke with
  delayed elbow/wrist folding during recovery; the 2,800 ms glide holds spread
  wings with small trim. Tucked feet sit behind/beneath the body.
- Default idle is now standing with folded wings, planted talons, quiet breathing
  and an alert head scan. Walk is an alternating 1,200 ms ground cycle; a new
  620 ms run uses the whole leg with short support gaps. The paired-foot 800 ms
  hop remains available. Three forward toes and a rear hallux distinguish feet
  from rounded paddles.
- Airborne peck remains the default attack, with an uninterrupted wingbeat and a
  sudden 70 ms neck-only angular jab. `talonStrike` adds a separate 1,450 ms
  airborne reach, body pitch, leg extension and return to tucked flight, inspired
  by the diving pickup posture. It does not simulate prey or ground impact.
- Ground locomotion uses a 240-sample author-time IK bake (480 for the sharper hop crouch). Equivalent hip Euler
  branches are selected continuously, avoiding interpolation flips near 90°.
  Standing height leaves a natural leg bend without forcing the walk across that
  singularity. Consumers still receive ordinary local rotations/translations.
- The initial 960-sample bake exposed a workbench `Math.min(...points)` argument-count overflow.
  Framing now reduces bounds without spreading all samples into a function call.
  The smaller final bake retains contact accuracy within 0.000002 m while reducing export size. The old ground-clip authoring entry point delegates to the Eagle baker, avoiding
  accidental restoration of stale geometry/motion.

### Regression and review

`test/flying-bird.test.mjs` now checks eight clips × eleven phases × six
camera elevations × sixteen headings (**8,448 views**) against the independent
occlusion oracle and token framing. Dedicated checks cover eagle proportions,
paired idle plants, 1,201 interpolated gait samples, continuous Euler branches,
whole-leg run, support gaps, wing symmetry, exact loop closure, angular peck,
forward/downward talon reach, flight recovery, fixed ground shadow, and dense
workbench framing. Existing beak-seam mutation coverage remains active.

Direct UI review includes the standing oblique silhouette, overhead spread wing,
folded walk/run, airborne peck and talon extension. Crossed physical depth
intervals remain a visual-review limitation of the 2D painter approximation;
passing golden equality alone does not establish correct anatomy/occlusion.
Final gates and implementation commit are recorded in the roadmap.

The focused bird/grounding run passed 24/24 tests. Final `npm run check` passed
all 226 tests, source validation, all 33 models, ordinary/motion/paint audits and
release checks. Eagle's audit covers 720 views with zero issues/warnings;
catalog advisory counts remain 40 ordinary, 38 motion and 40 paint. The browser
gate explicitly includes the new talonStrike clip and skips absent clips without
removing any expected render outputs.

Final browser parity passed **201/201** package/render comparisons, including
talonStrike. Patch, onion-skin, turntable and independent overlay UI checks
passed with zero console errors. The final workbench is left on Eagle powered
flight at 45° elevation / 315° heading.
