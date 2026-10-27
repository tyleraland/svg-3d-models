# WildMesh collection: opportunities for existing paper rigs

Local collection: `~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/`.
Inventory: **100 native Blender files**, comprising 62 realistic and 38 stylized
animals. All 100 files were readable through Blender's library API.
The [machine-readable inventory](wildmesh-inventory.json) records relative paths
and the action names actually present in each file.

This is a reference assessment. No creature geometry or animation was changed.
No source meshes, textures, skeletons, or animation channels were copied into
the paper-rig project.

## Highest-value next passes

| Priority | Existing rig | Reference | Concrete improvement | Verified action names |
|---|---|---|---|---|
| 1 | elephant | Realistic Animals/AfricanElephant | Dedicated broad fan-shaped ears (currently absent as ear plates), larger shoulder/forehead masses, columnar legs; separate trunk and ear secondary motion; a heavier support sequence | `WalkSlow-IP`, `Walk-IP`, `Idle`, `Attack_Head_01-IP` |
| 2 | leopard | Realistic Animals/Leopard | Long low torso, fuller shoulder/haunch transitions, compact feline head, longer curved tail; crouching and a feline paw-recovery arc | `Walk-IP`, `Trot-IP`, `Sneak-IP`, `Attack_Legs_02-IP` |
| 3 | wolf | Realistic Animals/Wolf_1 and Wolf_2 | Chest/ruff mass, narrower waist, long muzzle, upright ears and a low brush tail; more canine trot, head carriage and bite anticipation | Wolf_1: `Walk`, `Trot`, `Sneak`, `Attack_BiteForward`; Wolf_2: `TrotSlow_F`, `Idle_Breathing` |
| 4 | rhino | Realistic Animals/Rhinoceros | Lower head, broad shoulder mass, short thick neck and legs, horn alignment; body-driven attack and heavier weight transfer | `Walk-IP`, `Trot-IP`, `Attack_HornL-IP`, `Hit_HeadR_Heavy-IP` |
| 5 | flyingBird | Stylized Animals/Eagle_Stylized; Realistic Animals/Crow | Better shoulder/elbow/wrist folding, wingtip spread, tucked feet and tail fan; distinct flap, glide, takeoff and landing phases | Eagle: `FlyLoop`, `GlideLoop`, `TakeOff`, `Landing`; Crow: `Fly`, `FlyUp` |
| 6 | crab | Stylized Animals/Crab_Stylized | More deliberate carapace/leg width, claw hinges and alternating walking-leg groups; lateral stepping instead of generic forward motion | `Strafe`, `Walk`, `Attack1`–`Attack4` |

The elephant, leopard, wolf and rhino currently use the same default normalized
stride/lift settings in our grounded locomotion helper. Distinguishing their
support timing and joint curves is likely a larger animation gain than adding
more small surface details.

## Further existing-model matches

- **Horse / centaur:** Realistic Animals/Horse contains `G0_Walk`, **`G1_Trot`**,
  `G2_Canter`, `G3_Gallop`, `G4_Sprint`, and jump transitions. This is substantially
  better locomotion reference than the earlier demo GLB, whose moving clip was
  labelled `Horse_Walk`. The lower equine half of the centaur can share insights.
- **Rabbit:** Realistic Animals/Rabbit contains `HoppingSlow_F`, `HoppingFast_F`,
  `RunSlow_F`, `RunFast_F`, grazing and transition actions. These support a later
  pass on true compression, push-off, flight and landing rather than just paired
  stance exchange. Flight needs explicitly authored contact intervals and a
  body arc; it should not be faked by breaking our grounded-contact checks.
- **Walking bird:** realistic Chicken and Rooster, plus stylized Ostrich, can
  distinguish head stabilization, digitigrade stance and folded-wing posture.
  Chicken includes `Walk`/`Run`; Rooster includes `Walk` and one-leg poses.
- **Lizard / dragon's terrestrial half:** AmericanAligator and Crocodile_Stylized
  offer useful splayed-limb and tail references. The alligator has both
  `Walk fwd` and `Walk fwd low`; its exact crocodilian proportions should not
  overwrite the identity of a generic lizard or dragon.
- **Serpentine:** Anaconda_Stylized provides `WalkSLow`, `Rise`, `Strike`, and
  `Bite`; KingCobra_Stylized provides `IdleLoop`, `CircleBite`, and `Bite`.
  Useful for traveling curvature, head stabilization and strike recovery. A hood
  is species-specific and should remain an optional identity feature.
- **Greyhound:** Doberman_Stylized and Labrador are useful motion analogues
  (`WalkLoop`, `RunLoop`; Labrador `trot_fwd_01`, `sprint_fwd_01`). Neither is an
  exact sighthound shape reference, so preserve our deep chest/tucked waist.

There is no direct bat, spider, scorpion, ant or lobster match in this inventory.
Crab anatomy can inform some lobster appendages but cannot supply a lobster's
segmented body or tail mechanics.

## Inspection evidence

Six models were loaded into separate Blender study scenes, preserving earlier
horse/rabbit study scenes. Neutral silhouettes were rendered for Leopard,
Wolf_1, AfricanElephant, Rhinoceros, Eagle_Stylized and Crab_Stylized.
Five normalized poses were then evaluated in each of these actions:

| Reference | Evaluated action | Source frame range |
|---|---|---|
| Leopard | `Sneak-IP` | 1–101 |
| Wolf_1 | `Trot` | 1–19 |
| AfricanElephant | `Walk-IP` | 1–111 |
| Rhinoceros | `Attack_HornL-IP` | 1–51 |
| Eagle_Stylized | `FlyLoop` | 1–70 |
| Crab_Stylized | `Strafe` | 1–198 |

These ranges are frame counts, not duration claims; native playback settings
must be checked before converting them to milliseconds. Fur cards were visible
in untextured leopard/wolf previews, so contour extraction should use the body
mesh and a deliberately simplified fur envelope rather than blindly tracing
all cards.

## Applying the references

Use realistic models to study anatomy and motion, and stylized counterparts to
choose what remains legible at token size. Author fresh proportions, rigid
plates and joint-local amplitudes in our declarative sources. Reduce movement
to phases with explicit contacts and limits, then bake ordinary clips.

For each pass, review idle and movement in top/side/oblique views, retain the
new buried-appendage invariants and mutation tests, and approve visual changes
before updating goldens. Native 3D references inform the authoring; they do not
become renderer dependencies.
