# Mountain Goat — WildMesh reference and SVG model

N6, studied and authored 2026-10-29. Selectable `mountainGoat`, labeled
**Mountain Goat · swept horns**. An independent model/family, not a replacement
for Deer, Bull or Cow.

## Blender study and reference choice

Opened read-only in installed Blender 5.1.2 under
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/`:

| Native scene | Armature / bones | Actions / FPS | Use |
|---|---|---|---|
| MountainGoat/SK_MountainGoat.blend | MountainGoat / 119 | 116 / 24 | Primary compact proportions, horn shape, stance and gait |
| Goat/SK_Goat.blend | Armature / 41 | 11 / 60 | Secondary tucked-head charging posture from `ram run` |

The primary includes separate `MountainGoat Antler` and `MountainGoat.001`
meshes. Despite that mesh name, its horns are unbranched: narrow, upright,
outward-flaring and swept backward. The primary is stockier/deeper-chested
than the slender domestic Goat. Match the supplied MountainGoat silhouette;
do not add a large beard, bovine horn boss, antlers, udder or long cattle tail.

`scripts/study-wildmesh-goat.py` inventories each source, samples 21 normalized
bone/bounds poses per selected action, renders idle side/front/top and four
side key poses per motion. It also samples/renders all 21 opaque `A_*` clips
from MountainGoat so their names are not treated as evidence of an attack.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-goat.py -- /absolute/SK_MountainGoat.blend MountainGoat
# Secondary: /absolute/SK_Goat.blend Goat
```

Outputs are `/tmp/goat-<tag>-*`. No native scene is saved or imported into the
SVG/runtime. Diagnostic cameras/settings exist only in the separate background
Blender process. Native forward is approximately -Y, lateral X and up Z; local
skeleton data uses centimeter-scale values under world transforms.

Primary idle world-space envelope is approximately **2.002 m long × .480 m
wide × 1.589 m high**, including horns. Pelvis is .955 m high, chest .986 m,
head 1.179 m and left ear base 1.276 m. Fore upper-leg attachment is .869 m,
fore carpus .342 m and fore ankle .144 m; rear upper attachment 1.027 m,
stifle .616 m, hock .410 m and ankle .149 m. Chest control is .633 m forward of
pelvis, with the front upper attachment another .216 m forward; control spacing
alone does not define the visible barrel. Domestic Goat's envelope is 1.585 m
long × .364 m wide × 1.193 m high, with a more slender torso and longer-looking
neck/back-raked horns.

## Observed actions

| Reference / action | Frames | Duration | Observation/use |
|---|---|---|---|
| MountainGoat Idle_Breathing | 1–51 | 2.083 s | Alert elevated neck and quiet breathing |
| MountainGoat WalkMedium_F | 1–36 | 1.458 s | Whole-leg stepping, lower/forward-carried neck |
| MountainGoat RunFast_F | 1–15 | .583 s | Gathering/extension, suspension and lowered mobile neck |
| MountainGoat Idle2GrazingOnSpotA | 1–36 | 1.458 s | Neck/head lowering hierarchy |
| MountainGoat 21 opaque A_* clips | varied | varied | Inspected, not chosen as combat references |
| Goat idle | 1–611 | 10.167 s | Secondary standing/slender anatomy |
| Goat walk | 1–51 | .833 s | Secondary whole-leg cycle |
| Goat run | 1–25 | .400 s | Secondary quick running cycle |
| Goat ram run | 1–25 | .400 s | Tucked head and forward charging posture |
| Goat rear kick | 1–61 | 1.000 s | Inspected as an alternative, not implemented |

Primary head height is 1.177–1.181 m in idle, .942–1.007 m in medium walk and
.840–1.183 m in fast run. The moving head is carried substantially lower than
in alert idle; the SVG therefore has separate carried-neck offsets for both
gaits. Native `ram run` keeps its head low, around .672–.722 m in the smaller
secondary animal, rather than showing an upward horn toss.

No named MountainGoat combat clip was found. The 21 opaque names (seven A_F,
five A_G, nine A_S) showed turning/locomotion/standing-or-seated transitions at
the inspected poses, including some inverted poses; no clear head-attack
sequence was selected from them. Do not infer combat semantics from their
prefixes. Goat `ram run` is a charging gait, not an isolated impact animation:
the SVG's short braced head-butt is an explicit authored adaptation.

## SVG proportions and clips

`scripts/refine-mountain-goat.mjs` reuses the raw Deer ungulate hierarchy and
pure author-time quadruped tools, then writes an independent family and thin
model. Consumers receive ordinary local clips and geometry, with no renderer
branch or runtime IK. Existing ungulate source/output is unchanged.

- .94 m pelvis, .98 m chest, .55 m deep barrel and .43 × .60 m chest plate;
  compact body, sturdy limbs, articulated fore carpi and rear stifles/hocks.
- Raised .26 m thick neck, narrow .205 × .26 m head, small muzzle, upright/outward
  leaf ears, small hooves and short hanging tail. No extra beard/udder/bell.
- Two narrow swept-back horns, six stations each. Orthogonal pointed ribbons
  provide true 3-D thickness; horns flare outward a little and curl back/in at
  the tips. Tip spacing is .24 m and tips reach about 1.60 m. All geometry is
  rigid to the skull; no permanently foreground horn ordering is used.
- Scale 26, ground point [50,60], checked against complete emitted SVG bounds.

| SVG clip | Duration | Behavior |
|---|---|---|
| idle | 2,083 ms | Four planted hooves, 5 mm breathing, subtle ear/tail and neck motion |
| walk | 1,458 ms | Four staggered footfalls, .65 stance duty, forward/lower carried neck |
| run | 583 ms | Short supported gallop, whole-leg gathering/extension and suspension |
| attack | 1,300 ms | Load/recoil, sudden tucked forehead thrust, brief contact, recoil and recover |

Walk/run durations follow the primary reference. Walk has a 24° neck-base and
6° neck-tip carried offset; run uses a 24° base with 8° tip offset, plus gait
counter-motion. Both carry the head lower than standing idle. Run uses .34
normalized stride, .28 foot lift and .05 body rise: compact forelegs require a
shorter supported stride/modest body arc than the larger ungulates. Fore bind
alignment was made more upright, consistent with the primary stance; no joint
limits were loosened and no reach/contact failures were bypassed.

The head-butt loads at .20, starts at .34 and impacts at .48. The forehead point
moves forward about **.28 m in 182 ms**, with summed neck/head pitch changing
from -12° to 64°. This is a sharp downward tuck/thrust, not an upward goring
toss. Contact ends at .54, a **78 ms** interval, then the head recoils and rises
back to its starting posture. All four hooves brace through the action.
`foreheadContact` is a rigid diagnostic landmark, not a ground-contact ID or a
collision solver. Events have anticipation/action/contact/recovery/settle
ownership; the last pose exactly matches the first. Root translations/local
rotations are baked at 960 uniform samples plus phase boundaries.

## Regression and review

Nine focused tests cover anatomy, horn shape/projected area and skull rigidity,
fixed idle feet/shadow, lower moving head carriage, four walk footfalls and
faster suspended run, whole-leg participation, bone lengths/limits/loop seams,
interpolated contacts/clearance, and head-butt speed/direction/recoil/brace.
Ground/clearance is checked at 1,201 intermediate samples per clip to .1 mm;
idle drift is numerical and braced attack drift is bounded to 2 micrometers.

The independent directional matrix covers four clips × twelve critical phases
× six elevations × sixteen headings = **4,608 views**, including complete SVG
ellipse/rect/path bounds and transforms. Deliberately flattening the horns must
fail projected-area checks; promoting a far horn over the nearer skull or a
jaw seam over incident plates must be caught independently of golden/browser
parity. Ambiguous crossing depth intervals still require visual review; these
checks do not claim a complete 3-D surface-visibility proof.

Final catalog/browser gates, direct workbench review and implementation commit
are recorded in the creature roadmap.

Final gates passed: nine focused tests; all 278 headless tests and 39 source/
model validations; ordinary/motion/paint audits and release checks. Mountain
Goat adds zero issues/warnings; pre-existing catalog advisory totals remain
40 ordinary, 38 motion and 40 paint. Browser comparison passed 121/121 outputs,
authoring UI checks and zero console errors. Actual workbench review included
native/SVG side and frontal proportions, final horn flare, overhead burial,
lower walking head carriage, gallop suspension and head-butt impact. Final view
is idle at 45° elevation / 225° heading. See the roadmap for the implementation
commit and N7 Boar resume checkpoint.

## Follow-up — concealed muzzle bridge (2026-10-29)

`muzzleConnectorPlate` is now an internal join (`under-core`), so its broad base
is covered by the head rather than appearing on top of the forehead. Exposed
snout geometry remains visible between the head and muzzle. Proportions and all
clip frames/timings remain unchanged. `test/ungulate-joins.test.mjs` checks the
actual triangle-base corners against the covering head ellipse and painter
order across poses/cameras, with negative controls for the old exposed sorting
and a deliberately promoted connector. Final gates/commit are in the roadmap.
