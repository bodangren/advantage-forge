You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `cottage` (catalog id `architecture/structure/cottage`) as `assets/cottage.ts`.

Description: A cozy chibi fantasy cottage, about 2.2 m tall to the ridge, with rounded chunky walls, a broad bright shingled roof with a soft overhang, one round window with shutters, a chunky arched wooden door, and a small stone chimney on one side. A couple of bushes or flowers hugging the base. Clear silhouette that reads at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The cottage must look like it belongs to the SAME game as the barn that was just built for this hamlet:
- Read `assets/barn.ts` and study its palette constants, materials, and proportions. REUSE its palette family: the same warm red for board-and-batten walls (or warm cream plaster walls with the same red as an accent), the same cream trim color for corner boards, window frames, and door frame, the same cream shingle roof with the same soft overhang, and the same warm wood tones.
- Read `reference/barn_001.jpg`: that mockup shows the barn, the settlement's style anchor. Match its material language: rounded chunky forms, painted board texture, soft edges, bright cheerful colors.
- Match the barn's shape language: chunky rounded volumes, gently bulging walls, thick soft roof edges, small footprint relative to height. The cottage is a sibling building, not a different game's prop.
- Do NOT copy the barn geometry and do NOT copy any older baseline cottage: build a cottage (smaller, homey, one window and door, chimney), but unmistakably in the same style family as the barn.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Iterate with `./forge render cottage --fast` and look at the render before finishing. Compare it against `./forge render barn --fast` side by side: same game, same palette.
- Finish with a full textured build: `./forge all cottage`.
- Keep the whole asset under 20,000 triangles in the final build.
