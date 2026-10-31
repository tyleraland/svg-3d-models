# Apatosaurus — Quaternius native study

Source: `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Apatosaurus.blend`.
Opened in the connected Blender instance, and rendered/sampled read-only in
background Blender. Forward is native -Y, lateral X, up Z. Side, frontal and
overhead Idle views and five phases of every action were compared. Exact
positions and world bases at 41 phases per action are in `apatosaurus-reference.json`.

The low, nearly horizontal neck leads to a small blunt head. A deep barrel and
short front columns contrast with the much longer multi-segment tail. The Attack
is a body turn and tail sweep, rather than a bite. Run is a faster heavy gait.
The oddly named `Stegosaurus_Death` in this file actually animates the Apatosaurus
skeleton: rising neck, sideward fall, then a terminal side-rest. Jump was studied
but not added as a separate requested locomotion mode.

The independent paper rig uses native-informed rigid segment directions and
joint proportions at .05 m per source unit, with authored capsule/oval plates.
Native meshes/materials stay external. `scripts/lib/quaternius-paper.mjs` is an
author-time coordinate/basis retargeter; no new runtime behavior is introduced.
Only the root translates; limb lengths remain fixed. Native Idle begins with a
slightly raised rear foot, so the paper bind soles are leveled and Idle keeps all
four legs planted while head/tail motion continues. Native floor penetration is
corrected for the paper foot/body envelope, and KO freezes after phase .8.

Five focused regressions cover proportions, all-four supported Idle, upper and
lower leg articulation, run/walk cadence, body-turn/tail-sweep recovery, preserved
lengths, KO settling and the full elevation/heading matrix. Overhead framing
caught a tail-tip overflow and was corrected before delivery. Structural
validation and the 480-view audit pass with no issues or warnings. Existing
50 rig/package fixture sets remain unchanged.

Final Chromium: 121/121 outputs match; authoring UI passes, zero console errors.
All 51 model validations pass. Composed motion/paint audit: 480 views, no issues
or warnings. Full catalog test/audit gates will also run after the six-dinosaur batch.

Final support correction: native rotation curves are retained, while walk and
grounded-attack root height is baked at four subdivisions per reference interval.
This removes brief all-feet hover introduced by retargeting/interpolation. Contact
intervals are declared only where a sole is actually on the support plane at both
ends of the interval; run airtime is unchanged. A 641-phase support test and a
raised-root mutation supplement golden/browser parity. All 28 focused dinosaur
tests pass; final full-catalog results are recorded in the batch checkpoint.

Final corrected batch: `npm run check` passes 450/450 tests, all 56 models,
all three catalog audit modes and release metadata. All-six Chromium passes
726/726 outputs and authoring UI checks with zero console errors. Support
correction commit: `e8ef390`; see `creature-roadmap.md` for the complete checkpoint.
