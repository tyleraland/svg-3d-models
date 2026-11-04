# Animation gaps and planned creatures

Reviewed 4 November 2026. This is an implementation backlog, not a claim that
similarly named clips are interchangeable. `attack` may currently mean a bite,
paw strike, body lunge, arm strike or feeding rasp depending on the anatomy.
A generic `hit`/`ko` does not establish a convincing species-specific reaction.

Specific external model identities and study notes stay outside this repository.
The references below are internal rigs/clips and descriptions of suitable anatomy
or motion studies. Candidate resources are comparisons to inspect, not promises
of transferable animation or directly compatible skeletons. The named shortlist
is maintained outside this repo as `animation-reference-candidates.md` alongside
the local model inventory.

## Planned anatomy: do not implement yet

| Planned model | Anatomy/design decisions | First motion set to plan | Potential references |
|---|---|---|---|
| **Brontosaurus** | Distinct sauropod variant; decide neck carriage, barrel shape, limb proportions and tail balance before deriving from another family. Not currently implemented. | Heavy walk, quicker supported travel, supported tail sweep, neck/head reaction, feeding reach, settle/KO. | Existing `apatosaurus` neck/tail hierarchy and support rules; existing `mammoth` heavy supported gait; sauropod movement/anatomy studies. |
| **Hydra** | Decide body plan, number of heads and neck attachment layout. Each head needs stable IDs, independent neck/jaw control and an emitter/grip anchor where appropriate. Not currently implemented. | Walk/slither, staggered and simultaneous bites, per-head hit reactions, tail sweep, optional elemental spit, coherent multi-head KO. | Existing `dragon`, `kingCobra`, `crocodile` and `octopus` for body, long-neck/jaw motion and independent branch phasing. A multi-headed rig study is still needed. |

`apatosaurus` already exists; it is an internal starting point for planning,
not a claim that Brontosaurus has already been added. Hydra is likewise backlog
only. Neither has a model declaration in this change.

## Priority 0: reactions and locomotion transitions

| Applies to | Missing or insufficient animation | Kind | Potential references / review target |
|---|---|---|---|
| Models marked **generic hit** below | Anatomical recoil and recovery, ideally light/heavy variants; preserve support or airborne/aquatic state. | Reaction | `merfolk.recoil` is an initial aquatic example. Compare current supported attack recovery in `wolf`, `lion` and `crab`; inspect dedicated hurt/stagger studies. |
| Models marked **generic ko** below | Grounded collapse or species-appropriate limp/float, plus an explicit recovery/get-up where appropriate. | Reaction / state transition | Existing supported `lobster.ko`, relaxed gastropod `ko`, aquatic roll/float postures. Validate contact and clearance rather than copying the generic root roll. |
| Terrestrial quadrupeds | Start/stop, left/right turns, walk↔trot↔run blends, braking and recoverable stumble. Some gaits exist already; dedicated transition clips do not. | Locomotion / transition | Existing `horse`, `wolf`, `deer`, `lion`, `mammoth` contact patterns; turning/braking studies with visible foot plants. |
| Fish, shark, eel, manta ray, octopus, dolphin, whale, jellyfish, merfolk | Swim start/stop, bank/turn, rise/dive, hover↔fast movement and water-specific hurt/recovery. | Swimming / reaction | Compare each existing `swim`/`fastSwim` pair and `merfolk.recoil`; underwater turn and braking studies appropriate to each propulsion system. |
| Flying creatures | Takeoff, landing, banking, stall/recovery, grounded↔airborne transitions. Existing `fly`/`glide`/hops cover only parts of this. | Flying / transition | Existing `flyingBird`, `eagle`, `crow`, `goose`, `duck` wings and grounded support; bird takeoff/landing footage with wing/foot synchronization. |
| Slug, snail | Continuous directional steering, start/stop and obstacle negotiation. Faster `run` is a glide alias in meaning, not a legged run. | Crawling / transition | Their new traveling sole-margin waves; true gastropod pedal-wave studies. Existing slug-like clips need anatomical review before adaptation. |

The default resolver derives the canonical `hit` slot late in resolution.
A separate `recoil` clip does not replace it automatically. When specializing
that slot, use supported post-canonical patches or explicit motion composition,
and verify the final resolved clip; do not assume a family-level `hit` definition
survives canonical derivation. A full bespoke replacement needs a deliberate,
validated authoring path.

## Priority 1: distinct attack vocabulary

One generic `attack` slot is insufficient when a creature has multiple tools.
Use explicit clip IDs and exact impact/release events; visual projectiles, fire,
webs, water and particles are downstream effects attached to named emitters.
Opening a jaw alone does **not** count as implementing a projectile attack.
Some gaps also require new anatomy controls or anchors before clip authoring: a
spinneret/throat emitter, retractable tissue, a shell aperture, or independent
neck branches. Treat those as geometry-plus-motion work, not timing edits alone.

| Models / archetype | Clips to add or specialize | Kind | Potential references |
|---|---|---|---|
| `dragon` | `bite`, `clawSwipe`, `tailSweep`, `fireSpit` with anticipation, hold, release and recovery. Audit which existing movement can be reused without treating it as all four actions. | Bite / claw / tail / ranged | `shark.attack` and `crocodile.attack` hinged bites; `lion.attack`/`leopard` claws; existing long tails; a dedicated throat/head breathing cycle is needed. |
| `spider` | `fangBite`, `webSpit`; separate abdomen spinneret emission from mouth/fang attacks according to the intended design. | Bite / ranged / anatomy-specific | Existing `spider` locomotion and supported lunge, `scorpion` abdomen control; spinneret/leg-bracing motion studies. |
| `scorpion`, `wasp` | Distinguish sting jab from claw/mandible attacks; add guarded sting recovery and interruption. | Sting / claw / bite | Their current tail/abdomen sting motion and `crab.attack` large-claw timing; inspect stinger-target orientation at contact. |
| `crab`, `lobster` | Add guarded grab/hold/release and independently targeted claw strikes beyond the current big-claw snap / alternating reach-and-pinch. | Claw / grapple | Current `crab.attack` and `lobster.attack`; crab `sidewalk` for lateral bracing. |
| `wolf`, `lion`, `cat`, `leopard`, `hyena`, `bear`, `mink`, `badger` | Complete the appropriate bite / paw swipe / pounce / grapple set. Existing clips cover different subsets; bear and feline attacks should not be relabeled as equivalent bites. | Bite / claw / body attack | Existing `wolf.attack`, `lion.attack`, `leopard.attack`/`pounce`, `bear.attack`; matched canine, feline and ursine movement studies. |
| `trex`, `velociraptor`, `triceratops`, `stegosaurus`, `apatosaurus` | Additional head bite, grasp/sickle kick, horn shove or tail strike as appropriate; explicit recovery and interrupted attack. Existing primary attacks remain available. | Bite / claw / kick / horn / tail | Their current anatomy-specific attacks; `shark` jaw timing, `kangaroo.kick` for separate strike/recovery phases, existing heavy-animal support rules. |
| Humanoids, centaur, merfolk | Independent left/right strikes, guard/block, grab, weapon-ready and weapon attacks using declared grip slots. | Melee / defense | Existing humanoid/centaur hand chains, `merfolk.attack`, `lobster.attack` alternating timing; weapon-specific animation studies after grip alignment. |
| Fish, shark, eel, dolphin, whale | Distinct ram, bite and tail slap where anatomically appropriate; feeding should be separate from combat. Shark already has a jaw snap. | Bite / ram / tail | `shark.attack`, `eel.attack`, existing fish and cetacean propulsion; species-appropriate feeding and tail-strike studies. |
| Octopus, jellyfish | Arm grab/release, contact/sting posture, and optional ink emission for the intended octopod design. Bell contraction or an arm stroke alone does not establish these. | Grapple / contact / ranged | Existing octopus independent arm chains, `jellyfish` bell/filament motion; dedicated contact and ink-release studies. |
| Merfolk | Tail sweep is now present; add directional variants, interrupted arm strike, defensive tail brace and optional held-weapon thrust. | Tail / melee / defense | `merfolk.tailSweep`, `merfolk.attack`, existing fish-tail propulsion and humanoid hand/attachment conventions. |
| Slug, snail | Refine the initial `attack` as a radula feeding rasp; fantasy acid/slime spit needs an explicit design and emission event rather than being assumed from the base anatomy. | Feeding / optional ranged | Current gastropod mouth/radula articulation; feeding studies. |

## Priority 2: anatomy-specific actions and expression

| Models / archetype | Missing actions | Kind | Potential references |
|---|---|---|---|
| Snail | Full head/foot withdrawal into the shell, emergence and true telescoping eye-stalk retraction. `feelersFold` only folds rigid articulations; it does not implement these. | Defense / soft-body state | Current shell volume and `feelersFold` are inspection starting points. Real shell-withdrawal and eye-stalk studies are needed; define an explicit soft-tissue length/scale contract before implementation. |
| Slug | True eye-stalk retraction, mantle breathing, contact exploration and continuous pedal-wave deformation. | Anatomy / exploration | Existing rigid sole ripples and `feelersFold`; gastropod close-up studies. |
| Horned/antlered quadrupeds | Horn lowering/raising, guarded lateral head motion, grazing/browsing, neck recoil and post-impact recovery. | Horn / feeding / reaction | Existing `bull`, `bighornRam`, `moose`, `deer` and `triceratops` support/neck chains. |
| Long-neck and trunked animals | Browsing reach, drinking, trunk grasp/carry/release, neck look-around and supported sit/rest. | Feeding / manipulation / rest | Existing `apatosaurus`, `elephant`, `mammoth`, `camel` anatomy and anchors. |
| Birds | Peck/feed, head tracking, preen, folded-wing shake and species-appropriate threat/call. | Feeding / grooming / expression | Existing bird neck, beak and wing chains; grounded bird motion studies. |
| Mammals | Sit/lie-down/get-up, sleep/wake, sniff, look-around and species-appropriate vocalization. | Rest / expression / transition | Existing support, jaw and neck controls; dedicated rest/get-up studies rather than extending KO into a sleep animation. |
| Segmented crawlers | Coordinated turning, rear/head-led reverse, obstacle stepping and supported curl/uncurl. | Crawling / defense | Existing `centipede` and `segmentedCrawler` phase waves and contact audits. |
| Shell/wing/fin/tentacle creatures | Local flinch, guard, asymmetric contact response and readable recovery without breaking attachment seams. | Reaction / defense | Existing independent attachment branches and the directional audit matrix. |

## Acceptance criteria for every new clip

- Record intent, active anatomy, looping/one-shot behavior, and phase/event times.
- Use ordinary joint-local transforms and declared contacts. Grounded actors
  retain support; swimmers/flyers do not inherit terrestrial foot constraints.
- Preserve fixed-length bones and rigid plates. Any future soft-tissue length
  change needs an explicit contract and validation, not undeclared endpoint edits.
- Preserve loop seams; one-shots recover to their declared next state.
- Inspect opening, anticipation, strike/release, follow-through and recovery across
  eight headings and side/30/45/60/75/overhead elevations. Include both facing
  directions, near/far appendage ordering and silhouette readability.
- Review emitter/grip locations separately from downstream visual effects.
- A candidate reference clip must be inspected for actual moving anatomy and
  timing. Names alone do not establish rig suitability or an implemented action.

## Factual clip coverage

Update just the snapshot below with `node scripts/animation-coverage.mjs --write`.
The priorities above remain manually curated.

<!-- BEGIN ANIMATION COVERAGE -->

Snapshot: **78 implemented models**. Clip presence establishes structural coverage, not visual quality, species suitability, or transition quality. Legacy `walk`/`run` aliases for aquatic movement are omitted when explicit swim clips exist. Extra clips are listed by their exact IDs.

**78/78 models currently use the generic three-key `hit` recoil.** A separately listed bespoke `recoil` clip is useful but does not automatically replace that slot.

Models retaining the generic two-key `ko`: `angel`, `ant`, `badger`, `bat`, `bear`, `beaver`, `bighornRam`, `blob`, `boar`, `bug`, `bull`, `camel`, `cat`, `centaur`, `cow`, `crab`, `crocodile`, `deer`, `dragon`, `elephant`, `goose`, `greyhound`, `harpy`, `horse`, `humanoid`, `hyena`, `kangaroo`, `kingCobra`, `leopard`, `lion`, `lizard`, `mammoth`, `mimic`, `mink`, `monkey`, `moose`, `mountainGoat`, `ostrich`, `quadruped`, `rabbit`, `radial`, `rat`, `rhino`, `scorpion`, `serpentine`, `stoutBiped`, `tailedBiped`, `tentacle`, `tinyBiped`, `tortoise`, `walkingBird`, `wolf`. Other `ko` clips differ from that exact fallback signature; this does not establish bespoke motion or anatomical suitability.

| Model | Locomotion clips present | Attacks / additional actions present | Reaction coverage |
|---|---|---|---|
| `angel` | `walk` | `attack` | generic `hit`; generic `ko` |
| `ant` | `walk` | `attack` | generic `hit`; generic `ko` |
| `apatosaurus` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `badger` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `bat` | `walk` | `attack` | generic `hit`; generic `ko` |
| `bear` | `run`, `walk` | `attack`, `idleHind`, `walkHind`, `attackHind`, `standUp`, `standDown` | generic `hit`; generic `ko` |
| `beaver` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `bighornRam` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `blob` | `walk` | `attack` | generic `hit`; generic `ko` |
| `boar` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `bug` | `walk` | `attack` | generic `hit`; generic `ko` |
| `bull` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `camel` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `cat` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `centaur` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `centipede` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `cow` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `crab` | `run`, `sidewalk`, `siderun`, `walk` | `attack` | generic `hit`; generic `ko` |
| `crocodile` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `crow` | `fly`, `glide`, `run`, `hop`, `walk` | `attack` | generic `hit`; other `ko` |
| `deer` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `dolphin` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `dragon` | `walk` | `attack` | generic `hit`; generic `ko` |
| `duck` | `run`, `fly`, `walk` | `attack` | generic `hit`; other `ko` |
| `eel` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `elephant` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `fish` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `flyingBird` | `fly`, `glide`, `hop`, `run`, `walk` | `attack`, `talonStrike` | generic `hit`; other `ko` |
| `frog` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `goose` | `run`, `fly`, `walk` | `attack` | generic `hit`; generic `ko` |
| `greyhound` | `walk` | `attack` | generic `hit`; generic `ko` |
| `harpy` | `walk` | `attack` | generic `hit`; generic `ko` |
| `horse` | `walk` | `attack`, `stomp`, `gallop` | generic `hit`; generic `ko` |
| `humanoid` | `walk` | `attack` | generic `hit`; generic `ko` |
| `hyena` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `jellyfish` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `kangaroo` | `run`, `hop`, `walk` | `attack`, `kick` | generic `hit`; generic `ko` |
| `kingCobra` | `run`, `walk` | `attack`, `idleLow`, `rise`, `idleRaised`, `lower` | generic `hit`; generic `ko` |
| `leopard` | `run`, `walk` | `attack`, `pounce` | generic `hit`; generic `ko` |
| `lion` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `lizard` | `walk` | `attack` | generic `hit`; generic `ko` |
| `lobster` | `run`, `walk` | `attack`, `tailFlip` | generic `hit`; other `ko` |
| `mammoth` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `mantaRay` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `merfolk` | `fastSwim`, `swim` | `attack`, `tailSweep`, `recoil` | generic `hit`; other `ko` |
| `mimic` | `walk` | `attack` | generic `hit`; generic `ko` |
| `mink` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `monkey` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `moose` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `mountainGoat` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `octopus` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `ostrich` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `parasaurolophus` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `quadruped` | `walk` | `attack` | generic `hit`; generic `ko` |
| `rabbit` | `walk` | `attack` | generic `hit`; generic `ko` |
| `radial` | `walk` | `attack` | generic `hit`; generic `ko` |
| `rat` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `rhino` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `scorpion` | `walk` | `attack` | generic `hit`; generic `ko` |
| `segmentedCrawler` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `serpentine` | `run`, `walk` | `attack`, `rise`, `idleRaised`, `lower` | generic `hit`; generic `ko` |
| `shark` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `slug` | `run`, `walk` | `attack`, `feelersFold` | generic `hit`; other `ko` |
| `snail` | `run`, `walk` | `attack`, `feelersFold` | generic `hit`; other `ko` |
| `spider` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `stegosaurus` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `stoutBiped` | `walk` | `attack` | generic `hit`; generic `ko` |
| `tailedBiped` | `walk` | `attack` | generic `hit`; generic `ko` |
| `tentacle` | `walk` | `attack` | generic `hit`; generic `ko` |
| `tinyBiped` | `walk` | `attack` | generic `hit`; generic `ko` |
| `tortoise` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `trex` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `triceratops` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `velociraptor` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `walkingBird` | `run`, `walk` | `attack` | generic `hit`; generic `ko` |
| `wasp` | `run`, `walk` | `attack` | generic `hit`; other `ko` |
| `whale` | `fastSwim`, `swim` | `attack` | generic `hit`; other `ko` |
| `wolf` | `run`, `sprint`, `trot`, `walk` | `attack` | generic `hit`; generic `ko` |

<!-- END ANIMATION COVERAGE -->
