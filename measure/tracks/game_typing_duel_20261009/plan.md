# Typing Duel: a typing game for saved words and sentences

Status: new. The plan records execution state. The design document retains design detail.

## Phase 1: Design and contract

- [ ] Task: Write `docs/game-typing-duel.md`: the loop, the cue rule and its fallback, the keyboard and touch modes, the combo, the speed bounds and the setback, the evidence, the results, the phone layout, and the `needs` minimum.
- [ ] Task: Add the optional `memory` field to the practice word and sentence schemas, with contract tests; the existing contract tests and the 28 games pass unchanged.
- [ ] Task: Record the server request for `memory` in `docs/apk-port.md` for the monorepo session.
- [ ] Task: Add the game family "Type and strike" to `docs/apk-2d3d-program.md`. (The game roadmap lists the game since 2026-10-09.)

## Phase 2: Tests

- [ ] Task: Write the core tests: the cue rule with and without `memory`, the retype after an error, the speed bounds, the setback without game over, the combo, deterministic replay, the evidence, and `toGameResults`.
- [ ] Task: Write the input tests: keyboard letters, case, modifier keys, IME composition, backspace; tile generation from the seed; the mode switch.
- [ ] Task: Write the QC bot (`qc/bot.ts`) for keyboard and touch runs with errors.

## Phase 3: Implementation

- [ ] Task: Implement the rules core (`core/`: content, sim, evidence) until the core tests pass.
- [ ] Task: Implement the 3D view on the shared battle stage, with the student's avatar, the input HUD, the tiles, and the host answer audio.
- [ ] Task: Implement the Phaser 2D view with the 2D pack and the same HUD rules.
- [ ] Task: Add the manifest, the briefing, the English and Thai strings, and the host registry entry.

## Phase 4: Verification

- [ ] Task: Run the browser QC in 3D and 2D: desktop with a keyboard, `qc/run.mjs --phone` and `--phone-landscape` in touch mode; fix and record.
- [ ] Task: Check the game on a real phone and on a Chromebook keyboard. Waits for the owner.
- [ ] Task: Port the game with `port-game.mjs` after the Primary deployment and the end of the feature freeze; the monorepo session makes the monorepo change. Record the commit in `docs/apk-port.md`.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`; update this plan and the game roadmap.
