You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `tankard` (catalog id `props/food/tankard`) as `assets/tankard.ts`.

Description: A pewter tankard for the bar, about 0.16 m tall, 0.09 m top diameter, 0.08 m base diameter, standing on y = 0. A slightly tapered pewter cylinder with a soft rolled lip at the top, a thumb-rest curve on the back, and a chunky D-shaped handle. A pewter lid hinged at the back, slightly open. Slight tarnish and small dent variations. Reads at 128 px as a stout pewter mug at the bar. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its pewter tankard.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the iron palette. Pewter uses the same iron family `#4a4f55` / `#6c7178` / `#363a3f` with `roughness 0.45`, `metalness 0.85`.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: pewter mid #6c7178, pewter shadow #363a3f, pewter highlight #a8acb1.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the tankard on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/tankard.ts`. Do not change any other file.
- Iterate: `./forge render tankard --fast` writes `out/tankard/render.png`; also run `./forge inspect tankard --fast`.
- Finish with `./forge all tankard` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 2,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.