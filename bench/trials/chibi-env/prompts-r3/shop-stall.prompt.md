You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `shop-stall` (catalog id `architecture/structure/shop-stall`) as `assets/shop-stall.ts`.

Description: A small market shop stall for a cozy chibi fantasy hamlet, about 2.4 m wide, 1.6 m deep, and 2.6 m tall. Four wooden posts carry a broad striped awning over a counter; crates and goods sit on the counter. Bright cheerful colors, rounded chunky forms, clear silhouette at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/shop-stall.ts` (helper files named `assets/_shop-stall-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render shop-stall --fast` writes `out/shop-stall/render.png`; look at it if you can view images. Also run `./forge inspect shop-stall --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all shop-stall` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.

- Keep the whole asset under 24,000 triangles in the final build.
