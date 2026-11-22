# Game sound sets

Chibi set designs: `tap/soft`, `success/rise`, `error/knock`, `coin/bright`, `pop/bubble`,
`whoosh/soft`, `success/triad`. Renderer: earshot 1.0.0 pinned to
`7a7f7c5c70d4a763a1eca4b3666af7c77e313f97` (tag `v1.0.0`). MP3 encoder on the render host:
`ffmpeg version 8.0.1-3ubuntu2`.

Set up the pinned venv, then render the set:

```bash
bash scripts/sound-setup.sh
node scripts/sound-set.mjs chibi
```

The wrapper reads `sounds/sets/chibi.json` and writes an Ogg file and an MP3 copy of each entry to
`sounds/chibi/`.

Each earshot render writes new Ogg stream serials and page CRCs: 24 bytes in a three-page file,
32 bytes in a four-page file. A re-render then shows the `.ogg` files as changed with equal audio.
The committed files are the reference. The MP3 files re-encode from them byte for byte.

Ogg files:

| File            | Design          | Bytes | Duration |
| --------------- | --------------- | ----: | -------: |
| `tap.ogg`       | `tap/soft`      |  5534 |  0.130 s |
| `right.ogg`     | `success/rise`  | 24579 |  1.846 s |
| `wrong.ogg`     | `error/knock`   | 10800 |  0.579 s |
| `star.ogg`      | `coin/bright`   | 11149 |  0.691 s |
| `pop.ogg`       | `pop/bubble`    |  7639 |  0.319 s |
| `whoosh.ogg`    | `whoosh/soft`   |  7730 |  0.390 s |
| `level-end.ogg` | `success/triad` | 23037 |  1.712 s |

MP3 files:

| File            | Design          | Bytes | Duration |
| --------------- | --------------- | ----: | -------: |
| `tap.mp3`       | `tap/soft`      |  2016 |  0.168 s |
| `right.mp3`     | `success/rise`  | 22464 |  1.872 s |
| `wrong.mp3`     | `error/knock`   |  7488 |  0.624 s |
| `star.mp3`      | `coin/bright`   |  8640 |  0.720 s |
| `pop.mp3`       | `pop/bubble`    |  4320 |  0.360 s |
| `whoosh.mp3`    | `whoosh/soft`   |  5184 |  0.432 s |
| `level-end.mp3` | `success/triad` | 21024 |  1.752 s |
