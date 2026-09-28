You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `gold-coin` (catalog id `items/quest-and-treasure/gold-coin`) as `assets/gold-coin.ts`.

Description: A single chunky gold coin standing on its edge at y = 0 with its face toward +Z: 0.12 m across, 0.022 m thick. Gold #f2c14e (metalness 1, roughness 0.3) with a raised rim and a simple raised five-point star on both faces. Very chunky and readable at 128 px.

Style anchors. Reference images are in `reference/`:
- `reference/gold-coin-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/gold-coin-mock.jpg`.
- Only create or edit `assets/gold-coin.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render gold-coin --fast` writes `out/gold-coin/render.png`; look at it, then run `./forge inspect gold-coin --fast`.
- Finish with `./forge all gold-coin` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
