You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `dirt-road-t-junction` (catalog id `architecture/landscape-parts/dirt-road-t-junction`) as `assets/dirt-road-t-junction.ts`.

Description: A modular T-junction dirt road tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. Roads enter at the middle of three edges and meet in the middle of the tile with soft rounded corners, warm packed brown with worn edges on a green base. Straight clean tile edges. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/dirt-road-t-junction.ts` (helper files named `assets/_dirt-road-t-junction-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render dirt-road-t-junction --fast` writes `out/dirt-road-t-junction/render.png`; look at it if you can view images. Also run `./forge inspect dirt-road-t-junction --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all dirt-road-t-junction` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.

Review feedback (re-run for color harmony with its neighbours):
- The packed road color must match the warm brown of the straight dirt-road tile and the bare dirt ground tile: rich warm brown, clearly darker than pale tan.
- The road surface must sit flush with the grass, with no raised slab or visible seam between road and grass.
- Keep the T-junction connectivity: roads enter the middle of three tile edges and meet at the tile centre; keep tile edges straight and clean.
- Keep the whole asset under 20,000 triangles in the final build.
