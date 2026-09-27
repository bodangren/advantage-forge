You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `fence` (catalog id `architecture/building-parts/fence`) as `assets/fence.ts`.

Description: A section of wooden yard fence for a cozy chibi fantasy hamlet, one repeatable segment about 1.8 m long and 1.1 m tall. Two round posts and two horizontal rails with three upright pickets between them, warm brown wood with slightly rounded tops. The segment must tile: posts at both ends at the same height, flat ground line. Clear silhouette at 128 px. No rig or animation.

Review feedback (previous attempt scored fix):
- The wood surface displacement was far too strong; it read as bark and made the silhouette fuzzy. Reduce it to a subtle grain, or drop it.
- The post tops were painted cream and look like paint errors. Use the same warm brown wood for the whole fence, with softly rounded post tops.
- Keep the tiling: two end posts, two rails, three pickets, flat ground line.

- Keep the whole asset under 12,000 triangles in the final build.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/fence.ts` (helper files named `assets/_fence-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render fence --fast` writes `out/fence/render.png`; look at it if you can view images. Also run `./forge inspect fence --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all fence` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
