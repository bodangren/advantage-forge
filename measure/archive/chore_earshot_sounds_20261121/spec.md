# Author game sound sets with earshot

## Purpose

Games need short, clean sound effects. This track adds a pinned renderer that writes a named
sound set as Ogg files. The first set serves the Chibi games.

## Context

- earshot (MIT, github.com/Leonxlnx/earshot, version 1.0.0) makes sounds in code from named
  designs. It runs on the CPU and needs no model download.
- The trial of 2026-11-21 rendered eight sounds from the trial venv. Notes:
  `/var/tmp/earshot-trial/out/README.md`. Warm renders took about 3 s each. A cold first render
  took about 69 s for the numba compile. Each output was Ogg Vorbis, stereo, 48 kHz.
- Games load no sound file today. `src/apk3d/audio/bus.ts` synthesizes every effect from tones and
  noise, and each game names its effects with `sfx('name')`. The `audio/` folder holds library
  takes as MP3 with manifests, and `scripts/sfx-library.mjs` serves them to review pages. No file
  in `demo/`, `src/`, or a game refers to an `.ogg` or `.mp3` URL.
- Therefore the output path uses the assignment fallback: `sounds/chibi/<name>.ogg`.

## Decisions

D1. Output path. The wrapper writes `sounds/<set>/<name>.ogg`. The first set writes
`sounds/chibi/<name>.ogg`. See Context for the reason.

D2. Set file. `sounds/sets/<set>.json` maps each sound name to one earshot design. The wrapper
takes the set name and derives the file and output folder from it. The shape is:

```json
{
  "description": "Chibi games: the first shared sound set.",
  "sounds": [{ "name": "tap", "design": "tap/soft" }]
}
```

The array order is the render order.

D3. Venv. The pinned install lives at `.venv-earshot/` in the repository root. This path is
gitignored. `scripts/sound-setup.sh` creates the venv and installs earshot into it. The host
Python and every node_modules stay unchanged.

D4. Pin. earshot installs from `git+https://github.com/Leonxlnx/earshot` at commit
`7a7f7c5c70d4a763a1eca4b3666af7c77e313f97` (tag `v1.0.0`, 2026-11-20). The install line is:
`pip install "earshot @ git+https://github.com/Leonxlnx/earshot@7a7f7c5c70d4a763a1eca4b3666af7c77e313f97"`.

D5. Wrapper. `node scripts/sound-set.mjs <set>` is the one command. It reads
`sounds/sets/<set>.json` and writes `sounds/<set>/<name>.ogg`, and it creates the output folder
when absent. It calls `<earshot> make --sound <design> -o <output>` once for each entry, in array
order. The earshot binary is `EARSHOT_BIN` when set, and `.venv-earshot/bin/earshot` otherwise.
`SOUNDS_ROOT` sets the root folder when set, and the folder above `scripts/` otherwise.

Every failure prints exactly one line on stderr and exits with the code in this table. The
wrapper prints nothing else on stderr. The values substitute into the line. The test asserts the
full line for each class. A prefix match is not accepted.

| Failure class                                    | Line (exact)                                                         | Exit |
| ------------------------------------------------ | -------------------------------------------------------------------- | ---: |
| No argument                                      | `sound-set: usage: node scripts/sound-set.mjs <set>`                 |    2 |
| Set name outside `a-z`, `0-9`, `-`               | `sound-set: bad set name: <set>`                                     |    2 |
| Set file missing                                 | `sound-set: set file not found: <path>`                              |    1 |
| Set file not valid JSON                          | `sound-set: set file is not valid JSON: <path>`                      |    1 |
| `sounds` missing, not an array, or empty         | `sound-set: bad set file: sounds must be a non-empty array`          |    1 |
| Entry `name` missing or not a non-empty string   | `sound-set: bad set file: entry <index> needs a name`                |    1 |
| Entry `design` missing or not a non-empty string | `sound-set: bad set file: entry <index> needs a design`              |    1 |
| Two entries share a `name`                       | `sound-set: bad set file: duplicate name <name>`                     |    1 |
| `name` outside `a-z`, `0-9`, `-`                 | `sound-set: bad set file: bad name <name>`                           |    1 |
| earshot missing or not executable                | `sound-set: earshot not found at <path>; run scripts/sound-setup.sh` |    1 |
| earshot exits non-zero                           | `sound-set: earshot failed for <name> (<design>) with exit <code>`   |    1 |
| earshot exits 0 and writes no file               | `sound-set: earshot wrote no file for <name> (<design>): <path>`     |    1 |
| Output path cannot be prepared                   | `sound-set: cannot prepare output for <name> (<design>): <path>`     |    1 |

`<index>` is the zero-based position in the `sounds` array. `<path>` is the absolute path that
the wrapper resolved. `<code>` is the child exit code. The output path cannot be prepared when it is a directory, when
its name is too long, or when filesystem I/O fails. This check runs before the child call for that
entry. The wrapper never deletes a directory recursively and preserves its contents. The same line
and exit apply when the output folder cannot be created. In that case the line names the first set
entry and its target path, and no earshot call starts.

The check order is: set name, set file existence, JSON parse, set content, binary, then each
render in array order. A failure stops the run, and no later render starts. The wrapper captures
the output of each earshot call. It forwards the output of a successful call, and it prints none
of the output of a failed call. A successful child's stdout and stderr are both forwarded to the
wrapper's stdout, in call order, each pair followed by its `sound-set: <name>.ogg <- <design>`
line. The wrapper's stderr stays empty on success.

On success the wrapper prints `sound-set: <name>.ogg <- <design>` for each file, then
`sound-set: <n> sounds -> sounds/<set>`, and exits 0. Exit 0 requires that each render exited 0
and wrote its file.

D6. Test. `tests/sound-set.test.ts` runs with vitest. It uses a fake earshot binary and a
temporary root. It makes no real render.

D7. README. `sounds/README.md` holds one line that names the designs and the pin.

D8. Render route. Every render runs through
`HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.

## Acceptance criteria

- AC1: `sounds/sets/chibi.json` maps these seven names to these seven earshot designs:
  `tap` to `tap/soft`, `right` to `success/rise`, `wrong` to `error/knock`, `star` to
  `coin/bright`, `pop` to `pop/bubble`, `whoosh` to `whoosh/soft`, and `level-end` to
  `success/triad`.
- AC2: `node scripts/sound-set.mjs chibi` renders one Ogg for each entry through the pinned venv
  and exits 0. Each D5 failure prints its exact line and exits with its code.
  `tests/sound-set.test.ts` asserts the full line for each class, after the value substitution.
- AC3: The seven files `sounds/chibi/<name>.ogg` are committed to git. Owner rule: audio files are
  committed to git. A reader checks each file with these steps, and a file that fails any step
  fails the test:

  1. Bytes 0 to 3 are ASCII `OggS` (the capture pattern).
  2. Byte 4 is 0 (the stream structure version).
  3. Byte 5 has bit `0x02` set (the beginning-of-stream flag).
  4. Byte 26 is the segment count `n`. The segment table is bytes 27 to `26 + n`, and the first
     packet starts at byte `27 + n`.
  5. At the packet start, byte 0 is `0x01` and bytes 1 to 6 are ASCII `vorbis`.
  6. `vorbis_version` at packet offset 7 (uint32 little-endian) is 0.
  7. `audio_channels` at packet offset 11 (uint8) is 2. The set requires stereo, as the trial
     wrote it.
  8. `audio_sample_rate` at packet offset 12 (uint32 little-endian) is 48000.
  9. The framing flag at packet offset 29 is 1.

- AC4: `tests/sound-set.test.ts` passes. It covers a full render through a fake binary, every D5
  failure class with its exact line, and the nine AC3 header steps on the committed files.
- AC5: `sounds/README.md` has one line that names the seven designs and the pin from D4.
- AC6: These gates pass: the targeted vitest file and the doctor through the heavy runner, the
  `prettier --check` on the touched files, and the wrapper run with exit 0. The plan holds the
  exact commands.

## Sources

- [audio bus](../../../src/apk3d/audio/bus.ts)
- [sound library tool](../../../scripts/sfx-library.mjs)
- [sound library design](../../../docs/sound-library.md)
- [consumer track](../../tracks/audio_game_integration_20261014/spec.md)
- Trial notes: `/var/tmp/earshot-trial/out/README.md`
- Trial source: `/var/tmp/earshot-trial/src` at `7a7f7c5c70d4a763a1eca4b3666af7c77e313f97`

## Scope control

This track adds tooling, one set file, one test file, one README, and the seven Ogg files. It
changes no game, no AudioBus, and no asset. It adds no playback wiring. It runs no free-prompt
design and makes no music. It pushes nothing.

- Related track: `audio_game_integration_20261014` owns playback, format choice per browser, and
  the credits screen. This track gives it a source set.
