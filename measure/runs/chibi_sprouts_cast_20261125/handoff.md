# Chibi Sprouts cast handoff

Track: `chibi_sprouts_cast_20261125`. Task: T17. Date: 2026-11-27.
Phase base: `3fccaf44fd7b947e3008a655e1270b561813f593`.
Merge of master: `91e4cf40844eef0928e724e95fe4e8fafe241731`.

The sheet was written with `node scripts/sprout-cast-panel.mjs --sheet` under the heavy runner.
The command wrote `out/chibi-sprouts/cast/cast-sheet.png` and no panel.
The five panel hashes are equal before and after the command, and equal to the panel hashes of the
five judge records.

## The five panels

Each panel is 1416 × 900 px. Each panel holds three cells: the lit front render, the lit side
render, and the drawing. All three soles sit on the baseline at row 780. Every projected crown
sits at row 80.

| Asset | Path | SHA-256 | Size | Baseline | Projected crown | Crop (front, side, drawing) |
| --- | --- | --- | --- | --- | --- | --- |
| `sprout-dad-kim` | `out/chibi-sprouts/cast/sprout-dad-kim-panel.png` | `26513ebbcafa31e1646444e4c68d983b2f52b9473a4fd2c02378ec989b12993e` | 1416 × 900 | row 780 | row 80 | no, no, no |
| `sprout-grandma-kim` | `out/chibi-sprouts/cast/sprout-grandma-kim-panel.png` | `4e10acda9759702e11c8e0896729bb33ca2e01e62a95c6917d7540f839e45c30` | 1416 × 900 | row 780 | row 80 | no, no, no |
| `sprout-grandpa-kim` | `out/chibi-sprouts/cast/sprout-grandpa-kim-panel.png` | `09c9dc6dc2f61fee5b9421e00472e2d62be34a78ca824fe8dd037fd7f4ad84d8` | 1416 × 900 | row 780 | row 80 | no, no, no |
| `sprout-tom-kim` | `out/chibi-sprouts/cast/sprout-tom-kim-panel.png` | `734670c7f6856b97f3c5fd43795227000b612782f9712f88917a7d1aad2c5fa0` | 1416 × 900 | row 780 | row 80 | no, no, no |
| `sprout-lily-kim` | `out/chibi-sprouts/cast/sprout-lily-kim-panel.png` | `00455629846d6bc70ef506e73098d4d4a62bfd7ebd45e3963e63dbbc2e1c9307` | 1416 × 900 | row 780 | row 80 | no, no, no |

Every panel caption reads `11/11 rows pass; palms ok`.

## The cast sheet

| Path | SHA-256 | Size | Scale | Baseline | Crop |
| --- | --- | --- | --- | --- | --- |
| `out/chibi-sprouts/cast/cast-sheet.png` | `ed4ea5aa9515fe1a469d6904eb97365de798d378d4ae9e379c82935070b9b725` | 1544 × 900 | 466.667 px per metre | row 780 | dad no, grandma no, grandpa no, tom no, lily no |

The sheet holds the five figures at one scale. The projected adult body height is about 702 px and
the projected child body height is about 491 px. The caption names `sprout-dad-kim`, `sprout-grandma-kim`,
`sprout-grandpa-kim`, `sprout-tom-kim`, `sprout-lily-kim`, and `sprout-mom-kim`.

## The eleven rows per asset

Each row comes from `out/chibi-sprouts/cast/<name>-measure.json`. Each row passes.

### `sprout-dad-kim`

| Row | Value | Range | Pass |
| --- | --- | --- | --- |
| `heightInHeads` | 3.660 | 3.54 to 3.74 | yes |
| `armToTorso` | 1.328 | 1.25 to 1.41 | yes |
| `legShare` | 0.393 | 0.36 to 0.42 | yes |
| `headToShoulders` | 1.150 | 1.11 to 1.27 | yes |
| `wrist` | -0.061 | -0.16 to 0.04 | yes |
| `fingertips` | 0.510 | 0.41 to 0.61 | yes |
| `eyeLine` | 0.620 | 0.59 to 0.65 | yes |
| `eyeHeight` | 0.113 | 0.09 to 0.13 | yes |
| `spacingHead` | 0.391 | 0.35 to 0.41 | yes |
| `eyeWidthFace` | 0.226 | 0.22 to 0.24 | yes |
| `spacingFace` | 0.456 | 0.44 to 0.5 | yes |

### `sprout-grandma-kim`

| Row | Value | Range | Pass |
| --- | --- | --- | --- |
| `heightInHeads` | 3.649 | 3.54 to 3.74 | yes |
| `armToTorso` | 1.328 | 1.25 to 1.41 | yes |
| `legShare` | 0.392 | 0.36 to 0.42 | yes |
| `headToShoulders` | 1.169 | 1.11 to 1.27 | yes |
| `wrist` | -0.061 | -0.16 to 0.04 | yes |
| `fingertips` | 0.510 | 0.41 to 0.61 | yes |
| `eyeLine` | 0.621 | 0.59 to 0.65 | yes |
| `eyeHeight` | 0.112 | 0.09 to 0.13 | yes |
| `spacingHead` | 0.383 | 0.35 to 0.41 | yes |
| `eyeWidthFace` | 0.226 | 0.22 to 0.24 | yes |
| `spacingFace` | 0.457 | 0.44 to 0.5 | yes |

### `sprout-grandpa-kim`

| Row | Value | Range | Pass |
| --- | --- | --- | --- |
| `heightInHeads` | 3.661 | 3.54 to 3.74 | yes |
| `armToTorso` | 1.328 | 1.25 to 1.41 | yes |
| `legShare` | 0.393 | 0.36 to 0.42 | yes |
| `headToShoulders` | 1.234 | 1.11 to 1.27 | yes |
| `wrist` | -0.061 | -0.16 to 0.04 | yes |
| `fingertips` | 0.510 | 0.41 to 0.61 | yes |
| `eyeLine` | 0.621 | 0.59 to 0.65 | yes |
| `eyeHeight` | 0.112 | 0.09 to 0.13 | yes |
| `spacingHead` | 0.365 | 0.35 to 0.41 | yes |
| `eyeWidthFace` | 0.235 | 0.22 to 0.24 | yes |
| `spacingFace` | 0.473 | 0.44 to 0.5 | yes |

### `sprout-tom-kim`

| Row | Value | Range | Pass |
| --- | --- | --- | --- |
| `heightInHeads` | 2.897 | 2.79 to 3.03 | yes |
| `armToTorso` | 1.232 | 1.08 to 1.51 | yes |
| `legShare` | 0.335 | 0.3 to 0.39 | yes |
| `headToShoulders` | 2.176 | 1.83 to 2.35 | yes |
| `wrist` | -0.124 | -0.3 to 0.16 | yes |
| `fingertips` | 0.431 | 0.25 to 0.71 | yes |
| `eyeLine` | 0.645 | 0.61 to 0.68 | yes |
| `eyeHeight` | 0.139 | 0.12 to 0.16 | yes |
| `spacingHead` | 0.309 | 0.28 to 0.36 | yes |
| `eyeWidthFace` | 0.234 | 0.22 to 0.24 | yes |
| `spacingFace` | 0.492 | 0.45 to 0.51 | yes |

### `sprout-lily-kim`

| Row | Value | Range | Pass |
| --- | --- | --- | --- |
| `heightInHeads` | 2.921 | 2.79 to 3.03 | yes |
| `armToTorso` | 1.232 | 1.08 to 1.51 | yes |
| `legShare` | 0.340 | 0.3 to 0.39 | yes |
| `headToShoulders` | 2.145 | 1.83 to 2.35 | yes |
| `wrist` | -0.124 | -0.3 to 0.16 | yes |
| `fingertips` | 0.431 | 0.25 to 0.71 | yes |
| `eyeLine` | 0.646 | 0.61 to 0.68 | yes |
| `eyeHeight` | 0.141 | 0.12 to 0.16 | yes |
| `spacingHead` | 0.309 | 0.28 to 0.36 | yes |
| `eyeWidthFace` | 0.228 | 0.22 to 0.24 | yes |
| `spacingFace` | 0.490 | 0.45 to 0.51 | yes |

## The five judge records

| Asset | Record | Round | Identity | Proportion | Verdict |
| --- | --- | --- | --- | --- | --- |
| `sprout-dad-kim` | `measure/runs/chibi_sprouts_cast_20261125/judge-sprout-dad-kim.json` | 2 | 7.7 | 8.2 | pass |
| `sprout-grandma-kim` | `measure/runs/chibi_sprouts_cast_20261125/judge-sprout-grandma-kim.json` | 3 | 7.8 | 8.2 | pass |
| `sprout-grandpa-kim` | `measure/runs/chibi_sprouts_cast_20261125/judge-sprout-grandpa-kim.json` | 1 | 7.8 | 8.5 | pass |
| `sprout-tom-kim` | `measure/runs/chibi_sprouts_cast_20261125/judge-sprout-tom-kim.json` | 2 | 8.0 | 8.5 | pass |
| `sprout-lily-kim` | `measure/runs/chibi_sprouts_cast_20261125/judge-sprout-lily-kim.json` | 2 | 7.8 | 8.0 | pass |

Each judge record holds the matching `panel_sha256`.
The Grandma round 3 ran on the PM decision in `escalation-sprout-grandma-kim.json`.

## Claim

No customer-facing claim is made.

## The last gate

Daniel's look is the last gate. A judge score does not replace it.
