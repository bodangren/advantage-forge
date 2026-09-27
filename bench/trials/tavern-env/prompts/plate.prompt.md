You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `plate` (catalog id `props/food/plate`) as `assets/plate.ts`.

Description: A round wooden dining plate, about 0.24 m diameter, 0.025 m tall, standing on y = 0. Honey-oak plank rings (look like one disc) with a soft bevel on the top rim, a slightly recessed well in the center, and a thicker outer ring. Grain hints in the wood. Reads at 128 px as one stout wooden plate for the feast table. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its wooden plate shape.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette (plate uses honey oak).

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a, shadow #8a5a35, pale cut wood #c9a06a on the rim.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the plate on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/plate.ts`. Do not change any other file.
- Iterate: `./forge render plate --fast` writes `out/plate/render.png`; also run `./forge inspect plate --fast`.
- Finish with `./forge all plate` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 1,000 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.