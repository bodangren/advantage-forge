You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bottle` (catalog id `props/containers/bottle`) as `assets/bottle.ts`.

Description: A small glass bottle, about 0.22 m tall, 0.07 m max diameter, standing on y = 0. A round-bellied clear glass body, a narrow neck rising to a rolled lip, a dark cork stopper pressed into the top. A small paper label wraps the lower third. The glass has slight color: deep wine red (#5a1a26) or forest green (#2d4a2b) or amber honey (#a8651c) — pick one and stay on it. Reads at 128 px as one stout little bottle on a shelf. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its bottle shapes on the shelf.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber and label palette. Cork is `#7a4f2a`, label is `#e8d8a8` with `#5a4226` ink.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: glass body (wine #5a1a26 or green #2d4a2b or amber #a8651c), cork #7a4f2a, label #e8d8a8 with #5a4226 ink. Glass `roughness 0.18`, `opacity 0.85`.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the bottle on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/bottle.ts`. Do not change any other file.
- Iterate: `./forge render bottle --fast` writes `out/bottle/render.png`; also run `./forge inspect bottle --fast`.
- Finish with `./forge all bottle` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 2,500 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.