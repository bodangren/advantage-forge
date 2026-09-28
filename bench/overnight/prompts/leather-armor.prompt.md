You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `leather-armor` (catalog id `equipment/armor/leather-armor`) as `assets/leather-armor.ts`.

Description: A leather cuirass shown on a simple wooden armor stand, as in a shop: the stand is a dark walnut #6b4226 / #54331d T-post on a cross foot at y = 0, total height about 0.95 m. The armor is a chibi-proportioned vest about 0.5 m wide and 0.42 m tall: brown leather #8a5a35 with darker stitched panels #5c3a22, rounded shoulder pauldrons, two buckled side straps (iron buckles), and a belt. Front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/leather-armor-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/leather-armor-mock.jpg`.
- Only create or edit `assets/leather-armor.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render leather-armor --fast` writes `out/leather-armor/render.png`; look at it, then run `./forge inspect leather-armor --fast`.
- Finish with `./forge all leather-armor` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
