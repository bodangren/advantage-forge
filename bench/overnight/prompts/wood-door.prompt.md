You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `wood-door` (catalog id `architecture/building-parts/wood-door`) as `assets/wood-door.ts`.

Description: A standalone wooden door with its frame: the building part that fills the 0.85 m x 1.2 m doorway of the 2 m plaster and timber wall tiles (see assets/plaster-wall-door.ts for the opening and palette). A chunky frame about 0.97 m wide, 1.28 m tall, 0.14 m deep in dark walnut #6b4226 / #54331d; inside it a closed door of vertical planks (honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a) with shallow plank grooves, two black iron strap hinges on the left, a ring handle on the right, and a Z brace on the back face. Stands on y = 0 with the front face toward +Z, centred on x = 0.

Style anchors. Reference images are in `reference/`:
- `reference/wood-door-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/wood-door-mock.jpg`.
- Only create or edit `assets/wood-door.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render wood-door --fast` writes `out/wood-door/render.png`; look at it, then run `./forge inspect wood-door --fast`.
- Finish with `./forge all wood-door` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
