# Sound in the games: library takes for the game events

## Purpose

The games play synthesized sounds today. `src/apk3d/audio/bus.ts` builds each effect from tones
and noise (`defineSfx`) and each tune from chords (`defineMood`), so no file downloads. The
earshot set `sounds/chibi/*.ogg` now holds seven rendered sounds. The library (`audio/`, tracks
`audio_sfx_library_20261013` and `audio_sources_expand_20261014`) holds approved takes.

This track plays sound files for the game events. The earshot set is the first source. An
approved library take replaces a set file later. The synthesized recipe stays the fallback.

## Context

- The games pass 58 effect names to the AudioBus: `audio.play('<name>')` in a game view,
  `audio.defineSfx('<name>')` for a game's own recipe, and `.sfx('<name>')` in the six driver
  views.
- The set holds seven sounds: `tap`, `right`, `wrong`, `star`, `pop`, `whoosh`, and `level-end`.
  `sounds/sets/chibi.json` names them. `scripts/sound-set.mjs` renders them from pinned earshot.
- The seven `.ogg` files total 90,468 bytes. `sounds/README.md` holds each size and duration.
- No game sound effect loads from a file today. `src/apk3d/audio/` and `src/games/` name no audio
  URL. The bus builds each effect from tones and noise and each tune from chords.
- `demo/public/stories/*/story.json` names `article.mp3` and `words.mp3` for the story player. That
  story audio is not a game sound effect, and the track keeps it out of scope (Exclusions).
- The games name 26 moods: 3 built-in in `BUILT_IN_MOODS` (`calm`, `battle`, `boss`) and 23
  `defineMood` names (`vault`, `forge`, ...). The bus synthesizes every mood.

## Decisions

| #   | PM decision 2026-11-22 | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Source order           | The earshot set `sounds/chibi/*.ogg` is the first source for the Chibi game events. `sounds/sets/chibi.json` names the seven sounds, and `scripts/sound-set.mjs` renders them. A library take from `audio/` replaces a set file later. The synthesized recipe in `src/apk3d/audio/bus.ts` stays the fallback when a file does not load or an event has no file.                                                                                                                                                                                                                                                                                    |
| b   | Format                 | The wrapper `scripts/sound-set.mjs` writes an MP3 copy next to each `.ogg`, with pinned ffmpeg settings. The game picks Ogg Vorbis or MP3 per browser with `canPlayType`. It plays the synthesized recipe when neither format plays. No part of this track treats MP3 as the only format.                                                                                                                                                                                                                                                                                                                                                          |
| c   | Credits                | The earshot set gets no credits screen. The set holds our own renders and no CC-BY line. The credits task stays in the plan as deferred, for library takes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| d   | Hosting                | The files ship inside the game package with the APK release, like the model packs: `demo/public/audio/chibi/` in this repository and `apps/advantage-games/public/audio/chibi/` in the monorepo. The monorepo path is a proposed target. The MANIFEST names it as proposed, and the PM or Monorepo session confirms or replaces it at hand-off. The model is the model pack row `apps/advantage-games/public/packs/` in `docs/apk-port.md`, line 238. Forge writes the hand-off folder `out/apk-audio-handoff/chibi/` with a `MANIFEST.tsv`, and gives it to the PM. The PM routes it to the Monorepo session. Forge never writes in the monorepo. |

## Scope

- The event map: one row for each of the 58 effect names. The source is one set entry or `synth`.
- MP3 copies in the wrapper, with pinned ffmpeg settings. Seven `.mp3` files land in git.
- File playback in the AudioBus: the per-browser format choice, fetch, decode, and the synth
  fallback.
- A preload rule and a budget: a game preloads the files of its own events. The plan records the
  bytes and the load time.
- A hand-off folder with a MANIFEST for the monorepo part.

## Exclusions

- New takes and review rounds. The library tracks own them.
- Music files. This track keeps the 26 synthesized moods.
- Story audio. `demo/public/stories/*/story.json` names `article.mp3` and `words.mp3`. This track
  does not change those files or the story player.
- A credits screen for the earshot set. The plan keeps it as deferred work.
- Monorepo changes during the feature freeze. The freeze runs from 2026-10-07 until the Primary
  deployment (owner rule 2026-10-07). Forge work continues here. The release waits.

## Acceptance criteria

### AC1: Event map

`docs/sound-event-map.tsv` holds one header line and exactly 58 data rows, and nothing else. There
is no comment line, no blank line, and no other text. Line 1 is `event<TAB>source<TAB>note`. Each
data row is one event with three tab-separated fields. The `note` field names the event's meaning
in three words or less. The `source` field is one of the seven `chibi/<name>` values or `synth`.
The 58 `event` values are the names in the table below, and each of the seven set entries appears
at least once as a `source` value.

This acceptance criterion is the one document of the map's meaning: the header line, the three
fields, the `source` values, and the `note` rule. The map file itself holds data only.

| Source            | Events                                                                                                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chibi/tap`       | `tap`, `pick`, `swap`, `shield`                                                                                                                                                                                                        |
| `chibi/right`     | `correct`, `burst`, `freed`                                                                                                                                                                                                            |
| `chibi/wrong`     | `wrong`, `reject`, `fizzle`, `fizz`                                                                                                                                                                                                    |
| `chibi/star`      | `coins`, `collect`, `claim`, `chime`, `ding`, `bell`, `join`                                                                                                                                                                           |
| `chibi/pop`       | `spawn`, `boing`, `hop`, `bump`, `plop`                                                                                                                                                                                                |
| `chibi/whoosh`    | `whoosh`, `arrow`, `shoot`, `flap`, `creak`, `strike`, `page`                                                                                                                                                                          |
| `chibi/level-end` | `victory`                                                                                                                                                                                                                              |
| `synth`           | `aura`, `bolt`, `boom`, `cast`, `clang`, `clank`, `crash`, `crumble`, `defeat`, `eek`, `groan`, `gulp`, `heal`, `hit`, `light`, `munch`, `open`, `pour`, `roar`, `rumble`, `shatter`, `spit`, `storm`, `thud`, `tower`, `wail`, `ward` |

The table holds 31 mapped names and 27 `synth` names. `tests/audio-event-map.test.ts` asserts the
rows, the count, and both directions of the name check: each map name appears in `src/`, and each
name in `src/` appears in the map.

### AC2: MP3 copy in the wrapper

`node scripts/sound-set.mjs <set>` renders the `.ogg` of an entry, then its `.mp3`. The MP3 call is
this command, with the values substituted:

```
<ffmpeg> -nostdin -hide_banner -loglevel error -y -i <in.ogg> -map_metadata -1 -c:a libmp3lame -b:a 96k -ar 48000 -ac 2 -write_xing 0 -id3v2_version 0 -write_id3v1 0 -fflags +bitexact -flags:a +bitexact <out.mp3>
```

`FFMPEG_BIN` sets the binary, and `ffmpeg` on `PATH` is the default. A successful MP3 call prints
`sound-set: <name>.mp3 <- <design>` after the Ogg line. The final line stays
`sound-set: <n> sounds -> sounds/<set>`. The check order per entry is: prepare the two targets,
render the Ogg, render the MP3. A failure stops the run, and no later entry starts.

| Failure class                     | Line (exact)                                                      | Exit |
| --------------------------------- | ----------------------------------------------------------------- | ---: |
| ffmpeg missing or not executable  | `sound-set: ffmpeg not found at <path>; install ffmpeg`           |    1 |
| ffmpeg exits non-zero             | `sound-set: ffmpeg failed for <name> (<design>) with exit <code>` |    1 |
| ffmpeg exits 0 and writes no file | `sound-set: ffmpeg wrote no file for <name> (<design>): <path>`   |    1 |

### AC3: The committed files

The seven `.ogg` files and the seven `.mp3` files are committed. Owner rule: audio files are
committed to git. A reader checks each file. It uses `readFileSync` and `readUInt32LE`, with no
audio library.

The Ogg checks stay the nine steps of the sibling track (`measure/archive/chore_earshot_sounds_20261121/spec.md`,
AC3). The MP3 checks are these six steps:

1. Byte 0 is `0xFF`.
2. `(byte1 & 0xE0)` is `0xE0`. This tests the frame sync.
3. `((byte1 >> 3) & 0x03)` is `0x03`. This tests MPEG version 1.
4. `((byte1 >> 1) & 0x03)` is `0x01`. This tests layer III.
5. `((byte2 >> 4) & 0x0F)` is 1 to 14. This tests a bitrate index.
6. `((byte2 >> 2) & 0x03)` is 1. This tests the sample rate 48000 Hz.

### AC4: File playback in the AudioBus

`src/apk3d/audio/bus.ts` gains this API:

```ts
export interface SoundFiles {
  /** The folder of the sound files, with a trailing slash. */
  base: string;
  /** An event name to a set entry name: `{ correct: 'right' }`. */
  events: Record<string, string>;
}
useSoundFiles(files: SoundFiles | null): void;
preload(events: string[]): void;
```

The rules are these:

1. The bus picks the file format once, inside the first `unlock()`. It asks
   `new Audio().canPlayType('audio/ogg; codecs="vorbis"')` first, then
   `new Audio().canPlayType('audio/mpeg')`. The first non-empty answer wins. Two empty answers
   give the synth recipe for every event.
2. A file URL is `<base><entry>.<ext>`.
3. `play(name)` starts one `AudioBufferSourceNode` through the master gain when a decoded buffer
   holds the event.
4. `play(name)` plays the synth recipe and starts one fetch and decode when a decoded buffer does
   not hold the event.
5. A failed fetch (a network error, a non-OK status, or a decode error) marks the event. The synth
   recipe serves every later call. The bus tries each event once.
6. An event without a file mapping plays the synth recipe and starts no fetch.
7. `preload(events)` starts the fetch and decode for each named event, with no sound.
8. Mute, suspend, resume, the moods, and `dispose()` keep their current behavior. `dispose()`
   stops each playing buffer.

`tests/apk3d/audio-files.test.ts` covers every rule with a fake `window.AudioContext` and a fake
`fetch`. The test needs no audio device.

### AC5: Preload budget

A game preloads only the files of its mapped events. The largest possible load is the whole set.
The budget for one game is 100,000 bytes in the chosen format, and 1.5 s to load and decode those
files on the slow-3G profile (1.6 Mbit/s down, 300 ms latency).

`scripts/audio-budget.mjs --game <game>` measures one game and writes `out/audio-budget/<game>.json`
with `bytes`, `files`, and `seconds`. The plan records both numbers for Rune Match.
`tests/audio-budget.test.ts` compares the byte column of `sounds/README.md` with the committed files
and asserts a total of at most 100,000 bytes for each format.

### AC6: Hand-off to the PM

`out/apk-audio-handoff/chibi/` holds the seven `.ogg` files, the seven `.mp3` files, `MANIFEST.tsv`,
and `README.md`. `MANIFEST.tsv` holds the columns `file`, `bytes`, `sha256`, `format`, `source`, and
`target`. Each `target` value is `proposed: apps/advantage-games/public/audio/chibi/<file>`, so the
prefix names the path as proposed. `README.md` names the same proposed target and the load rule of
AC4. It also cites the model pack row in `docs/apk-port.md`, line 238:
`apps/advantage-games/public/packs/`. The folder goes to the PM, and the PM routes it to the
Monorepo session. The PM or Monorepo session confirms or replaces the proposed path at hand-off. No
acceptance criterion depends on that path: the folder contents, the checksums, and the empty
monorepo status decide AC6. Forge writes nothing in the monorepo.

### AC7: Credits

The earshot set gets no credits screen in this track. The plan keeps the credits task with the
`[ ]` marker, marked as deferred. `audio/CREDITS.md` stays unchanged.

### AC8: Gates

These commands pass:

- `node node_modules/vitest/vitest.mjs run tests/audio-event-map.test.ts tests/sound-set.test.ts tests/sound-set-mp3.test.ts tests/apk3d/audio-files.test.ts tests/audio-budget.test.ts --maxWorkers=1`
- `node measure/tools/generate.mjs --check`
- `./measure/doctor.sh --structural-only`
- `node_modules/.bin/prettier --check` on each touched text file

## Sources

- [audio bus](../../../src/apk3d/audio/bus.ts)
- [sound set renderer](../../../scripts/sound-set.mjs)
- [sound set](../../../sounds/sets/chibi.json)
- [sound sets readme](../../../sounds/README.md)
- [sound library design](../../../docs/sound-library.md)
- [sound effects list](../../../docs/sound-effects-list.tsv)
- [port rules](../../../docs/apk-port.md)
- [source track for the set](../../archive/chore_earshot_sounds_20261121/spec.md)

## Scope control

This track adds one map file, five test files, one budget script, and the MP3 step in the wrapper.
It changes one audio source file. It adds files to the demo package and the hand-off folder. It
changes no game rule, no asset, and no mood. It runs no new take and no review round. It pushes
nothing.
