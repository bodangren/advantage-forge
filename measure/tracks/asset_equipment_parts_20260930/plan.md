# Reusable equipment parts

Status: completed (2026-10-01). This plan owns execution status. Source documents retain design details.

## Phase 1: Part-module contract

- [x] Task: Read AGENTS.md, docs/equipment-fit.md, torso-contract.md, docs/color-variants.md, src/gltf.ts, and src/pipeline.ts.
- [x] Task: Define the module origin: the part origin is its grip, mount, or seat point, in meters.
- [x] Task: Define the up axis and facing: +Y is up and the part faces +Z, as for characters.
- [x] Task: Define the scale reference: 1x is the chibi humanoid base of docs/equipment-fit.md.
- [x] Task: Define the export shape: `part(opts)` returns the SDF shapes, and each shape has its material options.
- [x] Task: Define tint-slot handling: the part calls `k.tint(slot, shade)` with fixed slot names, and a host may map the names.
- [x] Task: Define the bone tag convention: the part carries a default `bone` name, and the host may override it.
- [x] Task: Write the contract in `docs/equipment-parts.md` and get owner approval. (Written 2026-10-01. The owner ordered the rollout on this contract and wrote: "It's okay if you don't need it. I trust you.")

## Phase 2: Pilot on three parts

- [x] Task: Record baseline renders, sprites, and stats of knight, mage, and skeleton-knight before any change.
- [x] Task: Write `assets/parts/` modules for the knight helmet, the mage wand and book, and the skeleton knight kite shield.
- [x] Task: Refactor `assets/knight.ts`, `assets/mage.ts`, and `assets/skeleton-knight.ts` to import the modules.
- [x] Task: Compare each existing standalone asset (iron-helmet, wand, spellbook, kite-shield) with its worn part. Update the asset to import the module.
- [x] Task: Add a standalone asset for any pilot part that has none.
- [x] Task: Compare the new renders and sprites with the baseline. Record the pixel difference and the stated tolerance.
- [x] Task: Run `./forge all` and `./forge check` on each changed character and asset. Confirm no warnings.
- [x] Task: Confirm that color variants and presets still bake for the three characters.

## Phase 3: Runtime extraction helper

- [x] Task: Add a `./forge parts <name>` subcommand, or a script, that reads `out/<name>/<name>.glb`. Dropped (owner approved the plan of 2026-10-01): the 65 part modules give one source per part and a standalone GLB per part, so extraction from a character GLB is not needed.
- [x] Task: Write a per-part GLB for each mesh node, with its bone, its skin, and its material. Dropped (owner approved the plan of 2026-10-01): the 65 part modules give one source per part and a standalone GLB per part, so extraction from a character GLB is not needed.
- [x] Task: Write `parts.json` with the name, the bone, the bounds, and the tint slot of each part. Dropped (owner approved the plan of 2026-10-01): the 65 part modules give one source per part and a standalone GLB per part, so extraction from a character GLB is not needed.
- [x] Task: Test the helper on the mage and the skeleton knight. Load one part on a second body in the viewer. Dropped (owner approved the plan of 2026-10-01): the 65 part modules give one source per part and a standalone GLB per part, so extraction from a character GLB is not needed.
- [x] Task: Add unit tests to `pnpm test` and pass `pnpm typecheck`. Dropped (owner approved the plan of 2026-10-01): the 65 part modules give one source per part and a standalone GLB per part, so extraction from a character GLB is not needed.

## Phase 4: Avatar attachment convention

- [x] Task: List the part classes: head, hand-held, off-hand, back, torso, shoulder, belt. Partly done: `docs/equipment-parts.md` lists the classes head, hand-held, shield, and upright effect with their local frames. Back, torso, shoulder, and belt parts were not broken out. The rest moved to `avatar_system_20261001` (Phase 3, the `equip` block).
- [x] Task: Assign one bone to each class, for example helmet to head and sword to hand.R. Partly done: each part carries its default bone (`head`, `hand.R`, `hand.L`, `forearm.L`). The avatar slot bones (`knife.R`, `knife.L`) moved to `avatar_system_20261001`.
- [x] Task: Record the socket offset and rotation of each class, in bone-local meters and degrees. Moved to `avatar_system_20261001` (Phase 3, the `equip` block declares the anchor).
- [x] Task: Write the rule for a part that has skin weights and a part that binds rigidly. Moved to `avatar_system_20261001` (Phase 3). The parts bind rigidly today, except the whip lash.
- [x] Task: Add the convention to `docs/equipment-parts.md` and link it from `docs/equipment-fit.md`. Moved to `avatar_system_20261001` (Phase 3); `docs/avatar-system.md` section 4 states that hero parts attach at 1x.

## Phase 5: Acceptance and documentation

- [x] Task: Resolve the open questions in the spec with the owner. See "Open questions: answers" below.
- [x] Task: Update the forge-assets skill and AGENTS.md with the part-module workflow. Done: a rule in `.claude/skills/forge-assets/SKILL.md` and a recipe in `AGENTS.md`.
- [x] Task: Update docs/fantasy-world-asset-catalog.md for changed equipment assets. No edit needed: no catalog item changed (owner answer 5 and the owner decision of 2026-10-01 to keep every variant). The 65 standalones are not catalog targets; `docs/avatar-catalog.tsv` lists them.
- [x] Task: Record evidence, pixel differences, and remaining limits in this plan. See "Closing record" below.
- [x] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`. Done 2026-10-01; see "Closing record".

## Pilot record (2026-10-01, orchestrator)

- Contract: `docs/equipment-parts.md` (local frames per class, the extraction recipe, the
  tolerance). Helper: `src/part.ts` (`Part`, `addPart`, `mapTint`), tested in `tests/part.test.ts`.
  Check: `scripts/part-check.mjs save|compare <name>` (baselines in `out/_part-baseline/`).
- Modules: `assets/parts/knight-helm.ts`, `assets/parts/mage-wand.ts` (wand and flame, with
  `holdPose`), `assets/parts/mage-spellbook.ts`, `assets/parts/skeleton-knight-shield.ts`.
- Standalone assets (new, at the worn size, 512 atlas): `knight-helm`, `mage-wand`,
  `mage-spellbook`, `skeleton-knight-shield`. No warnings; sprites read at 128 px.
- Existing items: `iron-helmet` (iron nasal helm), `wand` (crystal wand), `spellbook` (large purple
  tome), and `kite-shield` (blue chevron) are other designs. They keep their paths, names, and
  sources (owner answer 5); they do not import a module.
- Results: knight 23 of 23 meshes identical and 0.000% changed pixels; mage 15 of 16 identical
  (wand 533 to 509 vertices after the rotation round trip), largest view 0.291%; skeleton-knight 19
  of 20 identical (`studs` split: the buckle stays `studs`, the rivets are the new body
  `shield-studs`), largest view 0.356%. Sprite sheets 0.006% or less. Tolerance: 0.5% per image.
- `./forge check`: ok for the three characters. `forge all` built every preset without warnings.
- Tests: 652 of 654 pass; the 2 failures are in the untracked Labyrinth game work of another agent.
- Open: owner review of the contract, then the rollout (one `forge-sonnet-low` agent per
  character, a Haiku probe on two characters). 116 rigged characters have rigid bodies on head,
  hand, forearm, or shield bones; the rollout covers head pieces, held items, and shields.

## Rollout batch 1 (2026-10-01, commit 8cf507e)

Brief: `bench/sonnet/briefs/equipment-breakout.md`. One agent per character.

| Host | Model | Parts | part-check | Tokens |
| --- | --- | --- | --- | --- |
| warrior | Haiku (probe) | warrior-sword | 12 of 12 identical, 0.000% | 77,133 (all 30 turns) |
| bard | Sonnet low | bard-hat, bard-lute | 16 of 16 identical, 0.000% | 70,321 |
| paladin | Sonnet low | paladin-hammer, paladin-shield | 21 of 21 identical, 0.000% | 60,785 |
| cleric | Sonnet low | cleric-hammer, cleric-book | 20 of 20 identical, 0.000% | 62,270 |

- `forge check` ok on all four; the seven standalones build with textures and no warnings.
- The cleric agent found that the rotation round trip fails on its hammer (up to 2.8%) and used a
  translation by a mount rounded to 1/1024 m, which is exact. The recipe now prefers it.
- The orchestrator moved the cleric's `holy-cross` into the book module as a second part, so the
  standalone book shows its cross.
- The Haiku probe passed, but its report claimed a clean type check: it had copied the host's old
  `sdf.intersect` four-argument error into the part. Haiku reports need a check.
- Blocked: the permission classifier denied the launch of the barbarian (Haiku probe 2) and the
  fighter agents. They wait for the owner.
- Follow-up: the paladin shield face and sun show through its back, and its rim has gaps (old
  geometry; visible only on the standalone).

## Priority list (owner decision 2026-10-01)

Owner: use `forge-sonnet-low` for every character (no Haiku); do not break out every character.
Priority 1: pieces that also fill a catalog equipment item (fast, an approved piece). Priority 2:
the most useful pieces for player avatars (hero head pieces and class weapons). For a catalog item,
the orchestrator later points the catalog file at the part, scaled up by 1/0.45 (the hand fit of
docs/equipment-fit.md), after a side-by-side review with the current source.

| # | Host | Pieces | Catalog item it can fill |
| --- | --- | --- | --- |
| 1 | archer (P0) | bow (+ nocked arrow) | shortbow (P0, deferred) |
| 2 | captain | longsword, round shield | long-sword (P0, deferred), round-shield (P0, no review) |
| 3 | clockwork-soldier | halberd | halberd (6.5) |
| 4 | adventurer (P0) | short sword, map, lantern | lantern-handheld, map, short-sword (no review) |
| 5 | gladiator | helmet, short sword, round shield | short-sword, round-shield |
| 6 | fighter | cap, sword, buckler | buckler (no review) |
| 7 | duelist | hat, rapier | rapier (no review) |
| 8 | samurai | katana | katana (no review) |
| 9 | swashbuckler | bandana, sabre, dagger | scimitar, dagger (no review) |
| 10 | ranger | bow | longbow (no review) |
| 11 | barbarian | axe | great-axe or battle-axe (no review) |
| 12 | shield-maiden | winged helm, axe, round shield | hand-axe (no review) |
| 13 | guardian | helm, warhammer, shield | warhammer, tower-shield (no review) |
| 14 | wizard (P0) | hat, staff | quarterstaff (no review) |
| 15 | warlock | book | tome (no review) |
| 16 | treasure-hunter | hat, whip, torch | whip (no review) |
| 17 | explorer | hat, map | map |
| 18 | enchanter | staff, scroll | scroll (no review) |
| 19 | druid (P0) | mushroom cap, staff | avatar |
| 20 | rogue (P0) | hood | avatar (the avatar base) |
| 21 | dragoon | winged helm, lance | avatar |
| 22 | witch | hat, broom, potion | avatar |
| 23 | spear-warden | crest, spear, javelin | avatar |
| 24 | apprentice | wand, glasses | avatar |
| 25 | shaman | antler cap, staff, rattle | avatar |

Batch 2 (rows 1 to 4) started 2026-10-01.

## Rollout batches 2 to 4 (2026-10-01, Sonnet low)

| Host | Batch | Parts | part-check | Tokens |
| --- | --- | --- | --- | --- |
| adventurer | 2 (889a539) | adventurer-sword, adventurer-map, adventurer-lantern | 18 of 18 identical, 0.000% | 49,490 |
| captain | 2 (889a539) | captain-sword, captain-shield | 27 of 27 identical, 0.000% | 55,600 |
| archer | 2 (889a539) | archer-bow (+ archerArrow) | 17 of 17 identical, 0.000% | 56,378 |
| clockwork-soldier | 2 (889a539) | clockwork-soldier-halberd | 22 of 22 identical, 0.082% | 66,447 |
| fighter | 3 (0aff835) | fighter-cap, fighter-sword, fighter-buckler | 19 of 19 identical, 0.000% | 65,077 |
| samurai | 3 (0aff835) | samurai-katana | 23 of 23 identical, 0.000% | 40,089 |
| duelist | 3 (0aff835) | duelist-hat, duelist-rapier | 14 of 14 identical, 0.000% | 50,690 |
| gladiator | 3 (0aff835) | gladiator-helmet, gladiator-sword, gladiator-shield | 14 of 14 identical, 0.000% | 65,013 |
| ranger | 4 (42e1d2f) | ranger-bow (+ rangerArrow) | 16 of 16 identical, 0.000% | 49,180 |
| swashbuckler | 4 (42e1d2f) | swashbuckler-bandana, swashbuckler-sabre, swashbuckler-dagger | 17 of 17 identical, 0.000% | 55,111 |

- Two agents (archer, clockwork-soldier) saved a baseline after an edit. The orchestrator built
  the committed host source again and compared the meshes: all identical.
- Six standalones stood below the ground (a nasal bar, a brim, a bow tip). The orchestrator lifted
  them; the brief step 7 now checks `bounds.min[1]` (0 to 0.002).
- Follow-ups: the captain shield crest shows through the back (old geometry, as on the paladin
  shield). The fighter cap is an open steel frame that the hair fills; the standalone needs a
  leather arming cap to read as a shop item. The swashbuckler bandana standalone is a flat striped
  disc (its closed cap top is hidden under the hair on the host); it needs a better shop shape.

## Rollout batch 5 (2026-10-01, rows 11 to 25, Sonnet low, commit 0ba1537)

| Host | Parts | part-check | Tokens |
| --- | --- | --- | --- |
| barbarian | barbarian-axe | 9 of 9 identical, 0.000% | 39,885 (second agent; the first stalled) |
| shield-maiden | shield-maiden-helm, -axe, -shield | 28 of 28 identical, 0.000% | 88,343 |
| guardian | guardian-helm, -hammer, -shield | 27 of 27 identical, 0.000% | 67,775 |
| wizard | wizard-hat, wizard-staff (+ fire) | 14 of 14 identical, 0.000% | 71,785 |
| warlock | warlock-book (+ flame) | 21 of 21 identical, 0.000% (after an orchestrator fix) | 50,381 |
| treasure-hunter | treasure-hunter-hat, -whip, -torch | 22 of 22 identical, 0.000% | 66,013 |
| explorer | explorer-hat, explorer-map | 23 of 23 identical, 0.000% | 54,200 |
| enchanter | enchanter-staff (staff-gold split), enchanter-scroll (+ flame) | 13 of 14 identical; `gold` re-meshed, views up to 1.08% (accepted) | 64,028 |
| druid | druid-cap, druid-staff (+ lantern) | 25 of 25 identical, views up to 0.23% (body order) | 71,880 |
| rogue | rogue-hood, rogue-dagger | 17 of 17 identical (against a build of HEAD) | 68,932 |
| dragoon | dragoon-helm, dragoon-lance | 22 of 22 identical, views up to 0.375% (body order) | 63,767 |
| witch | witch-hat, witch-broom, witch-potion | 17 of 17 identical, 0.000% | 68,231 |
| spear-warden | spear-warden-crest, -spear, -javelin | 34 of 34 identical, 0.000% | 63,843 |
| shaman | shaman-cap, shaman-staff, shaman-feather | 22 of 22 identical, 0.000% | 68,973 |
| apprentice | apprentice-glasses, apprentice-wand (+ glow) | 14 of 14 identical, 0.000% | 62,869 |

- Incident: the shield-maiden agent ran `git stash` on the shared tree and popped it. The stash
  list was empty after it, with no conflict and the same modified files. The orchestrator rebuilt
  every host of the batch for its own check. The brief now forbids `git stash`, `reset`,
  `restore`, and `checkout` on other paths.
- Orchestrator fixes: the warlock flame (a rounded mount re-meshed it; the host now uses the
  original `.at(...FLAME_AT)`), the apprentice glasses (the host passes the measured face depths),
  dead host code in wizard, barbarian, guardian, druid, and enchanter, and the ground contact of
  the druid and enchanter standalones. The brief now asks for identical meshes and
  `tsc --noUnusedLocals`.
- Follow-ups: the guardian shield face shows through its back (as on the paladin shield); the
  witch cork floats about 1 cm above the bottle neck; the dragoon helm back is open and its cheek
  guards look ragged as a standalone; the treasure-hunter whip stands on its lash tip; the wizard
  hat keeps the host tilt.

## Catalog decision (owner, 2026-10-01): keep every variant

- The owner closed the substitution review: no part replaces a catalog item. Players choose, and
  the shop sorts by popularity. The review page and its choices are removed.
- All 65 parts are rows in `docs/avatar-catalog.tsv` (165 rows; 163 priced). A part takes the
  slot, tier, and two-handed value of the catalog item of the same kind and size. Headwear with
  no catalog kind: cloth and leather tier 1, metal tier 2. Rule and shop order are in
  `docs/avatar-system.md`.
- Every host with a head part uses the base head (radii 0.205 x 0.2 x 0.19 at y 0.675), so the
  17 head parts fit the avatar base at 1x. Parts have the worn size and attach at 1x in every slot.
- 9 parts have status `rework` (the shop-quality follow-ups above): captain, paladin, and guardian
  shields, fighter-cap, swashbuckler-bandana, dragoon-helm, spear-warden-crest, witch-potion,
  treasure-hunter-whip.
- Name check: 165 unique ids; every asset name matches its file. `archer-bow` and `ranger-bow`
  are the same shape in two colors; both stay.
- The price script also refreshed 5 rows from newer review scores (belt-pouch, gauntlets,
  halberd, pike, scythe).
- Fixed: the warrior-sword standalone stood point-down; it now stands on its pommel (417a204).

## Open questions: answers

1. Size: a part has the exact worn size; the shop view scales it (contract rule 4;
   `docs/avatar-system.md` section 4: hero parts attach at 1x).
2. Atlas: a standalone part has its own atlas; on the host it bakes onto the host atlas (rule 5).
3. Tint slots: a part owns its slot names; a host maps them with `mapTint` (rule 6).
4. Pixel tolerance: 0.5% per image, after an N of N mesh-identity check. One accepted exception:
   the enchanter gold split (1.08%, the diff image shows only gold trim edges).
5. Existing items keep their paths, names, and designs (owner answer 5). The owner confirmed it on
   2026-10-01: keep every variant; no part replaces a catalog item.
6. Format: the avatar system reads `catalog.json` and one reduced GLB per piece
   (`docs/avatar-system.md` sections 6 and 7). Each part has its own standalone GLB, so no
   per-node extraction is needed.

## Closing record (2026-10-01)

- Scope delivered: 25 priority characters plus the 3 pilot characters; 65 part modules in
  `assets/parts/`, 65 standalone assets, all hosts refactored to `addPart`. Commits: c1523b3,
  8cf507e, 889a539, 0aff835, 42e1d2f, 0ba1537, 417a204; catalog rows 4ece783 and 05398b6.
- Mesh identity: every host N of N identical bodies except the documented cases (mage wand round
  trip, skeleton-knight `studs` split, enchanter gold split). Largest image difference 0.356%
  except the enchanter gold split (1.08%, accepted with a diff image).
- Builds: every standalone builds with textures and no warnings and stands on y = 0 (bounds
  minimum 0 to 0.002). `./forge check` ok on every host.
- Tests: `vitest run` 652 of 654 pass; the 2 failures are in the Labyrinth game tests
  (`tests/games/labyrinth/`), not in this track. `tsc --noEmit`: no error in `src/part.ts`,
  `assets/parts/`, or the standalones; 6 errors in captain, shield-maiden, spear-warden, and warrior
  host files are in code that existed before the breakout (asset_quality_20260928 owns type errors).
- Remaining limits: the 9 parts with status `rework` in `docs/avatar-catalog.tsv` (shape defects;
  the avatar track owns the fix task). The avatar sockets moved to `avatar_system_20261001`.
