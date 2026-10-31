# Mink — 2026-10-31

Inspected AmericanMink/SK_AmericanMink.blend in Blender 5.1.2, read-only.
The reproducible scanner is `scripts/study-wildmesh-expansion.py -- mink`;
`mink-reference.json` records the source, FPS, 43 actions, 118 bones and nine
samples per selected action. Reference renders are diagnostic files in /tmp.

The native idle profile shows a long narrow horizontal barrel, short limbs,
raised slim neck, pointed face, round ears and a long tapering low tail. Run
start lowers and extends the forebody and folds the hind limbs beneath the body.
The SVG preserves those ratios, distinct from the broad, thick-necked badger.

Walk is a supported four-beat gait. Run uses quicker springing steps, spine
flexion and tucked hind recovery. Quiet idle and a short opening/snapping bite
keep four paws planted. There is no dedicated attack in the native library:
the bite is authored, informed by the alert/bark head postures, not a claimed
retarget. Swimming actions are recorded for later work, outside this batch.

Checks: compile validation (22 checks), 480-view audit (zero issues/warnings),
dense contact/rigidity tests and 1,120 directional action/camera samples.
Regression fixtures are added for Mink only; existing model oracles are untouched.

Browser parity: 121/121 outputs identical, authoring UI toggles passed, zero console errors.
