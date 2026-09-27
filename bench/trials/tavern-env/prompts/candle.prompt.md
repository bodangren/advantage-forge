You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `candle` (catalog id `props/furniture/candle`) as `assets/candle.ts`.

Description: A single short lit table candle, about 0.18 m tall, sitting in a small dark-iron saucer (about 0.06 m diameter). Pale beeswax column with a slight melt taper and a soft drip ridge near the top; the wick is a tiny black nub; the flame is emissive amber. Reads at 128 px as one warm dot of light on each table. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its small lit candle scale and warm color.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette. Iron is `#4a4f55` with `roughness 0.5`, `metalness 0.7`. Flame emissive uses warm amber, not blue or white.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: beeswax warm cream #f3dfa4 shading to #d8b878, dark iron #4a4f55 saucer, flame emissive amber #ffb255 with hot core #fff1c2.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the candle on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/candle.ts`. Do not change any other file.
- Iterate: `./forge render candle --fast` writes `out/candle/render.png`; also run `./forge inspect candle --fast`.
- Finish with `./forge all candle` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 1,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.