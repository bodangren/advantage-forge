# Sound in the games: library takes for the game events

## Purpose

The games play synthesized sounds: `src/apk3d/audio/bus.ts` builds each effect from tones and
noise (`defineSfx`) and each tune from chords (`defineMood`), so no file downloads. The sound
library (`audio/`, tracks `audio_sfx_library_20261013` and `audio_sources_expand_20261014`) now
holds recorded takes that the owner approves. This track plays approved takes in the games.

## Scope

- Map each event name that the games pass to `sfx` to one library row (the `game:<event>` entries
  in the `used_by` column of `docs/sound-effects-list.tsv`), and each mood to a music row.
- Play a file through the AudioBus. Keep the synthesized recipe as the fallback when a file did
  not load or a row has no approved take.
- Format: MP3 (it plays in every target browser). Set a preload budget for old phones: load the
  effects of the current game first, and stream music.
- Credits: show the lines of `audio/CREDITS.md` on a credits screen (CC-BY and ElvGames terms).
- Port: the APK release carries the files to the monorepo through the Monorepo session.

## Exclusions

- New takes and review rounds (the library tracks own them).
- Monorepo changes during the feature freeze (owner rule 2026-10-07: fixes only until the Primary
  deployment).

## Owner decisions needed before the work starts

- Where the credits screen goes in Primary Advantage.
- Where the audio files are hosted for the monorepo (in the package or on a file host).
