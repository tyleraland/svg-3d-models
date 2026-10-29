# Moose — WildMesh study and SVG model

N3, studied and authored 2026-10-29. Selectable ID `moose`, labeled
**Moose · palmate antlers**. Independent of Deer and Horse.

## Native Blender study

Opened the native reference read-only in installed Blender 5.1.2:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/Moose/SK_Moose.blend`.
Armature `Moose` has 105 bones; body `Moose.001` and separate `Antler_Moose`
mesh. The scene has **99 actions at 25 FPS**. Native skeleton data uses a
centimeter-scale armature transformed into world meters; world forward is -Y,
lateral is X and up is Z. No source scene is saved or mesh data imported into
our SVG/runtime.

Reproduce the inventory, 21 normalized bone/bounds samples per selected action,
standing side/front/top views and four side key poses per motion with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-moose.py -- /absolute/SK_Moose.blend Moose
```

Diagnostics go to `/tmp/moose-Moose-*`. The connector's CLI backend could not
locate its configured `blender` binary, so the installed native application CLI
was used directly. Diagnostic cameras/render settings exist only in that process.

| Studied native action | Frames | Duration | Observation/use |
|---|---|---|---|
| Idle_Breathing | 1–121 | 4.80 s | Quiet heavy standing posture, head/neck breathing |
| WalkFast_F | 1–26 | 1.00 s | Long-limbed alternating steps, foreleg and hock articulation |
| RunFast_F | 1–14 | 0.52 s | Gathered/extended leg cycle, body arc, relatively steady heavy neck/rack |
| Idle2GrazingOnSpotB | 1–41 | 1.60 s | Head lowers below chest while antlers rotate rigidly with skull |
| GrazingOnSpotB2IdleThreat | 1–41 | 1.60 s | Neck raises rack from low stance, body/limbs compensate |

Other actions include slow/medium/fast walking, grazing, wounded locomotion,
trots, slow runs, hopping/bouncing, sitting/lying and transitions. **No named
combat/goring action exists.** The SVG gore is an authored adaptation, informed
by observed grazing/threat neck articulation; it is not claimed to be a native
combat retarget.

Standing posed world-space envelope is approximately **3.21 m long × 1.69 m
wide × 2.88 m high**, including the rack. Pelvis control height 1.505 m; chest
1.578 m; skull control 1.716 m; left ear base 1.919 m. Pelvis/chest forward span
0.905 m, with upper foreleg attachment another 0.341 m forward of the chest
control. Fore ankle is 0.170 m above the hoof surface; rear ankle 0.199 m.
The reference shows a higher shoulder hump, deep barrel, lean long lower legs,
short hanging tail, long downward muzzle and pendulous throat bell. The broad
palmate antlers sweep laterally and rearward/upward, with forward brows and
separate edge tines; they are not a pair of ordinary pointed horns.

## Authored proportions and structure

`scripts/refine-moose.mjs` reuses the established Deer ungulate hierarchy and
pure author-time quadruped grounding/IK helpers, then writes its own family and
thin own-base model. Existing Deer and Horse sources/output remain unchanged.
No renderer branch, procedural consumer animation or runtime solver is added.

- 1.52 m hip and 1.62 m chest controls; a rigid shoulder-owned hump above them,
  0.75 m barrel, deeper forequarters and small short tail.
- Long three-segment legs with a foreleg carpus and opposing rear stifle/hock;
  slender distal segments and small hooves. All four idle contact endpoints lie
  on fixed world XY ground at Z=0.
- Thick short neck, elongated hanging muzzle and head-owned throat bell. The
  jaw seam is explicitly buried; ears retain broad leaf panels and structural
  spines. No Horse mane or saddle anchor.
- Two rigid head-owned racks: tapered stems, eight-point sloped palm polygons,
  five outer tines and one forward brow each. Palms spread about 1.54 m across
  their outer edges; upper tine tips reach about 2.84 m. Real 3-D rake/spread
  preserves front/profile/top area. All rack points share skull motion and do
  not stretch, bill-board or animate independently.
- Scale 17 and ground point [50,59] leave export margin for high tips and their
  diagonal head-lowering arc. The dense matrix caught and corrected the earlier
  low-elevation diagonal export crop; editor auto-fit alone would hide it.

## Authored clips

| Clip | Duration | Behavior |
|---|---|---|
| idle | 4,800 ms | Quiet 8 mm breathing arc, subtle neck compensation/ear flicks, four fixed hooves |
| walk | 1,400 ms | Four-beat lateral sequence, 0.65 stance duty, long controlled whole-leg steps |
| run | 560 ms | Fast four-beat gallop with staggered support, gathering, extension and suspension |
| attack | 1,600 ms | Brace, lower/aim rack, sudden forward thrust, upward lift, recovery |

Walk is intentionally slower than the native fast-walk action. Run follows the
native fast-cycle duration and gathering/body-weight character using the shared
in-place ungulate baker. Both articulate above and below the knee, with explicit
stance intervals and ground clearance.

Gore anticipation lowers the skull about 0.38 m by phase .44. The body drives
forward while the aimed brows advance into impact at .58, then the neck lifts
the rack sharply by .66 before recovery. Drive duration is 224 ms; lift interval
128 ms. All four hooves remain fixed throughout, with author-time sagittal IK
baked at 960 uniform samples plus exact phase boundaries. Only the root
translates; child joints rotate locally. Skull, muzzle, bell and antler rack keep
rigid distances. Events belong to anticipation/action/contact/recovery/settle
phases; the final pose exactly matches the start.

## Regression coverage

Nine focused tests cover reference-informed proportions, palm projected area
from front/profile/top, rack rigidity relative to three skull-owned landmarks,
four planted idle feet and fixed shadow, gait footfalls/suspension/whole-leg
motion, bone lengths/limits/loop seams, interpolated ground support/clearance,
gore lowering/thrust/lift/brace/recovery and two deliberate order mutations.

The dense directional matrix covers four clips × twelve critical phases × six
elevations × sixteen headings = **4,608 views**. It checks head/appendage order
with the independent vector/depth oracle, plus fixed-export framing. A jaw
seam promoted above incident plates and a far antler stem promoted above a
nearer ear both must be detected independently of goldens/browser parity.
Contact/clearance is bounded to 0.1 mm across 1,201 intermediate poses; braced
foot sliding is bounded to 2 micrometers. No new permanent foreground ordering
or renderer exceptions were introduced. Crossing depth intervals still require
visual review; the oracle does not claim full 3-D surface visibility proof.

Final gate results and completion commit are recorded in the durable roadmap.

Final gates passed: all nine focused tests, all 252 headless tests, all 36 source
and model validations, ordinary/motion/paint audits, and release checks. Moose
contributes no audit issues or warnings; existing catalog advisories remain
40 ordinary / 38 motion / 40 paint. Browser comparison passed 121/121 outputs,
authoring UI and zero console errors. Actual workbench review includes
side/front/top/oblique anatomy, gallop suspension, goring impact and lift. The
workbench is left at idle, 45° elevation / 225° heading. See the roadmap for the
implementation commit and N4 Bull resume checkpoint.
