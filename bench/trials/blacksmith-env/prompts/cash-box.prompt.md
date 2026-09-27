You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `cash-box` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/cash-box.ts`.

Description: A small iron-bound cash box, about 0.28 m long, 0.18 m wide, 0.16 m tall, sitting on y = 0. Walnut body with iron strap banding along the edges, an iron hasp lock on the front, and a small walnut lid with iron hinges at the back. A coin slot on the top. Reads at 128 px as one stout little iron-bound strongbox.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: walnut #6b4226, iron #4a4f55, shadow #363a3f.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/cash-box.ts`.
- `./forge render cash-box --fast` → `./forge inspect cash-box --fast` → `./forge all cash-box` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.