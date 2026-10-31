# T. rex — Quaternius native study

Opened `~/models/quaternius/Dinosaur Animated Pack - Dec 2018/Blends/Trex.blend`
in Blender. Native `TRex_*` actions (Idle/Walk/Run/Attack/Jump/Death) were sampled
at 41 phases with side renders plus frontal/overhead Idle. Forward -Y maps to
paper +X. `trex-reference.json` records world positions/bases and exact timings.

A heavy large skull and short strong neck lead a sloping barrel. Tiny forearms
contrast with the large bent hind legs and long balancing tail. Run uses long
bipedal strides; Attack crouches/lunges and lowers the open mouth. Death collapses
to its side. The mesh has no shape keys and the skeleton has no separate jaw
bone; native head/neck skin articulation implies the opening in the mesh.

The separate 94-joint / 31-plate paper rig uses .075 m per native unit, a deep
skull, an authored hinged lower jaw, two simplified tooth ribbons per jaw, and
two fingers per hand. Teeth are simplified expression detail rather than many
individual micro-plates. The native neck/head/body motion is retargeted, while
the paper jaw adds an explicit 36-degree opening and fast closure at .56 impact.
This jaw curve is an authored adaptation, not an extracted native jaw track.

Idle plants both hind soles; walk/run move entire limbs, with fixed lengths and
no runtime rig additions. The terminal KO holds. Native meshes remain external.
Twelve cumulative dinosaur tests pass, including world leg articulation and a
specific open-then-snap bite check. Final composed audit: 480 views, zero issues
or warnings. Closed and open bite profiles were inspected in the workbench
against the native Blender phase renders. Full catalog gates run at batch end.

Chromium: 121/121 outputs match; authoring UI passes, zero console errors.
