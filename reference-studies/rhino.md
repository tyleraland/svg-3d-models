# Rhino reference study

Reference opened in Blender: `Realistic Animals/Rhinoceros/SK_Rhinoceros.blend` in the local WildMesh3D library. The existing separate `Reference inventory Rhinoceros` scene remains open with its idle action and study camera. Imported and inspected native `Idle` (frames 1–451), `Walk-IP` (1–54), `Run-IP` (1–15), and `Attack_HornL-IP` (1–51), sampled at nine phases and rendered for silhouette review. No mesh or animation data is embedded in the SVG rig.

The reference has a deep, nearly horizontal barrel, a prominent shoulder, short sturdy legs, a low wedge-shaped head and wide muzzle. The nasal horns are consecutive on the centerline, rather than a bilateral pair. Ears stand behind the horns; the short tail hangs from the rump. The SVG keeps that structure at a stylized scale: lower head, broad body/shoulder masses, shorter articulated legs, flattened muzzle, a taller two-segment front horn and shorter rear horn, pointed ear panels and hanging tapered tail.

Sampled reference pelvis heights were approximately 1.48 m in idle, 1.39–1.43 m in walk, and 1.33–1.56 m in run. Walk carried the head around 0.99–1.02 m, versus run around 1.29–1.56 m. The horn attack lowered the pelvis while raising/sweeping the head; rear ankles stayed around 0.165 m while front ankles reached about 0.35–0.38 m. These are reference measurements, not retargeted coordinates.

- Idle: 3400 ms quiet neck breathing, ear movement and tail sway; four fixed feet.
- Walk: 1900 ms lateral-sequence gait, long overlapping stance, low foot lift and small body bounce. Both shoulder/hip and lower joints articulate.
- Run: 700 ms four-beat gallop with short suspension, stronger foot lift, modest body arc and higher head carriage. The shadow remains on a fixed XY plane.
- Attack: 1400 ms head dip, near-front brace-step, horn lift and leftward sweep, then recovery. The other three feet remain planted. The attack uses rotation of the neck/head rather than translating horn endpoints.

`groundedQuadruped` declarations bake walk/run to ordinary clips. `scripts/refine-rhino-attack.mjs` bakes the independently authored attack with sagittal IK and exact contact boundaries into the model source. Consumers require no procedural solver. Stable head/horn/foot IDs are retained.

Regression checks cover geometry, grounded idle, limb motion, support phases, loop seams, bone preservation, interpolated paw clearance/contacts, braced attack support, and horn/ear/muzzle ordering over 16 headings and six elevations. Adjacent authored seams are ordered jointly with strict depth intervals; independently moving seams behind their own plates can otherwise undo ordering around a neighboring horn/muzzle. The independent occlusion oracle checks the result. Depth-crossing surface intersections remain explicit visual-review cases.
