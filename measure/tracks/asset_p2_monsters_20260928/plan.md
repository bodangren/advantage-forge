# Produce P2 monsters

Status: in progress (batch 1 done 2026-10-04). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map (batch 1 by game demand, below).
- [x] Task: Record scale, palette, rig, clips, and game uses before generation (the design note at the top of each source).

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch (batches 1 to 4 done; 47 rows open).
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Acceptance checks (all batches)

Bar 7.5/10 (characters). Each asset needs: a mockup in `docs/monster-mockups/` (mmx, clay-toy
chibi style), a design note at the top of the source, a turnaround that matches the mockup in
silhouette and color, readable 8-direction sprites at 128 px, `./forge check <name>` with
`ground ok`, a `forge all` build with no `warning:` lines, a clip strip for each clip, and a
review entry in `docs/character-reviews.json` (scores, issues, next steps).

## Batch 1 (2026-10-04): game demand, built by the orchestrator

| Asset | Catalog ID | Base | Clips | Rating | Commit |
| --- | --- | --- | --- | ---: | --- |
| griffin | monsters/beast/griffin | new quadruped with wings (dire-wolf gait) | idle, walk, run, fly, attack, hit, roar, death | 7.7 | d0c3d6b |
| green-slime | monsters/small/green-slime | slime kind factory, leaf sprout | idle, walk, attack, hit, death, spit | 7.6 | 4a171cd |
| fire-slime | monsters/small/fire-slime | slime kind factory, flames | same six | 7.7 | 4a171cd |
| ice-slime | monsters/small/ice-slime | slime kind factory, crystals | same six | 7.6 | 4a171cd |
| poison-slime | monsters/small/poison-slime | slime kind factory, goo | same six | 7.8 | 4a171cd |
| dragon-wyrmling | monsters/dragon/dragon-wyrmling | fire-dragon rig and clips, new head and shell | idle, walk, run, fly, attack, hit, death, roar | 7.6 | f18f5c2 |

- Game use: the griffin replaces the fire dragon as the mount of Gryphon Patrol, Griffin Sky-Joust,
  and Griffin Riders Escape (integration is the next task, below). Its attack, hit, and roar happen
  in the air, so they blend with the fly loop. The slimes give Devourer Slime and the slime games
  four element kinds. The wyrmling is a weak early dragon or a companion.
- Slime kinds: `assets/slime.ts` (P0) now calls `slimeAsset` in `assets/parts/slime-kind.ts`;
  `node scripts/mesh-same.mjs slime` gave SAME (identical GLB data). A kind sets the slots and may
  add a crown on its own bone, posed in every clip and shrunk in the death.
- Evidence: `out/<name>/` (GLB, render, views, sprites with presets, `anim/` strips), the check
  output (ground ok for all six), and the review entries.

## Batch 2 (2026-10-04): element dragons on a dragon kind factory

| Asset | Catalog ID | Kind features | Rating |
| --- | --- | --- | ---: |
| dragon-ice | monsters/dragon/dragon-ice | ice horns and crest (see-through, faceted), frost breath | 7.7 |
| dragon-poison | monsters/dragon/dragon-poison | purple crest and wings, venom drop on a fang, gas breath | 8.0 |
| dragon-shadow | monsters/dragon/dragon-shadow | glowing violet crest and forehead gem, smoke breath | 7.9 |
| dragon-storm | monsters/dragon/dragon-storm | glowing yellow crest, silver metal horns, lightning breath | 7.8 |

- `assets/dragon-fire.ts` (P0) now calls `dragonAsset` in `assets/parts/dragon-kind.ts`;
  `node scripts/mesh-same.mjs dragon-fire` gave SAME. A kind sets the slots, the fixed palette
  (crest, wings, horns, brows, breath), the looks of the horns, crest, and wings, and extra bodies.
- All four: the eight fire dragon clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 3 (2026-10-04): ten elementals on a spirit kind factory

| Asset | Catalog ID | Kind features | Rating |
| --- | --- | --- | ---: |
| fire-elemental | monsters/elemental/fire-elemental | flame hair cap and five flickering tongues, glowing orange wisp | 7.8 |
| water-elemental | monsters/elemental/water-elemental | wave crest curls and droplets, clear teal wisp | 7.6 |
| air-elemental | monsters/elemental/air-elemental | two spiral wind ribbons, wind tuft | 7.5 |
| earth-elemental | monsters/elemental/earth-elemental | sprout, cracked clay boulder body with moss and stones | 7.8 |
| ice-elemental | monsters/elemental/ice-elemental | pointed ears, crown of ice crystals, white-to-teal wisp | 7.9 |
| light-elemental | monsters/elemental/light-elemental | floating halo, small wings, glowing gold wisp | 7.7 |
| shadow-elemental | monsters/elemental/shadow-elemental | cat ears, violet eye glass, smoke wisps | 7.8 |
| storm-elemental | monsters/elemental/storm-elemental | lightning bolt crest, cloud rings on the wisp | 7.6 |
| crystal-elemental | monsters/elemental/crystal-elemental | burst of sixteen crystals, pulsing chest gem | 7.8 |
| magma-elemental | monsters/elemental/magma-elemental | rock hood, lava flame crest, glowing lava spots | 7.6 |

- `assets/ghost.ts` (P1) now calls `spiritAsset` in `assets/parts/spirit-kind.ts` with
  `lower: 'sheet'`; `node scripts/mesh-same.mjs ghost` gave SAME. An elemental kind uses the
  wisp body (a small round body that tapers into the curled tail), sets the head and wisp
  materials and paint, and adds element features with their own bones and clip poses.
- Shared feature shapes are in `assets/parts/element-features.ts` (crystal, flame tongue, curl);
  `assets/ice-slime.ts` now imports its crystal from there (mesh-same: SAME).
- All ten: the six ghost clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 4 (2026-10-04): monsters on existing bases

| Asset | Catalog ID | Base | Rating |
| --- | --- | --- | ---: |
| will-o-wisp | monsters/fey-and-spirit/will-o-wisp | spirit kind: glowing ghost flame, flickering flames | 7.6 |
| forest-spirit | monsters/fey-and-spirit/forest-spirit | spirit kind: leaf hood, flower, moss wisp | 8.0 |
| imp-lord | monsters/abyssal-and-cosmic/imp-lord | imp kind: crown, purple mantle, gold armlets | 7.8 |
| demon | monsters/abyssal-and-cosmic/demon | imp kind: bulk 1.35, brow horn, stone armbands and belt | 7.5 |
| horned-demon | monsters/abyssal-and-cosmic/horned-demon | imp kind: huge horns, orange markings | 7.9 |
| drake | monsters/dragon/drake | dragon kind without wings, stripes | 7.6 |
| dragon-ancient | monsters/dragon/dragon-ancient | dragon kind: long horns, white mane and beard | 8.0 |
| hippogriff | monsters/beast/hippogriff | griffin copy with horse hindquarters, hooves, horse tail | 7.8 |
| giant-boar | monsters/beast/giant-boar | boar kind without horns, big tusks, tall mane | 7.8 |

- New factories: `assets/imp.ts` calls `impAsset` in `assets/parts/imp-kind.ts` (mesh-same:
  SAME) and `assets/horned-boar.ts` calls `boarAsset` in `assets/parts/boar-kind.ts` (SAME).
  The dragon kind gained `horn`, `hornBaseBelow`, `wings: false` (no wing bodies, no fly clip),
  and `paint` (dragon-fire, -ice, and -storm: SAME). The spirit kind gained head glow and opacity.
- The clip check counts any band on a forearm as a held item; the shared imp attack and death
  clips bring the forearms against the head, so the imp kinds wear bands on the upper arms.
- All nine: `ground ok`, `forge all` with 0 warnings, a mockup from mmx (with the base mockup as
  the subject reference).

## Batch 5 (2026-10-04): twelve monsters on six kind factories

| Asset | Catalog ID | Base | Rating |
| --- | --- | --- | ---: |
| unicorn | monsters/fey-and-spirit/unicorn | horse kind: white coat, rainbow mane, gold horn and hooves | 8.0 |
| nightmare | monsters/fey-and-spirit/nightmare | horse kind: black coat, red glowing eyes, violet fire mane, hoof flames | 7.8 |
| kelpie | monsters/fey-and-spirit/kelpie | horse kind: teal coat, seaweed mane, leg scales, fins | 7.6 |
| shadow-hound | monsters/abyssal-and-cosmic/shadow-hound | wolf kind: black fur, violet markings, glowing eyes, smoke wisps | 7.8 |
| displacer-beast | monsters/beast/displacer-beast | wolf kind: two arched shoulder tentacles with spiked pads | 7.7 |
| giant-spider-queen | monsters/giant-and-ancient/giant-spider-queen | spider kind: cute face, palps, gold crown, dark bands | 8.0 |
| hill-giant | monsters/giant-and-ancient/hill-giant | ogre kind 1.45: human nose, brown beard, fur collar | 7.7 |
| fire-giant | monsters/giant-and-ancient/fire-giant | ogre kind 1.45: flame beard and crest, iron plates, war hammer | 7.8 |
| frost-giant | monsters/giant-and-ancient/frost-giant | ogre kind 1.45: white beard, horned helmet, ice club | 7.7 |
| cyclops | monsters/giant-and-ancient/cyclops | ogre kind 1.4: one eye, grin with teeth, horn, mallet | 7.8 |
| colossal-golem | monsters/giant-and-ancient/colossal-golem | golem kind: charcoal faceted stone, cyan glowing veins | 7.7 |
| gremlin | monsters/small/gremlin | goblin kind: big ears, hair, overalls, bare feet, wrench | 7.7 |

- New factories, each checked with `scripts/mesh-same.mjs` (SAME): `assets/horse.ts` calls
  `horseAsset` (`assets/parts/horse-kind.ts`), `assets/dire-wolf.ts` calls `wolfAsset`,
  `assets/giant-spider.ts` calls `spiderAsset`, `assets/ogre-brute.ts` calls `ogreAsset`,
  `assets/stone-golem.ts` calls `golemAsset`, and `assets/goblin-warrior.ts` calls `goblinAsset`.
- The ogre kind has a `scale` (orc space to meters), a `headScale`, `nose`, `eyes: 'one'`,
  `mouth: 'grin'`, `tusks`, mane parts, `maneBody`, `weapon`, and `extra`; the slot base colors
  come from the first variant options, so the painted shades follow each kind.
- A held weapon with a long head across the swing goes below the ground in the ogre attack2
  swipe. The mallet and the hammer heads lie along the side axis and stay near the grip.
- The cyclops mockup was made again without a subject reference: with the ogre as the reference,
  mmx put an eyeball on top of the head.
- All twelve: `ground ok`, held items ok, `forge all` with 0 warnings, a mockup from mmx.

## Batch 6 (2026-10-04): five monsters on dragon, wolf, and spider kinds

| Asset | Catalog ID | Base | Rating |
| --- | --- | --- | ---: |
| giant-lizard | monsters/beast/giant-lizard | dragon kind: no wings, horns, or head spines; round yellow spots; acid spit | 7.6 |
| basilisk | monsters/beast/basilisk | dragon kind: red spiked frill (a frill slot), petrifying breath | 7.7 |
| kitsune | monsters/fey-and-spirit/kitsune | wolf kind: calm smile, forehead marks, three tails | 7.8 |
| scorpion | monsters/small/scorpion | spider kind: no abdomen, pincers, curled tail with a stinger | 7.8 |
| giant-crab | monsters/beast/giant-crab | spider kind: wide shell head, eye stalks, raised claws | 7.6 |

- Kind options added (each base checked with mesh-same: SAME): the dragon kind `horn: false` and
  `headCrest: false`; the wolf kind `brows`, `forelock`, `smile`, and `paint`; the spider kind
  `abdomen`, `smallEyes`, `web`, `chestMark: false`, `bones`, `pose`, `head`, `bands: 'none'`,
  `fangScale: 0`, and a face with only `paint`.
- A paint region equal to the painted shape puts the surface on the region edge, so it gets about
  half the color (the wolf's dark legs); a kind paints a clear region (below 8.5 cm) for black paws.
- The scorpion tail strike first went into the head in the attack; a strike of 20 degrees keeps
  the stinger over the head (checked in the attack strip).
- All five: `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 7 (2026-10-04): eight monsters on wolf, boar, goblin, imp, spirit, and slime kinds

| Asset | Catalog ID | Base | Rating |
| --- | --- | --- | ---: |
| abyssal-beast | monsters/abyssal-and-cosmic/abyssal-beast | wolf kind: crimson, black horns, glowing eyes and ember spots | 7.6 |
| dire-bear | monsters/beast/dire-bear | boar kind: bear muzzle, round ears, paws, stub tail | 7.6 |
| owlbear | monsters/beast/owlbear | goblin kind: no ears or face; owl face, bear ears, ruff, wing arms | 7.5 |
| fairy-sprite | monsters/fey-and-spirit/fairy-sprite | imp kind: upright ears, closed eyes, leaves, dragonfly wings | 7.6 |
| succubus | monsters/abyssal-and-cosmic/succubus | imp kind: a friendly demon girl, long hair, horns, a lilac dress | 7.6 |
| eldritch-eye | monsters/abyssal-and-cosmic/eldritch-eye | spirit kind: an eyeball head shape, no face | 7.7 |
| eldritch-horror | monsters/abyssal-and-cosmic/eldritch-horror | slime kind: matte, hollow eyes, maw, tentacles, orb crown | 7.6 |
| mushroom-creature | monsters/small/mushroom-creature | goblin kind: no ears or face; spotted cap, stem body | 7.7 |

- Kind options added (each base checked with mesh-same: SAME): the boar kind `mane`, `snout`
  (`'bear'` or none), `ears: 'round'`, `feet: 'paws'`, `eyeScale`, `eyeGlow`, `paint`, and `extra`;
  the goblin kind `ears: false` and `face: false`; the imp kind `ear`, `brows`, `mouth: 'smile'`,
  `wings`, `tail`, `claws`, empty `horns` (no horns slot), and `torso` and `eye` in its shape; the
  spirit kind `head.shape` and `face: false`; the slime kind `matte`, `eyes: 'hollow'`, `frown`,
  `bubbles`, and `extra`.
- The image model drew the owlbear as a biped in three tries (with the dire wolf, dire bear, and
  boar mockups as references), so the owlbear is a biped on the goblin kind.
- Owner rule (2026-10-04): every asset is rated G, with no sexual suggestion. The first succubus
  (heart eyes, a slip dress) broke it; the rework is a pretty demon girl in a normal lilac dress
  with puffed sleeves and a white collar, with a new mockup. The row name stays until the owner
  decides (see the spec, "Open decisions").
- Prettier reformats a whole kind file (500 changed lines); edit kind files without the formatter.
- All eight: `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 8 (2026-10-04): three birds on a new bird kind

| Asset | Catalog ID | Base | Rating |
| --- | --- | --- | ---: |
| giant-eagle | monsters/beast/giant-eagle | bird kind: egg body, white head, folded wings | 7.7 |
| roc | monsters/beast/roc | bird kind: big head, red crest and bib, raised wings | 7.6 |
| cockatrice | monsters/beast/cockatrice | bird kind: short beak, comb and wattle, serpent tail on three bones | 7.6 |

- New factory `assets/parts/bird-kind.ts`: an egg body, a head with painted eyes, a hooked or a
  short beak with a jaw, feathered thighs, scaly shins, four-toed feet with talons, a fan tail, and
  the griffin's wings; the clips idle, walk (a waddle, feet planted with `motion.plant`), fly (the
  griffin's `motion.orient` wing beat), attack (a rear-up and a peck), hit, and death. Options:
  body and head sizes, beak, brows, eye size, wing rest angle, wing turn, wing size, tail, bones,
  paint, extra, and pose. It also serves the 13 wildlife birds later.
- A folded wing hangs beside the body with a rest turn of -95 degrees about Z and -35 about Y; a
  rest turn about Z alone spreads the wing out like an arm.
- The image model drew no bird on four legs, so the griffin body did not fit these rows.
- All three: `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Next

- [x] Task: Put the griffin into the three griffin games. Done in the track `game_griffin_mount_20261004`.
- [x] Task: Batch 3: the ten elementals on a factory from the ghost (one floating body plan, element features).
- [x] Task: Batch 4: monsters on existing bases (spirit, imp, dragon, and boar kinds, and a griffin copy).
- [x] Task: Batch 5: twelve monsters on horse, wolf, spider, ogre, golem, and goblin kinds.
- [x] Task: Batch 6: giant-lizard, basilisk, kitsune, scorpion, and giant-crab on dragon, wolf, and spider kinds.
- [x] Task: Batch 7: abyssal-beast, dire-bear, owlbear, fairy-sprite, succubus, eldritch-eye, eldritch-horror, and mushroom-creature on six kinds.
- [x] Task: Batch 8: giant-eagle, roc, and cockatrice on a new bird kind.
- [ ] Task: Batch 9: the next monsters (19 rows are open: void-tentacle, chimera, giant-snake, giant-toad, hydra, kraken, manticore, sea-serpent, wyvern, lindworm, centaur, dryad, satyr, selkie, treant, ancient-treant, cave-worm, centipede, pixie-swarm); candidates: a serpent kind (giant-snake, sea-serpent, cave-worm, lindworm, hydra), treants on the golem kind, centaur on the horse kind.
