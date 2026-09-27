You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `grinding-wheel` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/grinding-wheel.ts`.

Description: A treadle grinding wheel, about 0.5 m diameter, 0.4 m tall, standing on y = 0. A round stone wheel on a wooden frame: two chunky side posts, a horizontal axle through the wheel's center, a wide flat treadle board at the floor, and a small water trough under the wheel. The stone is warm grey #8a8a82 with a slight rim groove. Reads at 128 px as one stout stone-wheel-on-frame.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: stone #8a8a82, walnut frame #6b4226, iron #4a4f55.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/grinding-wheel.ts`.
- `./forge render grinding-wheel --fast` → `./forge inspect grinding-wheel --fast` → `./forge all grinding-wheel` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.