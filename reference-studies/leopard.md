# Leopard shape and motion study

Reference: WildMesh3D's paid-standard-license Leopard model in the supplied
`100 MODELS - WildMesh3D` collection (see wildmesh-inventory.json).
Inspected in a separate Blender scene, sampling nine poses each from `Walk-IP`,
`Run-IP`, `Attack_Legs_02-IP`, and `Attack_Head_01-IP`.

The reference has a low head, nearly level back, rounded shoulder and hip masses,
compact muzzle, small rounded ears, and a long tapering tail with a curled end.
Native pelvis height spans about .580–.602 during walking and .508–.605 during
running. Forepaw lift is much greater during running and the paw attack.

The SVG is independently authored geometry and motion, without embedded mesh,
textures, or retargeted animation channels. It adds a middle spine control,
shoulder volume, articulated tail and three retracting claws per forepaw.

- Walk: 1500 ms, four lateral-sequence beats, 70% stance, small body motion.
- Run: 620 ms, staggered hind/fore beats, suspension, spine flex and body arc.
- Attack: 800 ms supported forepaw swipe; shoulder and elbow wind up, reach,
  extend claws, rake downward, then recover while three paws stay planted.
- Pounce: 1050 ms two-paw attack; crouch, hind push-off, suspension, forepaw
  impact, then recovery. Claws fold again outside the strike.

These are stylized authored approximations informed by the reference, baked to
ordinary clips. Regression checks cover phase boundaries, contact intervals,
bone lengths, joint limits, paw/claw clearance between samples, loop seams,
and side/oblique/top occlusion. Default audits include run suspension and pounce
push-off, suspension and impact.
