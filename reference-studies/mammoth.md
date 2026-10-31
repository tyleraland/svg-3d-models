# Mammoth — 2026-10-31

Inspected Mammoth/SK_Mammoth.blend read-only in Blender 5.1.2: 145 bones,
32 actions. `mammoth-reference.json` records inventory/FPS and nine samples
of Idle, Move-Fwd, Charge-Fwd and Attack-Tusk-Jab. The native library also has
tusk sweeps, trunk grabs, foot stomps and swimming for possible later work.

Reference differences from elephant: high domed forehead/shoulders, sloping
back, much smaller ears, shaggy belly/shoulders, and long sweeping tusks.
The independent SVG source preserves the elephant's articulated trunk/column
limbs but reshapes those proportions. Sparse embedded outline panels suggest
fur without recreating the native mesh's many hair cards. Four linked tusk
segments sweep down/out and curl up/in, rigidly following the head. Each is
head-relative, so far tusks can disappear behind the skull/trunk as appropriate.
The trunk connector and leg roots are explicitly buried beneath the opaque core.

The walk is slow, supported and four-beat. Charge uses faster supported steps,
not an airborne gallop. The native jab informs a short forward/down head drive,
trunk curl clear of the strike, recoil and full recovery over four fixed feet.
All animation transforms are baked joint-local rotations; no runtime IK.

Checks: source/compiled validation, dense fixed support/rigidity tests, 1,120
directional samples and 480-view audit pass with zero issues/warnings. Dedicated
regressions check raised shoulders, reduced ears, upward tusk curl, trunk
clearance, both buried hip seams and the trunk connector across seven headings.
Browser sheet reviewed all four actions; full batch parity follows at the end.
