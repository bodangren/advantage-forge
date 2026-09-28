You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bucket` (catalog id `props/containers/bucket`) as `assets/bucket.ts`.

Description: A wooden bucket 0.3 m wide and 0.32 m tall, standing on y = 0: eight chunky staves (warm brown with darker grooves as paint, NOT holes), two solid iron hoops, water inside (#3fa8c8, roughness 0.1) 3 cm below the rim, and a SOLID, THICK iron bail handle (a torus segment at least 1.2 cm thick) arching over the top between two lugs. Keep every part a solid, closed shape; thin wires break up in the mesh.

Style anchors. Reference images are in `reference/`:
- `reference/bucket-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/village-quest_001.jpg` (the village map this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: wood honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a, dark walnut #6b4226; burlap #c8a86b; iron iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5, metalness 0.7); leaf green #5cb85c; straw #e0bb60.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/bucket-mock.jpg`.
- Only create or edit `assets/bucket.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render bucket --fast` writes `out/bucket/render.png`; look at it, then run `./forge inspect bucket --fast`.
- Finish with `./forge all bucket` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
