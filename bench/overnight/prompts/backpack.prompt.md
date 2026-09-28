You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `backpack` (catalog id `equipment/accessories/backpack`) as `assets/backpack.ts`.

Description: An adventurer's backpack standing upright on its base: about 0.42 m wide, 0.5 m tall, 0.26 m deep. A rounded canvas body in burlap tan #c8a86b, a leather flap and trim in #8a5a35 with two buckled straps (iron buckles), a rolled red-brown blanket (#9a4a3a) strapped on top, a small side pouch, and two padded shoulder straps on the back (-Z). Front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/backpack-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/backpack-mock.jpg`.
- Only create or edit `assets/backpack.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render backpack --fast` writes `out/backpack/render.png`; look at it, then run `./forge inspect backpack --fast`.
- Finish with `./forge all backpack` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 7,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
