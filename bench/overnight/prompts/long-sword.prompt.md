You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `long-sword` (catalog id `equipment/melee-weapons/long-sword`) as `assets/long-sword.ts`.

Description: A plain steel longsword, 1.0 m long, standing upright with the point up and the pommel at y = 0 (the same pose as assets/knight-sword.ts, which is the knight's fancy gold version; this one is the common shop sword). Steel blade #c8ccd2 with a fuller groove, a straight iron crossguard (iron #4a4f55, shadow #363a3f, highlight #a8acb1 (roughness 0.5, metalness 0.7)), a brown leather grip #6e4526 with wrap lines, and a round iron pommel. Flat side toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/long-sword-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/long-sword-mock.jpg`.
- Only create or edit `assets/long-sword.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render long-sword --fast` writes `out/long-sword/render.png`; look at it, then run `./forge inspect long-sword --fast`.
- Finish with `./forge all long-sword` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
