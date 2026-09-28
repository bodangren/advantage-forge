You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `torch` (catalog id `props/furniture/torch`) as `assets/torch.ts`.

Description: A standing torch for paths, camps, and village edges: a 1.3 m dark walnut #6b4226 / #54331d pole planted in a small mound of earth and three fist-sized stones at y = 0, an iron #4a4f55, shadow #363a3f, highlight #a8acb1 cup at the top holding a pitch-soaked cloth wrap, and a bright flame. The flame is an emissive body (#ff9a3c core, #ffd66b tips, emissiveIntensity 2 to 3), shaped as a chunky teardrop with two or three licks. Never bake brightness into plain paint.

Style anchors. Reference images are in `reference/`:
- `reference/torch-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/torch-mock.jpg`.
- Only create or edit `assets/torch.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render torch --fast` writes `out/torch/render.png`; look at it, then run `./forge inspect torch --fast`.
- Finish with `./forge all torch` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.

Emissive rule: Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.
