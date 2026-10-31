# Crocodile — 2026-10-31

Read-only Blender 5.1.2 inspection of Crocodile_Stylized/SK_Crocodile_Stylized.blend.
`crocodile-reference.json` records 12 actions, 41 bones, 60 FPS and sampled
Idle, Running_Running, Bite_Bite and TailWhip_TailWhip transforms/bounds.
Run `scripts/study-wildmesh-expansion.py -- crocodile` with Blender to reproduce.

The separate crocodilian has a low broad armored trunk, short wide-set legs,
a long flattened broad muzzle, eye ridges, dorsal scutes, and a muscular
three-link tapering tail. Both vertical and horizontal snout/jaw panels retain
width when viewed edge-on; roots are buried under the opaque head/body.

Idle keeps four feet fixed. Crawl uses a supported four-beat gait; run is a
faster supported high walk (no mammalian bounding). Native Bite informs wide
jaw opening, a small snout lift and abrupt closure/recovery. TailWhip remains
a recorded option, not an exposed animation in this milestone. No mesh or
texture is copied into the SVG runtime. Shared IK executes only at author time.

Checks: 22 structural checks, 480-view audit with zero issues or warnings,
dense core-action contact/length/seam checks and 1,120 directional samples.
Scutes explicitly declare accessory regions; the earless rig emits no missing
ear animation channels. Model-specific tests protect broad jaws, long tail,
jaw opening and sustained high-walk support. Review sheet includes top/profile
and opposite oblique cameras for every core action.

Browser parity: 121/121 outputs and authoring UI checks pass, zero console errors.
