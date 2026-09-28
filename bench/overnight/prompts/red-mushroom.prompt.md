You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `red-mushroom` (catalog id `nature/plants/red-mushroom`) as `assets/red-mushroom.ts`.

Description: A cluster of three chunky red toadstools 0.3 m tall: red caps (#d9443a) with white spots, cream stems, on a small mossy base. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/red-mushroom-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/forest-quest_001.jpg` (the forest clearing this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: grass #7ec850 / #4a8a3f; canopy #5cb85c / #3f9248; bark #8a5a35 / #5f3d22; cut wood #c9a06a; stones #8a94a0; water #3fa8c8; ferns #2f7a3f / #4a9a4f; fire emissive #ff9a3c.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/red-mushroom-mock.jpg`.
- Only create or edit `assets/red-mushroom.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render red-mushroom --fast` writes `out/red-mushroom/render.png`; look at it, then run `./forge inspect red-mushroom --fast`.
- Finish with `./forge all red-mushroom` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
