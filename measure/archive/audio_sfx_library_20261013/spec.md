# Sound library: CC0 sound effects and music for the asset catalog and the games

## Purpose

Give the games and the Chibi Quest assets recorded sounds. Today every game sound is synthesized
with Web Audio (`src/apk3d/audio/bus.ts`: tones and noise). A recorded library adds voices for
enemies, monsters, wildlife, and NPCs, ambience loops for the scenes, and richer battle, magic,
and reward sounds.

## Owner request (2026-10-13)

- The owner gave the sources: the OpenGameArt "RPG Sound Pack" (CC0) and the OpenGameArt search for
  all CC0 sound effects and music with the tag RPG.
- "I want you to create a list of desired sound effects based on our asset list. (enemy sounds,
  hero sounds, environment sounds, NPC sounds, battle sounds, rewards, etc.) Then you should use
  haiku subagents to search for and acquire appropriate sound effects."

## Facts (2026-10-13)

- The CC0 RPG search has 750 entries: 125 sound effect entries (0.3 GB) and 625 music entries
  (6.4 GB). OpenGameArt has 896 CC0 sound effect entries in total (all tags). The catalog
  `audio/sources/oga-cc0.json` holds all 1521 entries (metadata only), each with the CC0 license
  checked on its page.
- The games call sounds by event name (`p.sfx('hit')`) and define extra synthesized sounds with
  `audio.defineSfx`. No game loads a sound file today. The music moods `calm`, `battle`, and `boss`
  are also synthesized.
- The free disk space was 14 GB on 2026-10-13. Raw downloads stay in `out/audio-source/` (ignored by git).

## Scope

- `docs/sound-effects-list.tsv`: the wanted sounds. One row is one sound with an ID
  (`category/name`), a description, the assets and game events that use it, the number of takes,
  a length class, and a priority. 355 rows, 694 takes, 15 categories.
- `scripts/sfx-library.mjs`: search the catalog, fetch and unpack an entry, probe a file, cut and
  level a take, record it in the manifest, and build the review page.
- `audio/<category>/<name>-<n>.mp3` and `audio/manifest/<category>.tsv`: the takes, each with its
  source entry, file, span, author, and license.
- Haiku search agents fill the list, one category slice for each agent.
- `out/audio-review/index.html`: a page that plays every take next to its row, for the owner.

## Exclusions

- Game integration: the AudioBus keeps its synthesized sounds. A later track decides how a game
  loads files (format, preload, size budget on old phones) and maps events to rows.
- The monorepo port and the APK pack contract.
- Riven Lands sounds (a later list from the Riven Lands catalog).
- Sound design or recording of new sounds.

## Rules

- **License.** Only CC0 entries of OpenGameArt. The tool refuses a take from an entry without CC0
  and stops on a description that names attribution or a third-party source until the agent
  checks it (`--checked`).
- **Content (rated G, grades 3 to 6).** No gore, no blood, no realistic screams of pain or fear,
  no crying, no guns or modern weapons, no rude sounds except light cartoon ones, no spoken words
  in any language (voices are non-verbal), and no horror-level sounds.
- **Style.** Warm, clear, cartoon fantasy. Chiptune and 8-bit sounds only where the row allows
  them (UI rows may use soft retro clicks).
- **Length.** short 0.03 to 1.5 s, medium 0.2 to 4 s, long 0.5 to 12 s, loop 8 to 90 s (the tool
  folds the tail into the head for a seamless loop), music 20 to 300 s.
- **Level.** RMS targets per class (-16 dBFS for effects, -26 for loops, -18 for music), with the
  peak at -1 dBFS or lower.

## Acceptance criteria

1. The list covers every family of the asset catalog and every game sound event, in categories.
2. Every P0 row has at least one take or a recorded reason why no CC0 file fits.
3. Every take has a manifest row with the source entry, the source file, the author, and CC0.
4. Every take meets its length class and level rule.
5. The review page plays every take. The owner listens and marks takes to remove.
6. The size of `audio/` is recorded. The owner decides whether music files go into git.

## Limits of the review

The agents and the orchestrator cannot hear the files. They choose by entry title, tags,
description, file name, length, and the sound spans that `probe` finds. Only the owner's listening
review accepts a take.
