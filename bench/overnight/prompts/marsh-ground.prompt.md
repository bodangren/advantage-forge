You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `marsh-ground` (catalog id `architecture/landscape-parts/marsh-ground`) as `assets/marsh-ground.ts`.

Description: A 2 m x 2 m ground tile 0.06 m thick, top at y = 0.06, edges at x = ±1 and z = ±1 so tiles join: dark wet mud with two shallow water pools (glossy, roughness 0.1), reed tufts and moss patches. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/marsh-ground-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/forest-quest_001.jpg` (the forest clearing this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: grass #7ec850 / #4a8a3f; canopy #5cb85c / #3f9248; bark #8a5a35 / #5f3d22; cut wood #c9a06a; stones #8a94a0; water #3fa8c8; ferns #2f7a3f / #4a9a4f; fire emissive #ff9a3c.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/marsh-ground-mock.jpg`.
- Only create or edit `assets/marsh-ground.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render marsh-ground --fast` writes `out/marsh-ground/render.png`; look at it, then run `./forge inspect marsh-ground --fast`.
- Finish with `./forge all marsh-ground` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
