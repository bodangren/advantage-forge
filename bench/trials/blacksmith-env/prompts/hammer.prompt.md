You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `hammer` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/hammer.ts`.

Description: Two smithing hammers side-by-side on a small wooden rack, sitting on y = 0. Each hammer about 0.32 m long: a heavy iron head with one square face and one slightly rounded peen, a chunky walnut handle. The rack is a thin plank (0.45 × 0.04 × 0.18 m) at y = 0.18 with two small walnut pegs. Reads at 128 px as one stout smith-hammer rack.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: iron #4a4f55, walnut #6b4226, highlight #a8acb1.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/hammer.ts`.
- `./forge render hammer --fast` → `./forge inspect hammer --fast` → `./forge all hammer` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.