You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `tilled-field` (catalog id `architecture/landscape-parts/tilled-field`) as `assets/tilled-field.ts`.

Description: A modular tilled soil tile for a cozy chibi fantasy farm field, exactly 2 m square and 0.08 m thick, top at y = 0.08. Dark rich brown soil with painted parallel furrow lines running one direction about 0.25 m apart, and a few tiny lighter soil flecks. Straight clean tile edges so it tiles with the other ground tiles. Clear at 128 px. No rig or animation.

Review feedback (previous attempt scored fix):
- The furrow lines came out too dark, too wide, and wet-shiny. Make them thin, subtle, matte lines about 0.25 m apart on rich brown soil.
- The stripes bled down the side faces. Keep all paint on the top surface; sides stay plain soil color.
- Add a few tiny lighter soil flecks.

- Keep the whole asset under 8,000 triangles in the final build.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/tilled-field.ts` (helper files named `assets/_tilled-field-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render tilled-field --fast` writes `out/tilled-field/render.png`; look at it if you can view images. Also run `./forge inspect tilled-field --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all tilled-field` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
