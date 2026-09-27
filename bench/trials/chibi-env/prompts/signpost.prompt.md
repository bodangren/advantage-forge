You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `signpost` (catalog id `props/world/signpost`) as `assets/signpost.ts`.

Description: A wooden signpost for a cozy chibi fantasy hamlet, about 2.2 m tall. One sturdy post with two arrow-shaped boards pointing in different directions, and a small nail detail where each board meets the post. Warm brown wood, rounded chunky shapes, clear silhouette at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/signpost.ts` (helper files named `assets/_signpost-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render signpost --fast` writes `out/signpost/render.png`; look at it if you can view images. Also run `./forge inspect signpost --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all signpost` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
