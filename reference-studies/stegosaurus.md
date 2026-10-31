# Stegosaurus — Quaternius native study

Opened `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Stegosaurus.blend`
in Blender. Read-only background study sampled six actions at 41 phases and
rendered side/action phases and front/top Idle views. This source's render format
was JPEG, so its temporary renders use `.jpg`. Forward -Y maps to paper +X.
Exact positions/bases/timing are preserved in `stegosaurus-reference.json`.

A deep arched barrel slopes to a very small low head; the front legs are shorter
than the strong hind legs. Staggered dorsal plates crest above the back, tapering
at either end. Four long tail spikes sit at the tip. Attack visibly turns the
whole body and swings the tail. Walk and Run articulate the entire leg chains;
local upper-leg angles alone understate motion driven by their parent hips.
Death rises and falls onto its side. Jump was inspected but is not exposed yet.

The independent paper rig has 160 joints (mostly solid-vertex/centroid helpers)
and 71 plates at .09 m per native unit. Eight simplified dorsal keels are closed
four-face tetrahedra; four tail spikes are four-sided needles. Actual lateral
thickness prevents their identity from disappearing in overhead/head-on views.
All solid faces use real triangle centroids and camera-relative surface ordering.
The idle soles are leveled, lengths remain rigid, the shadow stays on the ground,
and the terminal KO holds after phase .8. Native meshes are never runtime assets.

The shared dinosaur matrix includes independent anatomy, world-leg articulation,
ground clearance, loop/KO/length checks, head/connector ordering and camera
framing; the Stegosaurus identity test verifies real dorsal thickness and four
faceted tail spikes. Eight dinosaur tests pass at this checkpoint. The composed
480-view audit has no issues or warnings. Full catalog gates run at batch end.

Chromium: 121/121 outputs match; authoring UI passes, zero console errors.
Oblique paper silhouette inspected against the native side/top Blender renders.

Batch correction during Triceratops review: KO floor correction now includes
all polygon vertices, not only centers/spans; related fixtures were recaptured.
The shared 321-phase polygon clearance test passes, including a mutation check.
