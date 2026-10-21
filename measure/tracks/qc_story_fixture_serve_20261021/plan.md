# Game page dev server: serve the test story fixtures

Status: completed (2026-10-21). The plan records execution state. The [specification](./spec.md) records the
finding and the rule.

## Phase 1: Fix

- [x] Task: Serve `tests/fixtures/` at `/tests/fixtures/` in the dev server of
  `vite.demo.config.ts` (plugin `qc-fixtures`, the same file checks as `serveOut` in
  `vite.config.ts`).

## Phase 2: Verification

- [x] Task: Check the fixture URLs and play Rune Match from its QC bot on the fixture story in 3D
  and 2D in headless Chromium. Done (2026-10-21): `/tests/fixtures/stories/index.json` answers
  JSON (it answered the page HTML before), and the bot module
  `/@fs/<forge>/src/games/rune-match/qc/bot.ts` answers `text/javascript`. In headless Chromium
  (390 by 844), `?qc=1&stories=fixtures` loads `pip-the-curious-puppy-feels` in 3D and 2D, with
  no page error and no diagnostics. The play route opens the reader first and does not keep the
  game of the address: after the reader, the page plays the saved choice (Monster Encounters by
  default). A recording opens the game with `window.__apk3d.go({ name: 'play', game, story })`
  after the reader, or with the selector clicks of `scripts/apk3d-shot.ts`. The system stopped my bot play
  check because the machine had low memory (0.8 GB available); the next task records it.
- [x] Task: Answer the advantage-pr session (wave 3 method). Sent 2026-10-21: the game page server
  is `vite.demo.config.ts` (not `pnpm dev`), Forge 7f7a44ab or later, the reader step and `go()`,
  `&avatar=<class>` (no hero stand-in), `auto()` in 22 games, the QC bot modules of the six other
  games (not checked in a browser), Monster Encounters has no card (not in the app), headed Chrome
  for 3D video, and the CC-BY sounds.
- [x] Task: The bot play check. The advantage-pr session ran it in its game card pilots
  (2026-10-21, Forge page on port 5190 with no watcher, `?qc=1&stories=fixtures&avatar=knight`,
  headless Chrome with `--use-angle=gl --enable-gpu --ignore-gpu-blocklist`, which uses the Intel
  GPU, not SwiftShader). Rune Match with the `qc/bot.ts` loop (`nextSwap`): 6 dispatches (the bot
  answers null while the game is busy and between rounds), playing -> victory about 13 s after the
  start, the result screen with 3 stars, 0 page errors, 0 console errors. Potion Rush with `auto()`
  every 150 ms: 191 calls, playing -> complete, 0 page errors. Method notes from that session: the
  start button is at the end of a long briefing, so a tap during the smooth scroll can miss (tap
  again while `.briefing-screen.on` shows); the 3D scene is black for 1 to 2 s after the start
  (wait for `__apk3d.game()` plus 2.5 s).
- [x] Task: Run `./measure/doctor.sh` and close the track.
