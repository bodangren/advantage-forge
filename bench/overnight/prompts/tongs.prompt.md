You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `tongs` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/tongs.ts`.

Description: A pair of blacksmith tongs lying flat on y = 0 (long axis along X), about 0.45 m long. NOT scissors: no finger rings. Two long, straight, round iron reins (handles) about 0.3 m long that end in plain rounded tips, joined by a chunky rivet near the working end; beyond the rivet two short, thick, curved jaws that close on a small glowing-orange stub of hot iron is optional. Iron #4a4f55 with highlight #a8acb1 on the rivet and jaw tips. Chunky proportions so it reads at 128 px from above as a long iron tool.

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