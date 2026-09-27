You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bread` (catalog id `props/food/bread`) as `assets/bread.ts`.

Description: A round country loaf on a small wooden board, about 0.28 m wide, 0.12 m tall, standing on y = 0. A pale wheat-golden dome top with a soft X-shaped slash and faint bake speckles; a thicker tan crust around the bottom edge. The wooden board is a thin plank (about 0.4 m × 0.04 m × 0.25 m) with chamfered edges and visible grain. Reads at 128 px as one stout tan loaf on a small board. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its loaf shape and crust.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette (board uses honey oak `#b5814a` / `#8a5a35`).

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: crust gold #d4a04a, bake dark #8a5a30, board honey oak #b5814a, board shadow #8a5a35.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the loaf on y = 0 (board centered).
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/bread.ts`. Do not change any other file.
- Iterate: `./forge render bread --fast` writes `out/bread/render.png`; also run `./forge inspect bread --fast`.
- Finish with `./forge all bread` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 1,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.