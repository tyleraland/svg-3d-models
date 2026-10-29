# Crab: WildMesh reference pass

Milestone R1, 2026-10-29. Source:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Stylized Animals/Crab_Stylized/SK_Crab_Stylized.blend`.

## Reference evidence

Inspected the native file in Blender 5.1.2 in background mode and rendered
neutral top/side views plus the midpoint of all four attacks. The original file
was not saved or modified. The interactive connector was unavailable.

- Objects: `Armature` and `U3DMesh`. Scene playback is 60 FPS.
- Native mesh bounds at the initial file pose: approximately 1.002 × 1.108 ×
  0.586 m. These are whole-character bounds, including legs/claws, not shell dimensions.
- Idle: frames 1–240 (239/60 = 3.983 s).
- Walk: 1–58 (0.950 s); Strafe: 1–198 (3.283 s).
- Attack1, Attack2, Attack4: 1–142 (2.350 s); Attack3: 1–178 (2.950 s).
- Other actions present: Defeated, Die, HitBack. There is no explicit Run action.
- Evaluated five normalized samples of Idle, Walk, Strafe and all four attacks,
  including world-space claw and foot landmarks. Some source actions reorient
  their root: world axes alone must not be mistaken for a travel direction.
- Visible identity: broad low shell, thin pointed leg ends, raised eye stalks,
  a large right claw and a much smaller left claw. Attacks swing the large claw
  through space and articulate its pincer; the arm is not simply stretched.
- The stylized reference has three walking-leg pairs. Our existing four pairs
  are intentionally retained rather than copying that simplification.

Reference geometry, textures, skeletons and animation channels are not shipped.
The paper rig is freshly authored using the existing primitives and clip pipeline.

## Authored shape

`rigs/families/crab.json` keeps existing IDs and adds eye stalks, a shell cap and
hinged fixed/moving pincer digits. The right palm and fingers are approximately
1.47 times the left dimensions. This asymmetry is intentional.

The shell uses a closed horizontal cap and a rounded lower body plate: the cap
shows a broad top footprint and becomes edge-on in side view. The lower plate
keeps body volume in that view. Four fanned pairs of legs have elevated knees,
small ground tips and tapered distal plates. Their occlusion reference is the
shell cap so that overhead legs are compared against the shell surface, not a
lower torso center. The shadow explicitly uses the XY ground plane.

## Authored clips

| Clip | Duration | Behavior |
|---|---:|---|
| idle | 3200 ms | Small body dip and eye/claw motion over eight planted feet |
| walk | 1200 ms | Forward travel; alternating tetrapods, 68% stance |
| run | 650 ms | Faster forward cycle; 56% stance, larger clearance |
| sidewalk | 1150 ms | Lateral travel along +Y; alternating tetrapods, 68% stance |
| siderun | 620 ms | Faster lateral cycle; 56% stance, larger clearance |
| attack | 1250 ms | Claw windup at .28, arcing strike at .43, pincer snap at .46, recovery by .86 |

Run clips are authored adaptations, not nonexistent native actions. The shorter
SVG attack condenses the reference's guard/windup, swing, pincer closure and
recovery for token readability. All eight feet brace during the attack.
Sideways travel is a separately selectable in-place cycle; mirrored travel can
be added later if a consumer requires a distinct left/right clip contract.

`scripts/refine-crab-motion.mjs` reproduces the ordinary joint-local clips using
`scripts/lib/spatial-leg-ik.mjs` at author time. Gaits have constant backward
foot travel during stance and smooth lifted recovery. Upper and lower segments
both articulate. No runtime IK or mesh dependency is introduced. Existing hit
and KO remain available; this milestone does not replace those reactions.

## Review and regression coverage

- `test/crab.test.mjs` checks shape/asymmetry, both gait axes, coordination,
  articulated upper/lower legs, claw anticipation/snap/recovery, continuous
  support, loop closure, bone lengths and declared joint limits.
- Each requested clip is checked at 1,201 interpolated times for ground
  penetration and declared contact height. Idle/attack contacts remain fixed;
  locomotion support feet move backward relative to the stationary token body.
- Independent occlusion and joint framing checks cover six clips × eleven
  critical times × six elevations (0/30/45/60/75/90) × sixteen headings:
  **6,336 views**. This includes strike/snap poses beyond generic audit samples.
- The ordinary package/audit matrix now explicitly includes four phases each
  of sidewalk and siderun. Browser parity includes both optional clips and
  workbench selectors display their forward/sideways labels together.
- Native reference renders and a rendered SVG review sheet were inspected at
  top, side and oblique angles. The rebuilt workbench was inspected directly.
- An explicit overhead shell/leg ordering invariant includes a mutation that
  lowers the occlusion reference to the ground root and reproduces exposed
  upper legs. Separate checks verify planted idle/attack feet (3 µm tolerance
  for interpolation) and constant backward stance speed in each travel axis.
- Parity/golden equality checks implementation consistency, not anatomical
  correctness; the independent invariants and visual review are separate gates.

Final gate results and the commit are recorded in `creature-roadmap.md`.
