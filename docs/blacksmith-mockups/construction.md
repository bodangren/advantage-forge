# Blacksmith-shop — construction contract

Shared design rules for the chibi blacksmith-shop kit. Every asset reads as one workshop,
every wall follows the same timber-and-stone grammar, every tool matches the same scale and
iron family.

## 1 · Wall system

Three modular 2 m wall tiles: `timber-wall`, `stone-wall`, and the existing `plaster-wall`
reused for any back-of-shop partition. All tile on a 2 m grid, share length (2.0 m), height
(1.5 m), and the timber/palette contract below.

### Half-timbered wall (timber-wall)

- Two end posts (walnut #6b4226, 0.16 × 0.18 × full H) at `x = ±0.925`.
- Sill beam (2.0 × 0.18 × 0.18) at the bottom band.
- Top rail (2.0 × 0.18 × 0.18) above the openings.
- One diagonal brace in walnut, lower-left → upper-right (`AX=-0.88, AY=0.1 → BX=0.44, BY=1.36`).
- Soft bevel (`0.014–0.02 m`) on every timber.

### Ashlar stone wall (stone-wall)

- Cut blocks of warm grey `#8a8a82` with `#5e5e58` mortar lines, in a 4-row bond pattern.
- Each block ~0.5 × 0.25 m visible face; soft bevel on the stone edges.
- Top band is a darker capstone `#5e5e58`.
- Bottom band matches the timber wall's sill so corners read clean.

### Plaster wall

Reuse `plaster-wall` (and its door/window variants) from the tavern kit per
`docs/tavern-mockups/construction.md §1`. The plaster / walnut / iron palette is shared.

## 2 · Floor system — `stone-floor`

- Cobblestone tile, `2 × 0.06 × 2 m`, blocks of `#8a8a82` in a running-bond pattern, `#5e5e58` mortar.
- Slight worn variation across tiles; grit bump in the normal map.
- Tile edges align with wall edges (`x = ±1`, `z = ±1`).

## 3 · Iron and tool palette

Every iron tool in the workshop uses these hex codes; do not introduce a second iron
family in the set.

| role | hex | use |
|------|-----|-----|
| `IRON` | `#4a4f55` | tool bodies |
| `IRON_DEEP` | `#363a3f` | tool shadows / handles |
| `IRON_LIGHT` | `#a8acb1` | tool highlights / edges |

Wood handles (where tools have them) use walnut `#6b4226` / `#54331d` (shared with
tavern construction §3). Rope coils use the burlap family `#c2a06a` / `#9a7d4c`.

## 4 · Forge focal

- `forge` is the workshop's warm focal emissive: stone hearth with bright `#ff9a3c` /
  `#ffd66b` flame bed, ash and ember layering.
- The fire sits inside the stone arch and is never occluded by other assets; it reads
  through the front opening.
- Slight smoke drift from the chimney (optional emissive/vertex color hint).

## 5 · Hero — the smith

- Reuses the existing `hero/blacksmith` character (built by Opus).
- Stands behind the anvil, hammer raised or poised.
- Wears a leather apron in warm tan `#8a5a35` (shared with tavern honey oak family).

## 6 · Reuse from the tavern kit

- `plaster-wall`, `plaster-wall-window`, `plaster-wall-door` (tavern wall family).
- `barrel` (storage in the back).
- `crate`, `sack` (input materials).

## 7 · Future systems to lock down

- Tool scale grammar (every iron tool ~0.3–0.5 m at 128 px).
- Workbench surface pattern (one plank direction, soft wear on edges).
- Hero pose grammar (the smith behind the anvil with the hammer poised).

Added as wave 2/3 assets land.
