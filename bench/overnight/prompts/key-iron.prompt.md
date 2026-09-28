You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `key-iron` (catalog id `items/quest-and-treasure/key-iron`) as `assets/key-iron.ts`.

Description: An old iron key lying flat on the ground at y = 0: 0.24 m long, the round ring bow toward -X and the toothed bit toward +X. iron #4a4f55, shadow #363a3f, highlight #a8acb1 (roughness 0.5, metalness 0.7), a chunky round bow with a hole, a round shaft with two collars, and a two-tooth bit. Slightly oversized chunky forms so it reads at 128 px from above.

Style anchors. Reference images are in `reference/`:
- `reference/key-iron-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/key-iron-mock.jpg`.
- Only create or edit `assets/key-iron.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render key-iron --fast` writes `out/key-iron/render.png`; look at it, then run `./forge inspect key-iron --fast`.
- Finish with `./forge all key-iron` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
