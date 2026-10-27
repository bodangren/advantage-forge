# Fill every empty shelf in the games and scene maps

Status: new (2026-10-28). The [specification](./spec.md) owns the scope and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. Red writes the check. Green fills the
  shelves and the maps.
- Owned source paths: `src/games/enchanted-library/`, `src/games/haunted-library/`,
  `src/games/potion-rush/`, `src/games/alchemists-synthesis/`, `src/games/rune-forge-chamber/`,
  `scenes/maps/`, `scripts/design-bathhouse.mjs`, `scripts/design-warehouse.mjs`,
  `scripts/design-inn.mjs`, `scripts/design-school.mjs`, `scripts/design-archive.mjs`, and
  `src/apk3d/contracts/model-pack.ts`.
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

- [ ] Task: Write the failing shelf check (Red).
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
- [ ] Task: Fill the two library games (Green).
  Owned paths: `src/games/enchanted-library/view/hall.ts`,
  `src/games/enchanted-library/manifest.ts`, `src/games/haunted-library/view/library.ts`,
  `src/games/haunted-library/manifest.ts`.
  Replace every `shelf` with `bookcase`. The bookcase holds books and no candle.
  Add `bookcase` to each game's model list and to each `MODELS_3D` list.
- [ ] Task: Fill the shop, lab, and forge games (Green).
  Owned paths: `src/games/potion-rush/view/shop.ts`, `src/games/potion-rush/manifest.ts`,
  `src/games/alchemists-synthesis/view/lab.ts`, `src/games/alchemists-synthesis/manifest.ts`,
  `src/games/rune-forge-chamber/view/forge.ts`, `src/games/rune-forge-chamber/manifest.ts`.
  Keep the `shelf` and put items on its boards: bottles, bread, and apples in Potion Rush; bottles
  and vials in Alchemists' Synthesis; crates and sacks in Rune Forge Chamber.
  Place each item on a board top and scale the board height with the shelf scale of the view.
- [ ] Task: Fill the bathhouse and warehouse shelves (Green).
  Owned paths: `scripts/design-bathhouse.mjs`, `scenes/maps/bathhouse.ts`,
  `scripts/design-warehouse.mjs`, `scenes/maps/warehouse.ts`.
  Edit the generator, then run it. The bathhouse shelves hold jars and baskets. The warehouse
  shelves hold crates and sacks.
  The bathhouse comment at `scripts/design-bathhouse.mjs:43` promises towels. Change the comment
  to the items that the map holds.
- [ ] Task: Repair the floating items in the inn, school, and archive maps (Green).
  Owned paths: `scripts/design-inn.mjs`, `scenes/maps/inn.ts`, `scripts/design-school.mjs`,
  `scenes/maps/school.ts`, `scripts/design-archive.mjs`, `scenes/maps/archive.ts`.
  Move the inn bottle and mug onto the board at y 0.8025 and off the back panel. Lower the school
  jar and orb onto the cabinet top at y 0.99. Move the archive candle out of the cabinet.
  Edit each generator, then run it.
- [ ] Task: Register the new game models and rebuild the packs (Green).
  Owned path: `src/apk3d/contracts/model-pack.ts`.
  Put `bookcase` in a pack that the two library games load, and add it to each `GAME_LOADS` model
  list. Run the pack binding test and the budget test. The set piece limit is 200,000 bytes and the
  game total limit is 6,000,000 bytes. If the bookcase model is too heavy, reduce its build
  (texture size and triangle budget) or fall back to the `shelf` with `tome` and `spellbook` props
  on its boards. Record the chosen path.
  Commands: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`.
- [ ] Task: Render every changed game view and map, and look at each render.
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
- [ ] Task: Run the check and the model tests again (Green).
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts
  --maxWorkers=1'`.
  Record the exit code, the test counts, and the type check of the owned paths.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node
  node_modules/typescript/bin/tsc --noEmit'`. Record the owned errors and the baseline errors.

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
