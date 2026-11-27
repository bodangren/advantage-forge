# Test strategy: fill every empty shelf in the games and scene maps

Track: `asset_filled_shelves_20261028`. Phase: P1, "The check, the game fills, and the map fills".
Phase 2 owns the hand-off. This strategy covers the check, the fills, the pack wiring, and the renders.

## 1. Risks

| Risk | Effect | Level | Falsifier |
| --- | --- | --- | --- |
| A source loop hides a placement from the check. | An empty shelf survives the gate. | high | F2 counts the case placements of the five views. A new shelf raises the count. |
| An item rests on a wrong height and the check does not see it. | A floating item ships. | high | F3 fails when one bottle leaves its board top. |
| A defect outside the track scope fails the check. | The closeout blocks. | medium | The frozen count table names every pre-existing finding. |
| The new model does not reach the pack. | The game loads a missing model. | high | F9 and F10 fail before the pack release. |
| The 2D pack loses the 1:1 match. | The 2D cartridge has no file for the model. | medium | F11 fails when the 2D file is missing. |
| A render passes the format check and still shows a gap. | The owner sees an empty shelf. | medium | The render rule needs a look and a SHA-256 for each path. |

Phase risk: P1 is `medium`. P2 is `medium`, because the pack release and the hand-off change the byte state of the packs.

## 2. The check

One file owns the check: `tests/games/filled-shelves.test.ts` (Red writes it).

- The maps: import `places()` from each `scenes/maps/*.ts` and evaluate the array. No text parse.
- The five game views: run the view builder with a recording stub. The stub holds `scene`, `loader`,
  `addSun`, `onFrame`, and `timeline`. The loader returns an empty `THREE.Object3D` for every model.
  The stub records the model name, the position, the scale, and the yaw of every placement.
- The build functions skip the hero when the hero argument is empty. `potion-rush` reads one canvas,
  so the stub also provides a fake `document` with a canvas and a no-op 2D context.
- No WebGL and no browser are needed.
- Reason: the views place the shelves inside loops, so a text parse cannot count the placements.
- Limit: the stub proves the placement numbers. It does not prove the mesh content of a model. The
  render proves the mesh content.

### Support rule

- The case assets are `shelf`, `bookcase`, `bookshelf`, and `cabinet`.
- The shelf footprint is 1.3 m wide and 0.3 m deep. The back face sits at the origin. The board tops
  are 0.4725, 0.8025, and 1.1125 m. The shelf scale multiplies the width, the depth, and the tops.
- The cabinet footprint is 1.0 m wide and 0.45 m deep. Its top is 0.99 m.
- An item stands on a case when its x and z fall inside the case footprint after the yaw and its y is
  above zero.
- A resting item matches a support top within 0.01 m. The filled maps place items 0.0025 m above a
  board top, so they pass.
- An item inside a case footprint below the case top stands inside the case. Such an item is a finding.

### Rules

| Rule | Statement |
| --- | --- |
| R1 | Every `shelf` placement in the maps and in the five views holds at least one item. |
| R2 | Every item over a case footprint rests on a support top within 0.01 m. |
| R3 | No item stands inside a case footprint. |
| R4 | The two library views place no `shelf` and no `bookshelf`. The classroom map keeps its `bookcase`. |
| R5 | The frozen count table matches the live count of every map. The table holds the pre-existing `bookshelf` placements and the pre-existing findings. |

R5 stops Green from adding a lit candle and from hiding a defect with a new exception.

## 3. Test rows

| Id | What it proves | File | Expected Red failure |
| --- | --- | --- | --- |
| F1 | The map inventory lists every `shelf` placement with its item count. | `tests/games/filled-shelves.test.ts` | The bathhouse 4 shelves and the warehouse 3 shelves hold 0 items. The failure names both maps. |
| F2 | The view inventory lists every case placement of the five views with its item count. | `tests/games/filled-shelves.test.ts` | The enchanted library 8 and the haunted library 8 placements hold 0 items. The rune forge 2 hold 0 items. The count is 22. |
| F3 | Every item rests on a support top. | `tests/games/filled-shelves.test.ts` | The potion rush 12 bottles and the alchemists 12 bottles sit at y 0.52 and y 1.02. Neither height is a board top. The failure names 24 bottles. |
| F4 | No map item floats above a case. | `tests/games/filled-shelves.test.ts` | The school jar at [4.1, 1.1, -4.7] and the orb at [-5.6, 1.1, -0.4] float 0.11 m above the cabinet top. |
| F5 | No item stands inside a case. | `tests/games/filled-shelves.test.ts` | The archive candle at [-6.5, 0, 4.6] stands inside the cabinet at [-6.4, 0, 4.4]. |
| F6 | The four filled maps keep their items. | `tests/games/filled-shelves.test.ts` | No failure today. The row records the item counts of the alchemy lab 2, the apothecary 3, the bakery 1, and the general store 5 shelves. |
| F7 | The two libraries hold books and no lit candle. | `tests/games/filled-shelves.test.ts` | The two library views place 16 `shelf` placements and no `bookcase`. |
| F8 | The frozen count table holds. | `tests/games/filled-shelves.test.ts` | No failure today. Red writes the table from the baseline run: 19 `shelf` placements in 7 maps and 37 `bookshelf` placements in 10 maps. |
| F9 | The new model is bound. | `tests/apk3d/pack-bindings.test.ts` | After Green names `bookcase` in a manifest, the test fails with an unbound model until the pack holds it. |
| F10 | The new model stays inside the budget. | `tests/apk3d/budget.test.ts` | After Green names `bookcase` in `GAME_LOADS`, the test fails with an unknown model until the pack release adds the file. |
| F11 | The 2D pack keeps the 1:1 match. | `tests/apk3d/sprite-parity.test.ts` | After the pack release, the test fails when the 2D file of `bookcase` is missing. |

Rows F1 to F8 fail today. Rows F9 to F11 fail after the Green change and before the pack release.

## 4. Pack budget rows

| Budget | Limit | Source | Falsifier |
| --- | --- | --- | --- |
| Set piece file | 200,000 bytes | `MODEL_BUDGET.setPiece` | The budget test fails when the `bookcase` file is larger. |
| Game total | 6,000,000 bytes | `MODEL_BUDGET.totalBytes` | The budget test fails for every game that loads the pack. |
| Set piece texture | 512 px | `MODEL_BUDGET.character.textureSize` | The budget test fails when the texture is larger. |
| Pack membership | One pack per model | `tests/apk3d/budget.test.ts` | The budget test fails when a model sits in two packs. |
| 2D parity | One 2D file per 3D model | `tests/apk3d/sprite-parity.test.ts` | The parity test fails when the 2D file of `bookcase` is missing. |

The `potion-shop` pack holds `shelf` today. The enchanted library, the haunted library, the potion rush,
the alchemists' synthesis, and the rune forge chamber load that pack in full. One new file raises the
byte total of every one of them, so the budget test names each game.

The `potion-rush` 2D background is a bake of its 3D set (`scripts/apk2d-bake.ts`). The track re-bakes
that background before the pack release, so the 2D pack and the 3D set stay the same picture.

## 5. Render evidence rule

- One render per changed game view: `scripts/apk3d-shot.ts both --game <id>`. The five views are
  enchanted-library, haunted-library, potion-rush, alchemists-synthesis, and rune-forge-chamber.
- One render per changed map: `scripts/shoot-map.mjs` with `FORGE_SHOT_SIZE=1920x1080`. The five maps
  are bathhouse, warehouse, inn, school, and archive.
- The render path goes to the plan with its SHA-256.
- A look at every render comes before the commit. The three largest differences go to the plan.
- A render without a look does not close the task.

## 6. Mutations for the Green gate

Each mutation names the one test that must fail.

| Id | Mutation | Test that must fail |
| --- | --- | --- |
| M1 | Remove one bottle placement from a potion rush shelf. | F2 |
| M2 | Move one potion rush bottle from y 0.4725 to y 0.52. | F3 |
| M3 | Raise the school jar from y 0.99 to y 1.02. | F4 |
| M4 | Put the library view back to `shelf`. | F7 |
| M5 | Name `bookcase` in a manifest but not in `MODEL_PACKS`. | F9 |

## 7. Review gates

| Gate | Applies | Scope |
| --- | --- | --- |
| Review A | Yes | The rules R1 to R5, the support numbers, and the frozen table. |
| Review B (security) | No | The track adds no network call, no secret, no login, no file write outside the owned paths, and no shell call in the test. The check imports repository modules and stubs the loader. Review B applies only if Green adds a script that writes outside the repository or reads a path from the environment. |
| Review C (UX and API) | Yes | The model list of the two manifests, the `packs` list, and the `GAME_LOADS` map. These are the public contracts of the cartridge and of the host. |
| Adversarial testing | Yes | The mutations M1 to M5, plus a shelf whose item sits outside the footprint and a shelf whose item uses the wrong scale. |
| UX browser review | Yes, for the visual result | The five changed game views and the five changed maps are rendered in a browser and looked at. The rules, the input, and the level flow do not change, so the review covers the picture only. |

## 8. Gate commands

Every command runs as one call of `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`
with a `timeout -k 30` inside and vitest with `--maxWorkers=1`.

- `RED_TEST_COMMAND` (the new check only):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (the check, the pack tests, and the game manifest tests):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/filled-shelves.test.ts tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts tests/games/enchanted-library/manifest.test.ts tests/games/haunted-library/manifest.test.ts tests/games/alchemists-synthesis/manifest.test.ts tests/games/rune-forge-chamber/manifest.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`
- Type check baseline rule: the command exits 2 with 31 errors outside the owned paths today. Green
  records the owned error count, which must be 0, and the total, which must not exceed 31.
- Render of a game view:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node --import tsx scripts/apk3d-shot.ts both --game enchanted-library'`
- Render of a map:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'FORGE_SHOT_SIZE=1920x1080 timeout -k 30 600 node scripts/shoot-map.mjs out/filled-shelves bathhouse=scene=bathhouse'`
- Re-bake of the potion rush 2D background:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node --import tsx scripts/apk2d-bake.ts potion-rush'`
- Pack release check in Phase 2:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node --import tsx scripts/apk-release.ts --check'`

## 9. Anti-pattern coverage

`measure/anti-patterns.md` does not exist in this repository. This strategy uses the A-class list of
`measure/tracks/asset_storytime_l2_unit1_pictures_20261025/test-strategy.md`. A1 and A8 stay retired there.

| Id | Defense in this track | Falsifier |
| --- | --- | --- |
| A3 digit-only count | The check parses labeled values only: the board heights, the item counts, and the byte sizes. | A date or an arbitrary digit satisfies a bound. |
| A4 vacuous pass | R1 fails on an empty shelf, R2 fails on a floating item, and R5 fails when a count moves. The Red run needs at least one failure. | An empty scan or an empty finding list passes. |
| A5 false claim | The plan quotes the command, the exit code, and the labeled counts of every gate. | A claim disagrees with the quoted output. |
| A6 registry overstatement | The track stays open until the renders are looked at and the reviews return. | A completion claim precedes the results. |
| A7 over-broad filter | The check scans every map and every one of the five views. The frozen table names each map. | A filter drops a map or a finding. |
| A9 archived track paths | The check references no `measure/tracks/` path. | A grep of the test prints a track path. |
| A10 generated-facts drift | The registry entry and the generator run stay closeout items of Phase 2, because another session owns those paths. | The generated facts disagree with the plan. |
| A2 consent-blind publish gate | Not applicable. The track adds no publication and no consent transition. | None. |

## 10. Phase base

The orchestrator captures the immutable `phase_base_sha` at one point: after the strategy commit that
adds this file and the Phase 1 decisions, and before Red writes the first line of the check. The value
is the `git rev-parse HEAD` of that commit. This file names no SHA, because a SHA from before the
strategy commit is not the phase base.
