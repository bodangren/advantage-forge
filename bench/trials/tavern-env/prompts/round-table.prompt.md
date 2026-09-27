You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `round-table` (catalog id `props/furniture/round-table`) as `assets/round-table.ts`.

Description: A round tavern table, 1.05 m diameter top, 0.6 m tall, standing on y = 0 centered on the Y axis. A thick round honey-oak top (about 0.07 m) with a soft beveled rim, on a heavy central pedestal: a turned column (stack of rounded bulges, chunky not fine) flaring into three or four splayed feet. The read at 128 px: a round disc on a stout pedestal. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its warm wooden tables.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a top, warm brown #8a5a35 pedestal, pale cut wood #c9a06a rim wear.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the table on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/round-table.ts`. Do not change any other file.
- Iterate: `./forge render round-table --fast` writes `out/round-table/render.png`; also run `./forge inspect round-table --fast`.
- Finish with `./forge all round-table` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
