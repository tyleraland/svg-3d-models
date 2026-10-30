# Frog — Quaternius reference study

Reference: `~/models/quaternius/Easy Animated Enemy Pack - Jan 2019/Blends/Frog.blend`.
Opened in the connected Blender session, then inspected non-destructively in
Blender 5.1.2 with `scripts/study-quaternius.py`. The original file is never saved.
The script also inventories the eight newly requested Quaternius references;
`quaternius-inventory.json` records their exact files, FPS and action ranges.

## Native evidence

The Frog scene has one mesh and one armature; 24 fps. Actual actions:

| Action | Frames | Duration | Observations |
|---|---|---|---|
| Frog_Idle | 0–60 | 2.5 s | Low crouch; subtle breathing/body shift above planted limbs. |
| Frog_Jump | 0–21 | .875 s | Crouch, paired hind-leg drive, long rearward extension, airborne recovery, forelimbs reaching for landing. |
| Frog_Attack | 0–18 | .75 s | Recoil then forward/upward forebody/forelimb strike; hind feet remain braced. It has no tongue control or tongue-strike action. |
| Frog_Death | 0–20 | .833 s | Rises, rolls onto the back and ends with limbs extended/raised. |

Native idle bounds are about 3.51 wide × 3.22 long × 1.48 high. The source faces
-Y, with X lateral and Z up. Paper coordinates use +X forward and +Y left; about
.25 paper meters per source unit. The skeleton includes IK/pole controls beyond
the visible mesh; those control extents are not used as body dimensions.

`frog-reference.json` retains 41 evaluated phases per native action, mesh bounds,
and world-space bone heads/tails. Side phase renders and idle front/top renders
are generated under `/tmp/quaternius-Frog_*`; none enters the runtime. The
reference has a broad blunt head, paired raised eyes, shallow rising back, thin
forearms, thick outward thighs and a characteristic forward/back/forward fold
through thigh, lower leg and long hind foot. The webbed digits are simplified
into a single rigid nine-point silhouette per foot, matching the paper style.

## Authored SVG adaptation

Independent `frog` family/model, 60 joints (mostly toe helpers), 27 plates.
No native mesh, armature, animation evaluator or procedural solver is shipped.
The body is low and broad, with head/eye layering sorted using physical posed
head depths. Internal head/chin joins remain buried. Upper limbs are surface-
relative to the chest/pelvis so the exposed near arm stays visible in profile;
from above, the low roots pass behind the body. The hind fold has three segments
and retains its length while extending backward in flight.

- Idle: 2500 ms breathing over four fixed Z=0 foot contacts.
- Walk/slow crawl: authored 1800 ms four-beat ground alternative, .80 duty factor
  and at least three supporting feet. The reference has no Walk action.
- Run/travel paired hop: 875 ms crouch, takeoff at .30, peak body lift .34 m at
  .52, hind feet trailing about .55 m, landing at .80 and recovery. Both upper
  and lower hind-leg segments and the long distal foot rotate. This is an
  in-place token adaptation, not a claim of exact native motion retargeting.
- Attack/forelimb lunge: 850 ms recoil and lead forelimb reach, followed by the
  opposite limb; rear feet stay on their original support patches. Impact .62.
- KO: 1000 ms lifted roll onto the back with raised, splayed feet. The lift is
  adjusted for paper toe clearance, and the non-looping terminal pose stays down.

The existing author-time spatial IK helper now accepts an optional world-space
pole. Existing callers keep their upward default; Frog uses its authored low,
outward bend plane. Using the upward pole would turn its flat knees into high
mammalian knees, which a deliberate-mutation test catches. Output remains
ordinary joint-local Euler animation, with no child-bone translations.

## Validation and review

`test/frog.test.mjs` covers native-style proportions and low zigzag knees,
independent upper/lower/distal articulation, idle/attack planted feet, crawl
support, real paired suspension, KO state/clearance, length preservation,
continuous angles and intermediate toe/contact heights. It also sweeps actual
SVG bounds and independent head/connector ordering at six elevations and
sixteen headings, including side and overhead. A promoted internal connector
and a restored upward IK pole must fail their respective independent checks.
Ground shadow geometry stays fixed across clips.

The initial KO roll exposed a toe-floor intersection that the canonical audit
alone missed. A dense world-space toe sweep found it; the authored lift was
corrected without relaxing clearance or contact assertions. Denser attack
baking keeps rear support drift below .003 mm in the sampled test.

Final view review also lengthened the blunt chin: in overhead projection the
forefeet had crowded the shortened billboard head. A new test checks actual
projected snout/foretoe separation from above and in profile, rather than only
checking the head joint's world position.

Final checks: 413/413 tests passed; all 49 sources/models and ordinary, motion
and paint catalog audits passed, with advisory totals unchanged at 40/38/40.
After the final head refinement, the composed Frog motion/paint audit again
passed 480 views with zero issues/warnings. Chromium matched 121/121 final
package/browser outputs; patch, onion, turntable and overlay UI checks passed,
with zero console errors. All 48 existing rig/package fixture sets stayed
byte-identical. Actual workbench review covered top, front, profile and oblique
idle, ground crawl, airborne extension, forelimb attack and the terminal KO.
