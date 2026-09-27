You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `grass-ground` (catalog id `architecture/landscape-parts/grass-ground`) as `assets/grass-ground.ts`.

Description: A modular grass ground tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top surface at y = 0.08 with the sides and bottom simple. A bright cheerful green top with soft painted color variation, a few lighter grass flecks, and straight clean edges so tiles sit side by side. Keep the edges crisp: no grass blades sticking past the 2 m boundary. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/grass-ground.ts` (helper files named `assets/_grass-ground-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render grass-ground --fast` writes `out/grass-ground/render.png`; look at it if you can view images. Also run `./forge inspect grass-ground --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all grass-ground` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
