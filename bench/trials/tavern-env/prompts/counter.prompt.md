You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `counter` (catalog id `props/furniture/counter`) as `assets/counter.ts`.

Description: The tavern bar counter, 2 m long (one tile), 0.75 m tall, 0.55 m deep, standing on y = 0 with its length along X and the front facing +Z. A thick honey-oak top (about 0.08 m) overhanging the front by a few cm with a soft bevel; the front is a dark walnut panel with chunky vertical plank divisions and a low horizontal foot rail near the floor; the ends are capped with the same dark walnut. The read at 128 px: a long dark-fronted bar with a pale thick top. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its long wooden bar counter.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a top with pale cut wood #c9a06a wear, dark walnut #6b4226 and deep #54331d front.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the counter on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/counter.ts`. Do not change any other file.
- Iterate: `./forge render counter --fast` writes `out/counter/render.png`; also run `./forge inspect counter --fast`.
- Finish with `./forge all counter` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
