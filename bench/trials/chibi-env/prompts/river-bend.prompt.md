You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `river-bend` (catalog id `architecture/landscape-parts/river-bend`) as `assets/river-bend.ts`.

Description: A modular river bend tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. The river channel enters at the middle of one edge and leaves at the middle of an adjacent edge with a smooth rounded bend, calm blue-green water below grass-level banks with thin sandy edges. Straight clean tile edges. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/river-bend.ts` (helper files named `assets/_river-bend-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render river-bend --fast` writes `out/river-bend/render.png`; look at it if you can view images. Also run `./forge inspect river-bend --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all river-bend` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
