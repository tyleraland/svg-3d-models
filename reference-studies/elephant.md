# Elephant shape and motion study

Reference: AfricanElephant in the supplied WildMesh3D paid-standard-license
collection (see wildmesh-inventory.json), inspected in its separate Blender
reference scene. Sampled nine phases each from Walk-IP (frames 1–111), Run-IP
(1–61), Idle (1–401), Attack_Head_01-IP (1–67), and
Attack_LegsFront_01-IP (1–101). Studied side renders of walk and head attack.

The reference has a deep barrel, raised shoulder/head, broad folded fan ears,
nearly column-shaped legs, a long hanging trunk with a small curled tip,
forward/downward tusks that curl upward at the ends, and a thin hanging tail.
Sampled pelvis height spans 2.824–2.904 in walk versus 2.739–2.865 in run;
fore ankle height spans .572–.692 versus .555–.885 in native world units.
These observations guide relative motion, not an exact scale or retargeting.

The SVG uses independently authored geometry and rotations. Rigid fan polygons
have six points each, all parented to one ear control. Four tapered trunk spans
plus the curled end replace the short forward-pointing snout. Each tusk has a
separate downward segment and an upward tip. The barrel, shoulders and legs
are enlarged; all four feet remain on z=0 at rest.

- Idle: 3200 ms, trunk curl, gentle ear opening and tail sway; fixed feet.
- Walk: 2200 ms, lateral-sequence four beats, 76% stance, low foot clearance,
  small body dip and head nod, ear/tail motion and delayed trunk swing.
- Run: 1250 ms faster grounded four-beat gait, 60% stance, longer strides and
  more lift; at least two contact feet throughout, without a gallop suspension.
- Attack: 1400 ms braced head/tusk thrust, trunk curled up and out of the way,
  ears open, follow-through and recovery; four fixed contact feet.

All motion is baked into ordinary paper-rig clips. Grounded lateral-sequence
clips use 160 intervals to keep interpolation contact error below .1 mm at this
scale. Tests sample between keys for contacts, bone lengths, trunk clearance,
loop seams, rigid ear shape and support coverage. Occlusion checks cover top,
side and oblique cameras, eight headings, and idle/walk/run/attack phases.

The export uses a centered ground origin and conservative token scale so the
trunk reach, rear body and ears remain inside the 100×100 frame when heading
changes. The camera regression matrix also asserts projected joint containment.

## Head stacking follow-up

The first refinement still put tusks in the always-front accessory layer and
sorted ears by their mounting joint rather than their polygon. Some trunk spans
also inherited the generic limb classification. Compiler/browser equality and
the limb-versus-body oracle both reproduced those mistakes, so neither was a
sufficient test of head anatomy.

Physical head descendants now share the core surface painter stack. Polygon
vertices and span endpoints determine mean camera depth. True depth takes
precedence over authored depth bias; bias only breaks coincident depth ties.
Coincident connector gaskets sit behind surfaces, and a lone tapered endpoint
does not generate an oversized circular cap. Elephant trunk spans explicitly
declare the head region.

The independent head oracle inspects projected overlap and posed depth intervals,
including gaskets, line polygons and quadratic tapered paths. Separated depth
intervals have a definite far-to-near order. Crossing intervals are reported as
ambiguous for visual review, and unsupported paths are reported as unverified;
this is not a claim of per-pixel depth-buffer correctness. Tests deliberately
move ears, tusks, trunk spans and gaskets into the old frontmost layer and require
failure. The catalog sweep includes diagonal headings and inter-key poses of
every clip. Normal rig audits include the head-depth diagnostic.

Generate a focused visual matrix for any model with a head:

```
node scripts/head-occlusion-sheet.mjs elephant /tmp/elephant-heads.html
```

This covers six elevations and sixteen headings for every available idle,
walk, run and attack variant, with overlap/ambiguity/unverified counts per cell.

The follow-up camera cases also exposed internal connectors that are not exterior
anatomy. `trunkConnectorPlate` is now explicitly under-core; the renderer honors
that declaration even for head-region plates and their generated gaskets. Limb
root gaskets attached directly to body joints default to under-core symmetrically,
while an explicit authored occlusion mode can retain an exposed mount. The oracle
checks this internal-seam layer contract independently of center depth. Exact
45°/180°, side/90°, 45°/45°, 45°/90°, and front/180° cases and mutated frontmost
connector layers are regression tests. The compiled package records the same
fixed group and excludes buried seams from the opaque-core union.
