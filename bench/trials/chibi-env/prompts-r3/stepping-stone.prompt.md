You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `stepping-stone` (catalog id `architecture/landscape-parts/stepping-stone`) as `assets/stepping-stone.ts`.

Description: A short stepping-stone path piece for cottage yards: 4 to 5 rounded light-gray stones in a gentle line over about 1.8 m, each stone 0.25 to 0.35 m across and 0.03 to 0.05 m tall, sitting on a thin flush grass base the size of a 2 m ground piece, with small grass tufts between the stones. The stones read as worn, smooth, and friendly. Clear at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The piece must look like it belongs to the SAME game as the hamlet's ground and stone pieces:
- Read `assets/boulder.ts` and `assets/well.ts`: REUSE their stone palette family (light warm grays with soft shading).
- Read `assets/grass-ground.ts` for the base grass greens and its tuft/fleck conventions; the piece should sit beside grass tiles without a visible seam.
- Match the ground-piece conventions of `assets/dirt-road-straight.ts`: flush low profile, soft edges.
- Do NOT copy those files' geometry: build your own stone cluster in the same style family.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/nature.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Iterate with `./forge render stepping-stone --fast` and look at the render before finishing. Compare it against `./forge render boulder --fast`: same game, same stone.
- Finish with a full textured build: `./forge all stepping-stone`.
- Keep the whole asset under 3,000 triangles in the final build.
