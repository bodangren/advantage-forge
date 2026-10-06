# The old game host compared with the new games

Read-only check of monorepo integration b8550a502 and Forge `src/games/`, 2026-10-06.

## What the new path already has

- The 28 new student games are in `game-cartridges-3d`. Every old game id has a new game. Two ids
  changed: `labyrinth-goblin-king` is `labyrinth`, and `wizard-vs-zombie` is `hero-vs-zombie`.
- Primary Advantage runs them on the story page (`/student/games/story`) with the student's saved
  words and sentences (`/api/v1/apk/practice`) and the avatar (monorepo b8550a502).
- A finished run saves through the same completion route as the old games
  (`/api/v1/apk/complete`), under the game type `<id>-story`. The server computes the XP.
- The game cores also accept the APK `VocabularyInput` (the manifests of Hero vs. Zombie, Dragon
  Flight, and Dragon Rider say so; their `inputMode` is `practice` today).

## What only the old host has

| Feature | Where the old path uses it | Gap in the new path |
| --- | --- | --- |
| Class challenge runs: a server seed and content, a game version check, medium difficulty, `challengeRunId` on the completion | Quest battle, teacher challenge pages; `CARTRIDGE_CHALLENGE_CAPABILITIES` lists `wizard-vs-zombie`, `dragon-flight`, `dragon-rider` | The story host has no challenge mode; the new games declare no challenge capability |
| Weekly quests | `primary-quest/templates.ts`: the four templates use `wizard-vs-zombie`, `dragon-flight`, `dragon-rider`, content mode `vocabulary` | The templates name old ids |
| Reward pieces | `rpg/definitions.ts`: all three staffs come only from a `wizard-vs-zombie` completion (one attempt; a win; a perfect run with read-to-select-audio evidence) | A story completion (`hero-vs-zombie-story`) earns nothing |
| Read-to-select-audio mode ("answer audio"): a written Thai prompt and English answers that play as audio, with replays, audio failures, and strict evidence (`readToSelectAudioEvidenceSchema`) | The learning mode choice on the cartridge page for the three games; the Echo Staff quest | No new game plays answer audio; the kit has only browser speech and the story clip player |
| Reward panels (`RpgRewardDisclosure`, `RpgUnlockNotice`) | Cartridge page briefing and results | The story host shows none |
| Demo launch (`?mode=demo`) | Cartridge page | No demo mode |
| Content source `/api/v1/apk/content` (vocabulary or sentence input) | All three apps | Reading Advantage and Advantage Games have no practice route and no new-game page |
| Public play, the arcade, old-link redirects, QC pages | Advantage Games and Reading Advantage | None for the new games |

## Work split proposal

Forge:

- **F1. Challenge games (small).** Hero vs. Zombie, Dragon Flight, and Dragon Rider declare a
  challenge capability (a version, `vocabulary`, the modality `reading`) and pass a test: the same
  seed and the same challenge content give the same run and the same results.
- **F2. Answer audio (large).** The same three games get the read-to-select-audio mode in 3D and
  2D: a Thai prompt, English answer clips from the host's prepared content, replay, audio failure
  handling, and evidence that passes `readToSelectAudioEvidenceSchema`. A shared kit module holds
  the mode, so other games can use it later.

Monorepo:

- **M1. One host for the new games** with the old host's features: challenge runs, the reward
  panels, the learning mode choice, the demo launch, and the quest battle callback.
- **M2. Game ids and history:** the quest templates, the reward rules, and the challenge
  capabilities name the new games; old completions keep counting.
- **M3. Reading Advantage and Advantage Games:** new game pages with an input source and the
  teacher challenge pages.
- **M4. Removal:** old links go to a new game or the catalog; `game-cartridges`, the legacy-only
  host code, and the old QC pages go.

## Decision for the owner

The Echo Staff needs F2. If F2 is not ready at the cutover, the Echo Staff cannot be earned until it
ships, unless the owner accepts a temporary rule (for example, a perfect run in the reading mode).
