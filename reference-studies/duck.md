# Duck — 2026-10-31

Blender 5.1.2 read-only study of Duck/SK_Duck.blend: 24 FPS, 156 bones,
32 actions. Structured inventory and nine samples each for Idle, WalkMedium,
RunFast and FlyFlapping are in `duck-reference.json`. WalkMedium is 28 frame
intervals; RunFast is ten. Swim/takeoff/landing/grazing are recorded future options.

The separate Duck retains reusable waterfowl articulation but changes its
proportions before author-time IK: smaller compact feather barrel, shorter
curved neck, larger relative rounded head, broad spatulate bill, short pointed
tail, webbed feet and folded wings. A rigid head-local XY bill panel and
cross-section tip maintain the bill's proper angle across headings. The root
is embedded beneath the skull. No camera-facing beak oval or loose tail root.

Idle holds both soles flat. Walk waddles with alternating support and lateral
weight transfer; run uses faster longer alternating steps, lowered neck and
mostly folded wings, matching the reference rather than Goose's spread-wing
run. The authored snapping bill attack braces both feet, loads the neck,
lunges by joint rotation, closes the jaw and recovers. No native combat action
exists. Native FlyFlapping informs an additional quick synchronous wingbeat,
short extended neck, trailing feet, delayed wrist/elbow recovery and no contacts.

Source/compiled checks, dense contact/length/seam tests, 1,400 directional
samples including flight, and 600-view audit pass with zero issues/warnings.
Folded primary/covert order is tested throughout idle/walk at three elevations
and three cardinal headings. Browser sheet reviewed all five actions.

Final batch gate: 485 tests, all 65 catalog validations, three catalog audits
and all 1,109 package/browser comparisons passed; zero browser console errors.
