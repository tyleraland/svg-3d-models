# Centaur: Horse anatomy and motion reference pass

Milestone R3, 2026-10-29. Reference:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/Horse/SK_Horse.blend`.
The refined paper-rig Horse is the immediate equine geometry reference. There is
no claim that the native Horse supplies humanoid or Centaur combat animation.

## Blender study

Inspected and rendered in installed Blender 5.1.2 background mode without
modifying/saving the native file. Native armature: `Horse`; mesh: `Horse.001`.
Playback is 24 FPS. Initial file-pose mesh bounds are approximately
2.858 × .927 × 1.948 m; action evaluation changes facing, so those initial axes
must not be mistaken for the evaluated motion convention. Animated forward is
approximately -Y in these study views; our rig retains +X forward and +Z up.

| Native action sampled | Frame range | Duration from frame difference / 24 |
|---|---:|---:|
| Idle | 1–336 | 13.958 s |
| G0_Walk | 1–36 | 1.458 s |
| G1_Trot | 1–21 | .833 s |
| G2_Canter | 1–18 | .708 s |
| G3_Gallop | 1–16 | .625 s |

Twenty-one normalized samples were evaluated per action, recording pelvis,
spine, limb and tail landmarks. Neutral top/profile renders and two profile
poses from each gait were reviewed. The first camera direction revealed a
frontal view; the side camera was corrected after checking evaluated facing.
The file also contains turning, gait transitions, jumps, mounting and fidget
clips; these were inventoried, not all visually studied.

Observed features used:

- A level, elongated barrel between rounded shoulder and haunch masses.
- Slender lower legs with carpal/distal articulation in front and opposing
  stifle/hock bends behind; whole limbs participate in gait.
- Distinct slower support exchange versus faster gathering/extension and flight.
- Tail carriage and torso movement coordinated with the support cycle.

The native saddle, reins, skinning, mesh and animation channels are not imported.
The humanoid balance/strike are authored adaptations for the fantasy anatomy.

## Shape and integration

`rigs/families/centaur.json` retains the existing model identity and humanoid
joint IDs. The equine skeleton and major plates reuse the current refined
Horse geometry: one-metre pelvis-to-chest span, level barrel, rounded shoulder
and pelvis, three-link forelegs including Carpus, and articulated rear hocks.
The longer body replaces the previous short equine template.

A tapered waist and `withersBridgePlate` join the humanoid upper pelvis directly
to the withers. The torso stays upright, with a narrower waist, broader chest
and smaller head. Shoulder placement keeps relaxed arms outboard of the horse
barrel; elbow flexion uses the sagittal bend axis on both arms. Existing hand
and equipment anchors remain available.

Shoulder/bicep plates sort relative to upperShoulders. Forearms/hands sort
relative to upperSpine, the torso mass at their height. A single high shoulder
reference incorrectly buried the near resting forearm at 45°/225°; this was
caught in visual review and corrected. This is camera-relative geometry, not a
permanent foreground override.

## Authored clips

| Clip | Duration | Behavior |
|---|---:|---|
| idle | 3200 ms | Quiet torso/tail movement, four hooves fixed |
| walk | 1450 ms | Four-beat lateral support sequence, 68% stance, arm counter-motion |
| run | 760 ms | Left-lead four-beat gallop-style run, gathering/extension and suspension |
| attack | 1300 ms | Four-hoof brace, weight preload, torso twist and left-hand strike; right-hand guard |

Walk timing is close to native G0_Walk. Run condenses the observed equine
patterns into the existing four-beat authoring recipe and is deliberately
slower than the native gallop for the upright torso. Its authored support starts
are 0/.12/.32/.44, with suspension after .66 and an apex at .83. These are authored
recipe values, not extracted native contact times.

The hand strike winds up at .30, impacts at .42 (156 ms later), releases at .50
and settles by .84. Both arm segments and the torso participate, while leg IK
bakes compensation for the weight shift into ordinary local rotations. The
phased clip makes the full audit inspect the actual .42 contact, rather than
assuming a generic attack time. It remains compatible with grip attachments;
no weapon is required or added in this pass.

`scripts/refine-centaur-motion.mjs` reproduces the clips. It reuses the shared
quadruped gait baker at author time, adds humanoid balance curves, and writes
ordinary clips. The model's grounding declaration only fits bind geometry;
consumers do not run IK or procedural gait logic. Idle uses 481 samples so even
the existing strict 1e-8 planted-hoof tests pass without loosening tolerances.
The shared authoring baker now resolves upperNeck/upperHead when a rig has those
controls, avoiding nonexistent horse neck/head targets on Centaur. Existing
Horse and other models retain their previous output.

Hit and KO remain the existing generic reactions; additional weapon-specific
attacks or rearing are outside this milestone.

## Review and regression coverage

Seven focused tests in `test/centaur.test.mjs` cover:

- Exact equine geometry correspondence to Horse, level body, articulated
  forelegs/rear hocks and the humanoid junction.
- Four staggered walk support exchanges, faster run, flight, whole-limb movement
  and independent arm motion.
- Fast hand reach, torso participation, phased impact audit sampling, four-foot
  brace and exact neutral recovery.
- Bone lengths, declared joint limits, loop seams, foot clearance/contact and
  fixed idle/attack contacts at 1,201 interpolated samples per requested clip.
- The shared baker targets only existing humanoid neck/head controls.
- **5,376 camera/pose views**: four clips × fourteen critical phases × six
  elevations (0/30/45/60/75/90) × sixteen headings, checking independent
  occlusion and framing.
- A dedicated 45°/225° near-arm visibility invariant and a mutation that forces
  the forearm under the body and must fail.

Direct workbench review includes side/overhead/oblique shapes, relaxed arms,
windup and strike. The 17-test focused run combines these tests with the shared
Horse/grounding suite. Final catalog/browser gate results and commit are recorded
in `creature-roadmap.md`.

## Completed gates

- Focused Centaur plus Horse/grounding run: 17/17 tests passed.
- `npm run check`: 219/219 tests; all 33 models/sources validated; ordinary,
  motion and paint audits and release metadata passed. Catalog warnings remain
  40 ordinary, 38 motion and 40 paint; Centaur contributes none.
- Centaur audit: 480 views, zero issues/warnings, including phased impact at .42.
- Final Horse/Centaur browser gate: 262/262 outputs matched; authoring UI checks
  passed; zero console errors. Horse's golden output remained unchanged.
- Rebuilt workbench left open on the Centaur hand strike at 60°/225°.
