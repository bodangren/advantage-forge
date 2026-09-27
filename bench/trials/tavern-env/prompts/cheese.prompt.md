You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `cheese` (catalog id `props/food/cheese`) as `assets/cheese.ts`.

Description: A whole cheese wheel on a small wooden board, about 0.32 m diameter, 0.14 m tall, standing on y = 0. A pale cream-yellow cylindrical wheel with a thick orange-tan rind on the top and bottom; one wedge is cut out at the front (about 60 degrees) exposing the cream interior with faint round holes. The wooden board is a thin plank (about 0.42 m × 0.04 m × 0.42 m). Reads at 128 px as one stout wheel with a missing slice. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its cheese wheel shape.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette (board uses honey oak).

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: cheese interior cream #f4e4a4, rind warm orange #d49a3a, board honey oak #b5814a.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the wheel on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/cheese.ts`. Do not change any other file.
- Iterate: `./forge render cheese --fast` writes `out/cheese/render.png`; also run `./forge inspect cheese --fast`.
- Finish with `./forge all cheese` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 1,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.