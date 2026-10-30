# Wasp — Quaternius reference study

Source: `~/models/quaternius/Easy Animated Enemy Pack - Jan 2019/Blends/Wasp.blend`.
Opened in the connected Blender instance, preserving the clean Frog reference
on disk. `scripts/study-quaternius.py -- wasp` samples/renders the native file
in background Blender 5.1.2 without saving it. Unlike Frog, this model faces +X;
its side camera is along Y, front along X, and Z is up. The script now rejects
uncalibrated reference IDs rather than silently using Frog's camera directions.

## Native evidence

One mesh and one armature, at 24 fps. Exact action names/ranges:

| Native action | Frames | Duration | Observed content |
|---|---|---|---|
| Wasp_Flying | 0–36 | 1.5 s | Hover/body bob, two broad rigid-wing strokes, loose six-leg motion and a hanging hooked abdomen. |
| Wasp_Attack | 0–18 | .75 s | Abdomen pulls back, then curls/drives the sting forward; forelegs reach and wings keep beating. |
| Wasp_Death | 0–18 | .75 s | Rise, roll/fall onto its side, tucked legs and stopped wings; the native mesh crosses the floor slightly. |

There is no native grounded Idle, Walk or Run. The skeletal Wing.L/Wing.R pair
moves as rigid wings; it has no avian elbow/wrist chain. Three paired leg
chains (Top/Mid/Bottom) each have three segments. Thorax, neck, head, three
abdominal controls and a separate sting control supply the main articulation.
Antennae are head geometry in the reference, rather than separate native bones.

`wasp-reference.json` retains 41 evaluated phases per action, mesh bounds and
world-space bone heads/tails/bases. `/tmp/quaternius-Wasp_*` contains side
phase renders plus front/top Flying views. The native Flying hover measured at
phase zero has thorax Z about 2.62 and sting-tip Z .73, with the sting forward
of the low abdominal bend. In the windup its tip pulls behind the thorax, then
travels forward again. Flying wing tips alternate from behind/below the shoulder
to forward/above it. These are observations, not copied runtime animation.

## Paper model and shape

Independent `wasp` family/model: **93 joints, 55 plates**. Most joints beyond
the main anatomy are rigid geometry/sorting helpers. Native mesh/texture data
never enters the runtime. Approximate paper scaling is .20 m per source unit,
with the thorax hovering at Z=.61. The style retains opaque paper colors.

- Large compound-eye masses and bent two-part antennae on a compact head.
  Separate antenna joints add authored small motion absent from the native rig.
- Narrow waist, three articulated curved abdominal sections, three short paper
  chevrons indicating banding, and a tapered forward-pointing sting.
- Six three-part suspended legs, with whole-limb motion and a faster-flight tuck.
- One long swept wing pair, each built from six flat triangular paper panels
  meeting along a shallow cambered vein. The cant/camber preserves readable
  frontal/profile silhouettes and gives simple insect-wing vein lines. Every
  panel has a real centroid sorting frame; no nonplanar polygon can cancel its
  projected area at a grazing angle.

The first stinger draft was a flat triangle and collapsed into a line in profile.
The final needle has four planar faces. Its shallow mount sits near the outside
of a small opaque abdomen tip, and its faces use camera-relative surface order:
a forward-facing needle can cover the socket; a rear-facing needle goes behind
it. The entirely internal stem remains under-core and geometrically contained
by the socket at every tested angle. This avoids both a disappearing sting and
an internal triangle base painted over the body. No compositor changes were
needed; the existing declared occlusion policies handle it.

## Authored animations

- Idle / buzzing hover: 1500 ms, six wingbeats (4 Hz) and a small body bob.
- Walk equivalent / slow cruise: 1200 ms, four beats, modest forward lean.
- Run equivalent / fast dart: 720 ms, four beats, stronger lean and tucked legs.
  These are authored flight-speed interpretations, not invented native walks.
- Attack / abdominal sting: 900 ms. Recoil at .22, rapid three-joint abdominal
  strike reaching impact at .50, contact through .60, then recovery. The forelegs
  reach and four wingbeats continue throughout. The cadence is accelerated from
  the source to make a readable buzzing token rather than a slow bird flap.
- KO / fall onto side: 1000 ms. Early rise/flutter, wingbeat cessation by .52,
  side roll and settling by .72. The lower compound-eye envelope rests on Z=0;
  the frozen terminal pose stays down. Paper clearance replaces native clipping.

Every live locomotion state is airborne, with no fabricated foot contacts.
All motion is ordinary joint-local rotation plus root translation. Bone lengths
stay fixed; no child translations, scaling, transparency, masks or shaders are
needed. The ground shadow remains fixed through hovering, attack and KO.

## Regression coverage

`test/wasp.test.mjs` checks anatomy, cadence, flight posture and clearance,
upper/lower/distal articulation in all six legs, body-relative sting reach and
continued wingbeat during impact. It measures actual filled wing/needle areas
from emitted posed points through frontal, profile, overhead and oblique views.
Flattened-wing and flattened-needle mutations reproduce the original failures.

It also verifies the embedded stem's actual projected containment and painter
order, camera-relative exposed needle faces, KO settling/contact envelope,
continuous angles, hinge limits, fixed lengths, loop closure, full vector bounds,
independent head/connector depth and a fixed ground shadow. A promoted internal
stem must fail independently of golden parity. These sampled geometric checks
supplement, rather than replace, visual comparison with Blender.


## Final validation — 2026-10-30

- Full suite: 422/422 tests; all 50 sources/models validate.
- Existing 49 rig/package fixture sets are byte-identical; only Wasp fixtures added.
- Final composed Wasp motion/paint audit: 480 views, zero issues or warnings.
- Chromium: 121/121 package/browser outputs match, authoring UI checks pass,
  zero console errors. Manual overhead, head-on playback, profile strike and
  oblique side-rest KO reviewed alongside the native Blender reference renders.
- Full catalog standard/motion/paint audits and release metadata pass; advisory
  totals remain 40/38/40, with none contributed by Wasp.
