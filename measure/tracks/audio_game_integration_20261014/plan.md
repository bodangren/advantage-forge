# Sound in the games: library takes for the game events

Status: new. The plan records execution state. `docs/sound-library.md` retains the library design.

## Phase 1: Map and load

- [ ] Task: Write the event map: every `sfx` event and mood of the games to one row; list the events without a row.
- [ ] Task: Add file playback to the AudioBus with the synthesized recipe as the fallback; test on an old phone profile.
- [ ] Task: Set the preload budget (bytes for each game) and measure the load time.

## Phase 2: Credits and port

- [ ] Task: Add the credits screen (owner decides the place).
- [ ] Task: Carry the files in the APK release; hand the monorepo part to the Monorepo session after the feature freeze.
