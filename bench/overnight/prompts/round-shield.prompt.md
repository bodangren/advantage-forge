You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `round-shield` (catalog id `equipment/armor/round-shield`) as `assets/round-shield.ts`.

Description: A round wooden shield standing on its rim at y = 0, face toward +Z: 0.6 m diameter, 0.08 m thick. Radial honey-oak planks (honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a), a riveted iron rim band and a domed iron boss in the centre (iron #4a4f55, shadow #363a3f, highlight #a8acb1 (roughness 0.5, metalness 0.7)), a painted blue ring (#2f6aa8) between boss and rim, and a leather grip on the back.

Style anchors. Reference images are in `reference/`:
- `reference/round-shield-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/round-shield-mock.jpg`.
- Only create or edit `assets/round-shield.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render round-shield --fast` writes `out/round-shield/render.png`; look at it, then run `./forge inspect round-shield --fast`.
- Finish with `./forge all round-shield` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
