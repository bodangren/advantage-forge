# F2: the read-to-select-audio mode in three new games

Design, 2026-10-06. The contracts are the monorepo's (agreed 2026-10-06; the monorepo changes
nothing): `preparedReadToSelectAudioVocabularyResponseSchema` and `readToSelectAudioEvidenceSchema`
(`game-contracts/src/listening.ts`), and `createAnswerChoiceAudioController`
(`advantage-play-kit/src/audio/answer-choice-controller.ts`).

## The mode

- The student reads a Thai meaning (the item's `translation`) and chooses among English answers
  that play as audio (the items' `term` clips). The answers show numbers, not text.
- Each question is one content item. Every content item becomes one question, in a seeded order,
  so a perfect run can earn the Echo Staff and an audio challenge can count (both need one
  question per item).
- A choice plays its clip first. A choice is confirmed only after its clip played to the end
  (the controller enforces this). A confirmed choice is one attempt in the game.
- The host owns the controller and the evidence. The game calls `setQuestion` for each question,
  `playChoice` when the student picks a choice, `canConfirmChoice` and `confirmChoice` when the
  student commits to it, and `cancel`, `pause`, and `setMuted` from the host events. At the end,
  the completion carries `getEvidence()` and the game's counts equal the evidence counts
  (correct answers = completed questions, attempts = submitted choices).

## The games (same flow as the old games)

| Game | Question | Choices | Commit |
| --- | --- | --- | --- |
| Hero vs. Zombie | the Thai meaning on the banner | orbs labeled 1, 2, 3 and a "1 🔊" control per orb | touch an orb: the first touch plays its clip; a touch after the clip ends takes the orb. The hero gets a short protection when a question's first clip starts. |
| Dragon Flight | the Thai meaning | two gates labeled 1 and 2, a 🔊 control each | steer into a gate; at the gate the flight waits until that gate's clip has played, then the gate resolves |
| Dragon Rider | the Thai meaning | two gates labeled 1 and 2, a 🔊 control each | the same as Dragon Flight |

The 3D and the 2D view of each game get the mode. The rules cores get an option that defers the
take or the gate result until the view commits it, so the core stays pure and seeded.

## Kit and host parts

- `src/apk3d/contracts/listening.ts`: a Forge copy of the listening schemas the games and the demo
  need. The monorepo port maps it to a re-export of `game-contracts` (a monorepo-owned module,
  as `contracts/avatar.ts`).
- `src/apk3d/audio/answer-choice.ts`: the controller interface the games use, and a Forge copy of
  the controller for the demo host and the tests. The monorepo port maps it to a re-export of the
  `@reading-advantage/advantage-play-kit` root, which exports `audio/` (monorepo-owned).
- The session gets the controller and the prepared content from the host (`ctx.answerAudio`, input
  = the prepared `content`). Without a controller the games play as today.
- The Forge demo host plays the clips with the browser's English voice (`?audio=1`), so the mode
  can be checked without the app.
- The manifests add `read-to-select-audio` to their challenge modalities when the mode is done.

## Tests and checks

- Unit: each core with the deferred option; a full audio run per game whose evidence passes
  `readToSelectAudioEvidenceSchema` and whose counts equal the results; a perfect run that meets
  the Echo Staff rule; the copy of the controller against the monorepo tests it was copied with.
- QC shots of each game in 3D and 2D with the demo audio.
- The independent review is not needed (no new asset).

## Part A (done 2026-10-07, 58f06d5a)

- `src/apk3d/contracts/listening.ts` and `src/apk3d/audio/answer-choice.ts` as above, with copies of
  the monorepo tests (`tests/apk3d/listening-contracts.test.ts`, `tests/apk3d/answer-choice.test.ts`).
- `Game3DContext`, `Game2DContext`, `ThreeFactoryContext`, and `PhaserFactoryContext` have a typed
  `answerAudio`. `createCartridgeMounter` does the APK runtime duties (`runtime.ts`): a demo session
  gets no controller; pause, mute, and destroy reach it; at completion its evidence must parse and its
  submitted and completing attempts must equal `totalAttempts` and `correctAnswers`, or the result is
  dropped with the error diagnostic `apk3d/invalid-answer-audio-evidence`. The host `complete` gets
  the controller evidence as a fourth argument.

## Monorepo answers (2026-10-07)

- Q1. The Primary `GameHost` renders `StoryGameHost`, which mounts through `startStoryGame`
  (`host/story-game.ts`) and `createCartridgeMounter`, so the mount duties above reach the app with
  the port. In M1 nothing makes a controller. The monorepo proposal: `GameHost` fetches the prepared
  response and makes the controller (as the old `StudentCartridgeHost` did); `StoryGameHost` gets it
  through a new prop and gives it to `mount()`; the in-game mute (`host.toggleMute`) reaches it.
- Q2. The monorepo will change the controller: a play that ends cancelled or failed does not use a
  replay; only completed plays count toward `maxReplaysPerChoice`. The evidence schema does not
  change. Forge copies the change line for line when the monorepo sends the commit (the owner
  approves that branch first). The games are written to the new rule now.
- Q3. The Primary page sound toggle does not reach the game in M1; the in-game mute does. While the
  controller is muted, `playChoice` throws `muted`, so the games show a "turn the sound on" hint.
- Q4. The Echo Staff rule (`getEligibleRpgRewards`, lane-g d6cca07f8): a Hero vs. Zombie
  completion (`WARD_GAME_TYPES`) with victory, whose `metadata.learningEvidence` is answer audio
  evidence with one question per item, the last attempt of each question completing it, and
  `totalAttempts` = `correctAnswers` = `itemCount`. Thus only a run with no wrong confirmed choice
  earns it, and Dragon Flight and Dragon Rider cannot earn it under this rule (an owner decision if
  that must change; a domain change). The completion posts the answer audio evidence as
  `learningEvidence`; the story evidence stays on the results screen.

## Game rules that follow

- Audio mode takes every item of the input as one question (at most 50), in a seeded order, with no
  returned words, so the evidence can have one question per item.
- One clip at a time: a touch or a 🔊 control while a clip plays does nothing. Only pause, mute, and a
  question change cancel a clip.
- A confirmed choice is one attempt in the core and one submitted attempt in the evidence.

