You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `river-straight` (catalog id `architecture/landscape-parts/river-straight`) as `assets/river-straight.ts`.

Description: A modular straight river tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. A river channel about 1.4 m wide runs straight across the tile in one direction: calm blue-green water set slightly below grass-level banks, with thin sandy banks where water meets grass. Straight clean tile edges. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/river-straight.ts` (helper files named `assets/_river-straight-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render river-straight --fast` writes `out/river-straight/render.png`; look at it if you can view images. Also run `./forge inspect river-straight --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all river-straight` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
