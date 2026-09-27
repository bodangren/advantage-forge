You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `haunch` (catalog id `props/food/haunch`) as `assets/haunch.ts`.

Description: A roasted meat haunch on a wooden platter, about 0.34 m long, 0.2 m wide, 0.18 m tall, standing on y = 0. A mahogany-glazed rounded roast with a clear bone sticking out one end and a deep roast sheen; faint grill-marks on top. The wooden platter is a thicker plank (about 0.42 m × 0.05 m × 0.28 m) with chamfered edges. Reads at 128 px as one stout roast with a bone. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its roast-with-bone.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette (platter uses honey oak).

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: roast mahogany #7a3a1a with grill #4a2010, bone cream #ece0c0, platter honey oak #b5814a.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the haunch on y = 0 (platter centered).
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/haunch.ts`. Do not change any other file.
- Iterate: `./forge render haunch --fast` writes `out/haunch/render.png`; also run `./forge inspect haunch --fast`.
- Finish with `./forge all haunch` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 2,000 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.