You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `oak-tree` (catalog id `nature/trees/oak-tree`) as `assets/oak-tree.ts`.

Description: A chunky chibi fantasy oak tree, about 4.5 m tall, with a thick tapering trunk that splits into two or three heavy limbs, and a big rounded canopy built from 5 to 7 overlapping leaf blobs with bumpy silhouettes. A few roots flare into the ground. Clear silhouette that reads at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The oak must look like it belongs to the SAME game as the pine tree and bushes already built for this hamlet:
- Read `assets/pine-tree.ts` and `assets/bush.ts`. Study their palette constants and canopy construction. REUSE their foliage palette family: the same fresh mid-green foliage with lighter top patches and darker undersides, and the same warm brown bark.
- Read `reference/pine-tree_001.jpg`: that mockup shows the pine, the settlement's tree-style anchor. Match its material language: rounded chunky leaf blobs with bumpy silhouettes, soft edges, bright cheerful colors, clear sprite-readable silhouette.
- Match their shape language: chunky rounded forms, soft bulging silhouettes, slightly exaggerated proportions. The oak is a sibling tree, not a different game's prop.
- Do NOT copy the pine's geometry (an oak has a broader, rounder canopy and thicker branching trunk) and do NOT copy any older baseline oak: build your own oak in the same style family as the pine and bush.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/nature.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Iterate with `./forge render oak-tree --fast` and look at the render before finishing. Compare it against `./forge render pine-tree --fast`: same game, same palette.
- Finish with a full textured build: `./forge all oak-tree`.
- Keep the whole asset under 15,000 triangles in the final build.
