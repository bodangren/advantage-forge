You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `sack` (catalog id `props/containers/sack`) as `assets/sack.ts`.

Description: A plump grain sack, about 0.4 m tall, 0.3 m wide at the base, 0.35 m at the belly, sitting on y = 0. Burlap canvas in warm tan (#c2a06a) with a coarse weave hint and soft tonal variation; the top is gathered and tied with a short length of rough rope, the neck folds creating a soft pinch. The sack slumps slightly where it sits, suggesting a heavy load. Reads at 128 px as one stout tied bundle by the bar. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its sack silhouette and tie.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the rope and burlap palette. Rope is `#8a6a3a` slightly darker than the sack.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: burlap #c2a06a with shade #9a7d4c and light #d8b888, rope #8a6a3a.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the sack on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/sack.ts`. Do not change any other file.
- Iterate: `./forge render sack --fast` writes `out/sack/render.png`; also run `./forge inspect sack --fast`.
- Finish with `./forge all sack` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 2,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.