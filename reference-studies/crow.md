# Crow — R4 reference study for separate model N1

Studied 2026-10-29 in Blender 5.1.2, from
`~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/Crow/SK_Crow.blend`.
This is the actual Crow scene. The separate Raven FBX library is a possible
secondary reference; its actions have not been treated as inspected Crow motion.
No crow SVG model is authored in R4.

The native scene contains armature `SKM_Crow`, mesh `SKM_Crow.001`, 52 bones,
and 24 FPS timing. `scripts/study-wildmesh-birds.py` with tag `crow` reproduces
inventory, 17 samples per inspected action and side/front/top renders. Files
are opened but never saved. Rendered feather cards can look ragged in solid
shading, so use the smooth body, head/bill silhouette and skeleton landmarks
for proportion decisions rather than copying every visible feather edge.

## Action inventory

| Action | Frames | Duration (last minus first, at 24 FPS) |
|---|---|---|
| CSFly | 1–61 | 2.50 s |
| Float | 1–61 | 2.50 s |
| Fly | 1–61 | 2.50 s |
| FlyUp | 1–20 | 0.79 s |
| JFly | 1–23 | 0.92 s |
| JFly2 | 1–61 | 2.50 s |
| JFlyAll | 1–141 | 5.83 s |
| Jump | 1–81 | 3.33 s |
| Look | 1–144 | 5.96 s |
| Look2 | 1–270 | 11.21 s |
| Walk | 1–21 | 0.83 s |
| WalkSpeed | 1–21 | 0.83 s |

Rendered and landmark-sampled **Look, Fly, Walk, WalkSpeed and Jump**. The other
names above are inventory evidence, not a claim that their movement is already
analyzed. Neither an explicit Run nor an explicit Attack is named in this scene.
WalkSpeed has the same frame range as Walk: inspect step amplitude/root motion
before deciding how much to accelerate the SVG fast gait. Jump includes body/
head motion and a wing assist; do not assume it is a clean paired-foot hop loop.

## Separate Crow silhouette

Compared with the Eagle study, author a slimmer, more horizontal body, narrower
shoulders/secondary chord, proportionally longer tail, smaller round head with a
longer straighter pointed bill and a restrained tip curve. Avoid the Eagle's
short heavy hook and broad breast. Keep a distinct neck/chest transition and
thin articulated legs, forward toes and rear hallux. The native standing neck
and bill project forward while the tail balances behind the body; folded wings
sit along the sides rather than extending like flight panels.

Use ratios normalized to body length, not the native scene's absolute scale.
In the sampled Walk, the head is approximately 0.89 native units ahead of the
pelvis; the bill hinge extends another 0.21. The neck-to-head span is about 0.25.
These landmark offsets describe the skeleton, not the feather-surface envelope.
The standing/locomotion wings remain folded while feet alternate; Fly articulates
both wings together with distal folding. Look/Look2 provide a better starting
point for alert idle head turns than simply reusing an Eagle hover.

## N1 implementation handoff

1. Keep `flyingBird` as Eagle. Add a new thin `crow` model with its own named
   proportions and recognizable bill/tail; reuse the avian hierarchy, contacts,
   feather-panel structure and author-time gait tools where compatible.
2. Fit shape first against side/front/top reference views and normalized
   landmark ratios. Recheck wing fold after changing span/chord.
3. Bake grounded idle and alternating walk, a reference-informed faster ground
   gait, flight and glide. Inspect Jump before choosing a distinct hop variant.
4. Author a sharp neck-pivot peck as an adaptation; the inspected Crow action
   inventory has no dedicated attack. If a Raven attack is used, inspect that
   reference in Blender and document it separately.
5. Reuse all-angle/head-seam/grounding/loop/length/Euler-continuity tests and
   browser parity. Review top and oblique wing/leg/body overlap explicitly.
6. Commit the completed Crow before proceeding to Deer (N2).
