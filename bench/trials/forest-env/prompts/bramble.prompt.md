You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bramble` (catalog id `forest/dressing/bramble`) as `assets/bramble.ts`.

Description: A thorny bramble thicket about 1.5 m wide and 0.9 m tall: a dense tangle of 5 to 8 arching thorny canes (tapered chains work well) rising from a base mound, small sparse leaves, and a few thorn spikes per cane. Deep green #4a9a4f with darker brown-green canes. It must read as an impassable hedge clump, not a bush: spikier and messier than a bush, but still rounded chibi. No rig or animation.

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
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/vegetation.md` (or `references/props.md` for the campfire) and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/bramble.ts` (helper files named `assets/_bramble-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render bramble --fast` writes `out/bramble/render.png`; look at it if you can view images. Also run `./forge inspect bramble --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all bramble` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles in the final build.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
