You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bone-pile` (catalog id `dungeon/prop/bone-pile`) as `assets/bone-pile.ts`.

Description: A pile of cartoon dungeon bones: four or five big chunky femurs and ribs crossed in a mound about 0.5 m wide, with two stylized skulls (big round craniums, simple dark eye sockets) resting on top. Bleached warm ivory #e8dcc0 with a faint soil stain near the base. Rounded, friendly shapes; not gory. Clear at 128 px. No rig or animation.

Style anchors — this is the critical requirement. Every dungeon asset must look like it belongs to the SAME game. Two concept images are in `reference/`:
- `reference/dungeon-quest_002.jpg`: the batch style anchor. Match its chunky rounded stone-block language, its cool slate palette, its warm torchlight accents, and its prop vocabulary.
- `reference/dungeon-quest_001.jpg`: the top-down tile reference for grid rhythm and wall runs.
They are style guides, not traces: keep geometry simple enough to model with primitives.

Art direction (dungeon treatment of Chibi Quest): rounded chunky forms, soft bevels everywhere, silhouettes that read at 128 px, and a cool-dark stone world warmed by small emissive light sources. Palette contract:
- Stone: deep slate shadows #2a3547, mid blue-gray blocks #4a5d75, pale worn tops #7a8ba0; floor slabs cool gray with darker grout.
- Warm light: flame and ember emissive #ff9a3c (the kit's warm accent), soft glow painted onto nearby stone.
- Secondaries: moss and crystal teal-green #3fae9a, treasure gold #f4c542, wood brown #8a5a35.
- Mood: cool dark stone base, small warm pools of light. Squint test: flames must be the brightest, warmest points.

Emissive rules: flame, embers, and candle fires use `emissive` with color #ff9a3c and intensity around 2. Crystals, brew, and runes use #3fae9a at 0.3 to 0.8. Never bake brightness into plain paint — light sources must be emissive bodies.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/bone-pile.ts` (helper files named `assets/_bone-pile-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render bone-pile --fast` writes `out/bone-pile/render.png`; look at it if you can view images. Also run `./forge inspect bone-pile --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all bone-pile` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles in the final build.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
