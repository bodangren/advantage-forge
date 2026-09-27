You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `dirt-road-corner` (catalog id `architecture/landscape-parts/dirt-road-corner`) as `assets/dirt-road-corner.ts`.

Description: A modular dirt road corner tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. A 90-degree bend: the road enters at the middle of one edge and leaves at the middle of an adjacent edge, with a smooth rounded curve between them, warm packed brown with soft worn edges on a green base. Straight clean tile edges. Clear at 128 px. No rig or animation.

Review feedback (previous attempt scored drop):
- The road patch did NOT reach the tile edges, so the corner cannot connect to straight road tiles.
- The road must enter at the middle of one edge and leave at the middle of an adjacent edge, full-bleed to the tile boundary on both ends.
- Use a smooth quarter-circle bend between the two edge midpoints; no fold or crease across the bend.
- Keep the packed-brown road on a green grass base, soft worn edges, and the tile edges perfectly straight and clean.

- Keep the whole asset under 20,000 triangles in the final build.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/dirt-road-corner.ts` (helper files named `assets/_dirt-road-corner-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render dirt-road-corner --fast` writes `out/dirt-road-corner/render.png`; look at it if you can view images. Also run `./forge inspect dirt-road-corner --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all dirt-road-corner` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
