# Remove the legacy games from the monorepo

Status: in progress. The plan records execution state. The specification retains design detail.

## Phase 1: Agreement

- [x] Task: Send the owner direction, the use list (a read-only git grep of integration b8550a502), and five coverage questions to the monorepo session (2026-10-06).
- [x] Task: Compare the old game host with the new games (owner request, 2026-10-06): [comparison](./comparison.md). Forge gaps: F1 challenge games (small) and F2 answer audio (large) in Hero vs. Zombie, Dragon Flight, and Dragon Rider.
- [x] Task: Record the monorepo inventory and plan; agree the split and the order. Received 2026-10-06 (monorepo track `legacy_games_removal_20261006`): before the cutover, Primary only: M1 one host for the new games on `StoryGameHost` (challenge runs, reward panels, demo launch, briefing, battle callback, avatar; `resolveGameCapability` reads `manifest.challenge`), M2 the new ids at version 2026-10-06.1 with one alias map for old completions (`wizard-vs-zombie` to `hero-vs-zombie`, `labyrinth-goblin-king` to `labyrinth`), `docs/primary-games-integration.md` as the model for the Tutor Advantage developer, Primary pages only on new games, the old route redirects. After the cutover: M3 Reading Advantage and Advantage Games on the Primary model, M4 removal of `game-cartridges`, the legacy-only host code, the QC pages, and the ElvGames assets. F2 is not on the cutover path. Answers: F1 shape and version accepted; F2 builds against `preparedReadToSelectAudioVocabularyResponseSchema`, `createAnswerChoiceAudioController`, and `readToSelectAudioEvidenceSchema`. Owner go 2026-10-06: "Approve as proposed"; relayed to the monorepo session.

## Phase 2: Forge gaps

- [x] Task: F1. Hero vs. Zombie, Dragon Flight, and Dragon Rider declare a class challenge (owner: start F1, 2026-10-06). `challengeCapabilitySchema` and the optional manifest field `challenge` (`src/apk3d/contracts/manifest.ts`, the monorepo `CartridgeChallengeCapability` shape); each game declares `{ version: '2026-10-06.1', inputMode: 'vocabulary', modalities: ['reading'] }`; the 3D and 2D views take the core's input union and name an APK input in the evidence with `evidenceStoryOf` (`src/games/shared/challenge.ts`: id `vocabulary`, the game's first level). `tests/games/shared/challenge.test.ts` (5 tests, ported with the games): the three declarations; the same seed and content give the same snapshot and results; a different seed differs; the evidence parses. `tests/host/challenge-games.test.ts` (Forge only, because the port does not carry the host registry): only these three games declare a challenge. `tests/apk3d`, `tests/games`, `tests/host`: 149 files, 2,297 tests pass; the type check is clean. `docs/apk3d-cartridge.md` section 2.1 documents the field.
- [ ] Task: F2. The read-to-select-audio mode in the same three games, 3D and 2D, with evidence that passes the monorepo `readToSelectAudioEvidenceSchema`; add `read-to-select-audio` to their challenge modalities. The monorepo answered 2026-10-06 (the three contracts above); design in [f2-answer-audio.md](./f2-answer-audio.md).
- [ ] Task: Release each Forge change through the read-only sync check and send it to the monorepo session. F1: the check of Forge 9ab1938c showed 1 kit and 11 game differences; monorepo `apk3d-games-port` d292c1186 (kit 163 tests, games 1,986 tests, types and build pass), merged into `primary-parity-integration` 9f1562c67 and local `master` 80179d317; nothing pushed.

## Phase 3: Removal (monorepo)

- [ ] Task: Record the monorepo commits that move every route to the new games and remove `game-cartridges`, with their tests and the browser check.
- [ ] Task: Update `measure/game-roadmap.md`, `docs/apk-2d3d-program.md`, and `docs/apk-port.md`; run the generator and the doctor; close the track.
