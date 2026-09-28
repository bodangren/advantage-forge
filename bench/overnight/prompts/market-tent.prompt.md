You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `market-tent` (catalog id `architecture/structure/market-tent`) as `assets/market-tent.ts`.

Description: An open market tent 2.2 m wide, 1.6 m deep, 2.2 m tall: four wooden poles, a peaked canvas roof in cream and faded red stripes (#efe2c0 / #b8584a) with a scalloped valance, and a low wooden trestle table under it with a few baskets and cloth bolts. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/market-tent-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/village-quest_001.jpg` (the village map this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: wood honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a, dark walnut #6b4226; burlap #c8a86b; iron iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5, metalness 0.7); leaf green #5cb85c; straw #e0bb60.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/market-tent-mock.jpg`.
- Only create or edit `assets/market-tent.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render market-tent --fast` writes `out/market-tent/render.png`; look at it, then run `./forge inspect market-tent --fast`.
- Finish with `./forge all market-tent` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 9,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
