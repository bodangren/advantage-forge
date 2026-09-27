You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `wood-floor` (catalog family `architecture/building-parts`, plank variant) as `assets/wood-floor.ts`.

Description: A modular 2 m x 2 m tavern floor tile, 0.08 m thick with the top surface at y = 0.08 and clean square edges, exactly matching the hamlet ground-tile footprint so tiles butt seamlessly in every direction. The surface is warm honey-oak planks running along X: 6 to 8 planks across the 2 m, each with a slightly different tone, dark seams between planks, a few knots and soft wear. The seams and tone variation must NOT call out the tile grid — no feature may touch the tile edges in a way that repeats visibly. One matte body (roughness about 0.85), all fine grain in `bump`. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its warm plank floor.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and cheerful palette.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px from a top-down camera. Palette contract: honey oak #b5814a planks, warm brown #8a5a35 variation, pale cut wood #c9a06a wear, dark #54331d seams.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the tile on y = 0, centered on the Y axis.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/wood-floor.ts`. Do not change any other file.
- Iterate: `./forge render wood-floor --fast` writes `out/wood-floor/render.png`; also run `./forge inspect wood-floor --fast`.
- Finish with `./forge all wood-floor` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
