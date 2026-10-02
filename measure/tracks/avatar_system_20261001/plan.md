# Avatar system: base, equipment fit, pack, composer

Status: in_progress (2026-10-02: Phase 3 fit reworks done, no catalog row is `rework`; next the capped hair, then Phase 4 pack and Phase 5 composer). The plan records execution state. The specification retains design detail.

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
- [ ] Task: Add a capped version of each hair style (the skull cap above the brow line, the locks below it) for wear under head pieces that keep the hair; the composer shows it (fit test of 2026-10-01 in `docs/avatar-system.md` section 14).

## Phase 4: Pack and portraits

- [ ] Task: Add the reduced output pass (coarser `maxError`, 512 px atlas) as a second output of the same asset file.
- [ ] Task: Write `scripts/avatar-pack.ts` (catalog join, reduced GLBs, portrait layers).
- [ ] Task: Render portrait layers at the fixed camera and write the canvas composer.

## Phase 5: Composer and review

- [ ] Task: Write `src/apk3d/avatar/compose.ts` and the review page `avatar.html` with the 15 starter sets and random loadouts.
- [ ] Task: Review renders of the starter sets in idle, walk, and attack; record the evidence here.
- [ ] Task: Measure the pack size and the 30-avatar composite frame rate; record the evidence here.

## Monorepo notes

- The shop sorts by popularity: `purchase` rows in `avatar_inventory` for each item in the last
  30 days, over all schools (owner decision 2026-10-01). Ties (and every item at go-live, when all
  counts are zero) sort in a fixed random order for each student, seeded by the user id.

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

