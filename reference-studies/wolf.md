# Wolf shape and motion study

Reference: WildMesh3D paid-standard-license `Realistic Animals/Wolf_1/SK_Wolf 1.blend`.
Inspected in its separate Blender reference scene. Sampled nine phases each of
Walk (frames 1–27), Trot (1–19), Run (1–13), Idle (1–181), and
Attack_BiteForward (1–59), and inspected side renders of the sampled actions.

The reference has a deep chest, tucked waist, full neck ruff, compact skull with
an elongated muzzle, pointed upright ears, digitigrade hind legs and a brush tail
carried down near the hocks. Native sampled pelvis height spans .629–.661 during
walk, .589–.629 during trot and .569–.644 during run. Head carriage lowers during
faster travel. The forward bite includes body lowering, neck reach and jaw action.

The SVG geometry and motion are independently authored, without embedded mesh,
textures or retargeted animation channels. A middle spine control separates the
waist and chest; shoulder and ruff plates supply the front mass. Ear triangles
retain real polygon points, and three tail spans form the lowered brush. The jaw
has its own hinge and tapered lower-jaw plate.

- Idle: 2800 ms, gentle neck/head counter-motion, ear flick and small tail sway;
  all four feet remain fixed on z=0.
- Walk: 1400 ms lateral-sequence four-beat gait, 70% stance, low lift and small
  head/body movement.
- Trot: 850 ms, alternating diagonal pairs, 55% stance, greater stride and lift.
- Run: 580 ms, staggered hind/fore contacts and suspension, spine flex, body arc,
  lower neck/head carriage and a tail lifted into a trailing position.
- Attack: 1100 ms braced forward bite. Crouch and withdraw, open the jaw, reach
  with head/neck/body, close during contact, then recover. Four paws stay planted
  through compensated leg IK. The token deliberately uses a supported bite,
  rather than copying the reference's stepping attack exactly.

All trajectories bake to ordinary clips. `groundedQuadruped.trot` uses the walk
field grammar with an explicit diagonal pattern. `canineAttack` declares bounded
duration, normalized lunge/body dip, and jaw opening; it requires explicit jaw,
head/neck and spine controls and rejects competing attack sources. Run head, neck and
tail pitch offsets are bounded authoring fields; consumers never evaluate them.

Tests cover inter-sample contacts and bone lengths, joint limits, support phases,
loop seams, jaw opening/closure, silhouette proportions, token framing and
head/body occlusion across side, diagonal and top cameras. Default audits include
both trot contacts and its swing phase, plus run contact and suspension.

## Sprint

Inspected native `Sprint` (frames 1–10) and sampled nine phases in the existing wolf study scene. Pelvis height was approximately 0.578–0.633 m, head 0.619–0.762 m, front ankle 0.046–0.376 m. The independently authored SVG sprint is a 430 ms suspended four-beat gait, with longer reach, more lift and spine flex than run, shorter stance windows and a longer aerial interval. The author-time IK bake uses 960 samples plus exact contact boundaries to keep interpolated paw ground error below 0.1 mm; consumers receive ordinary keyframes. Source validation rejects competing sprint declarations and unsupported non-suspended patterns.
