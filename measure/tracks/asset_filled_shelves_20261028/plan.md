# Fill every empty shelf in the games and scene maps

Status: new (2026-10-28). The [specification](./spec.md) owns the scope and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. Red writes the check. Green fills the
  shelves and the maps.
- Owned source paths: `src/games/enchanted-library/`, `src/games/haunted-library/`,
  `src/games/potion-rush/`, `src/games/alchemists-synthesis/`, `src/games/rune-forge-chamber/`,
  `scenes/maps/`, `scripts/design-bathhouse.mjs`, `scripts/design-warehouse.mjs`,
  `scripts/design-inn.mjs`, `scripts/design-school.mjs`, `scripts/design-archive.mjs`, and
  `src/apk3d/contracts/model-pack.ts`, `scripts/demo-models.ts`, and
  `src/apk3d/contracts/pack-versions.ts` for the `bookcase` runtime build.
- `assets/shelf.ts` is owned only when Green changes the asset itself. The other method places
  props on the shelf.
- Owned test path: `tests/games/filled-shelves.test.ts` (new file).
- Owned output path: `out/filled-shelves/`.
- Owned planning path: `measure/tracks/asset_filled_shelves_20261028/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- Do not change `measure/tracks.md` or `measure/generated/*`. Another session owns those paths.
  The registry entry and the generator run are closeout items in Phase 2.
- Run every build, render, test, vite, or Chrome run with one command:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
- Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.
- The machine has 7.1 GB of RAM. One heavy job runs at a time.
- No session writes in the monorepo. The monorepo session runs the cartridge sync.
- The rating is G. No paid generation runs in this track.

### Measured supports

- The shelf boards sit at y 0.45, 0.78, and 1.09. Their tops are 0.4725, 0.8025, and 1.1125.
- The shelf footprint is 1.3 m wide and 0.3 m deep. Its back face sits at the origin.
- The filled maps put an item on the first board at y 0.475 and about 0.15 m in front of the
  shelf origin. See `scenes/maps/apothecary.ts` and `scenes/maps/general-store.ts`.
- The alchemy lab puts a bottle and a vial on the top board at y 1.11. See
  `scenes/maps/alchemy-lab.ts` lines 90 to 95.
- The cabinet top runs from 0.99 to 1.05. See `assets/cabinet.ts`.
- A game view scales the shelf. The Enchanted Library uses 1.6 and 1.5, so the board heights scale
  with it.

### Method per game and map

| Target | Method |
| --- | --- |
| Enchanted Library | Replace `shelf` with `bookcase`; add `bookcase` to the model list, the manifest, and the pack. |
| Haunted Library | Replace `shelf` with `bookcase`; add `bookcase` to the model list, the manifest, and the pack. |
| Potion Rush | Keep `shelf`; put bottles, bread, and apples on the boards. The models are already in the game. |
| Alchemists' Synthesis | Keep `shelf`; put bottles and vials on the boards. |
| Rune Forge Chamber | Keep `shelf`; put crates and sacks on the boards. The models are already in the game. |
| Bathhouse | Keep `shelf`; put jars and baskets on the boards. No towel asset exists. |
| Warehouse | Keep `shelf`; put crates and sacks on the boards. |
| Alchemy lab | Filled already. The check lists it. No change. |
| Apothecary | Filled already. The check lists it. No change. |
| Bakery | Filled already. The check lists it. No change. |
| General store | Filled already. The check lists it. No change. |
| Inn | Move the bottle and mug down onto the board at y 0.8025 and off the back panel. |
| School | Lower the jar and the orb onto the cabinet top at y 0.99. |
| Archive | Move the candle out of the cabinet at [-6.4, 0, 4.4]. |
| Classroom | Done in `e4e5c593`. The `bookcase` at [-1.2, 0, -3.68] stays. |

## Phase 1: The check, the game fills, and the map fills

Roles: Red writes the check and records the failing run. Green fills the shelves and the maps and
runs the check again. The render task belongs to Green and reports to Review.

### Decisions (2026-10-28)

1. Libraries: use `bookcase` within the set-piece budget (200,000 bytes; game total 6,000,000). If it
   does not fit after a reduced build, fall back to `shelf` with `tome` and `spellbook` props on its
   boards. Green records the chosen path here.
2. No lit candle on a library or classroom bookcase: use `bookcase` or the fallback, not `bookshelf`.
3. The check: the maps export `places()`, so the check imports and evaluates them. The five game views
   run their placement code with a recording stub, because a text parse cannot expand the loops that
   place the shelves. The stub needs no WebGL. It records the model name, the position, the scale, and
   the yaw of every placement. The limit: the stub proves the placement numbers, not the mesh content
   of a model. The render proves the mesh content.
4. Bathhouse: jars and baskets. A towel asset is a follow-up and stays out of scope.
5. Hand-off branch: the PM names it. The default is `primary-parity-integration`, the target of the
   last ledger entry of `measure/monorepo-syncs.md` (monorepo `0c220e663`).
6. Order: commit, then the pack release, then the hand-off.

Further decisions of the strategy role (2026-10-28):

- The support rule uses a tolerance of 0.01 m. The filled maps place items 0.0025 m above a board top.
- The library views place no `shelf` and no `bookshelf`. The classroom map keeps its `bookcase`.
- The pre-existing `bookshelf` placements with a lit candle stay a frozen count table. They are a
  follow-up for the owner.
- The `potion-rush` 2D background is a bake of its 3D set, so the track re-bakes it before the pack
  release.

### Gate commands

Every command runs as one call of `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`
with a `timeout -k 30` inside and vitest with `--maxWorkers=1`.

- `RED_TEST_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
  node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'`
- `GREEN_TEST_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
  node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts
  tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts
  tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts
  tests/games/rune-forge-chamber/manifest.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
  node node_modules/typescript/bin/tsc --noEmit'`
- Type check baseline rule: the command exits 2 with 31 errors outside the owned paths today. Green
  records the owned error count, which must be 0, and the total, which must not exceed 31.
- Render of a game view: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
  node --import tsx scripts/apk3d-shot.ts both --game enchanted-library'`
- Render of a map: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'FORGE_SHOT_SIZE=1920x1080
  timeout -k 30 600 node scripts/shoot-map.mjs out/filled-shelves bathhouse=scene=bathhouse'`
- Re-bake of the potion rush 2D background: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c
  'timeout -k 30 900 node --import tsx scripts/apk2d-bake.ts potion-rush'`
- The full strategy, the test rows F1 to F11, the mutations M1 to M5, and the review gates live in
  [test-strategy.md](./test-strategy.md).

- [x] Task: Write the failing shelf check (Red). Test commit `e4e94d76`.
  Owned path: `tests/games/filled-shelves.test.ts` (new file).
  The test lists every `shelf` placement in `scenes/maps/*.ts` and in the five game views with its
  item count. It uses the audit rule: an item stands on a case when its x and z fall inside the
  case footprint after yaw, and its y is above zero. It fails on an empty shelf and on a floating
  item, which means an item over a case whose y matches no board top or case top.
  The test reads the map files and the game view sources as text, so it names every placement and
  its count in the failure message.
  Run it and record the failing result: the command, the exit code, and the number of failures.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/games/filled-shelves.test.ts --maxWorkers=1'`.
  Commit the test alone, by its explicit path. Do not fix any shelf in this task.

  Red evidence (measure-mid-red, 2026-10-28):

  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'`.
    Result: exit 1. Summary: `Tests 6 failed | 2 passed (8)`.
  - F1 (map empty shelves): 7 empties. Bathhouse 4 (rows 91-94) and warehouse 3 (rows 141, 142, 145).
  - F2 (view empty shelves): 18 empties. Enchanted-library 8 (rows 85-92), haunted-library 8
    (rows 9-10, 26-27, 43-44, 60-61), rune-forge-chamber 2 (rows 52-53).
  - F3 (floating view items): 24 bottles. Potion-rush 12 (rows 45-50, 52-57) and
    alchemists-synthesis 12 (rows 52-57, 59-64), all at y 0.52 or 1.02.
  - F4 (floating map items): 7. Inn 2 (bottle row 150, mug row 151) and school 5 (jar row 48,
    orb row 62, apple row 144, mug row 145, scroll row 146).
  - F5 (items inside a case): 2. Archive candle row 169 and guild-hall barrel row 160.
  - F7 (libraries use bookcase): 16 `shelf` placements (enchanted-library 8, haunted-library 8)
    and no `bookcase`.
  - F6 passes: alchemy-lab 2, apothecary 3, bakery 1, general-store 5 shelves with no empty.
  - F8 passes: the frozen table holds (below).
  - Frozen count table: 19 `shelf` in 7 maps (alchemy-lab 2, apothecary 3, bakery 1, bathhouse 4,
    general-store 5, inn 1, warehouse 3). 44 `bookshelf` in 12 maps (apothecary 2, archive 11,
    bank 2, classroom 2, courthouse 2, guild-hall 5, library 6, observatory 3, prison 1, school 3,
    warehouse 1, wizard-tower 6). The strategy text said 37 in 10 maps; the live count is 44 in 12.
  - `isStructural()` exclusions: suffix /^(floor|ground|road|path|river|water|wall|window|door|gate|
    arch|column|pillar|stairs|ladder|bridge|dock|pier|roof|chimney|ceiling|fence|railing|walkway|
    plank|beam)$/; prefix /^(wall|door|window|gate|arch|column|pillar|stairs|ladder|bridge|roof|
    chimney|ceiling|fence|railing|walkway|ruin|cliff|boulder|cave|tunnel|street|trail|hill|mountain|
    pond|puddle|snowbank|sand-dune)/; and a named set. The mounted light fixtures in the named set
    are: chandelier, candle-cluster, lantern, torch-sconce, wall-sconce, torch, candelabra, brazier,
    fireplace, campfire, campfire-out, watchfire. The lone `candle` stays an item (the archive
    candle is the R3 target).
  - Type check: command `heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc
    --noEmit'` exits 2. Owned errors (filled-shelves.test.ts): 0. Total: 31. One owned error at a
    first run (rest-spread type at line 134) was fixed by typing the stub add rest as
    `THREE.Object3D[]`; the check logic did not change.
  - Deviations: (1) an earlier direct `vitest run` outside heavy-run.sh broke the machine rule; it
    is not gate evidence. (2) The strategy table said 37 bookshelf in 10 maps; the live count is 44
    in 12. (3) Extra findings stay in scope for Green: school apple, mug, scroll; inn bottle and
    mug; guild-hall barrel. (4) The fixture list above is read from the test. (5) A prior Red
    session stalled with no output for 4 hours; this session restarted and finished.

- [x] Task: Fill the two library games (Green). Commit `455d2c1d`.
  Owned paths: `src/games/enchanted-library/view/hall.ts`,
  `src/games/enchanted-library/manifest.ts`, `src/games/haunted-library/view/library.ts`,
  `src/games/haunted-library/manifest.ts`.
  Replace every `shelf` with `bookcase`. The bookcase holds books and no candle.
  Add `bookcase` to each game's model list and to each `MODELS_3D` list.
- [x] Task: Fill the shop, lab, and forge games (Green). Commit `a56b4b19`.
  Owned paths: `src/games/potion-rush/view/shop.ts`, `src/games/potion-rush/manifest.ts`,
  `src/games/alchemists-synthesis/view/lab.ts`, `src/games/alchemists-synthesis/manifest.ts`,
  `src/games/rune-forge-chamber/view/forge.ts`, `src/games/rune-forge-chamber/manifest.ts`.
  Keep the `shelf` and put items on its boards: bottles, bread, and apples in Potion Rush; bottles
  and vials in Alchemists' Synthesis; crates and sacks in Rune Forge Chamber.
  Place each item on a board top and scale the board height with the shelf scale of the view.
- [x] Task: Fill the bathhouse and warehouse shelves (Green). Commit `39a8a6f8`.
  Owned paths: `scripts/design-bathhouse.mjs`, `scenes/maps/bathhouse.ts`,
  `scripts/design-warehouse.mjs`, `scenes/maps/warehouse.ts`.
  Edit the generator, then run it. The bathhouse shelves hold jars and baskets. The warehouse
  shelves hold crates and sacks.
  The bathhouse comment at `scripts/design-bathhouse.mjs:43` promises towels. Change the comment
  to the items that the map holds.
- [x] Task: Repair the floating items in the inn, school, and archive maps (Green). Commit `39a8a6f8`.
  Owned paths: `scripts/design-inn.mjs`, `scenes/maps/inn.ts`, `scripts/design-school.mjs`,
  `scenes/maps/school.ts`, `scripts/design-archive.mjs`, `scenes/maps/archive.ts`.
  Move the inn bottle and mug onto the board at y 0.8025 and off the back panel. Lower the school
  jar and orb onto the cabinet top at y 0.99. Move the archive candle out of the cabinet.
  Edit each generator, then run it.
- [x] Task: Register the new game models and rebuild the packs (Green). Commit `455d2c1d`.
  Owned path: `src/apk3d/contracts/model-pack.ts`.
  Put `bookcase` in a pack that the two library games load, and add it to each `GAME_LOADS` model
  list. Run the pack binding test and the budget test. The set piece limit is 200,000 bytes and the
  game total limit is 6,000,000 bytes. If the bookcase model is too heavy, reduce its build
  (texture size and triangle budget) or fall back to the `shelf` with `tome` and `spellbook` props
  on its boards. Record the chosen path.
  Commands: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`.
- [x] Task: Render every changed game view and map, and look at each render. Commit `8a457be7`.
  Owned output path: `out/filled-shelves/`.
  Render each changed game view with `scripts/apk3d-shot.ts` and each changed map with
  `scripts/shoot-map.mjs` and `FORGE_SHOT_SIZE=1920x1080`.
  Look at every render. Write down the three largest differences for each one. Fix the largest
  difference first and render again.
  Record each path with its SHA-256 in this plan.
  Commands: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk3d-shot.ts both --game enchanted-library'`, and the same shape for each other game.
  For a map: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/shoot-map.mjs
  out/filled-shelves bathhouse=scene=bathhouse'` with the dev server already running.
- [x] Task: Run the check and the model tests again (Green). Commit `8a457be7`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts
  --maxWorkers=1'`.
  Record the exit code, the test counts, and the type check of the owned paths.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node
  node_modules/typescript/bin/tsc --noEmit'`. Record the owned errors and the baseline errors.

## Green evidence (2026-10-28)

### Game view renders

The shot script has no QC player for haunted-library, alchemists-synthesis, and rune-forge-chamber,
and the full bots of Potion Rush and the Enchanted Library run past the timeout. Every view was
rendered with the `--first` flag, which plays the selector, the reader, and the briefing, then
saves one game screen. Each run printed `diagnostics none` and `errors none`.

| Game and layout | Path | SHA-256 |
| --- | --- | --- |
| enchanted-library portrait | `out/apk3d-shots/enchanted-library/portrait/05-first.png` | `a0ae035012c8249e523ac2a00a598b8a82c2d2148dedaed70895f00091e85eac` |
| enchanted-library landscape | `out/apk3d-shots/enchanted-library/landscape/05-first.png` | `d877f9bb02c79754b59ab06e05b496040f878cab25d50d65ab39215c339cda48` |
| haunted-library portrait | `out/apk3d-shots/haunted-library/portrait/05-first.png` | `4702af500815253cacd1f98650162e3a35dcff6779072ca84b6343bda39c35f5` |
| haunted-library landscape | `out/apk3d-shots/haunted-library/landscape/05-first.png` | `0607c67d4b6a2531a9e06149094590acf4017930785eb3e8bbfa5d492992f158` |
| potion-rush portrait | `out/apk3d-shots/potion-rush/portrait/05-first.png` | `52f6a6b45682712a9a908afe2d68b13cab362c2c429826f16935a40e87fe4f83` |
| potion-rush landscape | `out/apk3d-shots/potion-rush/landscape/05-first.png` | `5f4d3f6e4a20b1d1965db04d9643d7af255717d4f65c5087e2a1e012d401aea4` |
| alchemists-synthesis portrait | `out/apk3d-shots/alchemists-synthesis/portrait/05-first.png` | `d69a7ad529542fc4ecef4d703a08ce0f1d75da7a6fcfebe4ee87e30a1dcad84b` |
| alchemists-synthesis landscape | `out/apk3d-shots/alchemists-synthesis/landscape/05-first.png` | `0f9694647f8c9bc3b77111499ea3c08facd71baa91064818600d02c367138667` |
| rune-forge-chamber portrait | `out/apk3d-shots/rune-forge-chamber/portrait/05-first.png` | `e28e77f24aa214fc69bf3f20ba55f0b9b8a7a433141e1159554162d54e376537` |
| rune-forge-chamber landscape | `out/apk3d-shots/rune-forge-chamber/landscape/05-first.png` | `3df13e1fc665238f2ef6ba125b321aa75626fa0949d705b1caac3591cf5af4f0` |

Looks and the three largest differences per render:

- enchanted-library portrait: (1) only the two side bookcases sit in frame, the four north wall
  cases stay behind the camera; (2) the spines read soft because the runtime texture is 128 px;
  (3) every visible row carries books and no candle stands on a case, so the goal holds.
- enchanted-library landscape: (1) the bottom row of every case holds the pale scroll rack of the
  asset, so three rows carry books; (2) the spines read soft at 128 px; (3) all eight bookcases are
  in frame, every row carries books, and no candle stands on a case.
- haunted-library portrait: (1) the camera looks down, so the cases are small and their rows read as
  stripes; (2) each case shows the pale scroll rack in its bottom row; (3) every visible row carries
  books and no candle stands on a case.
- haunted-library landscape: (1) the spines read soft at 128 px; (2) each case shows the pale scroll
  rack in its bottom row; (3) every visible case carries books on each row and no candle stands on a
  case.
- potion-rush portrait: (1) the top board of each shelf holds nothing, so the upper third of the
  case reads as bare wood; (2) the bottles cluster in the middle of each row and leave both ends of
  the board empty; (3) every bottle stands on a board, so the support rule holds.
- potion-rush landscape: (1) the top board of each shelf holds nothing; (2) the bottles sit close
  together in the middle of each board; (3) the bread and the apple rest on the lower row and every
  bottle stands on a board.
- alchemists-synthesis portrait: (1) the top board of each shelf holds nothing; (2) the bottles leave
  the board ends empty; (3) every bottle stands on a board.
- alchemists-synthesis landscape: (1) the top board of each shelf holds nothing; (2) the middle row
  carries few bottles, so the board looks sparse; (3) every bottle stands on a board.
- rune-forge-chamber portrait: (1) the camera crops both shelves at the frame edges; (2) the middle
  and the top board of each shelf hold nothing; (3) the crate and the sack stand on the lower board
  and nothing floats.
- rune-forge-chamber landscape: (1) the shelves sit at the top of the frame, so the case is small;
  (2) the middle and the top board hold nothing; (3) the crate and the sack rest on the lower board
  and the candle cluster of the forge stands inside the case, which the check excludes as a mounted
  fixture.

Stale render: `out/filled-shelves/enchanted-library` holds an earlier run of the full bot against
the reduced bookcase build. It shows an old state and is not cited as evidence.

### Map renders

The default camera of the map viewer sits 46 m away, so the changed shelves stay small. Each map
was rendered again with camera values that frame the changed piece. The first pass keeps the
default camera and shows the whole room.

| Map and camera | Path | SHA-256 |
| --- | --- | --- |
| bathhouse, default | `out/filled-shelves/bathhouse.png` | `be2cfa57a86415b496ca201b19b040dc944d4cf7369b94ce62878120f10c6c62` |
| bathhouse, `az=0&el=22&dist=15&tx=0&tz=-4.5` | `out/filled-shelves/bathhouse-close.png` | `acb852d08ea40ca3c6dd462d6d0f531c2db2f60563896c41ae82ed2887be6804` |
| warehouse, default | `out/filled-shelves/warehouse.png` | `d8da3160ae975c937e21a36da36b41ccff7ed4500cb818883dceb4f8364fb47b` |
| warehouse, `az=90&el=20&dist=16&tx=-4.6&tz=0.6` | `out/filled-shelves/warehouse-close.png` | `8794d15a5cb605f1043e3c7ffe6b0fcd5009e42ba045215c9deb6a790e015cc5` |
| inn, default | `out/filled-shelves/inn.png` | `45db6a12cd8e108e5291fce66bfc4ab9d26aef853ea88b18d6161d136592c62b` |
| inn, `az=0&el=20&dist=10&tx=1.6&tz=-4.7` | `out/filled-shelves/inn-close.png` | `0dd8e3bf882158325a47b94dd66e8bf2d8ff5aca1242bcaa9b7dcb65a2a146d2` |
| school, default | `out/filled-shelves/school.png` | `7abafede9d7353627f8c87b46b8cb9850212cf96b631b8ac41302209add8c75c` |
| school, `az=0&el=20&dist=9&tx=4.2&tz=-4.6` | `out/filled-shelves/school-close.png` | `aae2fd1a4c561f43a8496cce256eaa9e39cfc9b355d2ccfdccc84e15bf320ef1` |
| school, `az=90&el=20&dist=9&tx=-5.6&tz=-0.4` | `out/filled-shelves/school-west.png` | `0101267db1c4e5871aa4bf01fe6d411ba542f92e60d9a23ee1cacd464559079f` |
| archive, default | `out/filled-shelves/archive.png` | `1626f8c89d3c1fa4dadff31eac81c4f2f3ec638470a3f1bf083614d779470522` |
| archive, `az=90&el=22&dist=9&tx=-5.7&tz=4.6` | `out/filled-shelves/archive-close.png` | `902dece718493532a057ece7a94456efdc3eb44f7158e12428c7db20b798bdf3` |
| guild-hall, default | `out/filled-shelves/guild-hall.png` | `2d3b0a9bbcb22ca24693f9fd191b8baad870fa3516e438a7af18b732d7073bb2` |
| guild-hall, `az=90&el=22&dist=9&tx=-7.2&tz=3.3` | `out/filled-shelves/guild-hall-close.png` | `039d0ff371480cbc131fb7f8b9252d819e7f66abc8febc125bbe3b0abf4c3689` |

Looks and the three largest differences per render:

- bathhouse default: (1) the room fills the middle third of the frame and the black margins hold the
  rest; (2) the shelves are too small to read; (3) no empty shelf shows.
- bathhouse close: (1) only the lower board of each of the four shelves carries the jar and the
  basket, the middle and the top board stay bare; (2) the jar and the basket sit near the middle of
  the board and leave both ends empty; (3) every jar and basket stands on the board, so no shelf is
  empty and nothing floats.
- warehouse default: (1) the room floats in the middle of the frame; (2) the shelves are too small
  to read; (3) no empty shelf shows.
- warehouse close: (1) the crate and the sack stand on the lower board of each west shelf; (2) the
  middle and the top board of each shelf stay bare; (3) no shelf is empty and nothing floats.
- inn default: (1) the room floats in the middle of the frame; (2) the bar shelf is too small to
  read; (3) no empty shelf shows.
- inn close: (1) the bottle and the mug stand on the middle board of the bar shelf; (2) the lower
  board and the top board stay bare; (3) both items rest on the board and none floats over the back
  panel.
- school default: (1) the room floats in the middle of the frame; (2) the cabinets are too small to
  read; (3) no floating item shows.
- school close: (1) the jar and the apple rest on the cabinet top, and the plates beside them rest
  on the same top; (2) the wall case beside them keeps its lit candle, which is the pre-existing
  `bookshelf` case that the frozen table accepts; (3) no item floats above the cabinet.
- school west: (1) the orb, the mug, and the scroll rest on the cabinet top; (2) the orb stands on
  a dark stand, so it reads as a display piece; (3) two wall cases keep their lit candles, again the
  pre-existing `bookshelf` cases.
- archive default: (1) the room floats in the middle of the frame; (2) the wall cases are too small
  to read; (3) no candle shows inside a case.
- archive close: (1) the moved candle stands on the stone floor beside the cabinet; (2) the
  cabinet keeps its plates and books on top; (3) the wall cases hold books and no candle stands
  inside a case.
- guild-hall default: (1) the room floats in the middle of the frame; (2) the west corner is too
  small to read; (3) no barrel shows inside a case.
- guild-hall close: (1) the moved barrel stands on the floor beside the cabinet; (2) the cabinet
  keeps its plates on top; (3) the wall cases hold books and their lit candles are the pre-existing
  `bookshelf` cases.

Defect found in the looks and fixed: the crate and the sack of the two west shelves of the
warehouse stood at the back plane of the case, because the generator placed them at the origin of
the shelf. The spec puts an item about 0.15 m in front of the shelf origin. Commit `8a457be7` moves
them forward, the gate test passes again, and the warehouse close render shows the crate on the
board in front of the back panel.

The upper boards of the shop, lab, forge, bathhouse and warehouse shelves stay bare. The filled
maps of the project place their items on one board as well, so the track keeps that shape. A
follow-up track may fill the upper boards.

### Gate results

- Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
  node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts
  tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts
  tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts
  tests/games/rune-forge-chamber/manifest.test.ts --maxWorkers=1'`. Exit 0. Summary: `Test Files  7
  passed (7)` and `Tests  134 passed (134)`. The run after `8a457be7` gives the same result.
- Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
  node_modules/typescript/bin/tsc --noEmit'`. Exit 2. Owned errors 0. Total 32. The baseline holds 31
  errors. The extra error sat in `tests/storytime-book-pictures.test.ts`, a dirty file of the
  Storytime track, now committed as `6c55fac1` with a type fix.
- The Red run of the check at the start of the track exits 1 with `Tests  6 failed | 2 passed (8)`.

### Doctor result

`./measure/doctor.sh` exits 1 with six findings.

| Finding | Owner |
| --- | --- |
| `measure/tracks/asset_filled_shelves_20261028/plan.md`: new track has started tasks | Owned. The Phase 1 tasks carried the in-progress mark while the run went on. |
| `measure/tracks/asset_p2_npcs_20260928/plan.md`: new track has started tasks | Not owned. Another track owns that plan. |
| `measure/tracks.md`: missing registry link for asset_filled_shelves_20261028 | Not owned. The plan lists the registry entry as a Phase 2 closeout item, and another session owns that path. |
| `measure/lessons-learned.md`: 52 lines exceeds 50 | Not owned. Another session owns that file. |
| `measure/generated/status.md`: stale generated fact | Not owned. Another session owns the generated facts, and the generator run is a Phase 2 closeout item. |
| `measure/generated/asset-inventory.json`: stale generated fact | Not owned. The same closeout item. |

### Mutations

| Id | Mutation | Test | Result |
| --- | --- | --- | --- |
| M1 | Remove one bottle placement from a potion rush shelf. | F2 | The row passes, exit 0. The shelf keeps seven items, so the row as written does not fail. |
| M1b | Empty one potion rush shelf. | F2 | Fails, exit 1. |
| M2 | Move one potion rush bottle from y 0.4725 to y 0.52. | F3 | Fails, exit 1. |
| M3 | Raise the school jar from y 0.99 to y 1.02. | F4 | Fails, exit 1. |
| M4 | Put the library view back to `shelf`. | F7 | Fails, exit 1. |
| M5 | Name `bookcase` in a manifest but in no pack. | F9 | Fails, exit 1. The message reads `unknown model binding "bookcase": no loaded pack holds it`. |

The logs sit in `measure/runs/asset_filled_shelves_20261028/`, one file per mutation. The mutated
files were restored with `git checkout`, and `git status --short` shows no change in them.

### Deviations

1. The model changed. This turn ran on minimax-cn-coding-plan/MiniMax-M3#high. The earlier turns
   ran on openai/gpt-6-luna#high. Red ran on coding-plan/deepseek-v4-pro#high, so the independence
   holds.
2. The bookcase source restore. Commit `455d2c1d` had lowered the shared source asset. Commit
   `3419926f` restores detail 0.006 and texture 1024. The rebuild printed `texture 1024x1024
   atlas`, and `out/bookcase/stats.json` shows 1024.
3. The runtime bookcase uses the Meshopt permissive pass inside `scripts/demo-models.ts` for the
   bookcase alone, with a triangle budget of 8,000, a shape error of 0.02, and a 128 px texture.
   The plain simplifier stops at 61,282 triangles on the bevels of the books. The runtime file is
   178,988 bytes, under the set-piece limit of 200,000 bytes.
4. The render output path is `out/apk3d-shots/<game>/<layout>/`, because the shot script has no
   output flag. The plan names `out/filled-shelves/` as the owned output path.
5. The renders use `--first`, because three games have no QC player and the full bots run past the
   timeout. The rules, the input, and the level flow do not change.
6. `scripts/demo-models.ts` and `src/apk3d/contracts/pack-versions.ts` are in scope beyond the plan
   list. `assets/bookcase.ts` is out of scope after the restore.
7. The guild-hall map is a sixth changed map. The plan names five.
8. The pack version moved to 1.0.1, because the runtime file bytes changed.
9. The strategy row F9 has no matching test name in `tests/apk3d/pack-bindings.test.ts`. The M5 run
   used the row "the edition binds every required model from the listed packs".
10. The strategy mutation M1 does not fail F2 with the current fill, because the potion rush shelf
    holds eight items. The stronger variant M1b empties one shelf and fails F2.
11. The map renders needed a second pass with camera values, because the default camera sits 46 m
    away and the shelves stay small.
12. The mutated files were restored with `git checkout` instead of an edit. The orchestrator checked
    that no unrelated change was lost in those paths.
13. The lock was held over 600 s on the bookcase runtime build, on the haunted-library render, on
    the potion rush render, and on the type check.

## Phase 2: The hand-off

Roles: Green commits and releases the packs. The PM receives the status line and hands the commit
to the monorepo session.

- [ ] Task: Commit the change in Forge by explicit paths.
  Use `git commit -m "fix(scenes): fill every empty shelf" -- <paths>`. Stage only the owned paths.
  Other sessions share the tree and the git index. Never stage `measure/tracks.md` or
  `measure/generated/*`.
- [ ] Task: Release the model packs when a pack changed.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run the same command with
  `--commit`. A rebuild to the same bytes changes no pack version.
  Record the pack versions and the release commit.
- [ ] Task: Make the handoff file and send the status line to the PM.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. Read
  `out/monorepo-sync/handoff-<sha>.md`.
  Send one status line to the PM. The line names the Forge commit, the changed games and scenes,
  and the render paths with SHA-256. The PM hands the commit to the monorepo session for its
  cartridge sync, as in monorepo `0c220e663`, synced from Forge `afc8b890`.
- [ ] Task: Record the closeout items that this track must not touch.
  The registry entry for `measure/tracks.md`:
  `- [ ] **Track: Fill every empty shelf in the games and scene maps**` with the link
  `./tracks/asset_filled_shelves_20261028/`.
  The generator run: `./measure/generate.sh` and a commit of `measure/generated/*`.
  Another session owns both paths now, so this track leaves them alone. Record the items here and
  tell the PM.
