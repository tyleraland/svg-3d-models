# Goose reference study

N14, 2026-10-30. WildMesh `Realistic Animals/Goose/SK_Goose.blend`,
appended in Blender as `WildMesh Goose reference`, preserving earlier scenes.
Native armature Goose / mesh Goose.001, 156 bones, 24 FPS, 33 actions. Actions
were tagged by their original name so similarly named actions belonging to
other animals cannot be selected accidentally. No native file was saved and
no licensed mesh, texture or action payload enters the SVG runtime.

## Native inventory

| Actions | Frames |
|---|---|
| Idle / Idle_Breathing | 1–181 / 1–31 |
| WalkSlow / WalkMedium / WalkFast | 1–41 / 1–29 / 1–21 |
| WalkGrazing | 1–241 |
| RunSlow / RunFast | 1–21 / 1–11 |
| StandGrazingA / StandGrazingB | 1–201 each |
| Idle2StandGrazingA / Idle2StandGrazingB | 1–41 / 1–31 |
| StandGrazingA2Idle / StandGrazingB2Idle | 1–31 each |
| TakeOff_RunUp / TakeOff_BounceOff | 1–31 / 1–26 |
| Landing_PreLanding / Landing_Touch | 1–12 / 1–58 |
| FlyGliding / FlyFlapping | 1–121 each |
| SwimMove / SwimMove1 / SwimMove2 / SwimMove3 | 1–81 / 1–161 / 1–161 / 1–81 |
| SwimMoveMedium / SwimMoveFast | 1–33 / 1–26 |
| SwimSteady_1 / _2 / _3 / _4 / _5 / _6 / _7 | 1–201 / 1–101 / 1–161 / 1–101 / 1–201 / 1–201 / 1–101 |

There is **no native attack action**. The paper bite is an authored adaptation
of the neck/jaw articulation studied in the grazing actions, not a retargeted
combat animation. Flight/swim remain optional follow-ups under the roadmap.

Sampled Idle, Idle_Breathing, WalkMedium, RunSlow, RunFast, StandGrazingA/B and
Idle2StandGrazingA at 41 normalized phases each. Side native renders at quarter,
half and three-quarter phases; idle side/front/top. Native axes are lateral X,
forward -Y, up Z. Measurements use evaluated world transforms.

Idle phase-zero envelope: .291 m wide × .835 m long × .622 m high; pelvis Z=.269,
chest .301, neck chain .339/.426/.491, head .558. The torso is heavy and low,
with a tall curved neck, rounded small head, broad flat bill, long folded wings
and pointed feather tail. The true thigh is short, forward and mostly within
the feather barrel. Knee .219, backward hock .099, ankle .043 and toe .026:
four links, not a human two-link leg. The toes spread into a flat web.

WalkMedium alternates its ankles through Z=.043–.120 at half-cycle offsets;
pelvis .261–.280 and head .466–.478. The head lowers compared with the idle
pose while the barrel stays relatively steady. RunFast has much faster steps,
longer recovery/extension, ankle Z=.029–.122, pelvis .261–.279 and head .402–.422.
Its neck extends forward and down; these are grounded locomotion clips, not
flapping flight. Grazing demonstrates a large range of angular neck movement
and an independently moving jaw.

Reproduce the diagnostics with the active appended Goose scene, or:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-goose.py -- /absolute/path/SK_Goose.blend
```

Temporary outputs are `/tmp/goose-inventory.json`, `/tmp/goose-motion.json`
and `/tmp/goose-*.png`. This document preserves the evidence needed to resume
without relying on temporary files.

## Independent paper model

`scripts/refine-goose.mjs` writes the separate Goose family/model. 59 joints /
33 plates, nominal height .62 m; major proportions follow the native world
measurements. Chicken, Ostrich, Eagle and Crow remain independent. A broad low
barrel carries a curved three-section neck, small head, thin broad bill with a
rounded tip, long folded wing coverts/feathers and short pointed tail.

Short true thighs articulate independently above backward hocks and ankles.
The webbed sole is a rigid nine-point polygon with three forward lobes and web
notches. Longitudinal and transverse sole edges preserve thickness when the
plane is edge-on. All coplanar foot surfaces share the actual sole joint as
owner; the raised instep is owned by the ankle. Geometry endpoints are helpers,
without exposed joint caps. Explicit seam diameters avoid the default .06 m
floor on this small animal.

The bake uses author-time analytic IK with enforced reach and joint limits.
The true thigh is prescribed; the distal three-link solve follows sole targets.
Lateral root sway is compensated at the leg, and inverse lateral sole rotation
keeps the entire web flat. Consumers receive ordinary local rotations and root
poses; no IK or native animation evaluator is required at runtime.

- Idle, 3.6 s: breathing and small head stabilization above two fixed soles.
- Walk, 1.16 s: alternating .095 m strides, .65 duty and double support, .04 m
  foot recovery, .007 m lateral weight shift; thigh/knee/hock/ankle all move.
- Run, .54 s: .16 m strides, .42 duty with brief support gaps, .067 m recovery,
  lower forward neck and small folded-wing trim. Body crouch is bounded by
  actual leg reach; an initially excessive extension failed the authoring solve.
- Bite, 1.05 s: two planted soles, neck recoil to .36, fast angular lunge to .46,
  open jaw at impact, snap shut .51, release .53, return .76 and settle. No rigid
  child translations. First and last poses match idle exactly.

## Review and regression evidence

Browser review covers the moving waddle and side run, side and oblique bite,
contact overlays during the braced bite, top-down burial, front/rear bill
stacking and head-on wing/foot visibility. The shadow remains on the ground.
Review caught and fixed disconnected-looking neck segments (overlaps), a
vanishing edge-on foot (transverse sole edge), an attack framing extreme,
a jaw root slightly outside the skull, a hidden head-on bill (separate rounded
tip), and feather-covered thigh roots painting over the chest (buried roots).
No shared compiler or painter-sort behavior changed.

Fourteen focused tests cover proportions/anatomy, bounded seams with mutations,
whole-web ground contact, waddle/support/articulation, run cadence/stride/neck,
angular bite/snap/return, lengths/limits/loop continuity/intermediate clearance,
fixed shadow, edge-on thickness and sole ownership/helper-cap mutations.
Directional matrix: 4,608 pose/camera combinations check occlusion and actual
SVG primitive bounds. Another 960 views check actual skull coverage of bill/jaw
roots, with a promoted-connector mutation. Another 1,344 top-down poses/headings
assert feet stay behind the torso; promoting a web above the body fails that
independent oracle. Front/rear tests guard the bill tip and buried upper thighs.

All 46 earlier resolved-model goldens remain unchanged. Goose has its own
accepted rig/package fixtures. Workbench catalog entry and clip labels are
source edits; the generated HTML is rebuilt from those sources.

Final gates: `npm run check` passed — 372/372 tests, 47/47 source/model
validations, ordinary/motion/paint audits and release metadata. Advisory totals
remain 40/38/40; Goose adds none. Focused Chromium gate passed 121/121 outputs,
patch/onion/turntable/independent overlay UI checks, and zero console errors.
The actual workbench is left at Goose idle, 45° elevation / 225° heading,
overlays off. Screenshot proof: `/tmp/goose-workbench.png`.
