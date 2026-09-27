You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `shelf` (catalog id `props/furniture/shelf`) as `assets/shelf.ts`.

Description: A standing bottle shelf for behind the tavern bar, 1.3 m wide, 1.5 m tall, 0.3 m deep, standing on y = 0 with its back at z = 0 and the front facing +Z. A dark walnut frame (two side boards, a top, and a base plinth) with three honey-oak shelf boards and a back panel of vertical planks. Build it EMPTY — bottles and mugs are separate assets that will sit on the shelves. Chunky proportions, soft bevels, a slight overhang on the top board. The read at 128 px: a tall dark frame with three pale boards. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its warm woodwork.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: dark walnut #6b4226 and deep #54331d frame, honey oak #b5814a shelf boards with pale cut wood #c9a06a wear.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the shelf on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/shelf.ts`. Do not change any other file.
- Iterate: `./forge render shelf --fast` writes `out/shelf/render.png`; also run `./forge inspect shelf --fast`.
- Finish with `./forge all shelf` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
