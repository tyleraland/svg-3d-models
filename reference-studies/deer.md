# Antlerless Deer — WildMesh study and SVG model

N2, studied and authored 2026-10-29. The selectable model is `deer`, labeled
**Deer · antlerless doe**. This is separate from Horse and has no antlers,
horn mounts or mane. The requested attack is a bite.

## Blender reference inspection

Primary native scene:
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/FemaleDeer/SK_FemaleDeer.blend`.
Opened read-only in Blender 5.1.2 with armature `SK-Deer_Female` and mesh
`SK-Deer_Female.001`: 47 bones, 43 actions, 24 FPS. The scene itself is antlerless.
No reference file was saved, and no mesh/animation data is embedded in the SVG.

`scripts/study-wildmesh-deer.py` reproduces the inventory, 21 normalized
landmark/bounds samples per selected action and side/front/top diagnostic renders:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python scripts/study-wildmesh-deer.py -- /absolute/SK_FemaleDeer.blend FemaleDeer
```

Outputs are `/tmp/deer-FemaleDeer-*`. Native fur cards look blocky in
solid Workbench shading; use the body envelope, underlying skeleton and posed
silhouette rather than copying individual fur-card edges.

| Inspected primary action | Frames | Duration at 24 FPS | Use |
|---|---|---|---|
| Idle_Breathing_01 | 1–161 | 6.67 s | Standing proportion/weight and quiet breathing |
| Walk | 1–31 | 1.25 s | Alternating whole-leg motion and light foot clearance |
| Run | 1–13 | 0.50 s | Fast leg gathering/extension and suspension |
| Idle_Eating_01 | 1–321 | 13.33 s | Head/neck lowering and jaw hierarchy for bite adaptation |

The library also has trot, sprint, sneak, turning, hit/death, sitting/lying and
transitions. No named bite/attack exists in this primary action inventory.
The SVG bite is explicitly authored, not a claim of native combat retargeting.

Secondary inventories were opened in Blender:

- `Realistic Animals/Doe/SK_Doe.blend`: 36 bones, 58 actions, 30 FPS; standing,
  walk/run/trot/sprint and transitions. Its inventory includes a Wolf-named food
  action, which was not treated as a Deer bite reference.
- `Realistic Animals/Deer/SK_Deer.blend`: 119 bones, 113 actions, 24 FPS; separate
  `Deer_Antler` meshes identify it as an antlered alternative. Inspected for
  library selection only; its antlers were not reused.

Primary idle world-space measurements (native forward is approximately -Y):
mesh bounds about 2.38 m long, 0.69 m wide including fur and 1.77 m high. Pelvis
height is 1.12 m, chest 1.15 m, head 1.50 m, and left ear base 1.61 m. The
pelvis-to-chest forward span is 0.677 m; the front upper-leg attachment lies
another 0.36 m forward of that chest control, so that span alone does not define
the visible barrel length. Fore ankle is about 0.129 m above the hoof surface;
rear ankle about 0.132 m. These guided ratios and joint placement rather than
literal one-to-one skeleton copying.

## Shape and authoring structure

`scripts/refine-deer.mjs` reuses the established Horse family hierarchy and
quadruped author-time grounding/IK tools, then writes an independent Deer family
and thin own-base model. Horse source/output is unchanged. Consumers receive
ordinary declared geometry and clips; no runtime solver or Deer-specific
renderer branch was added.

- 1.76 m declared height, 1.10 m hip height, near-level back, long slender limbs,
  forward stifles, backward hocks and small hooves.
- A lighter 0.48 m barrel, rounded haunches and chest. Two rigid body helpers put
  the barrel 0.10 m below the hip/chest controls, preserving body depth without
  making the legs or torso excessively wide.
- A narrower rising neck, 0.21 × 0.24 m head and tapered narrow muzzle. A separate
  jaw hinge/tip supports the bite, with an explicitly buried 0.035 m seam gasket.
- Large six-point leaf ears on rigid local helpers, canted so the leaf reads from
  side and front views. A slim structural spine preserves edge-on ear presence.
- Short 0.16 m tail; no Horse mane or saddle anchor, and no antler/horn geometry.
- Token framing is scale 25 with ground origin [50,63], tested against the long
  muzzle at overhead diagonal headings as well as elevated attack views.

## Authored clips

| Clip | Duration | Behavior |
|---|---|---|
| idle | 4,000 ms | Four planted hooves, quiet breathing, gentle independent ear motion |
| walk | 1,250 ms | Four staggered footfalls, shoulder/hip and knee/hock articulation |
| run | 540 ms | Light left-lead gallop with four support beats and suspension |
| attack | 1,150 ms | Four-hoof brace, preload, neck reach, jaw opening, fast bite and recovery |

Walk uses a lateral sequence and 0.65 duty factor. Run reuses the existing
four-beat ungulate baker with a lighter stride/body pitch and a suspension arc.
This is an in-place adaptation of the native motion, not a frame-for-frame copy
of its translated gait. Idle and bite use baked sagittal IK to keep hooves fixed.
The jaw opens to 26° and closes to 2° over the 92 ms interval before impact at
phase .56, then closes fully and returns to the starting pose. Events explicitly
belong to anticipation/action/contact/recovery/settle phases. The root-only
translations and joint-local rotations preserve bone lengths.

## Regression and review

Seven Deer tests cover antlerless anatomy, native-informed proportions, leaf-ear
area in front/profile views, four fixed idle contacts through 1,201 interpolated
samples, staggered walk/faster run/suspension, whole-leg participation, limits,
lengths, loop seams, bite timing/reach/brace/recovery and jaw-seam mutation.
Ground contact/clearance is checked to 0.1 mm for moving clips; idle must remain
fixed within numerical tolerance. This bounds baked interpolation error as well as key poses.

The directional regression covers four clips × eleven critical phases × six
elevations × sixteen headings = **4,224 views**, using the independent occlusion
oracle and framing checks. The 480-view audit is clean. Direct workbench review
includes side/oblique/overhead/front shape, walk/run, the open jaw and bite impact.
Final catalog/browser gate results and the implementation commit are recorded in
the durable creature roadmap.

Final gates passed: seven focused tests; all 243 headless tests; all 35 models
and source validation; ordinary/motion/paint audits and release checks. Deer
contributes zero audit issues/warnings. Browser parity passed 121/121 outputs
and authoring UI checks with zero console errors. Existing catalog warnings
remain 40 ordinary, 38 motion and 40 paint. Final workbench is left on Deer idle
at 45° elevation / 270° heading.
