You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `tongs` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/tongs.ts`.

Description: A pair of smithing tongs, about 0.35 m long, sitting on y = 0. Two iron arms joined at a pivot in the middle, with a small jaw at one end (open 30 degrees) and round loops at the other end for the smith's grip. A slight bright spot where the jaws meet. Reads at 128 px as one stout scissor-like tool.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: iron #4a4f55, shadow #363a3f, highlight #a8acb1.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/tongs.ts`.
- `./forge render tongs --fast` → `./forge inspect tongs --fast` → `./forge all tongs` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.