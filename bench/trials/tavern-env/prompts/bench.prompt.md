You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bench` (catalog id `props/furniture/bench`) as `assets/bench.ts`.

Description: A long tavern bench, 1.5 m long, seat 0.35 m wide at 0.35 m high, standing on y = 0 with its length along X facing +Z. One thick honey-oak plank seat with a soft bevel on two splayed trestle end frames (each a pair of angled legs joined by a crossbar), plus a low stretcher between the ends. The read at 128 px: one long slab on two trestles. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its bench seating.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a seat, warm brown #8a5a35 trestles, pale cut wood #c9a06a edge wear.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the bench on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/bench.ts`. Do not change any other file.
- Iterate: `./forge render bench --fast` writes `out/bench/render.png`; also run `./forge inspect bench --fast`.
- Finish with `./forge all bench` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
