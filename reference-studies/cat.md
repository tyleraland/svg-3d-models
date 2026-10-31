# Domestic Cat — 2026-10-31

Read-only Blender study of Cat/SK_Cat.blend: 174 bones, 12 actions. The inventory
and nine samples each of Idle, Walk, Run and Dash are in `cat-reference.json`.
The native idle has a long slim torso, relatively long straight forelimbs,
pointed upright ears, short muzzle and low tail. Run extends the tail behind,
lowers the head and folds the hind limbs forward under a flexing spine.

The separate domestic cat scales the reusable feline structure, then changes
head/muzzle ratios, pointed two-plane ears, shoulders and the tail's low profile.
Two ear panels preserve width from front/top views; both use the same rigid
head-local frame. Connectors remain buried; rear upper limbs stay under-core.
Existing leopard/lion remain independently selectable and unchanged.

Idle fixes four paws. Walk uses measured four-beat support; run uses a quicker
spine-flexing gallop and lifted traveling tail. No native combat action is
present. The authored attack is a quick supported claw swat with shoulder/elbow
motion, extension/retraction of claws, descending rake and full recovery.

Source/compiled validation, dense support/rigidity/seam checks, 1,120 directional
samples and the 480-view audit pass with zero issues/warnings. Browser review
includes every core action and model-specific tests guard pointed ears, small
muzzle/head, lifted running tail and three-paw support during the swat.

Final batch gate: 485 tests, all 65 catalog validations, three catalog audits
and all 1,109 package/browser comparisons passed; zero browser console errors.
