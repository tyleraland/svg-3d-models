# Hyena — 2026-10-31

Blender 5.1.2 read-only study of Hyena/SK_Hyena.blend: 101 bones, 107 actions.
`hyena-reference.json` records FPS/actions/bones and nine samples each of
Idle_Breathing, WalkSlow_F, RunFast_F and Laughing_A. The library includes
wounded locomotion, grazing and vocalizations, but no dedicated attack action.

The native profile has high deep shoulders, a back sloping to a lower rump,
a strong forward neck, blunt muzzle, tall rounded-point ears and a short
hanging tail. The separate SVG reshapes the reusable canine skeleton around
those ratios; a sparse embedded back ruff distinguishes the outline. It has
head-relative two-plane ears, buried muzzle/jaw connectors and rear thighs,
and a short brush tail whose internal root stays behind the pelvis.

Idle holds four paws. Walk uses supported four-beat footfalls. The fast gallop
flexes the spine and lowers the head/neck during full upper/lower leg movement,
with tucked hind recovery and suspension. The authored braced bite opens a
short powerful jaw, snaps forward and closed, recoils and recovers over four
fixed paws. It borrows native jaw/head posture, not a nonexistent attack clip.

Source/compiled validation, dense support/length/seam tests, 1,120 directional
samples and the 480-view audit pass with zero issues/warnings. Browser review
covers all four actions. Dedicated checks guard shoulder/rump slope, tail
length, thick neck, abrupt jaw closure and exact attack recovery.
