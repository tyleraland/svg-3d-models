# Flying bird: eagle reference study

Reference: `Stylized Animals/Eagle_Stylized/SK_Eagle_Stylized.blend` in the local WildMesh3D library. Inspected the existing separate reference scene and its `FlyLoop` action (frames 1–70), sampling nine phases and rendering the posed mesh. Reference measurements are diagnostic only; the SVG geometry and animation are independently authored.

The left/right wing tips rise and fall together. Sampled left wing-tip height ranges roughly 0.52–1.47 m while the chest ranges 0.89–1.00 m; the distal wing lags the shoulder and folds on recovery. The broad secondary surface and separated outer primaries are much more characteristic than the previous rounded struts.

The SVG now has closed articulated upper/secondary panels, a serrated primary fan, a fan tail, compact head and tapered hooked beak. Mirrored shoulder, elbow and wrist rotations produce a fast power stroke and a slower folded recovery. `fly` is a 920 ms powered loop; `glide` and idle use small trim motions. The canonical `walk` is a grounded waddle; `hop` supplies paired-foot ground locomotion. All clips use ordinary joint-local keyframes; no runtime procedural evaluation or mesh data is required. Bone lengths remain fixed. The shadow projects onto a fixed XY ground plane.

Regression checks cover loop closure, synchronous mirrored wing motion, inter-frame bone lengths, ground clearance, token framing and head/body stacking through six elevations and eight headings. This is a paper-panel approximation: edge-on wings are thin, and the depth-interval oracle leaves truly intersecting surfaces for visual review.


## Ground locomotion and airborne peck

`attack` is now a 920 ms airborne peck with the complete synchronous wingbeat and tucked legs. The head/neck strike reaches its downward impact at phase 0.62 while the wings continue their recovery stroke.

`walk` uses folded wings, alternating thigh/knee/ankle articulation, lateral body weight transfer and planted foot height/lateral position during stance. `hop` uses paired support, preparatory crouch, takeoff at 0.18, an airborne apex at 0.48, and paired landing at 0.78. The bind skeleton has feet on the XY ground plane; airborne clips lift the root and tuck the legs. Hit/fall defaults inherit contact assumptions from idle rather than every action, allowing one rig to have both airborne and grounded clips.

`scripts/refine-flying-bird-ground-clips.mjs` is the author-time regeneration tool. It bakes ordinary local Euler rotations and root translations into the model/family sources, with exact contact boundaries and a dense IK bake. Runtime consumers still only evaluate keyframes. Tests check the peck's wingbeat against flight, foot clearance and contact accuracy between keys, lateral stance planting, waddle weight transfer, paired hopping support, bone lengths, all-angle stacking and framing.

## Peck articulation and beak seam review

The peck now pivots only the neck relative to its connector: a -14° wind-up at 0.54 snaps to +55° at impact 0.62 (about 74 ms), briefly holds, then recovers. Body, head-local rotation, root trajectory and wingbeat match flight; no endpoint translation fakes extension. The hook drops only 22 mm. A narrow 35 mm beak gasket is explicitly buried beneath its two incident plates, rather than appearing as a large round nose cap. The generic optional joint `gasket` authoring contract declares `diameterMeters` and `underIncidentPlates`; compiled gasket records preserve the incident plate IDs for consumers. The independent head oracle checks that seam contract even when endpoint depth intervals overlap. Regression coverage includes a mutation restoring the frontmost seam, 16 headings, six elevations, wind-up/impact/recovery and no-translation peck checks.
