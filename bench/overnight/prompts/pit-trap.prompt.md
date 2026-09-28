You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `pit-trap` (catalog id `props/world/pit-trap`) as `assets/pit-trap.ts`.

Description: An open pit trap in a 2 m x 2 m stone floor tile 0.1 m thick (top at y = 0.1): a square hole 1.2 m wide with a dark inside and iron spikes at the bottom, and a broken wooden cover beside it. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/pit-trap-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/dungeon-quest_002.jpg` (the Sunken Vault dungeon this asset lives in) and `reference/masonry-canon.png` (its stone and masonry style).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: dungeon stone cool gray #6f7680 / dark #4b525c; iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5, metalness 0.7); old gold #d4a93a (metalness 1); torch emissive #ff9a3c.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/pit-trap-mock.jpg`.
- Only create or edit `assets/pit-trap.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render pit-trap --fast` writes `out/pit-trap/render.png`; look at it, then run `./forge inspect pit-trap --fast`.
- Finish with `./forge all pit-trap` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
