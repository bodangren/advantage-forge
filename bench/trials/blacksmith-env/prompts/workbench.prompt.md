You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `workbench` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/workbench.ts`.

Description: A heavy wooden workbench, about 1.2 m long, 0.6 m wide, 0.85 m tall, standing on y = 0 facing +Z. A thick honey-oak top (0.06 m) with a soft bevel and a faint plank division, an iron vice at the front-right end with two jaws and a screw handle, four chunky square legs slightly inset, and a low stretcher frame near the floor. Reads at 128 px as one stout workbench.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a, walnut shadow #8a5a35, iron vice #4a4f55.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/workbench.ts`.
- `./forge render workbench --fast` → `./forge inspect workbench --fast` → `./forge all workbench` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.