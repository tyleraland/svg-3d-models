# Creature feedback follow-up — 2026-10-30

User review of Kangaroo, Rat, Goose, Tortoise and Ostrich supplied specific
connector, camera-order, foot-detail and locomotion issues. This follow-up
updates existing declarative sources and their reproducible authoring scripts.
There are no shared renderer/compositor changes. The previous milestone studies
are historical evidence; the current behavior below supersedes their affected
shape/motion descriptions.

## Kangaroo

- Muzzle connector now paints under the opaque skull. Its head/muzzle gaskets
  inherit the buried connector policy instead of mixing an incident-plate
  ordering contract with an under-core plate. Actual projected triangle-base
  coverage is checked through clips, elevations and headings; promoting it above
  the skull fails independently of fixtures. The head-seam mutation also checks
  its actual position above/below the skull.
- Ear spines share their leaf's attachment frame and stay behind both leaves.
  Rigid ear tips are geometry helpers, without stray endpoint caps. Leaf-over-
  spine rank is checked at every tested heading, including 135° and 315°.
- Tail root is buried within the pelvis. During the paired hop, the two long
  tail segments now extend nearly horizontally behind the hips, with small
  delayed angle changes. This is a rotation-only counterbalance; ground-support
  IK for pentapedal walk and tail-braced kick stays intact. Merely lifting the
  old tail target initially left an unnatural V-shaped tail, so the airborne
  segments were straightened explicitly. Tail contact height stays within .10 m
  of the pelvis in the hop. Side browser review confirms a level, extended tail.

## Rat

- Scurry cycle is 440 ms (previously 1000 ms). Fast run is 230 ms (previously
  380 ms), using alternating diagonal feet, low recovery and at least two
  contacts at every phase. This is the user's requested supported interpretation,
  replacing the exaggerated body bound; it does not claim rats cannot use
  bounding gaits. Upper/lower/distal limb articulation remains.
- Spine rise reduced from .012 m to .004 m; the back plate's vertical size is
  .075 m instead of .09 m. Chest/head positions and grounded limb proportions
  are retained. The upper back now follows the rump envelope instead of forming
  a separate elevated mass, including at heading 270°. Small root dip and head
  motion keep the run low and steady. Workbench labels say “rapid steps”.

## Goose

Extended the existing native study with TakeOff_RunUp and FlyFlapping, 41
phases each, in the preserved Blender Goose scene. Native FlyFlapping carries
the head about .407 m ahead of the chest at nearly chest height, synchronizes
both wings and changes elbow/wrist angles through recovery. At quarter phase
the left wrist is .185 m below the chest; at three-quarter it is .250 m above.
TakeOff_RunUp provides a lower-neck running posture and wing assist. The paper
cadence and simplified wing surfaces are authored adaptations of those poses.

- Removed the broad beak-web overlay and triangular upper-bill span. A single
  rounded upper-bill span, with a small consistent tip and buried root, replaces
  their overlapping shapes. Jaw motion remains for the snapping bite.
- Replaced the two minimum-width sole strips per foot with a true polygon
  profile only .006 m thick. It is contained within the web's footprint. Web
  tops are .006 m above true Z=0 sole contacts; the old span width floor can no
  longer create a ribbon protruding behind the foot.
- Run now unfolds both articulated wings. Flight is a separate 1.25 s powered
  wingbeat with shoulder/elbow/wrist motion, delayed distal recovery, a long
  forward neck, trailing webbed feet, positive clearance and no contacts.
  Folded states use a compact chain and rounded coverts. KO preserves that
  folded shape too. No joint scaling or child translations are used.
- The fan base is narrower and embedded deeper in the rump; the tail tip's
  world bind position is retained. Both tail fan and socket are buried. The
  rump is an actual opaque core plate, so it can cover those internal joins.
  An under-core rump cannot reliably serve as their covering surface.
- Fixed scale reduced to 52 units/m with ground origin [50,60] so the spread
  wings fit the same exported 100×100 box across orientations. Current model:
  91 joints / 34 plates. Native mesh/action data never enters the runtime.

## Tortoise

- The exposed neck segment now paints below every shell facet, including the
  reported 45° / 225° view. It still emerges beyond the shell silhouette.
- Three separate claw plates and two sole-edge strips per foot are replaced
  by one ten-point foot/toe outline. This retains a three-toed silhouette while
  reducing the model from 202 to 178 joints and 96 to 76 plates. The tiny contact
  seams retain their previous size. Shell geometry, leg articulation and all
  supported animation/contact trajectories remain unchanged.

## Ostrich

- Each foot now uses one flat eight-point two-toed sole polygon, replacing
  overlapping main/small toe capsules. It remains attached to the actual sole
  joint and turns as a rigid plane during the kick. Both feet have the same
  mirrored structure and cannot change internal toe stacking while walking.
- Tail base moved inward; the distal tip retains its original world bind
  position. Fan/socket both stay behind the opaque rump, and actual triangle
  base corners are covered across views. The rump now participates in the
  opaque core rather than sitting under it.
- Thigh and calf roots stay behind the opaque body at every view. This fixes
  the far calf at 75° / 270° and the near calf at heading 45° without freezing
  their animation. Exposed portions below/outside the body remain visible.
  Current model: 49 joints / 29 plates.

## Verification and review

Updated the affected focused tests to assert the new intended geometry and
motion contracts. Added `test/creature-feedback.test.mjs` with independent
projected coverage/order checks, mutations, support/cadence constraints and
Goose flight/wing/clearance assertions. Existing dense directional, geometry,
length, limit, contact, framing and shell surface-depth checks remain active.
All 43 unrelated resolved-model goldens remain byte-identical.

Actual workbench review covers Kangaroo ear/muzzle joins and straight hopping
counterbalance, Rat side scurry/rapid run and lower back, Tortoise 45° / 225°,
Ostrich 75° / 270° and 45° / 135° walking feet, and Goose folded/run/fly wings,
bill, foot profile and tail. Temporary preview proofs include
`/tmp/kangaroo-feedback.png`, `/tmp/ostrich-feedback.png`,
`/tmp/tortoise-feedback.png` and `/tmp/goose-feedback-flight.png`.

Final catalog/browser gate results and commits are recorded in the roadmap
checkpoint once verification finishes.

Final results: `npm run check` passed 393/393 tests, 48/48 source/model
validations, all ordinary/motion/paint audits and release metadata. Advisory
totals are unchanged at 40/38/40. Focused five-model Chromium gate matched
645/645 outputs, passed patch/onion/turntable/independent-overlay UI checks,
and logged zero console errors. The workbench is left on Goose flight,
45° / 135°, paused near the start of the power stroke. No push was performed.
