You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `dirt-road-straight` (catalog family per docs/village-mockups/components.tsv) as `assets/dirt-road-straight.ts`.

Description: A 2 m × 2 m dirt road straight tile, 0.06 m thick, standing on y = 0. Compacted earth warm tan `#a87a4a` with dry shade `#7d5630` at the shoulders and a slight rut `#4f3a26` down the middle. Sparse grass tufts `#5fb14d` creeping in from the edges. Soft worn edges; gritty normal-map noise. Reads at 128 px as one stout warm dirt square.

Style anchors — `reference/village-quest_001.jpg`, `reference/forest-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/village-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: dirt #a87a4a, dry shade #7d5630, wet rut #4f3a26, grass tuft #5fb14d.

Workflow: read AGENTS.md and the forge-assets skill; stand on y = 0; reference `docs/village-mockups/village-quest_001.jpg`; only edit `assets/dirt-road-straight.ts`; render → inspect → all with no warnings; under 4,000 triangles; ~40 minutes.
