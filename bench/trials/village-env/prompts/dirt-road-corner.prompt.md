You are working in the Fantasy Asset Forge repository (the current directory).

Task: create the asset `dirt-road-corner` (catalog family per docs/village-mockups/components.tsv) as `assets/dirt-road-corner.ts`.

Description: A 2 m × 2 m dirt road corner tile, 0.06 m thick, standing on y = 0. The road turns 90 degrees — same warm earth palette as dirt-road-straight (`#a87a4a` / `#7d5630` / `#4f3a26`). The bend arc sits inside the tile, mouths at the south and east edges (so a tile at yaw 0 connects to a straight on south and to another corner on east). Sparse grass tufts `#5fb14d` at the outer shoulders. Reads at 128 px as one stout dirt bend.

Style anchors — `reference/village-quest_001.jpg`, `reference/forest-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/village-mockups/construction.md`. Verify the bend mouths by reading the asset code in your workspace after writing — they must be south and east at yaw 0.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: dirt #a87a4a, dry shade #7d5630, wet rut #4f3a26, grass tuft #5fb14d.

Workflow: read AGENTS.md and the forge-assets skill; stand on y = 0; reference `docs/village-mockups/village-quest_001.jpg`; only edit `assets/dirt-road-corner.ts`; render → inspect → all with no warnings; under 4,000 triangles; ~40 minutes.
