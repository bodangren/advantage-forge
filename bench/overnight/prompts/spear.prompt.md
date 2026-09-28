You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `spear` (catalog id `equipment/melee-weapons/spear`) as `assets/spear.ts`.

Description: A spear 1.5 m tall standing on its butt at y = 0: a straight walnut shaft, a leaf-shaped steel head with a socket, a leather wrap at hand height, and an iron butt cap. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/spear-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/blacksmith-quest_001.jpg` (the smithy this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5, metalness 0.7); handles walnut #6b4226 / #54331d; steel edge #c8ccd2.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/spear-mock.jpg`.
- Only create or edit `assets/spear.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render spear --fast` writes `out/spear/render.png`; look at it, then run `./forge inspect spear --fast`.
- Finish with `./forge all spear` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
