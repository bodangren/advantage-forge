# Game XP: the end card shows the XP that the server awards

Status: in progress. The plan records execution state. The [specification](./spec.md) records the
finding and the decision; `docs/apk3d-cartridge.md` (section 6.1) retains the rule.

## Phase 1: Forge part (before the cutover)

- [x] Task: Correct the comments that called `calculateXP` an exact copy of the app rule:
  `src/apk3d/contracts/results.ts`, `src/host/results.ts` (the demo has no server, so it shows a
  local number), and the two Monster Encounters views. No behavior changes: the APK
  `gameResultsSchema` requires `xp`.
- [x] Task: Add the cartridge guard `tests/games/shared/xp-display.test.ts`: no game view or game
  catalog has the text "XP" or reads `xp` (the rules cores are skipped). `port-game.mjs all`
  copies it to the monorepo `packages/game-cartridges-3d/tests/shared/`, and the sync gate runs
  it in "games tests" before each sync commit. Checked in both layouts: the Forge test passes, and
  the same scan after the port rewrite finds nothing in the 298 monorepo game files.
- [x] Task: Add the release rule to `docs/apk3d-cartridge.md` section 6.1: a cartridge never shows
  XP; only the host end card shows the XP that the server awards.

## Phase 2: Monorepo part (after the cutover, monorepo session)

- [ ] Task: The monorepo host gives the saved `xpEarned` to the end card. The card shows a saving
  text until then and never reads `result.xp`. The monorepo writes the kit test
  `src/__tests__/results.test.ts` (a result with `xp: 99` and an award of 10 shows "+10 XP"). The
  monorepo records it in `run2/FIX-LIST.md` (line 23) and its `measure/tech-debt.md`.
- [ ] Task: Sync Forge after the cutover (`scripts/monorepo-sync.ts`) and record the monorepo
  commit here. Close the track when the end card and the server XP agree in a manual check.
  2026-10-20: synced in monorepo `0c220e663` "sync from Forge afc8b890" (fast-forwarded into
  `primary-parity-integration`). The sync gate passed (7 of 7) with the guard
  `tests/shared/xp-display.test.ts` in the games tests. The monorepo session started the host part
  the same day. Open: the host change and the manual check.
