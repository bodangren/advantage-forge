You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `curtain` (catalog id `props/furniture/curtain`) as `assets/curtain.ts`.

Description: A red cloth curtain 1.2 m wide and 1.8 m tall hanging in soft folds from a wooden rod with ring clips, gathered with a gold tie-back on one side. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/curtain-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/tavern-quest_001.jpg` (the warm firelit tavern this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: wood honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a, dark walnut #6b4226; plaster #f0e4cc; pewter #9aa3ad (metalness 0.8); fabric reds #9a4a3a; flame emissive #ff9a3c.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/curtain-mock.jpg`.
- Only create or edit `assets/curtain.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render curtain --fast` writes `out/curtain/render.png`; look at it, then run `./forge inspect curtain --fast`.
- Finish with `./forge all curtain` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
