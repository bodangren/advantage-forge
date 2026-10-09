# Typing Duel: a typing game for saved words and sentences

Working title. The owner can rename the game; the track ID and the game ID `typing-duel` stay.

## Purpose

Add a 29th student game in which the student **types** the saved words and sentences. In the 28 other games the
student chooses, taps, steers, or drags a word. Typing makes the student produce the word, which is stronger
practice than recognition. Each correct word is a hit by the student's own avatar against an enemy.

## Owner decisions (2026-10-09)

- The game is new, and separate from Magic Defense. Magic Defense stays a choice game (a missile shows a meaning, and the student picks one of the spell words).
- Both platforms: a keyboard (desktop, laptop, Chromebook) and a touch screen (phone, tablet). The game is complete on each.
- Both products: like every game, it runs in the pack of the launch context: Chibi Quest in Primary Advantage, Riven Lands in Reading Advantage.

## Facts (2026-10-09)

- **Input.** The game reads a `PracticeInput` (`src/apk3d/contracts/story-input.ts`): the student's saved `vocabulary` and `sentences`, chosen by the server in FSRS due order (track `game_flashcard_input_20261004`). The items have no memory state today.
- **No typing game exists.** The 28 manifests use `inputMode: 'practice'` (or `story`) with choice, tap, steer, or drag. The keyboard code in Astral Mage, Alchemists Synthesis, and Rune Forge Chamber moves a cursor between choices.
- **Program rules** (`docs/apk-2d3d-program.md`, Phase D): no timer decides a result, no game over (a setback is courage or a rest), speed never gives XP, and one evidence item per input item.
- **Host services.** The host plays English word clips (`src/host/answer-audio.ts`; the apps use prepared clips), runs the class boss (`src/host/classBoss.ts`), and passes the student's avatar to the game (track `avatar_in_games_20261006`; the avatar is the student's identity, with no hero stand-in).
- **Stage.** The battle family shares a stage (`src/games/shared/battle/stage3d.ts`, `stage2d.ts`), with models in the existing packs.
- **Release.** The monorepo has a feature freeze until the Primary Advantage deployment. A new game is a feature, so the port waits. Forge work can start now.

## Functional requirements

- FR-1 **Core loop.** An enemy walks toward the student's avatar. A cue for one saved item appears. The student enters the item. A correct entry is a hit; the enemy falls after a set number of hits, and the next enemy comes. The round ends when every item of the round has an evidence result.
- FR-2 **Errors.** After a wrong letter, the game shows the correct word and the student types it again. An error never removes the item from the round. The first-try result goes into the evidence.
- FR-3 **No defeat by speed.** The enemy speed comes from the student's own typing speed (measured on the first words, with fixed lower and upper bounds). An enemy that reaches the avatar is a setback (the avatar loses courage and steps back), never a game over. Speed never changes XP. Accuracy decides the score.
- FR-4 **Cues by memory state.** The cue gets harder as the item becomes better known, so the student does not only copy:
  - a new item: the word is shown and its audio plays;
  - a learning item: only the audio plays (dictation), or the meaning in the student's language is shown;
  - a known item: a saved sentence is shown with a gap for the word.
- FR-5 **Memory state field.** `practiceWordSchema` and `practiceSentenceSchema` get an optional field `memory` (`new`, `learning`, `review`, or `relearning`, the FSRS states). The field is optional, so every current input stays valid. When it is absent, the game uses a fallback: the first time an item comes in a run it is "new", the second time "learning", and after that "known".
- FR-6 **Keyboard mode.** Physical keys type letters into the answer. The game ignores modifier keys and accepts upper and lower case. It handles IME composition events without double letters. Backspace corrects.
- FR-7 **Touch mode.** Letter tiles replace the system keyboard: the letters of the word plus 2 to 4 distractor letters, from the run seed, tapped in order. A sentence combo (FR-8) uses word tiles in order. Tiles meet the phone layout rules (`docs/apk3d-cartridge.md` section 9.1): readable at 390 × 844 and 844 × 390, never under the top panels.
- FR-8 **Sentence combo.** After a streak of correct words, a combo charge is ready. The student completes one saved sentence (typed on a keyboard, word tiles on touch) for a special attack. Single words stay the normal attack, so a slow typist still progresses.
- FR-9 **Mode choice.** The game starts in touch mode on a coarse pointer and in keyboard mode otherwise. The first physical key press switches to keyboard mode; the briefing has a switch for both modes.
- FR-10 **Results.** One `GameResults` per run through `toGameResults`: `correctAnswers` counts items right on the first try, `totalAttempts` counts every attempt. The evidence records for each item: the id, the cue kind, the first-try result, the attempts, and the mode. The damage of correct words goes to the host class boss like the other games.
- FR-11 **Avatar.** The student's avatar is the fighter in 3D and 2D, with the same fallback rules as the other games (no hero stand-in).
- FR-12 **Both renderers.** One rules core, a three.js view on the shared battle stage, and a Phaser view with the 2D pack. Enemies come from the existing packs (no new 3D asset).
- FR-13 **Manifest.** `id: 'typing-duel'`, `inputMode: 'practice'`, `levels` = every value of `CEFR_LEVELS` (Pre-A1 to B1), and `needs` with a minimum of words and sentences that Phase 1 sets. Strings in English and Thai pass the i18n scan.

## Acceptance criteria

- The core is deterministic: a replay of the same seed and the same key or tile events gives the same evidence.
- Tests cover the cue rule with and without `memory`, the retype after an error, the speed bounds, the setback without game over, the combo, the tile generation, the IME handling, and the results mapping.
- A QC bot plays full runs in keyboard mode and touch mode, with errors.
- Browser QC passes in 3D and 2D on desktop with a keyboard, and with `qc/run.mjs --phone` and `--phone-landscape` in touch mode, with no page errors and no legacy model requests.
- A real check on a phone and on a Chromebook keyboard (owner).
- The contract change of FR-5 is backward compatible: the existing contract tests and the 28 games pass unchanged.

## Out of scope

- The server side of FR-5: the monorepo fills `memory` from `userWordRecords` and `userSentenceRecords`. The monorepo session owns it; this track records the request in `docs/apk-port.md`. The game works without it (fallback).
- The port to the monorepo while the feature freeze lasts. The port follows `port-game.mjs` after the Primary deployment.
- New 3D assets. The Riven Lands look comes through `riven_game_skin_20261009`.
- FSRS updates from the game (owner, 2026-10-04: the games read the state and record evidence only).
- Typing practice without saved items (for example a free typing course).

## Evidence

- Design document (Phase 1): `docs/game-typing-duel.md`
- [Flashcard input track](../game_flashcard_input_20261004/)
- [Game program](../../../docs/apk-2d3d-program.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds a game folder `src/games/typing-duel/`, a design document, and one optional contract field.
