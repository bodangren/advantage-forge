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
  tests/games/rune-forge-chamber/manifest.test.ts tests/games/filled-shelves.adversarial.test.ts --maxWorkers=1'`
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

- [x] Task: Write the failing shelf check (Red). Test commits `e4e94d76`, `a9e1914b`.
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

- [x] Task: Fill the two library games (Green). Commits `455d2c1d`, `d28bb5bb`.
  Owned paths: `src/games/enchanted-library/view/hall.ts`,
  `src/games/enchanted-library/manifest.ts`, `src/games/haunted-library/view/library.ts`,
  `src/games/haunted-library/manifest.ts`.
  Replace every `shelf` with `bookcase`. The bookcase holds books and no candle.
  Add `bookcase` to each game's model list and to each `MODELS_3D` list.
- [x] Task: Fill the shop, lab, and forge games (Green). Commits `a56b4b19`, `d28bb5bb`, `f8d1dfc4`.
  Owned paths: `src/games/potion-rush/view/shop.ts`, `src/games/potion-rush/manifest.ts`,
  `src/games/alchemists-synthesis/view/lab.ts`, `src/games/alchemists-synthesis/manifest.ts`,
  `src/games/rune-forge-chamber/view/forge.ts`, `src/games/rune-forge-chamber/manifest.ts`.
  Keep the `shelf` and put items on its boards: bottles, bread, and apples in Potion Rush; bottles
  and vials in Alchemists' Synthesis; crates and sacks in Rune Forge Chamber.
  Place each item on a board top and scale the board height with the shelf scale of the view.
- [x] Task: Fill the bathhouse and warehouse shelves (Green). Commits `39a8a6f8`, `d28bb5bb`.
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
- [x] Task: Register the new game models and rebuild the packs (Green). Commits `455d2c1d`, `f8d1dfc4`.
  Owned path: `src/apk3d/contracts/model-pack.ts`.
  Put `bookcase` in a pack that the two library games load, and add it to each `GAME_LOADS` model
  list. Run the pack binding test and the budget test. The set piece limit is 200,000 bytes and the
  game total limit is 6,000,000 bytes. If the bookcase model is too heavy, reduce its build
  (texture size and triangle budget) or fall back to the `shelf` with `tome` and `spellbook` props
  on its boards. Record the chosen path.
  Commands: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`.
- [x] Task: Render every changed game view and map, and look at each render. Commits `8a457be7`, `d28bb5bb`.
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
- [x] Task: Run the check and the model tests again (Green). Commits `8a457be7`, `d28bb5bb`, `f8d1dfc4`.
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

- [x] Task: Remediate Review A and Review C findings (round 2). Commits `d28bb5bb`, `f8d1dfc4`. Red test commit `a9e1914b`.
  Owned path: `tests/games/filled-shelves.test.ts` (Red) and the Green source paths in the plan.
  Cover five findings. Red owns the skip list and the new rules (done in `a9e1914b`). Green owns the
  placements and the model wiring.
  - RA-FS-4: freeze the view case counts (enchanted-library bookcase 8, haunted-library bookcase 8,
    potion-rush shelf 2, alchemists-synthesis shelf 2, rune-forge-chamber shelf 2) and the classroom
    bookcase 1. Add in-test fixtures that fail when the deliverable is removed. Owner: Red.
  - RA-FS-3: narrow the mounted-fixture skip list to chandelier, torch-sconce, and wall-sconce. The
    free-standing props (candle-cluster, lantern, torch, candelabra, brazier, fireplace, campfire,
    campfire-out, watchfire) become items. The rune-forge candle cluster then fails F3 until Green
    moves it onto a board. Owner: Red (skip list), Green (placement).
  - RA-FS-7: add an item height table and a clearance rule, plus an item depth table and a
    board-depth rule. The rules apply to the in-scope shelves only: the views potion-rush,
    alchemists-synthesis, rune-forge-chamber and the maps bathhouse, warehouse, inn, alchemy-lab.
    The 9 resting kinds (bottle, vial, jar, basket, crate, sack, bread, apple, mug) have height and
    depth entries. Owner: Red (rules), Green (placements).
  - RA-FS-14: remove the always-true `shelf counts` assertion. Owner: Red.
  - RC-FS-1: assert the required item kinds per place. The Alchemists' Synthesis lab must place a
    vial. Owner: Green (vial placement and model wiring in view, manifest, game load, and pack).

  Red evidence (round 2, 2026-10-29):

  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
    node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'`.
    Result: exit 1. Summary: `Tests  4 failed | 10 passed (14)`.
  - F3 (floating view items): 1. rune-forge-chamber candle-cluster at [-2.5, 1, -3.4] floats over
    shelf at [-2.5, 0, -3.5]. The narrowed skip list now counts it as an item.
  - Clearance (RA-FS-7): 12. bathhouse 4 jar and 4 basket (top 0.92 and 0.94 pass 0.7575), alchemy-lab
    4 jar (top 1.25 twice, 1.56, and 0.92 pass 1.0675, 1.43, and 0.7575).
  - Board-depth (RA-FS-7): 26 items. alchemy-lab 4 jar (front 0.302 passes 0.3); bathhouse 4 jar
    (back 0.018) and 4 basket (back -0.05 and front 0.35); warehouse 3 crate (back 0.007) and 3 sack
    (back 0.028); potion-rush 2 bread and 2 apple (centre z 0.3); rune-forge 2 crate (back 0.007)
    and 2 sack (back 0.027).
  - RC-FS-1: 1. alchemists-synthesis missing `vial`.
  - The narrowing causes exactly one new float. No other free-standing fixture sits over a shelf or
    cabinet footprint in the seven shelf maps or the school, archive, and guild-hall cabinets.
  - Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
    node_modules/typescript/bin/tsc --noEmit'`. Exit 2. Owned errors (filled-shelves.test.ts): 0.
    Total: 31, which matches the baseline.
  - Deviations: (1) the role base SHA for this run is `ee9addc8`, and the run started at HEAD
    `ee9addc8`, not `d0ab3232` as the Review A artifact named. The commits after `cd9029c3` change
    only Storytime paths and are not touched. (2) Red ran on the DeepSeek model
    `deepseek-v4-pro#high`. Green ran on OpenAI/MiniMax, so the independence holds.

### Green evidence (round 2, 2026-10-29)

The fixes of this round:

| Finding | Fix | Commit |
| --- | --- | --- |
| RA-FS-1 | The bathhouse jars stand at 0.58 and the baskets at 0.55, so their tops clear the board above. | `d28bb5bb` |
| RA-FS-2 | The west barrel of the guild hall moved to [-6.4, 0, 2.6], inside the room and clear of the cabinet at [-6.6, 0, 3.6]. | `d28bb5bb` |
| RA-FS-3 | The rune forge candle cluster stands on the floor at [-2.5, 0, -2.9], in front of the left shelf and outside its footprint. | `d28bb5bb` |
| RA-FS-5 | The potion rush loaf and apple stand on the top board at z -3.35, in line with the bottles. | `d28bb5bb` |
| RA-FS-6 | The warehouse and rune forge crates stand at 0.55 and the sacks at 0.6, 0.16 m in front of the shelf origin. | `d28bb5bb` |
| RA-FS-7 | The alchemy lab shelf jars stand at 0.55, so their tops clear the board above and their fronts stay on the board. | `d28bb5bb` |
| RA-FS-10 | The haunted library bookcases moved from z -1.0 to z -0.75, clear of the back wall. | `d28bb5bb` |
| RC-FS-1 | The alchemy lab places three vials on the top board of each shelf. The vial is wired through the view list, the manifest, the game load and the pack. | `f8d1dfc4` |

Gate results:

- Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
  node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts
  tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts
  tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts
  tests/games/rune-forge-chamber/manifest.test.ts --maxWorkers=1'`. Exit 0. Summary: `Test Files  7
  passed (7)` and `Tests  140 passed (140)`. The run before the commits and the run after the two
  commits give the same result.
- The orchestrator command `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
  600 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'` is part of
  that gate and exits 0.
- Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
  node_modules/typescript/bin/tsc --noEmit'`. Exit 2. Owned errors 0. Total 136. The committed
  baseline is 31. The other 105 errors sit in the uncommitted files of other sessions:
  `tests/games/castle-defense/` 68, `tests/games/magic-defense/` 35, and
  `src/storytime/book-pictures.ts` 2. No error names a path of this track.
- The sprite parity test `tests/apk3d/sprite-parity.test.ts` exits 1 with two rows: the
  `library-furniture/bookcase` and the `potion-shop/vial` 2D file are missing. The bookcase row
  failed before this round (RC-FS-2). The 2D entries belong to the Phase 2 release.

Game view renders. Each run printed `diagnostics none` and `errors none`. The command is
`bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node --import tsx
scripts/apk3d-shot.ts both --game <id> --first'`.

| Game and layout | Path | SHA-256 |
| --- | --- | --- |
| potion-rush portrait | `out/apk3d-shots/potion-rush/portrait/05-first.png` | `b6184a596461084532744f5ae6b5eaadd0e1e155bf23a5910c62d25638ffbb5c` |
| potion-rush landscape | `out/apk3d-shots/potion-rush/landscape/05-first.png` | `3dcc70be6c4c837f5537eaa35427e61da4974dfd781a50ff0ff0e11c0db5d70c` |
| alchemists-synthesis portrait | `out/apk3d-shots/alchemists-synthesis/portrait/05-first.png` | `69434647565ce1210d6e303f5fd1344a1d480cf13f4cd146c29dbf7a940636bb` |
| alchemists-synthesis landscape | `out/apk3d-shots/alchemists-synthesis/landscape/05-first.png` | `9d7644e9a893e29f4eb6f7727d2fd34d5cc8de3746fcd77948fe0d13a316033c` |
| rune-forge-chamber portrait | `out/apk3d-shots/rune-forge-chamber/portrait/05-first.png` | `c23ae1ee70a8f81fae26fa3b475fa85c71e09dfa739d8d4be746533424f7d297` |
| rune-forge-chamber landscape | `out/apk3d-shots/rune-forge-chamber/landscape/05-first.png` | `80a8c201c01c933f4d5ba874be71c2a3727ad4ba21bb18bfb7b780a894700587` |
| haunted-library portrait | `out/apk3d-shots/haunted-library/portrait/05-first.png` | `e742816be9fbae48afb9e974ac2ad6cd57fbbe746269145f620e5ee5e83eb65f` |
| haunted-library landscape | `out/apk3d-shots/haunted-library/landscape/05-first.png` | `475527fb1eb5f80d340804b298dc54afdf2fa7db9bf03b1b7a12e9c8ac99e8ca` |

Looks and the three largest differences per render:

- potion-rush portrait: (1) the top board of each shelf now carries the loaf and the apple; (2) the
  bottle rows read soft at 512 px; (3) every bottle, the loaf and the apple rest on a board, and
  nothing hangs over the board edge.
- potion-rush landscape: (1) the top board of each shelf carries the loaf and the apple; (2) the
  middle board of the left shelf holds three bottles and leaves both ends empty; (3) the loaf stands
  clear of the bottles and rests on the board.
- alchemists-synthesis portrait: (1) the top board of each shelf carries three small green vials;
  (2) the bottle rows read soft; (3) the four pedestals hold their ingredients and nothing floats.
- alchemists-synthesis landscape: (1) the vials read as small green dots on the top board; (2) the
  shelves sit high in the frame; (3) every bottle and every vial rests on a board.
- rune-forge-chamber portrait: (1) the camera crops both shelves at the frame edges; (2) the crate
  and the sack stand on the lower board of each shelf, in front of the back panel; (3) the candle
  cluster stands on the floor in front of the left shelf, and nothing floats.
- rune-forge-chamber landscape: (1) the shelves sit at the top of the frame; (2) the crate and the
  sack rest on the lower board of each shelf; (3) the candle cluster stands on the floor clear of
  the shelf footprint.
- haunted-library portrait: (1) the bookcases stand clear of the back wall; (2) the spines read soft
  at 128 px; (3) every case carries books on each row and no candle stands on a case.
- haunted-library landscape: (1) the bookcases stand in front of the wall and the green pads stay
  clear of them; (2) the spines read soft at 128 px; (3) every case carries books and no candle
  stands on a case.

Map renders. The command is `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '... vite
--port 5199 ... node scripts/shoot-map.mjs out/filled-shelves <name>=scene=<map>&az=..&el=..&dist=..
&tx=..&tz=..'`. The default camera of the map viewer sits 46 m away, so each changed map was
rendered again with camera values that frame the changed piece.

| Map and camera | Path | SHA-256 |
| --- | --- | --- |
| bathhouse, default | `out/filled-shelves/bathhouse.png` | `62c82b233b7ceeb7156a253aa542d7b43b9340a7ebb49b17a665e12bc65dc922` |
| bathhouse, `az=0&el=22&dist=15&tx=0&tz=-4.5` | `out/filled-shelves/bathhouse-close.png` | `17b1b5a0600aa6cb250725fd2ee5278d293a48900f5655b14a3310da8ad3256b` |
| warehouse, default | `out/filled-shelves/warehouse.png` | `bf74de373518138e14ff380c42dde112a0c80a104fd05f1a3e69403e9ad7e67c` |
| warehouse, `az=90&el=20&dist=16&tx=-4.6&tz=0.6` | `out/filled-shelves/warehouse-close.png` | `4914e6e4e3be09b12cff3210e1360aeeea9bf20cf0ddb867779d3b317eb5cf38` |
| alchemy-lab, default | `out/filled-shelves/alchemy-lab.png` | `84d902dfae09e7b16dd431f7255d906c371a0a0f2ecd125790048b3a4c39282c` |
| alchemy-lab, `az=0&el=20&dist=9&tx=0.8&tz=-3.94` | `out/filled-shelves/alchemy-lab-close.png` | `bc13798e7085c3384837cbb88b4957374055614bbd1d3539f31b96850085c3d0` |
| guild-hall, default | `out/filled-shelves/guild-hall.png` | `57df3f18e6f92d2e2651e8d017a1e919e011a76ee66b5fdf39456dcb92a6ba0c` |
| guild-hall, `az=90&el=22&dist=9&tx=-7.2&tz=3.3` | `out/filled-shelves/guild-hall-close.png` | `e71eff35a4f3193841a5f75e05f3da07f390f412f1e84fb8cf9e51062d0c1495` |

Looks and the three largest differences per render:

- bathhouse default: (1) the room fills the middle of the frame and the black margins hold the
  rest; (2) the shelves are too small to read; (3) no empty shelf shows.
- bathhouse close: (1) the jar and the basket stand on the lower board of each of the four shelves;
  (2) the middle and the top board stay bare; (3) every jar and basket rests on the board and
  clears the board above.
- warehouse default: (1) the room floats in the middle of the frame; (2) the shelves are too small
  to read; (3) no empty shelf shows.
- warehouse close: (1) the crate and the sack stand on the lower board of each west shelf, in front
  of the back panel; (2) the middle and the top board stay bare; (3) no shelf is empty and nothing
  floats.
- alchemy-lab default: (1) the room floats in the middle of the frame; (2) the shelves are too small
  to read; (3) no empty shelf shows.
- alchemy-lab close: (1) the north shelf carries jars, bottles and vials on its three boards; (2) the
  jars are smaller now and their tops clear the board above; (3) every item rests on a board and
  stays on it.
- guild-hall default: (1) the room floats in the middle of the frame; (2) the west corner is too
  small to read; (3) no barrel stands inside a cabinet.
- guild-hall close: (1) the moved barrel stands on the floor inside the room, clear of the west wall
  and of the cabinet; (2) the cabinet keeps its plates on top; (3) the wall cases hold books.

No render shows an empty shelf, a floating item, or an item that hangs over a board.

Mutations. Each log holds the diff of the mutation, the command, the output of the test and the exit
code. The logs sit in `measure/runs/asset_filled_shelves_20261028/`.

| Id | Mutation | Row | Result |
| --- | --- | --- | --- |
| M1 | Remove one bottle placement from a potion rush shelf. | F2 | The row passes, exit 0. The shelf keeps five items, so the row as written does not fail. |
| M1b | Empty one potion rush shelf. | F2 | Fails, exit 1. The shelf holds 0 items. |
| M2 | Move one potion rush bottle from y 0.4725 to y 0.52. | F3 | Fails, exit 1. |
| M3 | Raise the school jar from y 0.99 to y 1.02. | F4 | Fails, exit 1. |
| M4 | Put the library view back to `shelf`. | F7 | Fails, exit 1. |
| M5 | Name `bookcase` in a manifest but in no pack. | F9 | Fails, exit 1, with the message `unknown model binding "bookcase": no loaded pack holds it`. |
| M6 | Give a bathhouse jar the wrong scale, 1 instead of 0.58. | The clearance row | Fails, exit 1. Four jars pass the next board bottom. |
| M7 | Move the jar and the basket of one bathhouse shelf out of the footprint. | F1 | Fails, exit 1. The shelf holds 0 items. |
| M8 | Remove the vial from the alchemy lab. | RC-FS-1 | Fails, exit 1. The row names the missing `vial`. |

M6, M7 and M8 are the two extra cases of the strategy section 7 ("a shelf whose item sits outside the
footprint and a shelf whose item uses the wrong scale") and the new kind rule. Every mutated file
was restored from a backup copy, and `git status --short` shows no change in them.

Doctor result. `./measure/doctor.sh` exits 1 with twelve findings. None names a path of this
track.

| Finding | Owner |
| --- | --- |
| `measure/tracks/game_archers_revenge_rebuild_20261029/plan.md`: new track has started tasks | Not owned. Another track owns that plan. |
| `measure/tracks/game_castle_defense_rebuild_20261029/plan.md`: new track has started tasks | Not owned. Another track owns that plan. |
| `measure/tracks/game_magic_defense_rebuild_20261029/plan.md`: new track has started tasks | Not owned. Another track owns that plan. |
| `measure/tracks/game_paladins_twin_soul_rebuild_20261029/plan.md`: new track has started tasks | Not owned. Another track owns that plan. |
| `measure/tracks.md`: missing registry link for asset_filled_shelves_20261028 | Not owned. The plan lists the registry entry as a Phase 2 closeout item. |
| `measure/tracks.md`: missing registry link for the four rebuild tracks | Not owned. Another session owns that path. |
| `measure/lessons-learned.md`: 52 lines exceeds 50 | Not owned. Another session owns that file. |
| `measure/generated/status.md`: stale generated fact | Not owned. The generator run is a Phase 2 closeout item. |
| `measure/generated/asset-inventory.json`: stale generated fact | Not owned. The same closeout item. |

Deviations of round 2:

1. The model stayed MiniMax (the Green model family). Red ran on `deepseek-v4-pro#high`, so the
   independence holds.
2. The rune forge candle cluster stands on the floor instead of on a board. The check counts a
   free-standing fixture as an item, and its height table has no entry for `candle-cluster`, so a
   placement on a board would fail the coverage row. A floor placement outside the shelf footprint
   is the only placement the frozen check accepts.
3. The potion rush loaf and the apple moved to the top board. On the lower board the loaf would
   touch the bottle of the same place, and the top board was bare.
4. The crate at 0.65 is 0.286 m deep, deeper than the 0.27 m of board between the back panel and
   the frame front, so the crates stand at 0.55 and the sacks at 0.6. The jars and the baskets use
   the apothecary scale of 0.58 and the bakery scale of 0.55.
5. The `potion-shop` pack moved from 1.0.0 to 1.1.0, because the pack gained the vial model and the
   pack script gives a pack that adds a model the next minor version. The other eight packs kept
   their versions. The monorepo sync of `potion-shop` 1.1.0 is a Phase 2 item.
6. The 2D pack holds no `prop.bookcase` and no `prop.vial` file, so the sprite parity test fails for
   two rows. The bookcase row failed before this round. Both 2D entries belong to the Phase 2
   release.
7. The type check total is 136, above the baseline of 31, because other sessions added uncommitted
   test files. The 105 extra errors sit in `tests/games/castle-defense/` (68),
   `tests/games/magic-defense/` (35) and `src/storytime/book-pictures.ts` (2). The owned count is 0
   and no error names a path of this track.
8. The mutated files were restored from a backup copy, not with `git checkout`, because the fixes of
   this round were still uncommitted.
9. No run of this round waited over 600 s for the lock.

- [x] Task: Remediate Review A round 4 findings (round 3). Source commit `929f20aeb5fbe8167b6a5f0e1af9a02d16f2f8ca`; test commit `0e9af0f7`.
  Owned path: `tests/games/filled-shelves.test.ts` (Red) and the Green source paths in the plan.
  Review A round 4 (`review-a-cd11315.json`) closed the round-2 work and found two new placement
  defects and two test gaps. Cover four findings. Red owns the table and the two new rules (done in
  `0e9af0f7`). Green owns the placements.
  - RA-FS-15 (blocking): the moved guild-hall barrel at [-6.4, 0, 2.6] scale 0.9 enters the
    bookshelf at [-6.72, 0, 2.4] by 0.18 m. Owner: Green (move the barrel to about
    [-6.05, 0, 2.6], clear of the bookshelf front and the banner).
  - RA-FS-16 (blocking): the haunted-library bookcases at z -0.75 enter the door depth band by
    0.145 m and hide the open-door glow at z -0.63. Owner: Green (move the bookcases to about
    z -0.95; front then -0.715, behind the arch back -0.66).
  - RA-FS-17 (medium): rule R3 had no bookshelf or bookcase footprint. Owner: Red (added in
    `0e9af0f7`: a centred bookshelf footprint 1.0 x 0.368 m and a bookcase 1.28 x 0.45 m, plus a
    floor prop radius table from the stats.json bounds).
  - RA-FS-18 (low): five item table entries sat under the measured bounds. Owner: Red (taken from
    the stats.json bounds in `0e9af0f7`: sack height 0.437, basket depth 0.415, vial height 0.132,
    apple height 0.133, mug height 0.124). No placement changes result.

  Red evidence (round 3, 2026-10-29):

  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
    node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'`.
    Result: exit 1. Summary: `Tests  2 failed | 14 passed (16)`.
  - RA-FS-15/17: 1. guild-hall row 160 barrel at [-6.4, 0, 2.6] enters the bookshelf at
    [-6.72, 0, 2.4], radius 0.307 overlaps by 0.18 m.
  - RA-FS-16: 8. The eight haunted-library bookcases at z -0.75 have front -0.515, inside the door
    band back -0.661.
  - The 14 other rows pass, so the corrected item tables (RA-FS-18) change no pass to a fail.
  - Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
    node_modules/typescript/bin/tsc --noEmit'`. Exit 2. Owned errors (filled-shelves.test.ts): 0.
    Total: 37. The baseline 31 (assets/ and tests/part.test.ts) plus
    `src/games/castle-defense/core/sim.ts` 6 of another track.
  - Deviations: (1) the Red run waited over 600 s for the shared heavy lock while other sessions ran
    long jobs; the first call recorded `lock wait over 600 s` and a later retry in the same call
    acquired the lock. (2) The bookshelf/bookcase footprint rule is asserted on the changed map
    `guild-hall`, and the door band rule on the `haunted-library` view, because the pre-existing
    bookshelf and bookcase collisions in archive, bank, library, and warehouse sit outside this
    track's scope. (3) RA-FS-18 changes only the five named entries; the rest stay as measured or
    over-conservative (sack depth 0.35 stays above the measured 0.32).

  Green evidence (round 3):

  - Targeted Red command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'`. Exit 1; `Tests 2 failed | 14 passed (16)`. The failures name the guild-hall barrel overlap and eight haunted-library door-band overlaps.
  - Source commit `929f20aeb5fbe8167b6a5f0e1af9a02d16f2f8ca` moves only the guild-hall barrel to x -6.05 and the eight haunted-library bookcases to z -0.95.
  - Green gate: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts tests/games/rune-forge-chamber/manifest.test.ts --maxWorkers=1'`. Exit 0; 7 test files passed, 142 tests passed. The two round-3 rows pass.
  - Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`. Exit 2; 31 total errors and 0 owned errors. The total is not above the baseline 31.
  - Correction: the first round-3 evidence named a stale file, rendered before the barrel move. The new render is timestamped `10-30_01:35`; SHA-256 `d8864331d2cbe0deb92efe231a947aa898bf5b693d1ba64a09083f70c80ad81a`.
  - Guild-hall render: `out/filled-shelves/guild-hall-close.png`, mtime `10-30_01:35`, SHA-256 `d8864331d2cbe0deb92efe231a947aa898bf5b693d1ba64a09083f70c80ad81a`. Look: (1) the barrel at [-6.05, 0, 2.6] clears the bookshelf front; (2) it clears the banner stand; (3) the nearby crates remain to the left and do not block the bookcase.
  - Haunted-library render: `out/apk3d-shots/haunted-library/landscape/05-first.png`, SHA-256 `236ee52a1989e60414bc62854c9197719ba8758b06b9135ae56cc849dc9b7b81`. Look: (1) bookcases sit behind the arch backs; (2) the arch openings and door glow sightline are clear; (3) book spines remain visible across the three floors.
  - Deviation: Red round 3 stopped at the 17:15 ICT restart before it wrote its `MEASURE_AGENT_RESULT` log. The orchestrator verified the two Red commits and confirmed the targeted Red command failed as expected. No Green lock wait exceeded 600 s.
  - [x] Task: Remediate Review C round 3 finding RC-FS-8 (Green). Commit `0f99a1d57ddadbaa285c5af1942800600eb3a91e`.
    Owned path: `scripts/design-guild-hall.mjs`. The generator diff changes only the first west barrel x from -6.4 to -6.05.
    `node scripts/design-guild-hall.mjs` exited 0 and reported `169 places; missing glb: none`.
    `git diff --exit-code -- scenes/maps/guild-hall.ts` exited 0 with no output after generation.
    GREEN_TEST_COMMAND exited 0: 7 test files passed and 142 tests passed.
  - [x] Task: Remediate adversarial finding M5 (Green). Commit `fe23329a` is the Red test evidence SHA.
    GREEN_TEST_COMMAND: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts tests/games/rune-forge-chamber/manifest.test.ts tests/games/filled-shelves.adversarial.test.ts --maxWorkers=1'`. Exit 0; 8 test files passed; 144 tests passed.

## Phase 2: The hand-off

Roles: Green commits and releases the packs. The PM receives the status line and hands the commit
to the monorepo session.

- [x] Task: Commit the change in Forge by explicit paths. Existing commits: `d28bb5bb26d8a6a4fc4bfd467305cb66af035981`, `f8d1dfc4d241ee8933790735b4e691f25c770efc`, `cd11315f2ae9da508bffa7623954a295b92e34f2`, `929f20aeb5fbe8167b6a5f0e1af9a02d16f2f8ca`, and `0f99a1d57ddadbaa285c5af1942800600eb3a91e`. No new commit was needed for this task.
  Use `git commit -m "fix(scenes): fill every empty shelf" -- <paths>`. Stage only the owned paths.
  Other sessions share the tree and the git index. Never stage `measure/tracks.md` or
  `measure/generated/*`.
- [x] Task: Re-bake the Potion Rush 2D background (RA-FS-8). Commit `9938df4b1cf22daa3daf36f665e74d5a432b9d48`. The heavy-run command exited 0. It wrote `out/apk2d/backgrounds/potion-rush/background.png`; SHA-256 `14bdd1fcd33a6853b7837259475b34f502879899a26efcdfbd8e431f1770e9c5`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node --import
  tsx scripts/apk2d-bake.ts potion-rush'`.
  The 3D set of the potion rush changed in this track: the loaf and the apple moved to the top
  board of each shelf. The 2D background is a bake of that set, so it must show the same picture.
  Run it before the pack release and record the output.
- [x] Task: Add the 2D pack entries for the new models (RC-FS-2 and the parity rows). Commit `9938df4b1cf22daa3daf36f665e74d5a432b9d48`. `scripts/apk2d-sprites.ts bookcase vial` completed. `scripts/apk2d-pack.ts` wrote pack version `1.3.0`. The first pack run used incomplete ignored sprite folders and removed unrelated entries. I restored the tracked sprites and retained only `background.potion-rush`, `prop.bookcase`, and `prop.vial` from that build. The parity test passed: 1 file and 96 tests. Bookcase sprite SHA-256: `f5480a9edd3db8e698a7698695ea724a1f3dd0a265ffe110ffa9860635e18a32`; vial sprite SHA-256: `748e072056e107f09add118db4b1a82fa2f91536909dbbf5bd253cdd1a5c6b28`.
  The 2D pack `primary-chibi-2d` has no `prop.bookcase` and no `prop.vial` file, so
  `tests/apk3d/sprite-parity.test.ts` fails for the `library-furniture` and the `potion-shop`
  packs. Run `scripts/apk2d-sprites.ts bookcase vial` and then `scripts/apk2d-pack.ts`, and record
  the new 2D pack version. The parity test must pass before the hand-off.
- [x] Task: Release the model packs when a pack changed. 2D pack commit: `9938df4b1cf22daa3daf36f665e74d5a432b9d48`. `--check` passed the MODEL_PACKS source check and listed `bookcase` stale in 3D and 2D and `vial` stale in 2D. `--commit` exited 0. It rebuilt `bookcase` from source commit `3419926f` and confirmed identical bytes, so it retained `forgeCommit` `455d2c1d`. No 3D pack bytes changed, so the release tool made no separate release commit. Versions remain `potion-shop` 1.1.0 and `library-furniture` 1.0.1. The potion-rush game pack total is 5.70 MB, below 6,000,000 bytes.
  The `--check` command passed its MODEL_PACKS source check. It listed `bookcase` as stale in 3D and 2D, and `vial` as stale in 2D. The release will rebuild these models.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run the same command with
  `--commit`. A rebuild to the same bytes changes no pack version.
  Record the pack versions and the release commit.
  The `potion-shop` pack moved from 1.0.0 to 1.1.0 in this track, because it gained the vial model.
  The release must carry that version to the monorepo.
  `scripts/apk-release.ts --check` must pass before the release, because it checks the MODEL_PACKS source against the built packs (adversarial M5).
- [x] Task: Make the handoff file and prepare the status line for the PM. Commit `9938df4b1cf22daa3daf36f665e74d5a432b9d48`. Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx scripts/monorepo-handoff.ts --monorepo ../reading-advantage-monorepo --branch master --target primary-parity-integration'`. The handoff file is `out/monorepo-sync/handoff-9938df4b.md`. I used the local `../reading-advantage-monorepo` checkout and `--branch master`, because the configured `apk3d-games-port` branch is absent. The target branch `primary-parity-integration` is also absent. The read-only sync check exited 1 because `monorepo-sync.ts` rejects a `master` checkout. No monorepo files changed. Per the owner instruction, I did not send the status line.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. Read
  `out/monorepo-sync/handoff-<sha>.md`.
  Send one status line to the PM. The line names the Forge commit, the changed games and scenes,
  and the render paths with SHA-256. The PM hands the commit to the monorepo session for its
  cartridge sync, as in monorepo `0c220e663`, synced from Forge `afc8b890`.
- [x] Task: Record the closeout items that this track must not touch. Commit `9938df4b1cf22daa3daf36f665e74d5a432b9d48` owns this Phase 2 hand-off.
  The registry entry for `measure/tracks.md`:
  `- [ ] **Track: Fill every empty shelf in the games and scene maps**` with the link
  `./tracks/asset_filled_shelves_20261028/`.
  The generator run: `./measure/generate.sh` and a commit of `measure/generated/*`.
  Another session owns both paths now, so this track leaves them alone. Record the items here and
  tell the PM.
  This track did not edit `measure/tracks.md` or `measure/generated/*`, and did not run `./measure/generate.sh`. The closeout owner must add the registry line and run the generator.
  Final Green gate: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts tests/games/rune-forge-chamber/manifest.test.ts tests/games/filled-shelves.adversarial.test.ts tests/apk3d/sprite-parity.test.ts --maxWorkers=1'` exited 0: 9 test files and 240 tests passed.
- [x] Task: Make the shelf-only sync branch and the new hand-off (PM decision 2026-10-30). Branch tip `623e7b5d5cc44c6584a903634ffa988625958da4`.
  Rebuilt `shelf-sync-20261030` from `afc8b8909f383a1498f6bc499695a927adb884cf`. Added only `scenes/maps/classroom.ts` and `scripts/design-classroom.mjs` from `96cfd025` in commit `65454e02003e7678fdfce43592c8dc8e0f1c024b`, then cherry-picked with `-x`, in order: `e4e5c593`, `e4e94d76`, `39a8a6f8`, `a56b4b19`, `455d2c1d`, `3419926f`, `8a457be7`, `a9e1914b`, `d28bb5bb`, `f8d1dfc4`, `0e9af0f7`, `929f20ae`, `0f99a1d5`, `fe23329a`, `9938df4b`. No conflicts occurred in this rebuild. Deviation: the branch carries the two classroom map files from `96cfd025`; they are outside the synced paths. The aborted first attempt and its missing classroom prerequisite are recorded in the provisional log.
  Scope proof 4a: `git diff --stat afc8b890..shelf-sync-20261030 -- src/apk3d src/games tests/games demo/public/packs demo/public/assets/apk` reports 43 files, 965 insertions, and 27 deletions. Forbidden A-28 and `src/games/shared` path count: 0. Scope proof 4b: diff against `885a254d` for the shelf paths, `scenes/maps`, and `scripts/design-*.mjs` is empty (exit 0).
  Shelf gate exited 0: 9 test files and 240 tests passed. The read-only handoff check exited 1 because the local monorepo checkout is on `master`; the file was written at `out/monorepo-sync/handoff-623e7b5d.md`. It names `library-furniture` 1.0.1, `potion-shop` 1.1.0, and `primary-chibi-2d` 1.3.0. The handoff lists the vial for `alchemists-synthesis` and `potion-rush`. Review C confirms the vial is also used in `rune-forge-chamber`; the handoff does not list it there. Pack contents and game changes are limited to the shelf work.
  Potion Rush bake SHA-256: `14bdd1fcd33a6853b7837259475b34f502879899a26efcdfbd8e431f1770e9c5`. Committed 2D background SHA-256: `3fdf844bf49a36fea5fa526a0fb87fc1d7e80e681ff781c4eff62ef6af4b5b7c`.
  Keep this worktree and branch until the monorepo merges the sync. Closeout must remove the worktree and branch after that merge.
