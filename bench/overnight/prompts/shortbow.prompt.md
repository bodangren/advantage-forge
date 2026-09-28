You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `shortbow` (catalog id `equipment/ranged-weapons/shortbow`) as `assets/shortbow.ts`.

Description: A shortbow standing upright on its lower tip at y = 0: 0.9 m tall, the bow curving toward +Z. Two smoothly curved dark walnut #6b4226 / #54331d limbs with pale horn tips, a leather grip wrap in the middle (#8a5a35), and a thin, taut pale string (#e8dcc0) from tip to tip on the -Z side.

Style anchors. Reference images are in `reference/`:
- `reference/shortbow-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/shortbow-mock.jpg`.
- Only create or edit `assets/shortbow.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render shortbow --fast` writes `out/shortbow/render.png`; look at it, then run `./forge inspect shortbow --fast`.
- Finish with `./forge all shortbow` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
