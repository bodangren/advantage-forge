# Game XP: the end card shows the XP that the server awards

Status: completed (2026-10-20); not in production yet (see "Release state"). The plan records execution state. The [specification](./spec.md) records the
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

- [x] Task: The monorepo host gives the saved `xpEarned` to the end card. The card shows a saving
  text until then and never reads `result.xp`. The monorepo writes the kit test
  `src/__tests__/results.test.ts` (a result with `xp: 99` and an award of 10 shows "+10 XP"). The
  monorepo records it in `run2/FIX-LIST.md` (line 23) and its `measure/tech-debt.md`.
  Done 2026-10-20: monorepo `a316ea73a` on `primary-parity-integration`. Kit `host/results.ts`:
  the card shows the saving text, then the server `xpEarned` ("+N XP") or "XP not saved.", and
  never `result.xp`. `host/story-game.ts`: `onComplete` may return `Promise<number | undefined>`.
  The app returns the save promise, and the header XP gem updates at once. The kit test
  `src/__tests__/results.test.ts` passes (xp 99, awarded 10, "+10 XP").
- [x] Task: Sync Forge after the cutover (`scripts/monorepo-sync.ts`) and record the monorepo
  commit here. Close the track when the end card and the server XP agree in a manual check.
  2026-10-20: synced in monorepo `0c220e663` "sync from Forge afc8b890" (fast-forwarded into
  `primary-parity-integration`). The sync gate passed (7 of 7) with the guard
  `tests/shared/xp-display.test.ts` in the games tests. The monorepo session started the host part
  the same day. Open: the manual check. The monorepo session adds it to its browser checks after
  the next app rebuild: one game played in the app, and the end card XP equals the saved
  `xpEarned` and the header gem change.
  Manual check passed (monorepo session, 2026-10-20, port 3005 rebuilt on integration `888d99935`
  with sync `0c220e663`, the host fix `a316ea73a`, and the load-error screen `7f5a31e39`; headed
  Chrome, real GPU): Enchanted Library played to the end. The server saved `xpEarned` 10; the card
  showed the saving text first, then "+10 XP"; the header gem went from 101 to 111 with no reload;
  0 console errors. The rules differ for this run: the card shows 75% on the first try, so the old
  rule gives 6. Evidence: `~/Desktop/primary-parity-progress/run2/post-cutover/xp-check.json`,
  `FOR-FORGE-checks-20261020.md`, and `captures/run2-20261019/post-cutover/XP-*.png` (checked in
  Forge). Track closed.

## Release state (2026-10-21)

The fix is in the monorepo branch `primary-parity-integration` only. Monorepo `master` (`beb904102`,
the cutover merge) does not contain the sync `0c220e663` or the host fix `a316ea73a`. Primary
production runs revision 00132-qeq since 16:21 Bangkok on 2026-10-20, which is before these
commits. Students see the old end card XP until the owner merges `primary-parity-integration` into
`master` and deploys a new revision. The track acceptance (the guard test, the kit test, and the
sync gate) is met. The merge and the deployment belong to the owner and the monorepo session.
