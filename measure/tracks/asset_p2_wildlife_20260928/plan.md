# Produce P2 wildlife

Status: in progress (started 2026-10-05). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map (ten batches by kind, below).
- [x] Task: Record scale, palette, rig, clips, and game uses before generation (the design note at the top of each source).

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials (sizes below).

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Acceptance checks (all batches)

Bar 7.5/10 (characters). Each asset needs: a mockup in `docs/wildlife-mockups/` (mmx, clay-toy
chibi style, rated G), a design note at the top of the source, a turnaround that matches the
mockup in silhouette and color, readable 8-direction sprites at 128 px, `./forge check <name>`
with `ground ok`, a `forge all` build with no `warning:` lines, a clip strip for each clip, and a
review entry in `docs/character-reviews.json` (group "Wildlife").

Sizes follow the 1 m chibi hero: a riding animal about 1.1 to 1.3 m to the ears, a farm animal
0.6 to 1.1 m, a pet or small bird 0.25 to 0.5 m, an insect 0.15 to 0.25 m. A small animal reuses
a kind factory at the kind's own size and then scales the whole asset (bodies, joints, clip
moves, cell sizes) with `assets/parts/scale-asset.ts`.

## Batches (by kind factory)

| Batch | Rows | Base |
| ---: | --- | --- |
| 1 | riding-horse, warhorse, pony, donkey, mule | horse kind (tack, ears, mane, and tail options) |
| 2 | stag, elk, moose, goat, pack-goat, sheep | a deer kind factory from `assets/deer.ts` |
| 3 | cow, ox, yak, camel | horse kind (horns, hump) |
| 4 | wolf, dog, fox, cat, familiar-cat, riding-wolf | wolf kind |
| 5 | boar, bear, pig, badger, hedgehog | boar kind |
| 6 | crow, raven, familiar-raven, eagle, falcon, hawk, owl, familiar-owl, pigeon, messenger-bird, sparrow, chicken, rooster | bird kind |
| 7 | hare, rabbit, squirrel, bat | small quadrupeds; bat from giant-bat |
| 8 | bee, wasp, butterfly, moth | a new insect kind |
| 9 | fish, salmon, trout, dolphin, eel, seal, crab, octopus, frog, turtle, crocodile | a new fish kind, serpent, spider, octopus, toad, and dragon kinds |
| 10 | dragon-mount, gryphon-mount, riding-lizard | dragon kind and the griffin |

Game uses: the mounts carry heroes in the rider games (Dragon Rider, the griffin games); the farm
animals and pets fill the village and hamlet scenes; the wild animals are ambient life and
targets in the hunting and nature games; the familiars follow the hero (avatar pets later).

## Batch 1 (2026-10-05): mounts on the horse kind

| Asset | Catalog ID | Kind features | Rating |
| --- | --- | --- | ---: |
| riding-horse | wildlife/mounts-and-pets/riding-horse | saddle, stirrups, breast strap, and a blue blanket with a gold trim | 7.7 |
| warhorse | wildlife/mounts-and-pets/warhorse | silver chanfron, red plume, red peytral with gold suns, caparison, white feathering | 7.8 |
| pony | wildlife/mounts-and-pets/pony | 0.78 scale, curly topknot (no forelock), larger eyes, a patch slot | 7.5 |
| donkey | wildlife/mounts-and-pets/donkey | 0.88 scale, long wide ears, brush mane, tufted tail, back and thigh stripes | 7.7 |
| mule | wildlife/mounts-and-pets/mule | 0.93 scale, long ears, brush mane, rope halter, pack saddle with baskets and a roll | 7.7 |

- New horse kind options, all default-safe (`node scripts/mesh-same.mjs` gave SAME for horse,
  unicorn, kelpie, and centaur): `ears`, `earWidth`, `earSpread`, `mane` ('brush'), `tail`
  ('tuft'), `forelock`, `eyeScale`, and the `trunk` shape for tack.
- `assets/parts/horse-tack.ts`: a riding saddle and a pack saddle that fit over the trunk.
- `assets/parts/scale-asset.ts`: scales a whole asset (bodies, joints, clip moves, cell sizes).
- All five: the seven horse clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx
  (with the horse mockup as the subject reference).

## Batch 2 (2026-10-05): deer kind factory

| Asset | Catalog ID | Kind features | Rating |
| --- | --- | --- | ---: |
| stag | wildlife/land/stag | 1.15 scale, thick branching antlers, red-brown coat, cream lower face | 7.7 |
| elk | wildlife/land/elk | 1.3 scale, wide swept antlers, dark ruff slot, tan coat, pale rump | 7.6 |
| moose | wildlife/land/moose | 1.4 scale, palm antlers, droopy snout, beard bell, hump, pale stockings | 7.7 |
| goat | wildlife/land/goat | 0.85 scale, drooping ears, curled ridged horns, beard, patches | 7.6 |
| pack-goat | wildlife/mounts-and-pets/pack-goat | 0.95 scale, spiral horns, beard, red pad, canvas bags | 7.6 |
| sheep | wildlife/land/sheep | 0.8 scale, lumpy wool coat and cap on a wool slot, pink cheeks | 7.8 |

- `assets/deer.ts` (P0) now calls `deerAsset` in `assets/parts/deer-kind.ts`;
  `node scripts/mesh-same.mjs deer` gave SAME. Kind options: `mask`, `bib`, `spots`, `antlers`,
  `nose`, `earTilt`, `earTurn`, `earScale`, `headProbes` (antler and horn tips for the death
  roll), `bulk` (coats and packs), and the `paint` and `extra` hooks; `antlerShape` builds a beam
  with tines.
- All six: the seven deer clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx
  (stag, elk, and moose with the deer mockup as the subject reference; the pack goat mockup was
  made again from the side because the first one stood like a biped).

## Batch 3 (2026-10-05): large farm and desert animals

| Asset | Catalog ID | Base and features | Rating |
| --- | --- | --- | ---: |
| cow | wildlife/land/cow | horse kind, side ears, wide pink muzzle, horns, black patches, collar and bell | 7.7 |
| ox | wildlife/land/ox | horse kind at 1.05, wide horns, brows, rope collar and bell | 7.6 |
| yak | wildlife/land/yak | horse kind at 0.95, hanging coat of strands, mop, horns | 7.6 |
| camel | wildlife/land/camel | deer kind at 1.35, hump, woven blanket, droopy snout, lashes | 7.5 |

- New horse kind options `earAt` and `muzzleScale`; new deer kind option `nose` (both
  default-safe: horse and deer mesh-same SAME). The cow has no udder (rated G).
- All four: the kind clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx (no
  subject reference).
