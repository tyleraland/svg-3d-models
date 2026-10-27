# Chicken reference study

Source: `~/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/Chicken/SK_Chicken.blend`.
Opened non-destructively as `Reference study Chicken` in Blender. The existing `walkingBird` source ID is retained for compatibility; the workbench names this specimen **Chicken · walking bird**. Ostrich and goose remain separate future specimens.

## Observed reference

Native coordinates: forward -Y, lateral X, up Z. Evaluated idle bounds approximately .208 m wide, .551 m long, .481 m high. Pelvis .253 m above ground; head .405 m; folded wings, full breast, compact head, upswept tail, short exposed shanks and spread toes. Thigh points forward, hock backward, distal foot forward.

Walk: frames 1–31 at 24 fps (1.25 s). Alternating feet, body sway and vertical settling, head bob. Run: frames 1–13 (0.5 s), lower head and greater foot excursion. Both regular and root-motion variants exist, plus RunAngry, Idle, Idle2, IdleLay, GetHit and Death. There is no named attack action.

Idle2 contains angular pecks. At native frames 51–58 the head falls from .406 m to .109 m in .292 s, then holds briefly. The SVG attack condenses that action into a single planted-foot peck with anticipation, 242 ms downstroke, short impact hold and recovery. It is an adaptation of the observed idle peck, not a claim of an authored GLB attack clip.

## SVG changes and checks

Smaller head and beak, fuller compact torso, short three-segment legs with opposed bends, close-folded wings, elevated tail, comb/wattle and spread toe accents. Two-link author-time leg solving plus an authored distal segment produces ordinary local rotations; consumers do not run IK. Walk 1250 ms; run 500 ms with longer stride, higher swing, suspension and lower head. Idle and attack keep both feet planted. Root never moves the ground-plane shadow.

Regenerate with `node scripts/refine-chicken-motion.mjs`. Tests sample 1001 interpolated poses per clip for bone/contact/ground checks; camera checks cover 16 headings, six elevations, nine phases and four clips. These supplement, rather than replace, browser parity and the configured 480-view audit.
