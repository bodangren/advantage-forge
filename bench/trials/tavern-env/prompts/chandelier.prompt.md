You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `chandelier` (catalog id `props/furniture/chandelier`) as `assets/chandelier.ts`.

Description: A hanging candle-ring chandelier for the tavern hall, about 0.6 m diameter, hanging from a short dark-iron chain (the chain reads as a thin dark line above). A round dark-iron ring about 0.04 m thick, six curved arms branching outward, each ending in a small drip cup with a lit candle flame. Emissive warm light from all six flames — the hall's overhead warm anchor. Reads at 128 px as a dark-iron ring with six warm dots of light. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its hanging ring of candles.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette. Iron is `#4a4f55` with `roughness 0.5`, `metalness 0.7`. Flame emissive uses warm amber, not blue or white.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: dark iron #4a4f55 ring and arms, beeswax cream #f3dfa4 candle stubs, flame emissive amber #ffb255 with hot core #fff1c2.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Hang the chandelier so its ring center is at y = 0 (group at the hanging chain origin).
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/chandelier.ts`. Do not change any other file.
- Iterate: `./forge render chandelier --fast` writes `out/chandelier/render.png`; also run `./forge inspect chandelier --fast`.
- Finish with `./forge all chandelier` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.