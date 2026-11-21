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
`SOUNDS_ROOT` sets the root folder when set, and the folder above `scripts/` otherwise. Exit
codes:

- 0 when every render exits 0.
- 2 when the set argument is missing or is not a name of `a-z`, `0-9`, and `-`.
- 1 for every other failure, with one clear line on stderr.

Failure conditions, each with exit 1 and no render after the failure:

- The set file is missing or is not valid JSON.
- `sounds` is missing, is not a non-empty array, or holds an entry without a non-empty string
  `name` or `design`.
- Two entries share a `name`.
- A `name` holds a character outside `a-z`, `0-9`, and `-`.
- The earshot binary is missing or is not executable. The message names the path and
  `scripts/sound-setup.sh`.
- An earshot call exits non-zero. The message names the sound name, the design, and the exit
  code.

On success the wrapper prints `sound-set: <name>.ogg <- <design>` for each file, then
`sound-set: <n> sounds -> sounds/<set>`, and exits 0.

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
  and exits 0. Each failure in D5 exits 1 with its named message, and a bad set argument exits 2.
- AC3: The seven files `sounds/chibi/<name>.ogg` are committed to git. Each file starts with the
  bytes `OggS`, and its Vorbis identification header gives 48 kHz. Owner rule: audio files are
  committed to git.
- AC4: `tests/sound-set.test.ts` passes. It covers a full render through a fake binary, a missing
  set, a missing binary, a failed render, an invalid set, and the committed files.
- AC5: `sounds/README.md` has one line that names the seven designs and the pin from D4.
- AC6: These gates pass: the targeted vitest file and the doctor through the heavy runner, the
  `prettier --check` on the touched files, and the wrapper run with exit 0. The plan holds the
  exact commands.

## Sources

- [audio bus](../../../src/apk3d/audio/bus.ts)
- [sound library tool](../../../scripts/sfx-library.mjs)
- [sound library design](../../../docs/sound-library.md)
- [consumer track](../audio_game_integration_20261014/spec.md)
- Trial notes: `/var/tmp/earshot-trial/out/README.md`
- Trial source: `/var/tmp/earshot-trial/src` at `7a7f7c5c70d4a763a1eca4b3666af7c77e313f97`

## Scope control

This track adds tooling, one set file, one test file, one README, and the seven Ogg files. It
changes no game, no AudioBus, and no asset. It adds no playback wiring. It runs no free-prompt
design and makes no music. It pushes nothing.

- Related track: `audio_game_integration_20261014` owns playback, format choice per browser, and
  the credits screen. This track gives it a source set.
