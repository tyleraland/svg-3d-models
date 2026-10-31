# Beaver — 2026-10-31

Blender 5.1.2 read-only study of Beaver/SK_Beaver.blend: 24 FPS, 111 bones,
20 actions. `beaver-reference.json` stores the inventory and nine samples each
of Idle, Walk_F_IP, Run_F_IP and Attack, including posed joint positions/bounds.
Use the shared `study-wildmesh-expansion.py -- beaver` scanner to reproduce.

Reference proportions: rounded high rump, deep pear-shaped continuous trunk,
small blunt head/round ears, short forelimbs and large hind feet. The top view
shows the broad paddle tail, while the profile shows its very shallow thickness.
The SVG uses a rigid XY paddle and thin XZ edge, rather than a camera-facing oval.
Internal distal tail plates were removed to avoid lines drawn atop the paddle.
Small incisor panels and hind webs provide restrained identity detail.

Idle fixes four paws. Walk uses supported four-beat steps; the quick run has
staggered footfalls, hind recovery and brief suspension informed by Run_F_IP.
The braced bite follows Attack's head lift and jaw opening/closure, with short
preload and full recovery. IK is baked at author time; all clips retain lengths.

Validation: source pair and 22 compiled checks pass; 480-view audit has zero
issues/warnings; dense support/length tests and 1,120 directional samples pass.
Browser parity for the full new batch will be checked after all nine are built.
