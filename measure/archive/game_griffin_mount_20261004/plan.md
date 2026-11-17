# The griffin replaces the tinted fire dragon in the griffin games

Status: done (2026-10-04). This plan owns execution status.

## Phase 1: Forge

- [x] Task: Add the griffin to the web-weight models, a model pack, and the three game loads.
  `scripts/demo-models.ts` (16,000 triangles, 498 KB), a new `mounts` pack in
  `src/apk3d/contracts/model-pack.ts`, and the three `GAME_LOADS` rows; the manifests list the
  pack. Budgets: Gryphon Patrol 2.94 MB, Griffin Sky-Joust 1.94 MB, Griffin Riders Escape 2.67 MB.
- [x] Task: Load the griffin in the three 3D views without the tint; set the rider seat.
  `src/games/shared/griffin.ts` holds the model name and the seat (0.84 m up, 0.04 m back, in
  model meters). The tint constants are gone.
- [x] Task: Bind the griffin sprite files in the three 2D views and manifests; build the 2D sheets and the pack.
  `scripts/apk2d-sprites.ts` has a griffin job (fly, hit, roar, attack; 8 directions); the
  `primary-chibi-2d` pack has 118 files (5.53 MB).
- [x] Task: Run the tests, the type check, and screenshots of the three games in 3D and 2D.
  Forge: 2196 tests pass; the type check shows only the 31 old asset errors (TD-01). The Forge
  screenshot tool has no bot for these games, so the browser QC ran in the monorepo package.
  The first QC showed the hind feet and the tail hiding the rider from the chase camera of
  Griffin Riders Escape; the fly clip now tucks the hind legs and lowers the tail (`forge all`
  again: 0 warnings, ground ok).

## Phase 2: Monorepo port

- [x] Task: Copy the kit, the three games, and the pack files; rebuild the kit.
- [x] Task: Run the kit and the games tests and the port checks; commit on `apk3d-games-port`.
  Kit 155 and games 1886 tests pass; lint and type checks are clean; `port-game.mjs --check` and
  `port-kit.mjs --check` match Forge. QC (`qc/run.mjs`): 12 of 12 runs ok, without errors or
  diagnostics (three games, 3D and 2D, desktop and phone). Commits 115a5496a (code and packs) and
  c7250c4bc (track record).

## Phase 3: Records

- [x] Task: Update this plan, the metadata, the game tracks, and run generate and doctor.
  The game design docs of the three games name the griffin and the seat.
