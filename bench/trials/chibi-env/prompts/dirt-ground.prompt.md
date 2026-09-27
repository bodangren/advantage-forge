You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `dirt-ground` (catalog id `architecture/landscape-parts/dirt-ground`) as `assets/dirt-ground.ts`.

Description: A modular bare dirt ground tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. Warm light brown packed earth with soft darker patches and a few small pebble dots painted on top. Straight clean edges so tiles sit side by side with grass tiles. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/dirt-ground.ts` (helper files named `assets/_dirt-ground-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render dirt-ground --fast` writes `out/dirt-ground/render.png`; look at it if you can view images. Also run `./forge inspect dirt-ground --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all dirt-ground` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
