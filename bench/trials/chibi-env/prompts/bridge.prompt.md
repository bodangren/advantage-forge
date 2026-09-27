You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bridge` (catalog id `architecture/structure/bridge`) as `assets/bridge.ts`.

Description: A small wooden footbridge for a cozy chibi fantasy hamlet, spanning about 4 m over a stream, about 1.8 m wide. Gentle arch with chunky side rails and short posts at both ends, warm brown planks. Ends rest at ground level. Stylized and friendly, clear silhouette at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/bridge.ts` (helper files named `assets/_bridge-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render bridge --fast` writes `out/bridge/render.png`; look at it if you can view images. Also run `./forge inspect bridge --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all bridge` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
