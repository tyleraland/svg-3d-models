# Horse silhouette and gait study

Reference: **HORSE – Realistic 3D Model (DEMO FREE)** by WildMesh 3D,
[Sketchfab source](https://sketchfab.com/3d-models/horse-realistic-3d-model-demo-free-65d6a70a6721495f938c93e80a5998e4),
CC BY-NC 4.0, as declared in the supplied GLB asset metadata.
Local reference: `~/models/cc-by-nc/horse_-_realistic_3d_model_demo_free.glb`.
Inspected in a separate Blender scene; the file's clips are `Horse_Idle` and
`Horse_Walk` (walk frames 0–35 at 24 fps).

The SVG is a manually authored paper-rig approximation. No mesh, texture,
skeleton, or animation channels are embedded or retargeted from the reference.
The source remains external to this repository.

Observations used:
- Body length dominates the silhouette, with rounded shoulder and haunch masses.
- The neck rises from the chest rather than forming a long upright stalk.
- The small poll and long, downward-sloping face distinguish the horse head.
- Upright ears, a crest/mane, and a hanging tail reinforce its identity.
- The foreleg has an upper arm, forearm and carpal/distal section; the rear
  stifle and hock articulate oppositely.
- Body height and head angle vary subtly during the support exchange.

The token retains a simplified diagonal gait. Model parameters choose a 1.1 s
cycle, 55% stance, 0.48 hip-height stride, 0.17 hip-height swing clearance,
2.5% body-height dip, 3° head nod and 5° tail sway. These are authored stylized
values, not extracted motion data. All are baked to ordinary rotation/pose
keyframes. Idle feet and stance contacts remain on Z=0; the shadow stays fixed
on the ground while the body moves. The whole-body dip uses root translation,
with leg IK compensating it, preserving all parent-child bone lengths.

## Gallop clip

A separate `gallop` now uses a manually authored left-lead four-beat sequence:
trailing hind at 0, leading hind at .12, trailing fore at .32 and leading fore
at .44. Each stance lasts .22 cycles. All four feet are airborne after .66;
the body rises through the suspension apex at .83. The loop lasts 700 ms.
The plan also authors body pitch, head/neck motion, tail carriage and hoof curl
on recovery. IK bakes the trajectory to ordinary joint-local keyframes while
preserving bone lengths, joint limits and grounded stance contacts.

The paid inventory confirms that `G3_Gallop` exists, but the attempted Blender
sample of that action was blocked by an automatic-review usage limit. This
clip is a stylized authored interpretation, not sampled/retargeted motion from
that action. The source GLB observations above still apply to the silhouette.

Contact starts/ends and suspension events are included as exact bake samples;
dense intermediate samples keep stance error below 0.1 mm in regression tests.
Default package contact sheets/audits include gallop support and suspension
poses, and browser parity explicitly renders the new clip. The workbench uses
cached clip-wide framing so the denser bake does not refit every playback frame.
