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

## N1 — separate Crow implementation (2026-10-29)

The selectable `crow` model now exists alongside `flyingBird` (Eagle). It has a
thin model declaration over its own authored Crow family. `scripts/refine-crow.mjs`
reuses the Eagle's joint/panel structure at author time, fits Crow proportions,
and emits ordinary clips through `scripts/lib/avian-motion.mjs`. The same pure
baker now supplies the Eagle authoring script; its default output and all Eagle
resolved data remain golden-identical. No native mesh/animation data is shipped.

The separate family keeps species geometry explicit without adding runtime
variant rules or teaching the renderer how to animate birds. Both models retain
the same stable wing/leg/neck controls, enabling later avian authoring reuse.

### Shape and proportions

- 0.55 m declared height, slimmer 0.185 m body plate, smaller 0.12 × 0.128 m head,
  thinner neck, and a less upright resting torso than Eagle.
- Long 0.12 m nearly straight pointed bill; only a 2 mm tip drop. The small bill
  gasket remains explicitly buried beneath its incident plates.
- A long narrow 0.315 m tail fan balances the forward head/bill. A slim quill
  plate retains tail thickness in edge-on side views.
- Narrower secondary chord and swept/slotted primaries, slimmer legs and smaller
  talons, retaining three forward toes and a rear hallux.
- The shared paper palette/style is preserved; this pass distinguishes species
  through anatomy rather than introducing species-specific black coloring.

### Motion and interpretation of reference evidence

The existing 17-sample Blender study was rechecked numerically for N1. Walk and
WalkSpeed have identical sampled foot trajectories relative to the pelvis:
left-foot forward-axis excursion is approximately 0.270 native units and
vertical excursion 0.191. Their matching frame ranges do not establish a second
faster native gait. The SVG run is therefore explicitly an authored acceleration.

Fly contains two up/down cycles over its 60-frame, 2.50-second interval: sampled
wing-wrist heights relative to the pelvis alternate low/high/low/high/low at
normalized phases 0/.25/.5/.75/1. The SVG uses one 1,250 ms cycle, with a phase
shift to begin on raised wings. Its distal wing folds after the shoulder starts
recovery. Jump includes wing participation; the SVG's paired hop is a compact
loop adaptation, not a literal retarget of the entire 3.33-second action.

| SVG clip | Duration | Authored behavior |
|---|---|---|
| idle | 3,600 ms | Paired planted feet, quiet breathing and a wider alert head scan |
| walk | 840 ms | Alternating whole-leg steps, weight transfer, folded wings |
| run | 520 ms | Faster/larger alternating steps with brief support gaps |
| hop | 760 ms | Paired crouch, takeoff, partial wing opening, landing and fold |
| fly | 1,250 ms | Symmetric articulated wingbeat, delayed distal fold, tucked feet |
| glide | 2,500 ms | Spread wings with small trim motions |
| attack | 1,250 ms | Airborne peck; 75 ms neck-pivot jab over uninterrupted wingbeat |

No dedicated attack was named in the native Crow scene, so peck remains an
explicit adaptation. Eagle's talon strike is not copied into Crow's menu.
Hit/KO keep ordinary inherited/grounded-start behavior consistent with the
standing idle. Runtime consumers receive local rotations/root translations;
contact-aware IK and continuous Euler branch selection happen only at authoring.

### Regression coverage and review

Seven focused Crow tests cover distinctive ratios, Eagle-output preservation,
whole-leg participation, support schedules, 1,201 interpolated samples per ground
clip, foot clearance/plants, loop closure, continuous hip angles, wing-assisted
hop, symmetric flight, quick angular peck and unchanged wingbeat/root motion.
The shared baker is tested for input immutability, deterministic output and exact
Eagle default parity.

Directional checks cover seven clips × eleven critical phases × six elevations
× sixteen headings = **7,392 views**, with the independent occlusion oracle and
framing checks. A bill-seam mutation must fail that oracle. The 720-view audit
has zero issues/warnings. Direct workbench review includes oblique idle, side
run, assisted hop, overhead wing/tail proportions and the airborne peck. Final
catalog/browser gate results and implementation commit are in the roadmap.

Final gates: seven focused tests passed; full `npm run check` passed all 233
tests, all 34 models, source validation, ordinary/motion/paint audits and release
checks. Crow's 720-view audit has zero issues/warnings. Browser parity passed
181/181 package/render outputs, plus patch, onion-skin, turntable and independent
overlay checks, with zero console errors. The workbench is left on Crow alert
idle at 45° elevation / 270° heading.
