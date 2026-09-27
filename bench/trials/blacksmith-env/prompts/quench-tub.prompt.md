You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `quench-tub` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/quench-tub.ts`.

Description: A wooden water quench tub, about 0.4 m diameter, 0.3 m tall, sitting on y = 0. A round bucket-shaped tub in honey-oak staves with two dark iron strap bands, a flat wooden lid leaning against one side, and a calm water surface visible from above (calm teal #6fa8b8 at the rim). Reads at 128 px as one stout little wooden tub with water.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a, iron #4a4f55, water #6fa8b8.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/quench-tub.ts`.
- `./forge render quench-tub --fast` → `./forge inspect quench-tub --fast` → `./forge all quench-tub` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.