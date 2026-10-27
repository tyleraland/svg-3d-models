# Animated spider reference study

Reference: `/Users/tal/models/cc-by/animated_spider.glb`. Imported into a separate Blender scene, `Reference study AnimatedSpider`, retaining the bear and other existing study scenes. The source asset is unchanged. This is a visual and timing reference; the SVG contains newly authored paper geometry and ordinary joint-local animation, not copied mesh geometry.

The GLB contains idle, walk, walk back, large walk, walk tight, run, attack and die actions. Walk is 20 Blender frames, run 10, attack 30. Its imported neutral mesh spans about 2.54 × 2.98 × 0.75 Blender units. Forward is approximately -Y. The body is low relative to the raised knees; the legs spread longitudinally as well as laterally. Idle has a small body sink while the foot locations remain steady. Walk and run use alternating supports, with run roughly twice the cadence. Attack raises both front legs, elevates and pitches the front body, then thrusts and recovers. The reference has more leg subdivisions and mouth detail than our deliberately simplified rig.

## SVG changes

- Low body with knees at 0.57–0.60 m, above the 0.27 m cephalothorax. Front and rear feet fan to X +0.78 / -0.92 m, rather than eight nearly parallel lateral spokes.
- Fuller rounded abdomen, narrower cephalothorax, short downward fangs and two articulated palps. Slender tapered lower legs and small foot contacts replace the old round foot pads. A fixed XY ground shadow replaces the old body-relative base.
- Idle: 2400 ms, quiet body breathing over eight fixed contacts.
- Walk: 1100 ms, alternating four-foot supports, 64% stance, 0.20 m stride, 0.10 m lift.
- Run: 550 ms, 55% stance, 0.28 m stride, 0.16 m lift; remains supported rather than adding an unsupported airborne gait.
- Attack: 1000 ms, front feet release at .12, raised threat crest at .32, rapid bite at .46, front feet return at .86. The six remaining feet stay planted. The clip returns exactly to neutral.

`scripts/refine-spider-motion.mjs` bakes spatial two-link IK into ordinary dense local-rotation keyframes. It checks reachability and continuous Euler interpolation; no runtime IK or renderer special case is added. Preserve the declarative family/model sources; regenerate the clips after changing proportions.

## Regression coverage

`test/spider.test.mjs` checks the arched proportions and longitudinal fan, whole-leg articulation, alternating support sets, run cadence/lift, front-leg release and six-foot attack support, rapid bite/fang closure, neutral recovery, loop seams, contact heights and bone lengths through 1000 interframes per clip. It also checks independent occlusion and framing at six elevations, sixteen headings and nine key times for idle/walk/run/attack. The normal catalog audit and workbench parity checks apply as well.

The waist plate is explicitly `under-core`: its connecting strip stays behind the abdomen and cephalothorax, including 60° elevation / 135° heading. A dedicated all-clip/all-camera ordering assertion covers this internal connector; ordinary depth ordering alone did not express that intent.

The second local reference, Quaternius `Easy Animated Enemy Pack - Jan 2019/Blends/Spider.blend`, contains `Spider_Idle`, `Spider_Walk`, `Spider_Attack`, `Spider_Jump` and `Spider_Death`. The jump and death actions are candidates for a future study; their presence has been verified, but their movement has not yet been analyzed or retargeted.

## GLB death / SVG KO

Studied `Armature|die`, frames 0–47 at 24 fps, with quarter-pose renders and nine bone-position samples. The reference topples laterally, gathers all legs inward, then settles with a curled side-lying body; it does not use the generic forward pitch used by the old SVG KO.

The SVG `ko` is 1960 ms, begins at the neutral idle pose, releases foot support after .04, rolls sideways with the fall at .34 and impact/recoil at .48, then completes its leg curl and holds from .90 to 1. Body translation follows the roll and keeps the abdomen envelope on the ground in the final pose. All limb motion is baked joint-local rotation with preserved bone lengths; only the root translates. Euler angles are unwrapped before interpolation, including the rear-leg hip frames crossing ±180°. The source GLB is unchanged and its final death pose remains open in Blender.

Canonical derivation now preserves an explicitly authored KO; creatures without one retain their existing generated default. The occlusion oracle excludes `under-core` connector plates from exposed core occluders: an internal waist must not falsely demand sorting other already-buried limbs behind it. The separate buried-connector layer contract remains enforced.

KO regression tests cover exact idle entry, foot-support release, lateral roll, longitudinal leg curl, final body height, settled hold, 1000 interframe ground-clearance samples, invariant bone lengths, and six elevations × sixteen headings × ten fall times for framing and independent occlusion.
