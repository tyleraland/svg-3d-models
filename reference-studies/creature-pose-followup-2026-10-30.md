# Pose and layering follow-up — 2026-10-30

This follows the second user review of Goose, Rat, Tortoise and Kangaroo.
It uses their existing WildMesh studies; no additional mesh data is shipped.

## Goose

The folded primary was sorted from its wrist hinge while the covert was sorted
from its shoulder. Breathing and waddling moved those pivots past each other in
camera depth, although the visible panels should keep the same overlap.
Each wing surface now has a rigid sorting frame at its actual surface centroid.
Outline helpers retain their original rigid owner and geometry. The coverts use
the midpoint of their span. This fixes the source geometry ownership rather than
hiding the crossover with a large depth bias or camera-specific rule.

The bill-tip ellipse was a screen-facing billboard. A twelve-point rigid YZ
rim, normal to the bill's forward axis and attached to the beak, now projects as
a real tip face: visible head-on, narrowing obliquely and edge-on from the side.
The jaw and rounded upper bill remain unchanged. Goose now has 111 joints and
34 plates (twenty new geometry/sorting helpers, no additional visible plates).

## Rat and Tortoise

Rat's rear upper leg roots remain below the opaque pelvis instead of swapping
foreground/background during the step. The workbench labels are `walk · creep`
and `run · scurry`; the 440/230 ms cadences are retained.

Tortoise slow crawl is 3200 ms instead of 3900; faster crawl is 1650 ms instead
of 2000. Both are approximately 21% faster. Pose, contacts and shell/feet geometry
are unchanged.

## Kangaroo

Shoulders are farther out from the chest; upper arms angle down/back into an
exposed guard, with forearms reaching forward and hands ahead of the torso. Upper/lower
arm lengths are preserved. Two small shoulder-cap plates bridge the joint.
The arm-specific IK branch is used consistently, without widening the declared
joint limits.
Punch and tail-supported kick return to the same upright guard.

Physical placement alone still hid the far arm at rear-oblique cameras. The
new explicit, opt-in `over-core` source policy keeps these arm plates and their
inherited seams in the existing camera-near appendage group. This intentionally
prioritizes readable paper arms over physical rear-body occlusion. It retains
limb semantics, exports a singleton eligible group with no heading swap, and
needs no new renderer group or consumer evaluation. Other appendages/details
still follow their normal order. Schema and independent oracle checks cover
this contract; old models retain their previous output.

`hop · single upright` is separate from fast paired travel: 2.2 seconds, once,
with quiet holds, preparatory crouch, paired takeoff at .36, a .24 m rise at .46,
landing at .56 and settling by .70. The torso stays upright instead of adopting
the running lean. Flight is ballistic (about 9.92 m/s² over .44 s), with slight
foot tuck and airborne tail clearance. Feet and tail return to their original
contact patches. Dense rotation-only baking preserves all bone lengths and
keeps interpolated ground-contact drift below 0.01 mm in the sampled sweep.
The shadow remains fixed. Current Kangaroo: 40 joints, 35 plates.

## Regression coverage

`test/creature-pose-followup.test.mjs` checks coherent folded-wing ordering over
a full cycle at sixteen headings and four elevations, actual rigid centroids,
projected bill-cap orientation, buried Rat roots, the single-hop trajectory and
contacts, and sampled upper-arm/forearm/hand visibility across six elevations
and sixteen headings. Deliberately restoring the old Goose hinge ownership or
burying a Kangaroo arm reproduces failure independently of accepted fixtures.

`test/over-core.test.mjs` checks family/model schema acceptance, unknown-mode
rejection, semantic/export metadata, actual rendered groups, inherited seams
and independent detection of a plate or seam demoted behind the body.
The existing Kangaroo length/limit, framing, continuity and directional tests
also include the new hop. Golden parity alone would have preserved the original
bad sorting owners and hidden arm; these geometric and temporal assertions
provide the missing independent checks. They remain sampled evidence, not a
proof of every possible pose or arbitrary custom shape.

Final headless validation: 402/402 tests, 48/48 model/source checks, all ordinary,
motion and paint audits, and aligned release metadata passed. Advisory totals
remain 40/38/40. Only these four rig/package fixture sets changed; the other
44 sets are byte-identical. Actual workbench review covered Goose waddling and
bill orientation at 270/250/180°, Rat creep/scurry, both Tortoise crawl speeds,
and Kangaroo upright/punch rear views plus the new hop and settled return.
Chromium matched 544/544 package/browser outputs for the four changed models;
patch states, onion skins, turntable and independent overlay controls passed,
with zero console errors. The generated workbench includes all source changes.

## Kangaroo elbow correction after user review

The first visibility fix selected the opposite arm IK branch: elbows projected
forward/high, leaving the lower arms hanging nearly vertically. Visibility
coverage alone did not catch this anatomical pose error. Restored the original
arm bind directions (same upper/lower lengths) and the forward-reaching arm
solver branch consistently across clips. Shoulders, hand targets and foreground
layering remain intact. In upright idle the elbows now sit below/behind the
shoulders, with almost horizontal forward forearms; punching raises/extends
from that bend. Ground-supported walk keeps its hand contacts.

The new guard test measures elbow height and forward forearm direction through
idle, upright hop and run, supplementing the existing camera visibility checks.
Focused pose/occlusion tests and the Kangaroo length/limit/contact/framing audit
passed; actual workbench review includes side/oblique resting and strike poses.
Kangaroo export parity passed 161/161 browser/package comparisons, authoring UI
checks passed, and there were zero browser console errors. This correction has
12 passing Kangaroo tests plus the passing pose-follow-up and over-core tests;
it does not claim a rerun of the unrelated full suite.
