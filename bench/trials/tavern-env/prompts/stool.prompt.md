You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `stool` (catalog id `props/furniture/stool`) as `assets/stool.ts`.

Description: A round tavern stool, 0.38 m diameter seat at 0.45 m high, standing on y = 0 centered on the Y axis. A thick round honey-oak seat with a soft bevel, on three splayed round legs joined by a low ring stretcher. The read at 128 px: a small round disc on three legs. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its round bar stools.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a seat, warm brown #8a5a35 legs, pale cut wood #c9a06a edge wear.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the stool on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/stool.ts`. Do not change any other file.
- Iterate: `./forge render stool --fast` writes `out/stool/render.png`; also run `./forge inspect stool --fast`.
- Finish with `./forge all stool` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
