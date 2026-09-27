You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `mug` (catalog id `props/food/mug`) as `assets/mug.ts`.

Description: A wooden tavern mug, about 0.11 m tall, 0.09 m diameter, standing on y = 0. Honey-oak staves with a dark iron strap band around the middle, a chunky rounded handle on one side. A pale ale head (cream foam) sits just above the rim, slight overflow drip on one side. Reads at 128 px as one stout wooden tankard with foam. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its wooden mug shape and foam top.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber and iron palette. Honey oak is `#b5814a` / `#8a5a35`. Iron is `#4a4f55` with `roughness 0.5`, `metalness 0.7`.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a with warm brown #8a5a35 stave shadows, dark iron #4a4f55 band, foam cream #f5ead0 with pale bubbles.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the mug on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/mug.ts`. Do not change any other file.
- Iterate: `./forge render mug --fast` writes `out/mug/render.png`; also run `./forge inspect mug --fast`.
- Finish with `./forge all mug` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 2,000 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.