You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bowl` (catalog id `props/food/bowl`) as `assets/bowl.ts`.

Description: A round wooden stew bowl, about 0.18 m diameter, 0.09 m tall, standing on y = 0. Honey-oak with a thick rolled lip at the top, a soft outer taper, and a chunky base ring. A small puddle of warm stew (deep orange-brown) sits just below the rim with two chunky vegetable lumps and one bone-shaped piece poking up. Reads at 128 px as one stout wooden bowl with stew. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its wooden bowl.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette (bowl uses honey oak).

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a bowl, deep stew #8a4a18, vegetable green #6a8a3a, bone cream #ece0c0.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the bowl on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/bowl.ts`. Do not change any other file.
- Iterate: `./forge render bowl --fast` writes `out/bowl/render.png`; also run `./forge inspect bowl --fast`.
- Finish with `./forge all bowl` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 1,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.