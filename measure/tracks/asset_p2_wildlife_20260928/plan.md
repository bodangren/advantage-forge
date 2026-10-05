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

- New horse kind options, all default-safe (`node scripts/mesh-same.mjs <base> --rev 0576147^
  --part assets/parts/horse-kind.ts` gave SAME for horse, unicorn, kelpie, nightmare, and
  centaur on 2026-10-05; the first check without `--part` compared the working kind with itself):
  `ears`, `earWidth`, `earSpread`, `mane` ('brush'), `tail`
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
  default-safe: the horse kind check above, and `mesh-same deer --rev 0576147^` SAME against the
  inline deer). The cow has no udder (rated G).
- All four: the kind clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx (no
  subject reference).

## Batch 4 (2026-10-05): wolf kind and a cat helper

| Asset | Catalog ID | Base and features | Rating |
| --- | --- | --- | ---: |
| wolf | wildlife/forest/wolf | wolf kind at 0.9, dark friendly eyes, smile, smooth ruff, darker back | 7.6 |
| fox | wildlife/forest/fox | wolf kind at 0.75, big black-tipped ears, white cheeks, black socks, bushy white-tipped tail | 7.7 |
| dog | wildlife/mounts-and-pets/dog | wolf kind at 0.72, floppy ears slot, brow marks, tongue, red collar with a gold tag, curled tail | 7.7 |
| cat | wildlife/mounts-and-pets/cat | cat helper, orange tabby stripes, green eyes, whiskers, white paws | 7.6 |
| familiar-cat | wildlife/mounts-and-pets/familiar-cat | cat helper, black fur, glowing violet eyes, collar, moon charm, tail star | 7.6 |
| riding-wolf | wildlife/mounts-and-pets/riding-wolf | wolf kind at 1.45, saddle, blanket slot, harness, and stirrups fitted to the wolf trunk | 7.5 |

- New wolf kind options, all default-safe (`mesh-same <base> --part assets/parts/wolf-kind.ts`
  SAME for dire-wolf, kitsune, manticore, shadow-hound, displacer-beast, abyssal-beast, and
  chimera): `cheekTufts`, `ruff` ('smooth'), `ears`, `eyeScale`, `pupilScale`, `smileArc`,
  `noseScale`, `claws`, and a `tone` argument to the `paint` hook.
- `assets/parts/cat-kind.ts`: `catAsset` sets the wolf kind for a cat (big eyes and pupils, a small
  nose, a smooth ruff, whiskers, white paws, optional tabby stripes, a long curled tail) and scales
  it to 0.6.
- `scripts/mesh-same.mjs --part <part>`: the committed build imports the committed copy of the
  part, so a kind edit is compared too.
- All six: the wolf kind clips, `ground ok`, `forge all` with 0 warnings, a mockup from mmx.

## Batch 5 (2026-10-05): boar kind with friendly faces

| Asset | Catalog ID | Base and features | Rating |
| --- | --- | --- | ---: |
| boar | wildlife/forest/boar | boar kind at 0.8, big dark eyes, short tusks, low mane, no brows or teeth | 7.7 |
| pig | wildlife/land/pig | boar kind at 0.75, pink skin, rosy cheeks, smile, curly tail | 7.7 |
| bear | wildlife/forest/bear | the dire bear setup at 0.82, a friendly cub face, tan muzzle | 7.7 |
| badger | wildlife/forest/badger | bear setup at 0.62, longer muzzle, striped white face, rimmed ears, black legs | 7.6 |
| hedgehog | wildlife/forest/hedgehog | bear setup at 0.45, long muzzle, a spine dome slot with cones along its normals | 7.5 |

- New boar kind options, all default-safe (`mesh-same <base> --part assets/parts/boar-kind.ts`
  SAME for horned-boar, giant-boar, and dire-bear; a 2 mm test change gave DIFF): `brows`,
  `lids`, `teeth`, `tail` ('long', 'stub', 'curl'), `muzzleLength`, and deeper eyes when
  `eyeScale` is above 1.
- The bear and the hedgehog mockups were made again from the side without a subject reference,
  because the first ones stood like bipeds.
- All five: the boar kind clips, `ground ok`, `forge all` with 0 warnings.
- Kind audit (2026-10-05): for all 16 committed kinds, each asset that used the kind at the
  commit that added it was built at that commit and with the working kind
  (`mesh-same <asset> --rev <commit> --part assets/parts/<kind>.ts`): 63 of 63 SAME. So every
  later kind option is default-safe, also those that the earlier checks without `--part` did not
  test.

## Batches 6 to 9 (2026-10-05): birds, small animals, insects, and water animals

| Batch | Assets | Base |
| ---: | --- | --- |
| 6 | crow, raven, familiar-raven, eagle, hawk, falcon, owl, familiar-owl, pigeon, sparrow, rooster, chicken, messenger-bird | bird kind (`assets/parts/bird-kind.ts`) at a small scale, with `assets/parts/bird-extras.ts` (glowing eyes, ribbons, letter tube) |
| 7 | rabbit, squirrel, bat | a new sitter kind (`assets/parts/sitter-kind.ts`); the bat kind (`assets/parts/bat-kind.ts`) holds the giant bat |
| 7 | hare | deer kind with a puff tail, round paws, a bent hock, and an oval bib |
| 8 | bee, wasp, butterfly, moth | a new insect kind (`assets/parts/insect-kind.ts`) |
| 9 | fish, trout, salmon, seal, dolphin | a new fish kind (`assets/parts/fish-kind.ts`) |
| 9 | eel | serpent kind with its own head merged into the neck |
| 9 | crab | its own round clay-toy body; the giant crab moved to `assets/parts/crab-kind.ts` |
| 9 | frog | toad kind, new form `'frog'` (the giant toad is unchanged) |
| 9 | octopus, turtle, crocodile | octopus kind; turtle and a new lizard kind (`assets/parts/lizard-kind.ts`) |

Default safety of kind edits: `mesh-same <asset> --part <kind>` SAME for giant-eagle, roc, and
cockatrice (bird kind), giant-toad (toad kind), and deer, goat, and sheep (deer kind). The new
kinds (sitter, insect, fish, lizard, crab, bat) are not committed yet, so `mesh-same` cannot
compare them; their options are additive with defaults that keep the earlier shape.

## Independent review (owner decision 2026-10-05)

The owner decided that self-evaluation is not acceptable. A separate reviewer agent rates each
batch from review cards (`scripts/review-cards.py`: mockup, four views, 128 px sprites, and one
clip strip) with the brief in `measure/tracks/asset_review_audit_20261005/reviewer-brief.md`. The
reviewer does not see the sources or the earlier ratings. `scripts/record-reviews.py` writes the
ratings to `docs/character-reviews.json`. The reviewer JSON files are in `reviews/`. The ratings
in the batch 1 to 5 tables above are the builder's own ratings and are replaced by this table.

| Asset | Reviews | First | Latest | Status |
| --- | ---: | ---: | ---: | --- |
| octopus | 3 | 7.0 | 8.0 | accepted |
| bat | 2 | 4.5 | 7.5 | accepted |
| butterfly | 4 | 6.0 | 7.5 | accepted |
| crab | 2 | 6.0 | 7.5 | accepted |
| crow | 3 | 6.0 | 7.5 | accepted |
| dolphin | 2 | 6.5 | 7.5 | accepted |
| fish | 1 | 7.5 | 7.5 | accepted |
| hare | 5 | 4.5 | 7.5 | accepted |
| hedgehog | 2 | 6.0 | 7.5 | accepted |
| owl | 3 | 6.0 | 7.5 | accepted |
| rabbit | 4 | 6.0 | 7.5 | accepted |
| stag | 2 | 6.5 | 7.5 | accepted |
| turtle | 1 | 7.5 | 7.5 | accepted |
| bear | 3 | 7.0 | 7.0 | accepted |
| boar | 3 | 6.5 | 7.0 | accepted |
| cat | 3 | 6.5 | 7.0 | accepted |
| chicken | 5 | 6.5 | 7.0 | accepted |
| cow | 1 | 7.0 | 7.0 | accepted |
| crocodile | 4 | 7.0 | 7.0 | accepted |
| dog | 3 | 6.5 | 7.0 | accepted |
| donkey | 1 | 7.0 | 7.0 | accepted |
| eagle | 5 | 6.0 | 7.0 | accepted |
| eel | 3 | 6.0 | 7.0 | accepted |
| falcon | 5 | 5.5 | 7.0 | accepted |
| familiar-cat | 3 | 6.5 | 7.0 | accepted |
| familiar-owl | 5 | 6.0 | 7.0 | accepted |
| goat | 2 | 6.5 | 7.0 | accepted |
| messenger-bird | 4 | 6.0 | 7.0 | accepted |
| moose | 2 | 6.0 | 7.0 | accepted |
| mule | 1 | 7.0 | 7.0 | accepted |
| ox | 1 | 7.0 | 7.0 | accepted |
| pig | 3 | 6.5 | 7.0 | accepted |
| pigeon | 4 | 5.5 | 7.0 | accepted |
| raven | 4 | 5.5 | 7.0 | accepted |
| riding-horse | 1 | 7.0 | 7.0 | accepted |
| salmon | 3 | 7.0 | 7.0 | accepted |
| seal | 3 | 6.5 | 7.0 | accepted |
| sparrow | 5 | 5.5 | 7.0 | accepted |
| trout | 4 | 7.0 | 7.0 | accepted |
| warhorse | 1 | 7.0 | 7.0 | accepted |
| wasp | 4 | 5.0 | 7.0 | accepted |
| yak | 1 | 7.0 | 7.0 | accepted |
| badger | 3 | 6.5 | 6.5 | rework |
| bee | 5 | 5.5 | 6.5 | rework |
| elk | 2 | 6.5 | 6.5 | rework |
| fox | 3 | 6.0 | 6.5 | rework |
| frog | 4 | 5.5 | 6.5 | rework |
| hawk | 5 | 6.0 | 6.5 | rework |
| moth | 6 | 4.5 | 6.5 | rework |
| pony | 2 | 6.5 | 6.5 | rework |
| riding-wolf | 3 | 6.0 | 6.5 | rework |
| rooster | 5 | 5.5 | 6.5 | rework |
| sheep | 2 | 6.0 | 6.5 | rework |
| familiar-raven | 5 | 6.0 | 6.0 | rework |
| pack-goat | 2 | 6.0 | 6.0 | rework |
| squirrel | 5 | 5.5 | 6.0 | rework |
| wolf | 3 | 6.5 | 6.0 | rework |
| camel | 2 | 5.5 | 5.5 | rework |

Bar decision. Owner, 2026-10-05: "We can drop the rating to 7.0. How does that affect the pass
rate?" The wildlife bar is 7.0 from this date; the table marks 7.0 and higher as accepted. The
reviewers still rate against the brief, and their ratings stay as they are. Proposal (open,
waiting for the owner): after three reviews below the bar, record the rating, put the asset on a
follow-up list, and move on.

Status on 2026-10-05 after 17 review rounds: 42 of 58 reviewed assets are at 7.0 or higher (13 at
7.5 or higher).
Review files in time order: wildlife-b1-3.json, wildlife-b4-5.json, wildlife-b6.json, wildlife-b6-r2.json, wildlife-b7-8.json, wildlife-b78-r2.json, wildlife-b9.json, wildlife-b89-r2.json, wildlife-b78-r3.json, wildlife-b6-r3.json, wildlife-r4.json, wildlife-b6-r4.json, wildlife-w4.json, wildlife-w5a.json, wildlife-w5b.json, wildlife-w5c.json, wildlife-w5d.json.

Changes in the latest rounds (all kind options are additive; `mesh-same` or a manual GLB compare
shows SAME for the other users of each kind):

- Owner decision of 2026-10-05: the dog, the fox, the cat, and the familiar cat keep a standing
  rest pose and get a `sit` clip (wolf kind option `sit`); the review card shows the sit strip,
  and the reviewer brief judges their pose from it.
- The hedgehog and the badger moved from the boar kind to the lizard kind (a low body on short
  legs): the hedgehog has a coat of cone spines raised along the coat normals; the badger has a
  wedge head. Lizard kind options: `tail: 0` (a round stub) and `tailSway`.
- Boar kind options: `ears: false`, `hoofStyle: 'round'`, `eyeInset`, `claws: false`, and
  `mouth: false`. Wolf kind options: `snout`, `fangs`, `muzzleWidth`, `cheekCream`, and `sit`.
  Deer kind options: `eyeScale` and a `pose` hook (the hare's bound). Bird kind options:
  `stillNeck`, `glint`, `oneBody`, `headLift`, `wingSlim`, `irisScale`, and `clay`.
- The moth's fine fur grooves broke the texture bake (89,000 triangles in thin strands); the
  grooves are now in the normal map (`bump`), and the textured render is clean.

Changes in rounds 14 to 17 (all kind options are additive; `mesh-same` shows SAME for the other
users of each kind: centaur, horse, kelpie, unicorn, nightmare, cow before its rework; deer, hare;
butterfly, wasp; dire-wolf, shadow-hound, kitsune, abyssal-beast, chimera, displacer-beast,
manticore):

- Space warps (`assets/parts/head-swell.ts`, on `Sdf.warp`): `headSwell` grows a head, `stretch`
  (and `legStretch`) makes legs or a body longer or shorter, and `headShift` moves a head and
  stretches the neck. Paint and bone tags follow. `headSwellPoint` and `stretchPoint` move
  rest-pose points the same way, so the clips' ground probes stay on the ground.
- Horse kind: `legLength`, `bodyLength`, `headScale`, `irisScale`, `smile`, `nostrilScale`,
  `eyeSink`, `coatBump`, and the eye on `HorseShape`. Wolf kind: `legLength` and `paintMuzzle`.
  Deer kind: `legThick`, `legLength`, `smile`, `eyeStyle: 'white'`, and `headShift`. Boar kind:
  `pupilScale`, `legLength`, `flatPaws`, and `muzzleWidth`. Bird kind: `tailPose`, `thighs`, and
  `wingThick`. Lizard kind: `legSpread`, `eyeSink`, and `pupils`. Insect kind: `bodySize`,
  `pompom`, and the moth's fluffy `hood` (it replaces the moth-only `strands` ruff).
- `assets/parts/curl-field.ts`: round curls on a surface (the sheep's wool, the pony's topknot,
  the moth's hood).
- The cow keeps no udder (rated G, as in batch 3).

Rework method: one asset at a time from the reviewer's issue list, largest difference first, with
`./forge render <name> --fast` against the mockup, `./forge check <name>` (`ground ok`), and then
`forge all` with no `warning:` lines. A fresh reviewer agent rates each reworked batch.
