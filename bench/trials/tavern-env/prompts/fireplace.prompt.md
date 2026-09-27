You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `fireplace` (catalog id `props/furniture/fireplace`) as `assets/fireplace.ts`.

Description: A big stone hearth for the tavern wall, about 1.6 m wide, 1.5 m tall, 0.45 m deep, standing on y = 0 with its back at z = 0 and the front facing +Z. Cool-gray chunky stone blocks around a dark fire box: two jamb columns, an arched or straight lintel, and a raised mantel shelf. Inside the fire box a bed of embers, two or three chunky charred logs, and two or three soft flame tongues. The lit fire is the focal point and the room's warm accent: flames and embers are EMISSIVE bodies (#ff9a3c around intensity 2.5), the stone and logs stay matte. A few mugs could sit on the mantel — no, keep the mantel bare; mugs are separate assets. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its chunky stone hearth, bright fire, and warm firelight.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces: keep geometry simple enough to model with primitives.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, silhouettes that read at 128 px. Palette contract: stone cool gray #8a94a0, dark #5b6670; charred wood #3d2717 and #5f3d22; flame and ember emissive #ff9a3c with a pale #ffd66b core; never bake brightness into plain paint — light sources must be emissive bodies.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/fireplace.ts` (helper files named `assets/_fireplace-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render fireplace --fast` writes `out/fireplace/render.png`; look at it if you can view images. Also run `./forge inspect fireplace --fast` for a text report.
- Finish with `./forge all fireplace` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles in the final build.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
