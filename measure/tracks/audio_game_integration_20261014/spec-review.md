Author model: opencode-go/deepseek-v4.1-flash

## Amendment 2026-11-22

Scope: `spec.md`, `plan.md`, and `metadata.json` only. No implementation, no test, no game change.

- The "Owner decisions needed before the work starts" section became a decisions table with the
  four PM decisions of 2026-11-22: (a) the earshot set is the first source and the synth recipe
  stays the fallback, (b) the wrapper writes an MP3 copy and the game picks a format per browser,
  (c) the set needs no credits screen, and (d) the files ship in the game package through a PM
  hand-off folder with a MANIFEST.
- Reason: the earshot track `chore_earshot_sounds_20261121` closed on 2026-11-21 with seven
  rendered sounds, so the track has a source before the library takes arrive. The former MP3-only
  rule, the credits requirement for the set, and the two open owner questions no longer hold.
- `sounds/sets/chibi.json` and `scripts/sound-set.mjs` are now evidence. The metadata adds the
  earshot dependency and 9 tasks. The feature-freeze exclusion stays, with the owner rule of
  2026-10-07 stated as it stands.
- The spec H1 stays as it is, because `index.md` and the `measure/tracks.md` registry keep that
  name outside this commit.
