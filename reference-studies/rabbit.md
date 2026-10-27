# Rabbit silhouette and gait study

Reference: **RABBIT – Realistic 3D Model (DEMO FREE)** by WildMesh 3D,
[Sketchfab source](https://sketchfab.com/3d-models/rabbit-realistic-3d-model-demo-free-d70284ea0d7644988bdcd327c3ffb59a),
CC BY-NC 4.0, as declared in the supplied GLB metadata.
Local reference: `~/models/cc-by-nc/rabbit_-_realistic_3d_model_demo_free.glb`.
Inspected in a separate Blender scene. Clips: `Rabbit_Idle` (0–220) and
`Rabbit_WalkSlow_F` (0–25), at 24 fps.

The SVG is a manually authored paper-rig approximation. No mesh, texture,
skeleton or motion channels are embedded or retargeted from the GLB.

Observations used:
- Pelvis and rounded haunches sit above the low chest and short forelegs.
- The head merges into a short neck and ends in a small muzzle.
- Ears rise above the crown and sweep slightly backward, rather than spreading flat.
- Folded hind limbs and long hind feet provide the characteristic rabbit silhouette.
- The short upturned tail is a compact accent behind the rump.
- Slow locomotion transfers support between the forelegs and hind legs, with
  modest left/right staggering in the reference. The token simplifies this to
  synchronized fore/hind pairs with overlapping stance, rather than a diagonal trot.

The ordinary `walk` clip uses the `fore-hind` authoring pattern, 60% stance,
0.42 hip-height stride, 0.22 hip-height clearance, one 4% body dip per cycle,
2° head nod and 5° ear sway. These are stylized authoring choices, not extracted
animation data. Idle contacts remain at Z=0. Support intervals follow the baked
foot trajectories; all parent-child lengths remain fixed during locomotion.
Existing attachment, semantic paint and configured strike declarations are preserved.
