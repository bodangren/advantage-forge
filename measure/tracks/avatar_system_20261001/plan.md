# Avatar system: base, equipment fit, pack, composer

Status: completed (2026-10-04: Phases 4 and 5 done: the avatar pack, the portraits, the composer, and the review). The monorepo tables, API, and pages are a monorepo track. The plan records execution state. The specification retains design detail.

## Phase 1: Documents

- [x] Task: Write the program plan (`docs/chibi-quest-progression.md`) and the specification
  (`docs/avatar-system.md`) with the owner decisions of 2026-10-01.

## Phase 2: The avatar base

- [x] Task: Build `assets/avatar-base.ts` on the shared hero skeleton: full skin body, hair, underclothes, 4 tint slots, 4 hair styles as head pieces. (2026-10-01: see "Avatar base record".)
- [x] Task: Add the clips the games use (idle, walk, run, attack, hit, rest, cheer, cast) and pass `forge check`. (2026-10-01: see "Avatar base record".)

## Phase 3: Equipment declaration and fit

- [x] Task: Add the `equip` block to `defineAsset`, validate it against the fit contract, write it to GLB extras. (2026-10-01: see "Equip record".)
- [x] Task: Record the socket of each part class (bone, offset in bone-local meters, rotation in degrees) and the rule for skinned and rigid parts; add it to `docs/equipment-parts.md` and link it from `docs/equipment-fit.md` (moved from `asset_equipment_parts_20260930` Phase 4). (2026-10-01: see "Equip record".)
- [x] Task: Extend `forge check` to equipment: fit bounds, skin intersection in the rest pose, weapon clearance on the base clips. (2026-10-01: show-through replaces the bounds rule; see "Equip record".)
- [x] Task: Make the base clips pass the clearance check with held items: the wrists aim the item (`motion.orient`) in walk, run, attack, cheer, and cast. (2026-10-01.)
- [x] Task: Rework the 10 non-compliant pieces (belt, iron-helmet, steel-helmet, chainmail, leather-armor, horned-helmet, cloth-hood, leather-cap, crown, circlet). (2026-10-01: circlet, crown, leather-cap, leather-armor, and cloth-hood pass on the avatar and are `ready`. 2026-10-02: iron-helmet 7.5, horned-helmet 7.2, and steel-helmet 7.2 are `ready`; the edits of a crashed session were reviewed and finished; see `bench/sonnet/log.tsv`, batch `closeout`. 2026-10-02: belt 7.0 and chainmail 7.0 are `ready`, batch `avatar-fit`.)
- [x] Task: Rework the pieces that the avatar fit check fails (`docs/equipment-fit.md`): plate-armor, bracers, boots, cape, cloak, mantle, greaves, guardian-shield (an avatar size), enchanter-scroll, and closed-fist gloves and gauntlets. (2026-10-02: all 12 `ready` at 7.0 or more, fit ok; commits 660f544, 214aecb, 771dc6e, 2f7c691, 05807f7, c609b45, 162199c, 2093a95, 49f6687, 99a1b5f; table and rules in `docs/equipment-fit.md`, "Fit reworks (2026-10-02)"; no catalog row is `rework`.)
- [x] Task: Write `docs/avatar-catalog.tsv` (100 pieces: slot, tier, status) and the GP price formula (`src/apk3d/avatar/price.ts`, `scripts/avatar-price.ts`, `tests/apk3d/avatar-price.test.ts`).
- [x] Task: Add `equip` blocks to every phase 1 piece. (2026-10-01: 138 blocks, 122 pass; gloves and gauntlets need a closed-fist shape first; see "Equip rollout record".)
- [x] Task: Add the 65 hero parts (`asset_equipment_parts_20260930`) to `docs/avatar-catalog.tsv` (owner decision 2026-10-01: keep every variant; the shop sorts by popularity).
- [x] Task: Fix the 9 hero parts with status `rework` (shape defects; list in `docs/avatar-system.md` section 6). (2026-10-01: see "Part fix record".)
- [x] Task: Add a capped version of each hair style (the skull cap above the brow line, the locks below it) for wear under head pieces that keep the hair; the composer shows it (fit test of 2026-10-01 in `docs/avatar-system.md` section 14). (2026-10-04: see "Capped hair record".)

## Phase 4: Pack and portraits

- [x] Task: Add the reduced output pass (coarser `maxError`, 512 px atlas) as a second output of the same asset file. (2026-10-04: see "Pack, composer, and portrait record".)
- [x] Task: Write `scripts/avatar-pack.ts` (catalog join, reduced GLBs, portrait layers). (2026-10-04: the portrait layers are `scripts/avatar-portraits.ts`, run after the pack.)
- [x] Task: Render portrait layers at the fixed camera and write the canvas composer. (2026-10-04)

## Phase 5: Composer and review

- [x] Task: Write `src/apk3d/avatar/compose.ts` and the review page `avatar.html` with the 15 starter sets and random loadouts. (2026-10-04)
- [x] Task: Review renders of the starter sets in idle, walk, and attack; record the evidence here. (2026-10-04)
- [x] Task: Measure the pack size and the 30-avatar composite frame rate; record the evidence here. (2026-10-04)

## Monorepo notes

- The shop sorts by popularity: `purchase` rows in `avatar_inventory` for each item in the last
  30 days, over all schools (owner decision 2026-10-01). Ties (and every item at go-live, when all
  counts are zero) sort in a fixed random order for each student, seeded by the user id.

## Pack, composer, and portrait record (2026-10-04)

- Reduced pass: `./forge build <id> --reduced` (4x `maxError`, 512 px atlas; `--capped` and
  `--tucked` for the hair forms) writes `out/<id>[+form]+reduced/`. Code: `REDUCED_*` in
  `src/asset.ts`, `errorScale` on the mesh task, `wornAs` for the worn state in the workers.
- Pack: `scripts/avatar-pack.ts --build` built 144 reduced inputs (two slots, about one a minute)
  and writes 149 GLBs: the base, 136 pieces, and 4 hair styles with their capped and tucked forms.
  14.98 MB in total (budget 25 MB); the base 288 KB (budget 2 MB); the largest piece
  shoulder-armor 283 KB (budget 400 KB); 203,741 triangles in all.
- Defects found and fixed in this phase:
  1. Lossless WebP set the tint mask color to black under zero alpha (all 196,866 such texels of
     the base; the whole hair mask of each style). The mask stays PNG.
  2. `avatarModelOf` searched the glTF textures for the mask, but the GLB holds it as an image
     only: no tint in 3D and black portrait masks. It now loads the named image.
  3. A hair style kept its own default color. It now takes the base hair color.
  4. A full `prune()` in the pack removed the tint mask of 23 dyed pieces. The pack now joins
     without it and fails when a GLB names a mask that it does not hold.
  5. The capped hair came through the top of the explorer hat: its avatar fit is 1 cm higher. The
     long falls, the low ponytail, and the side tufts came through 6 pieces that cover the nape or
     the cheeks: these pieces tuck the hair (`tuckHair`, the cap alone).
- Composer: `src/apk3d/avatar/compose.ts` with `tint.ts`, `hair.ts`, `pack.ts`, and `starters.ts`
  (15 starter sets of ready tier 1 pieces). Tests: `tests/apk3d/avatar-compose.test.ts` (7),
  `avatar-starters.test.ts` (2), `avatar-portrait.test.ts` (4). The kit import rule allows
  `apk3d/avatar` to import contracts and three (`docs/apk3d-cartridge.md` section 4).
- Draw calls: the first pack drew 1,038 calls for 30 avatars (about 35 for each). The pack now
  drops the display-only bodies and joins the bodies of a piece into one mesh: 373 calls.
- Review: `avatar.html` with `scripts/avatar-review.ts`. Renders of the 15 starter sets:
  `out/avatar-review/idle.png`, `walk.png` (0.25 s), and `attack.png` (0.3 s). Every piece follows
  its bone; no loadout errors. The hair check (`scripts/avatar-portraits.ts --hair`) passes all 76
  pairs of the 19 head pieces that cap or tuck the hair and the 4 styles (limit 100 pixels in a
  1024 px head frame).
- Portraits: 223 layers (3 base layers, 136 pieces, 72 hair layers of 4 styles in 6 colors and 3
  forms, 12 open head pieces over each style), 609 KB in all; the largest is 6.8 KB color and
  5.6 KB mask (budgets 48 KB and 24 KB); no layer touches the frame. Check
  (`--check`, `out/avatar-review/portrait-check.png`): each starter portrait from its layers
  against the 3D render at the portrait camera; at most 1.92% of the figure (witch) differs by
  more than 48 of 255 (bar 2%). The review page composes the 15 portraits in 3.0 s
  (`out/avatar-review/portraits.png`).
- Frame rate: 30 random loadouts walking, 28.5 to 32.7 fps over four runs (373 draw calls,
  746,043 triangles), on the 2012 quad-core with Intel HD 4000 graphics. The acceptance names a
  2020 laptop, which is faster; this machine was the only one available.

## Capped hair record (2026-10-04)

- Slot: the 4 hair styles moved from `head` to a new `hair` slot (socket on the head bone, hides the
  base hair, base price 0), so a student keeps the chosen style under a hat. Catalog rows are
  `ready`: swept 7.5, short 7.2, long 7.0, ponytail 7.2 (orchestrator review of the full styles on
  the base and the capped forms under head pieces, `bench/sonnet/log.tsv`, batch `capped-hair`).
- Rule: a head piece hides the hair (`hides: ['hair']`), caps it (the default), or keeps it full
  (`fullHair: true`). The resolved block names it (`forgeEquip.hair`: `hidden`, `capped`, `full`)
  for the composer. `wearAsset` sets `k.worn.capHair`; `capsHair` and `hairOf` in `src/equip.ts`.
- Shape: `avatarHair(style, tint, { capped })` in `assets/parts/avatar-hair.ts`. A thin cap 5 mm over
  the skull above the cap line y = 0.66 + 0.3 z (brow 0.72, nape 0.6), slim side tufts, the long
  back and falls below the line, and a low ponytail from the nape. No fringe.
- Full hair: circlet, crown, and swashbuckler-bandana. Renders with the capped hair looked bald under
  these open pieces; with the full hair the fringe falls over the band.
- Fit check of the 22 head pieces that kept the hair: the 19 capped pieces went from 3,506 hair
  points to 295 (10 at 0). The rest are inner surfaces (wizard-hat 189 and gladiator-helmet 40 at
  the back, spear-warden pieces 27 each at the cheek straps); the renders show no hair through any
  piece. Evidence: `docs/avatar-system.md` section 4; renders `out/avatar-base+<piece>/render.png`.
- Check change: a hair style tucks its lower edge into the jaw and neck skin as the base hair does,
  so skin over a `hair` slot piece is a note. The swept, short, and ponytail standalones failed the
  check for this reason before the change (the same result in the old `head` slot).
- Tests: `tests/equip.test.ts` (hair rule, the wear flag for the base and a style, the capped forms
  inside a thin cap above the line). Forge suite: 146 files, 2176 tests.
- Follow-up: equipment GLBs built before 2026-10-04 have no `forgeEquip.hair` field. The Phase 4
  pack rebuilds them.

## Part fix record (2026-10-01)

| Part | Defect | Fix | Host check |
| --- | --- | --- | --- |
| paladin-shield, captain-shield, guardian-shield | the face and the emblem showed through the back; the plate edge met the rim (gaps) | decorations cut at z -0.006 inside the plate; the plate 0.008 inside the rim | only the shield bodies changed; the back shows steel |
| witch-potion | the cork floated 1.5 cm above the lip | the cork sits half in the neck | only `cork` changed (0.12% image) |
| treasure-hunter-whip | the standalone stood on its lash tip | the standalone lays the coil flat on the ground | host unchanged (standalone only) |
| fighter-cap | an open frame on its own | option `lining` (padded leather, quilted) on in the standalone; tipped back on the nasal | fighter 19 of 19 bodies identical |
| swashbuckler-bandana | a flat disc on its own | hollow: the inside follows the skull 0.006 under the skin | only `bandana` changed (0.1% image) |
| dragoon-helm | ragged hem and cheek guards | cheek guards on a smooth skull with rounded cuts; helm body detail 0.0035 | only `helm` changed (0.12% image) |
| spear-warden-crest | a crest fin with no helm | new part `spear-warden-helm` (helmet, helmet-dark moved out of the host); the crest standalone shows both | 34 of 34 bodies identical, 0.000% |

All 10 standalones (the 9 and the new `spear-warden-helm`) built with `forge all`: no warnings, on
y = 0. The 8 changed hosts built textured with sprites: no warnings; `forge check` result ok.

## Avatar base record (2026-10-01)

- Source: `assets/avatar-base.ts`. The rogue's skeleton (with `cloak`, `knife.L`, `knife.R`), head,
  face paint, arms, and fists, without change; the hero torso of the chest-armor contract.
  Bodies: skin (full body), hair, undershirt (short sleeves, painted collar, hem, and belt), pants
  (to the ankle), shoes. Color slots: skin (5 options), hair (6, two of them fantasy: silver,
  teal), eyes (5), cloth (5). Presets: sunny, forest, night, frost.
- Hair: `assets/parts/avatar-hair.ts` with 4 styles (swept is the default on the base), each also a
  standalone `assets/avatar-hair-<style>.ts`. Lock lines are a darker shade that follows the hair
  slot.
- Clips: idle, walk, run, and hit are the rogue's (motion.gait legs); attack (a one-handed slash
  with the right fist), rest (a breathing crouch, loops), cheer (fists up and a hop, loops), and
  cast (gather and push with both fists) are new. Strips: `out/avatar-base/anim/*.png`.
- Builds: `forge all avatar-base`: 23,352 triangles, no warnings, sprites for the default and the
  4 presets; the 4 hair standalones: no warnings, on y = 0. `forge check avatar-base`: no held
  items; ground ok.
- Fit test (a temporary asset, removed): the swept hair under the rogue hood fits; small spots of
  hair show at the brim of the knight and dragoon helms; the fringe comes through the wizard hat.
  Follow-up task in Phase 3 (capped hair styles); recorded in `docs/avatar-system.md` section 14.
- Catalog: `spear-warden-helm` (head, tier 2) and the 4 hair styles (head, tier 1, override 0)
  added; the 9 fixed parts are `planned`. 170 rows; `scripts/avatar-price.ts --check` passes.

## Equip rollout record (2026-10-01)

- Blocks: 138 assets (every phase 1 catalog row except gloves and gauntlets). `forge check`: 122
  pass. Catalog: 120 `ready`, 16 `rework` (reasons in `docs/equipment-fit.md`, "Every phase 1
  piece"), the 4 hair styles `planned` (the capped hair task). Contact sheets of 45 worn renders
  were reviewed; the steel helmet passes the check but covers the eyes, so it stays `rework`.
- Socket and clip changes: the shield socket moved to (0.262, 0.25, 0.075) (outward and lower);
  idle, hit, rest, and the shield arm of the attack keep a held item at its rest direction
  (`steady` in `assets/avatar-base.ts`). Bows, the heavy crossbow, the whip, and the sling use the
  socket frame; books ride at the side with the cover outward; orbs sit outside the fist.
- Engine: `frame: 'body'` (character axes at the socket point) for level items; a worn piece
  meshes no finer than 1/380 of its worn size (the tower shield grid error).
- Check changes: a point inside two base bodies counts for the outer one (hair over the skull);
  a piece point buried in another body of the piece does not count. The first change passes the
  bandana; plate-armor, cape, and the helmets still fail, as the renders show.
- Found: iron-helmet and horned-helmet have a hidden ring inside the cavity. The brow band is a
  shell of an open revolve profile, and the shell also wraps the profile's closing chord.

## Equip record (2026-10-01)

- Code: `src/equip.ts` (declaration, sockets, validation, the resolved `forgeEquip` record, and
  `wearAsset`, which dresses a base in pieces), `src/equip-check.ts` (the fit check), the CLI
  (`forge check <piece>` for an asset with `equip`; `--wear a,b` on render, animate, sprites, and
  all), worker threads dress the base the same way. Tests: `tests/equip.test.ts` (8): the socket
  joints match `avatar-base`, validation errors, the resolved transforms, the mirrored pair, the
  rest-pose turn, the GLB extras, and the dressed base.
- Authoring: `origin` and `rotate` say where the socket frame stands in the asset, so a part
  standalone copies its rest pose. The plan's `anchor` field is not needed (the slot gives the bone).
- Socket changes against the first plan: pauldrons on the upper arms, the shield on `hand.L`, the
  back socket at the torso neck opening. Table: `docs/equipment-parts.md`.
- Check rules: show-through of skin or clothes at more than 2% of the piece's points (calibrated on
  renders), gap 2 cm, floor 1 cm, and the clip clearance on the worn base for pieces on arm bones.
  The bounds rule of the plan ("within 5%") was dropped: display bounds include plumes and brims.
- Base clips: before the change, every held test piece passed through the head in cheer and cast
  (and in attack and run for some). The wrists now aim the item: steady in walk and run, a flat
  sweep in the attack, up and outward with the flat outward in cheer (the wrists at x 0.31), ahead
  in cast. Result: fighter-sword, warrior-sword, wizard-staff, dragoon-lance, and captain-shield
  pass every clip (cheer clearance more than 5 cm). Strips: `out/avatar-base+warrior-sword+captain-shield/anim/`.
- Pilot blocks (13): pass: knight-helm, rogue-hood, shoulder-armor, fighter-sword, warrior-sword,
  wizard-staff, dragoon-lance, captain-shield. Fail (rework task): plate-armor (arm cuffs, 3.6%),
  bracers and boots (inside the body), cape (shirt through it, hem 3 cm under the ground),
  guardian-shield (touches the head at rest).
- Hair: knight-helm shows hair at the brow (147 points, a note, not a failure) — the capped hair task.

