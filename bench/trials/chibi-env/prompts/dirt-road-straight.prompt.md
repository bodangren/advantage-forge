You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `dirt-road-straight` (catalog id `architecture/landscape-parts/dirt-road-straight`) as `assets/dirt-road-straight.ts`.

Description: A modular straight dirt road tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. The road runs straight across the full tile in one direction (along Z), about 1.2 m wide: warm packed brown center with soft worn edges and a few small stone flecks, edged with the same bright green as grass tiles on both sides. Straight clean tile edges. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/dirt-road-straight.ts` (helper files named `assets/_dirt-road-straight-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render dirt-road-straight --fast` writes `out/dirt-road-straight/render.png`; look at it if you can view images. Also run `./forge inspect dirt-road-straight --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all dirt-road-straight` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
