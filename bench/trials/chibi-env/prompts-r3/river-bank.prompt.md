You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `river-bank` (catalog id `architecture/landscape-parts/river-bank`) as `assets/river-bank.ts`.

Description: A modular river bank edge tile for a cozy chibi fantasy hamlet map, exactly 2 m square and 0.08 m thick, top at y = 0.08. Grass ground on most of the tile with one bank edge crossing it: a thin strip of sandy shore with a few small round pebbles along the waterline, so it sits between a grass tile and a river tile. Straight clean tile edges. Clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/river-bank.ts` (helper files named `assets/_river-bank-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render river-bank --fast` writes `out/river-bank/render.png`; look at it if you can view images. Also run `./forge inspect river-bank --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all river-bank` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.

Review feedback (re-run for palette harmony with its neighbours):
- The grass color must match the grass-ground tile: fresh mid green, not yellow-green. Use the same green across the whole tile.
- Keep the tile slab 2 m square with its top flush at 0.08 m; the water channel and banks stay inside the tile.
- Keep the whole asset under 20,000 triangles in the final build.
