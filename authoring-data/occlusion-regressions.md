# Buried appendage regression: rabbit pastern

The rabbit's new `Pastern` segment was omitted from the model's regex for
`under-core` limb geometry. The generic renderer used bilateral left/right
preference before testing depth against the owning torso. From above it selected
one leg as camera-near even though both legs were below the torso.

The source rule now includes Pastern. The generic classifier also checks posed
depth relative to the nearest body/head/neck ancestor before using bilateral
preference, for both plates and joint gaskets. For a rigid span, a behind-owner
endpoint puts the whole span in the far group. This is a conservative painter
ordering policy, not a polygon-splitting hidden-surface solver. Side-view
left/right reversal is still tested where bilateral separation is visible.

## Why the previous checks passed

- Structural validation checked IDs, rigid lengths, contacts and group presence.
- Golden files locked the output we had captured; recapturing an incorrect image
  made it the new expected output.
- Browser parity checked that two callers of the same compiler agreed.
- The default audit matrix sampled elevations 45/60/75; it omitted both true
  overhead and side-on views.
- There was no independent depth/overlap test of the resulting painter order.

## New evidence and gates

Default audits/manifests now sample 0/45/60/75/90 degrees at all eight headings
(400 views for the standard ten poses). Every view carries `occlusion` evidence.
`audit.buried-appendage-order` fails if an appendage or gasket is painted after
an overlapping, closer core plate attached to its owner, despite being behind
that owner's plane. The validator uses emitted vector geometry and posed joint
depths; it does not call the renderer's classification function.

The independent geometry predicate supports ellipses, circles and rounded
rectangles, including their single rotation transforms. It samples interior
span points and uses a 2 mm depth tolerance. Custom paths, polygons and unsupported
transforms are listed in `unsupportedCoreElementIds` and
`unsupportedAppendageElementIds`; they are not silently certified.

`test/occlusion.test.mjs` runs canonical audits for all 31 models, additional
interpolated times in every clip at side/oblique/top cameras, and configured
attachment/motion/paint scenes. Mutation tests move a genuinely buried plate or
gasket into the front group and require the oracle to reject both. The rabbit
also remains covered with its specimen-specific under-core overrides removed.

This catches a concrete class of depth/painter contradictions. It does not prove
that all silhouettes, arbitrary custom paths, partial interpenetrations or
artistic choices are correct. Contact-sheet review and intentionally approved
visual baselines remain useful, especially for unsupported geometry and detail
that should be visible but has been hidden. Goldens are updated only after these
independent invariants pass; parity alone is not an approval criterion.
