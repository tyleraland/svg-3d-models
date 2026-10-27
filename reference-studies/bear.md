# Brown bear reference and SVG model

Reference: `Realistic Animals/BrownBear/SK_Bear.blend` in the local WildMesh3D library. The asset is open in the separate Blender scene `Reference study BrownBear`, with an independent study camera. Inspected the native `Idle` (frames 1–222), `Walk` (1–52), `Run` (1–18), and `Attack_IdleAngry_01_High` (1–92), sampling nine phases and rendering each for review. The mesh bounds at idle were approximately 0.80 m wide, 2.33 m long and 1.50 m high. No reference mesh, textures or animation channels are embedded in the SVG.

The SVG is a new `bear` model with its own authored `ursine` family. It uses the existing quadruped topology with independently authored bear proportions: raised shoulders, deep torso, broad short muzzle, small round ears, heavy forelimbs, large plantigrade paws and a short tail. Paw and shoulder proportions are intentionally distinct from the cat and wolf. Three visible front claws per paw are a silhouette simplification; claws remain present instead of retracting like a cat's.

Sampled reference walk pelvis height was about 0.97–1.01 m, chest 1.06–1.13 m and head 0.95–1.02 m. Run pelvis ranged about 0.87–1.11 m, chest 1.05–1.28 m and head 1.00–1.44 m. The native high attack rears and raises both forepaws; the initial SVG attack is a simpler supported forepaw swipe, retaining three-foot support instead of reproducing the complete rear-up animation.

The model includes a 3200 ms quiet idle, 1800 ms lateral-sequence walk, 720 ms suspended run and 1100 ms paw swipe. The walk/run plans use `keepPawsLevel` to bake compensation at each foot, preserving a level sole and claw clearance as the hip, knee and ankle articulate. `scripts/refine-bear-attack.mjs` bakes the supported swipe to ordinary joint-local keyframes with ground-contact intervals. No runtime solver is added to consumers.

Regression tests cover bear proportions, permanent claws, ground clearance through 1000 inter-frame samples, paw orientation, planted supports, bone preservation, loop closure, swipe reach, and head/limb stacking and token framing over 16 headings and six elevations. Catalog source, semantic-detail, provenance, audit and golden-fixture checks include the new 32nd model.


## Upright posture and springy arcs

Inspected native `Idle_to_IdleHind` (frames 1–91), `IdleHind_Idle_01` (1–151), and `IdleHind_to_Idle` (1–102). Upright reference pelvis/chest/head heights were roughly 0.90/1.57/2.31 m, with forepaws near 1.11 m and the hind ankles near 0.12 m. The SVG bends through the pelvis with hind-leg IK, a raised chest, forward-facing head and guarded forepaws.

New ordinary clips: `idleHind`, `walkHind`, `attackHind`, `standUp`, and `standDown`. The upright walk is independently authored; the reference library does not supply a named hind-leg walk. It alternates hind stance/swing with overlapping support, level soles and counter-swinging forepaws. The explicit neutral upright idle makes the transitions and upright attack share exact endpoint positions and rotations. `standDown` follows the inverse pose path of `standUp`, with corresponding forepaw plant/release metadata. Both hind paws stay fixed during the rise, descent and upright swipe.

Both swipes now use a cubic spatial paw arc, a short accelerated stroke, body loading/recoil and recovery. The all-fours version keeps three feet planted; the upright version supports on both hind paws. The original four-legged walk/run remain unchanged in world space. Export framing uses one fixed scale for all postures so standing fits without per-frame zoom.

Tests cover endpoint frame agreement, up/down inverse paths, contacts between keyframes, claw clearance, fixed bone lengths, upright gait support and sole orientation, curved swipe shape, whole-limb articulation, loop seams, and the full directional matrix for every new clip. The workbench labels all-fours and hind-leg actions separately.

### Upright shoulder and arm visibility

The foreleg roots now sit at ±0.40 m, at the edges of the broad chest rather than buried at ±0.22 m. Upright guard reaches 0.20 m forward. Front limb plates use the existing surface-relative chest depth contract, so a shoulder endpoint behind the barrel does not force the entire bent arm into the far layer. The shoulder oval is reduced to 0.68 × 0.64 m to nest into the chest barrel. A targeted 45° elevation / 225° heading test checks the exposed near upper arm, forearm and paw through upright idle, walk and swipe; the full camera matrix continues to check incorrect exposure from other angles.
