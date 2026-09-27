You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `clothesline` (catalog id `props/world/clothesline`) as `assets/clothesline.ts`.

Description: A cottage clothesline: two chunky wooden posts about 1.8 m tall standing 2 m apart, a gently sagging rope strung between them, and 3 to 4 bright cloth pieces hanging over the rope — for example a red shirt, a blue dress, and a cream towel — with soft rounded folds and a slight sway. Clear silhouette that reads at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The clothesline must look like it belongs to the SAME game as the hamlet's props:
- Read `assets/fence.ts` for the wooden post palette: REUSE the same warm honey-brown wood for the posts.
- Read `assets/shop-stall.ts` for the settlement's bright cloth colors (awning reds and blues): REUSE that cloth palette family for the laundry.
- Read `assets/wildflowers.ts` for the cheerful accent language if you add a small flower pot at a post base.
- Do NOT copy those files' geometry: build your own clothesline in the same style family.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z (the line runs along X).
- Iterate with `./forge render clothesline --fast` and look at the render before finishing. Compare it against `./forge render fence --fast`: same game, same wood.
- Finish with a full textured build: `./forge all clothesline`.
- Keep the whole asset under 5,000 triangles in the final build.
