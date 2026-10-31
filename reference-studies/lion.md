# Maned Lion — 2026-10-31

Blender 5.1.2 read-only study: Lion_Stylized/SK_Lion_Stylized.blend, 34 bones,
15 actions. Structured inventory and nine pose/bounds samples each for Idle,
Walk, Run and Swatting are in `lion-reference.json`. The realistic male source
is FBX-only; this milestone uses the native stylized male as its primary study.

The reference has powerful forequarters, a short broad muzzle, rounded ears,
a full mane surrounding the skull/neck, and a thin long tail ending in a tuft.
The independent lion source reuses feline structure and authoring helpers,
increases forequarter/paw bulk, adds a tuft, and builds a closed faceted collar
from complementary side/front/top planes. Mane roots stay beneath the opaque
skull/body; the outline remains visible from top and front as well as profile.
Existing leopard sources/fixtures remain unchanged.

Idle fixes four paws. Walk is a slow supported stalking gait; run is a gallop
with spinal flexion and tucked hind recovery. Native Swatting raises the full
forebody: our simpler adaptation uses a three-foot-supported swipe, articulated
shoulder/elbow extension, sudden descending rake and retractable claws.
This is an informed adaptation, not a literal full-body action retarget.

Source/compiled checks, dense contacts/lengths, 1,120 directional samples and
480-view audit pass with zero audit issues/warnings. Browser review covers all
four actions in profile/top/opposing oblique cameras. Batch-end parity pending.
