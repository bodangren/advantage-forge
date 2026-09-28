# Character brief (overnight, 2026-09-27)

You make ONE new character for Fantasy Asset Forge in `assets/<name>.ts`. Read `AGENTS.md` for
the API. Do not read the long skill docs; this brief has what you need.

## Start from a base file

Copy the base file named in your task to `assets/<name>.ts`, rename it (`name:`, description,
`reference:`), and change it to match the mockup. Keep the base's skeleton, bone names, knee
(`shin.*`) bones, and clip set unless your task says otherwise. The base already has good
proportions, a good face, and working clips; change what the mockup needs, not more.

## Match the mockup

Look at the mockup image once at the start. Write down: silhouette, clothing layers, hair and
headwear, held props, and the five main colors. Then build. After each `./forge render <name>
--fast`, read `out/<name>/render.png` and fix the largest difference first (silhouette, then
proportions, then color, then details).

## Rules

- Only create or edit `assets/<name>.ts`. Never edit `src/`, other assets, scenes, or docs. Never
  commit. Never run `git` commands that change files.
- Run forge with `FORGE_WORKERS=1`. Use `--fast` while you iterate. Run the textured
  `./forge all <name>` only once, at the end (it may print `forge: waiting for a build slot`; wait).
- Characters are about 1 m tall (the rogue is 1.02 m). Stand on y = 0, face +Z.
- Color variants: keep the base's `variants` / `presets` / `k.tint(...)` structure. Slots are
  eyes, hair, skin, and clothing (up to 4). Options must fit the role: the same saturation and
  value family as the default, in the dyes of the job (faded, earthy: brick red, faded indigo,
  ochre, olive, rust brown). No primary red, blue, or bright green for villagers.
- Held props must not pass through the head or body in any clip: `./forge check <name>` must end
  with `result ok` if the character holds something.
- The final build must print no `warning:` lines.
- Budget: about 35 tool calls and 8 image reads. If you run out, stop and report.

## Report (short)

1. What you built and what base you used.
2. The final triangle count and size (from the build line).
3. The three largest remaining differences from the mockup, if any.
4. `forge check` result and any warnings.
