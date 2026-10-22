# Chibi Sprouts, week 1 test set: serial method

Track: measure/tracks/asset_chibi_sprouts_r1_20261022/. Rules from bench/sonnet/npc-serial/method.md:
one builder agent at a time, one narrow step per agent, an independent reviewer per batch (the builder
never rates its own work), textured builds under `flock ~/Desktop/primary-parity-progress/heavy.lock`.
A tools agent (src/ work) may run beside one builder.

Prompts live in `prompts/`; the agent prompt only names the file. `log.tsv` has one row per run.

## Delivery (week 1)

`out/chibi-sprouts/r1/week1/`:

- `manifest.json`: `{ "version": 1, "week": 1, "ppm": <pixels per meter>, "canvas": [w, h],
  "footPoint": { "col": <x>, "row": <y> }, "cast": { "<name>": { "front": "<file>", "threeQuarter": "<file>" } },
  "gestures": { "adventurer": { "<gesture>": ["<file>", ...] , "idle": ["<file>"] } },
  "scenes": { "classroom": { "file": "<file>", "size": [1920, 1080], "floor": { "rowFrom": 700, "rowTo": 850 } }, "rug": { "file": "<file>" } } }`
- `cast/<name>/front.png`, `cast/<name>/three-quarter.png` (pip, nan, pat, may, sam, mia, ben, adventurer).
- `gestures/adventurer/<slug>.png`: clap-apart, clap-together, wave-left, wave-right, nod-up, nod-down,
  point-to-self, point-forward, hands-out, idle.
- `scenes/classroom.png` (1920 x 1080, opaque, no people), `scenes/rug.png` (transparent).

All cut-outs: one canvas, one scale, straight soft alpha, no shadow, no text, feet at the foot point.
