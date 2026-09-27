You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `hay-bale` (catalog id `props/farm/hay-bale`) as `assets/hay-bale.ts`.

Description: A chunky golden hay bale, about 0.9 m wide and 0.7 m tall: a rounded rectangular block of compressed straw with two or three shallow strap grooves around it and a few loose straw wisps poking from the top. Bright warm gold, like ripe crops. Clear silhouette that reads at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The hay bale must look like it belongs to the SAME game as the hamlet's farm pieces:
- Read `assets/tilled-field.ts` and study its ripe-crop golds. REUSE that golden straw palette family for the bale.
- Read `assets/barn.ts` for the farm building family's wood tones and chunky proportions.
- Read `reference/barn_001.jpg`: that mockup shows the barn and the farm look of the settlement. The map paints hay bales sitting beside the barn.
- Do NOT copy those files' geometry: build your own hay bale in the same style family.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Iterate with `./forge render hay-bale --fast` and look at the render before finishing. Compare it against `./forge render tilled-field --fast`: same game, same golds.
- Finish with a full textured build: `./forge all hay-bale`.
- Keep the whole asset under 4,000 triangles in the final build.
