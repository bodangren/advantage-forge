# Game page dev server: serve the test story fixtures

Status: in progress. The plan records execution state. The [specification](./spec.md) records the
finding and the rule.

## Phase 1: Fix

- [x] Task: Serve `tests/fixtures/` at `/tests/fixtures/` in the dev server of
  `vite.demo.config.ts` (plugin `qc-fixtures`, the same file checks as `serveOut` in
  `vite.config.ts`).

## Phase 2: Verification

- [~] Task: Check the fixture URLs and play Rune Match from its QC bot on the fixture story in 3D
  and 2D in headless Chromium. Done (2026-10-21): `/tests/fixtures/stories/index.json` answers
  JSON (it answered the page HTML before), and the bot module
  `/@fs/<forge>/src/games/rune-match/qc/bot.ts` answers `text/javascript`. In headless Chromium
  (390 by 844), `?qc=1&stories=fixtures` loads `pip-the-curious-puppy-feels` in 3D and 2D, with
  no page error and no diagnostics. The play route opens the reader first and does not keep the
  game of the address: after the reader, the page plays the saved choice (Monster Encounters by
  default). A recording opens the game with `window.__apk3d.go({ name: 'play', game, story })`
  after the reader, or with the selector clicks of `scripts/apk3d-shot.ts`. Open: the bot play
  check. The system stopped it because the machine had low memory (0.8 GB available).
- [ ] Task: Answer the advantage-pr session (wave 3 method), run `./measure/doctor.sh`, and close
  the track.
