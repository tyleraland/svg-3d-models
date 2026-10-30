# Boar reference study

N7, 2026-10-29. Native Blender inspection of WildMesh Realistic Animals:
`WildBoar/SK_WildBoar.blend`, `Boar/SK_Boar.blend`, and
`Warthog/SK_Warthog.blend`. No reference mesh or animation data enters the runtime.

## Reference evidence

WildBoar has 89 bones and 84 actions at 30 FPS. Its idle envelope is approximately
.495 m wide × 1.788 m long × 1.074 m high. Hips are .850 m high, upper spine
.906 m, head .711 m, front elbow .481 m, carpus .204 m and ankle .086 m.
The compact torso, higher shoulders, short limbs, long tapered snout, upright ears
and thin hanging tail informed the paper silhouette.

Inspected actions include Idle (1–121), walk_fwd_01 (1–25), run_fwd_01 (1–13),
attack_02 (1–14), and idle_shake_head_01. The attack crouches, opens its jaws,
lunges airborne with an upward head flick, and lands forefeet before hind feet.
It is a moving cyclic strike rather than an isolated bind-to-bind action.

Boar has 110 bones and 81 actions at 24 FPS, a .507 × 1.913 × 1.116 m envelope,
and four separate upper/lower tusk meshes. Inspected Idle_Breathing (1–46),
WalkMedium_F (1–29), RunFast_F (1–12), and Idle2GrazingOnSpotA. Warthog has
134 bones and 101 actions at 24 FPS, a .484 × 2.046 × 1.235 m envelope and
larger tusks/facial bumps. It served as a comparison; its warts and enlarged tusks
were not adopted.

Reproduce inventories, 41 normalized motion samples and native pose renders:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-boar.py -- /absolute/path/to/SK_WildBoar.blend WildBoar
```

The same script accepts Boar and Warthog paths/tags. Outputs are temporary JSON
and PNG files under `/tmp`, without saving changes to the reference scenes.

## Paper adaptation

Independent `boar` family/model, authored reproducibly by
`scripts/refine-boar.mjs`, using the existing grounded quadruped pipeline.
High shoulders, deep compact barrel, low long snout with flat nose disc, short
three-segment legs, upright ear leaves and short hanging tail. Two curved lower
cutters attach to the jaw, two small upper canines to the skull. Orthogonal
polygon ribbons preserve volume across headings. Lower tusks flare slightly
farther out for token-scale readability; this is a deliberate simplification.

Idle: 4 s quiet breathing over four fixed hooves. Walk: .95 s lateral four-beat
sequence. Run: .42 s short suspended gallop. All leg segments participate.
Attack: 1.05 s isolated crouch/lunge/upward tusk flick with open jaws, forefoot
landing at .62 and hind landing at .70, then recovery. Suspension is .34–.62;
a short parabolic body arc matches vertical launch and landing velocities.
The anticipation and complete recovery are authored adaptations. Ground shadow
stays fixed. Body/local rotations and leg IK are baked at authoring time; there
is no runtime solver or imported animation evaluator.

## Regression coverage

Eight focused tests cover anatomy and tusk ownership/rigidity, projected tusk
volume including a flattened-volume mutation, fixed idle feet and shadow,
whole-leg gait articulation, lengths/limits/clearance, attack flight/support
sequence and recovery, dense occlusion/framing and an intentionally promoted
far tusk. Contact/clearance sampling uses 1,201 interpolated phases per clip,
.1 mm vertical tolerance and 10 micrometer attack stance-drift tolerance
(observed maximum approximately 5.4 micrometers).

The independent directional matrix covers four clips × twelve phases × six
elevations × sixteen headings = 4,608 views, checking full emitted SVG bounds
and anatomical occlusion. It complements golden/browser parity; overlapping
depth intervals still require visual judgment. Native walk/run/attack side
poses and SVG side/front/top/oblique poses were reviewed. Final catalog and
browser gate results are recorded in the roadmap.

Final gates: 286/286 tests, 40/40 model validations, ordinary/motion/paint audits
and release checks passed. Boar adds no issues or warnings; existing advisory
totals remain 40/38/40. Browser parity passed 121/121 outputs, authoring UI checks
and zero console errors. Workbench left at idle, 45° elevation / 225° heading.

## Follow-up — concealed muzzle bridge (2026-10-29)

The broad base of `muzzleConnectorPlate` is now an internal join (`under-core`),
covered by the head rather than an exposed triangle on its surface. The closed
head/muzzle envelopes hide the embedded base; any exposed bridge between them
still contributes to the silhouette. Jaw articulation and jaw-owned tusks remain
unchanged, including all clip frames and timings. The independent muzzle-base
coverage/order checks in `test/ungulate-joins.test.mjs` include restoration of the
old exposed ordering and a promoted-connector mutation. See the roadmap for the
corrective commit and final gates.
