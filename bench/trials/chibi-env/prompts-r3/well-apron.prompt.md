You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `well-apron` (catalog id `architecture/landscape-parts/well-apron`) as `assets/well-apron.ts`.

Description: A round cobblestone apron pad that sits under the hamlet well, about 2.4 m in diameter and 0.04 m thick: a ring of rounded light-gray cobble stones fitted together with slight size variation, a few moss specks between them, and a flush low profile so the well model can stand on top of it. It is ground dressing, not a tile: soft rounded edge, no square footprint. Clear at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The apron must look like it belongs to the SAME game as the well it serves:
- Read `assets/well.ts` and study its stone drum: REUSE the exact cobble grays and mortar tones for the apron stones.
- Read `assets/dirt-road-straight.ts` for the settlement's ground-piece conventions: flush low profile, soft beveled edges, clean paint that meets the ground without a hard lip.
- Do NOT copy those files' geometry: build your own round pad in the same style family.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centered on the Y axis.
- Iterate with `./forge render well-apron --fast` and look at the render before finishing. Compare it against `./forge render well --fast`: the apron stones must read as the same masonry as the well drum.
- Finish with a full textured build: `./forge all well-apron`.
- Keep the whole asset under 6,000 triangles in the final build.
