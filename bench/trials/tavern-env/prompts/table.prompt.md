You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `table` (catalog id `props/furniture/table`) as `assets/table.ts`.

Description: A sturdy square tavern table, 0.95 m x 0.95 m top, 0.6 m tall, standing on y = 0 facing +Z. A thick honey-oak top (about 0.07 m) with a soft edge bevel and a faint plank division, on four chunky square legs slightly inset from the corners, joined by a low stretcher frame near the floor. The read at 128 px: a square slab on four legs — keep it that simple and bold. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its honey-oak tables.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a top, warm brown #8a5a35 legs and stretchers, pale cut wood #c9a06a edge wear.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the table on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/table.ts`. Do not change any other file.
- Iterate: `./forge render table --fast` writes `out/table/render.png`; also run `./forge inspect table --fast`.
- Finish with `./forge all table` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
