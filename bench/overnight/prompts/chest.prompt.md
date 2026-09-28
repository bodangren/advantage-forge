You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `chest` (catalog id `props/containers/chest`) as `assets/chest.ts`.

Description: A plain wooden storage chest (not the gold treasure chest): about 0.7 m wide, 0.45 m deep, 0.45 m tall with a gently domed lid. Honey-oak planks (honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a) with dark walnut #6b4226 / #54331d edge battens, iron #4a4f55, shadow #363a3f, highlight #a8acb1 (roughness 0.5, metalness 0.7) corner caps, two iron bands over the lid, and a hasp with a small padlock on the front. Stands on y = 0, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/chest-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/chest-mock.jpg`.
- Only create or edit `assets/chest.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render chest --fast` writes `out/chest/render.png`; look at it, then run `./forge inspect chest --fast`.
- Finish with `./forge all chest` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
