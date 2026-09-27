You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `mushroom` (catalog id `nature/plants/mushroom`) as `assets/mushroom.ts`.

Description: A forest-floor mushroom cluster about 0.4 m wide: 3 to 5 chunky mushrooms with warm tan #c9a06a and warm brown #8a5a35 caps on cream #e8d9b8 stems, rising from a small moss patch #4a9a4f. This is the temperate forest mushroom — do NOT use the dungeon kit's teal or slate palette. No rig or animation.

Style anchors — this is the critical requirement. Every forest asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/forest-quest_001.jpg`: the batch style anchor and layout reference. Match its chunky rounded plant language, its sunny green palette, and its warm fire accent.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette so forest assets sit beside hamlet assets without a style clash.
They are style guides, not traces: keep geometry simple enough to model with primitives.

Art direction (forest treatment of Chibi Quest): rounded chunky forms, soft bevels everywhere, silhouettes that read at 128 px, and a bright sunny green world with one warm fire accent. Palette contract:
- Grass: sunny leaf green #7ec850, shaded green #4a8a3f.
- Canopy: leaf green #5cb85c, deep green #3f9248.
- Bark and wood: warm brown #8a5a35, dark bark #5f3d22, pale cut wood #c9a06a.
- Stones: cool gray #8a94a0. Dirt: warm tan #c8a86b.
- Ferns and brambles: deep greens #2f7a3f and #4a9a4f.
- Fire (campfire only): flame and ember emissive #ff9a3c at intensity around 2 — the same warm accent contract as the dungeon kit. Never bake brightness into plain paint — light sources must be emissive bodies.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/vegetation.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/mushroom.ts` (helper files named `assets/_mushroom-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render mushroom --fast` writes `out/mushroom/render.png`; look at it if you can view images. Also run `./forge inspect mushroom --fast` for a text report.
- Finish with `./forge all mushroom` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles in the final build.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
