# Bighorn Ram — 2026-10-31

Inspected Bighorn_Stylized/SK_Bighorn_Stylized.blend read-only in Blender 5.1.2.
The structured study records FPS, 35 bones, 10 native actions and nine samples
of Idle, Walk, Run and HeadButt. Reproduce using `study-wildmesh-expansion.py`.

The ram builds on the ungulate authoring structure while keeping its own source:
deeper/stronger barrel and neck, compact hooved stance, short tail, shorter ears
and two heavy curling horns. Each horn is an open curved ribbon with a second
perpendicular ribbon through the same head-local centerline. This preserves
thickness in top/front views and allows camera-dependent near/far ordering.
It has no arbitrary camera-facing horn plate and does not alter Mountain Goat.

The reference HeadButt visibly folds the neck/forehead down during the strike.
Our simpler braced version preloads backward, tucks two neck joints and the
head, drives forward suddenly, recoils and returns to the exact start pose.
Idle fixes four hooves. Walk is four-beat; run is a short gallop with articulated
upper/lower limbs and opposing hock flexion. The authoring reach solver rejected
a larger gallop arc; the final bounded stride respects actual limb lengths.

Checks: source schema/pair, compiled structure, contacts, rigid spans/loop seams,
1,120 directional samples and 480-view audit pass with zero audit issues/warnings.
Browser review confirms visible horn thickness from top and both oblique directions.
Full new-batch browser parity remains the batch-end gate.
