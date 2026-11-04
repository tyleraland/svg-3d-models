# Authoring data

These files hold numeric shape and motion controls used by the creature builders
and regression checks. They are authoring inputs; exported rigs and consumers
use ordinary geometry, hierarchy, contacts and baked joint-local clips.

Builders are in `scripts/build-*.mjs` and `scripts/lib/*-family.mjs`. Dinosaur
bakes use `scripts/lib/dinosaur-paper.mjs`. Keep control names and numeric sample
indexes synchronized with the corresponding builder when editing these files.

The `lobster-original-*` declarations preserve the earlier model shape for the
in-place lobster upgrade. They are model baselines, not runtime dependencies.
