# Tavern — construction contract

The shared design rules every tavern asset follows, so the set reads as one game. Each
section pins numbers that every variant of a system shares: palette hex codes, sizes,
and structural patterns. Subagents reference this file from their prompts; reviewers
flag drift against it.

## 1 · Wall system (plaster-wall family)

Three modular 2 m wall tiles: `plaster-wall`, `plaster-wall-window`, `plaster-wall-door`.
All tile on a 2 m grid, share length (2.0 m on X), height (1.5 m), and the timber/palette
contract below. The wood-frame pattern reads as one half-timbered system across the set.

### Wood-frame contract (every wall variant)

- Two end posts: square in section, `0.15 m × 0.18 m × full H`, flush at `x = ±0.925`.
- Sill beam: full-length, `2.0 × 0.18 × 0.18 m`, bottom band.
- Top rail: `2.0 × 0.18 × 0.18 m`, top band above the openings.
- One or more diagonal braces in walnut, mirroring the same diagonal across variants:
  - **`plaster-wall`**: 1 brace, lower-left → upper-right (`AX=-0.88, AY=0.1 → BX=0.44, BY=1.36`).
  - **`plaster-wall-window`**: 2 braces flanking the window, mirrored across the X axis.
  - **`plaster-wall-door`**: 2 braces flanking the doorway, mirrored across the X axis.
- Every timber uses the same dark walnut palette (see §3) with `roughness 0.8` and a soft
  bevel (`0.014–0.02 m`).
- The diagonal angle is `−45°` (or `+45°` for the mirrored side) so the eye reads one
  timber grammar across the set.

### Wall openings

- Openings are always centered at `x = 0`.
- The frame steps around the opening: jamb posts, lintel, sill beam, threshold.
- Top rail and sill beam continue across the wall at full width even when the opening
  interrupts them; the jamb and lintel cap the opening inside that frame.
- A brace's inner edge must clear the opening by `≥ 0.015 m` (no poking through glass
  or door leaf).

### Door behavior

- Doors are **closed** in the still. No tavern-set animation drives a door, so a closed
  leaf reads correct.
- The door leaf sits flush in the doorway at `DOOR_ANGLE = 0`. Hinges and handle are
  detail, not motion.

## 2 · Plaster system

- Plaster field: warm white `#f0e4cc`, shading to `#d8c9a8` near the sill.
- Slight trowel bump (`0.0012` noise amplitude), `roughness 0.95`.
- Splash accents near the floor in `#c4a880` (mottled plaster).
- The slab is inset from the frame by `5 mm` on X and `20 mm` on Y so texels never bleed
  onto walnut ends.

## 3 · Timber palette (walnut family)

Every wood member in the tavern uses these hex codes; do not introduce a second wood
tone in the set.

| role | hex | use |
|------|-----|-----|
| `WALNUT` | `#6b4226` | timber base |
| `WALNUT_DEEP` | `#54331d` | grain streaks / shade |
| `WALNUT_LIGHT` | (per file) | warm highlights |

Honey oak (`#b5814a` / `#8a5a35` / `#c9a06a`) is reserved for **doors, table tops, and
bench seats** — the focal furniture wood. Do not use it on framing.

Iron accents (`#4a4f55` + dark/light variants) are reserved for hinges, handles, and
straps; `roughness 0.5`, `metalness 0.7`.

## 4 · Floor system

- Floor tiles (`wood-floor`) carry the same honey oak family as furniture tops so the
  room reads as one timber palette.
- A floor tile is `2 × 0.06 × 2 m`, plank direction along X (the long axis), every 0.2 m
  a plank gap.
- Floor edges align with wall edges (`x = ±1`, `z = ±1`) so walls and floor tile cleanly.

## 5 · Future systems to lock down

- **Furniture grammar**: leg shape, stretcher pattern, tabletop thickness for table / bench / chair / stool / round-table / counter.
- **Lighting grammar**: candle / candelabra / chandelier / hearth scale and proportion, so light sources look like one family.
- **Tableware grammar**: mug / tankard / bottle / plate / bowl share one scale and one handle/stem pattern.
- **Food grammar**: bread / cheese / haunch share one wood-board or plate grammar.

These get added here as wave 2/3 assets land.