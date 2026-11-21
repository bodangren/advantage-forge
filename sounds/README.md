# Game sound sets

Chibi set designs: `tap/soft`, `success/rise`, `error/knock`, `coin/bright`, `pop/bubble`,
`whoosh/soft`, `success/triad`. Renderer: earshot pinned to
`7a7f7c5c70d4a763a1eca4b3666af7c77e313f97` (tag `v1.0.0`).

Set up the pinned venv, then render the set:

```bash
bash scripts/sound-setup.sh
node scripts/sound-set.mjs chibi
```

The wrapper reads `sounds/sets/chibi.json` and writes the Ogg files to `sounds/chibi/`.

| File            | Design          | Bytes | Duration |
| --------------- | --------------- | ----: | -------: |
| `tap.ogg`       | `tap/soft`      |  5534 |  0.130 s |
| `right.ogg`     | `success/rise`  | 24579 |  1.846 s |
| `wrong.ogg`     | `error/knock`   | 10800 |  0.579 s |
| `star.ogg`      | `coin/bright`   | 11149 |  0.691 s |
| `pop.ogg`       | `pop/bubble`    |  7639 |  0.319 s |
| `whoosh.ogg`    | `whoosh/soft`   |  7730 |  0.390 s |
| `level-end.ogg` | `success/triad` | 23037 |  1.712 s |
