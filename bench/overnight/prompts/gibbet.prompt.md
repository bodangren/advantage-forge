You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `gibbet` (catalog id `props/world/gibbet`) as `assets/gibbet.ts`.

Description: A dungeon gibbet 2.0 m tall: a stout wooden post with an arm, an iron chain, and a hanging iron cage with a few bones inside, on a small stone base. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/gibbet-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/dungeon-quest_002.jpg` (the Sunken Vault dungeon this asset lives in) and `reference/masonry-canon.png` (its stone and masonry style).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: dungeon stone cool gray #6f7680 / dark #4b525c; iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5, metalness 0.7); old gold #d4a93a (metalness 1); torch emissive #ff9a3c.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/gibbet-mock.jpg`.
- Only create or edit `assets/gibbet.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render gibbet --fast` writes `out/gibbet/render.png`; look at it, then run `./forge inspect gibbet --fast`.
- Finish with `./forge all gibbet` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 7,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
