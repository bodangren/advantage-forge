# Produce P2 monsters

## Purpose

Produce and accept the P2 catalog rows in the monsters family. Select batches from scene and game demand.

## Acceptance criteria

- Each source has a stable catalog ID and a recorded visual review.
- Each accepted asset has a textured GLB, a turnaround, and readable sprites.
- Rigged assets pass clearance checks for every required clip.
- Builds contain no warnings, and changed sources pass the relevant checks.
- The plan records evidence and remaining limits for each batch.

## Sources

- [docs/fantasy-world-asset-catalog.tsv](../../../docs/fantasy-world-asset-catalog.tsv)
- [docs/fantasy-world-asset-catalog.md](../../../docs/fantasy-world-asset-catalog.md)
- [bench/overnight/PLAN.md](../../../bench/overnight/PLAN.md)

## Scope control

Existing paths remain stable. Catalog IDs define scope; filename matches indicate source coverage only.

## Open decisions

- The catalog row `monsters/abyssal-and-cosmic/succubus`: in folklore the name means a demon that
  seduces people. The asset is now a G-rated demon girl in a normal dress, but the name stays in
  the catalog (TSV and Markdown), the asset file, the reviews, and the Measure files. Proposal:
  rename the row and the asset to `little-demon` (a path change, so it waits for the owner).
