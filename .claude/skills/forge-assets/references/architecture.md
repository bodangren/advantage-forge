# Architecture and environment pieces

Worked example: `assets/cottage.ts` (fieldstone base, plaster walls with a timber frame,
shingled roof, chimney, arched door, windows, flower box).

## Scale and layout

Architecture is judged against the player's body, so real dimensions matter: door 2 m tall and
0.8 to 1 m wide, window sill about 0.9 m, floor height 2.5 to 3 m, wall thickness 0.2 to 0.4 m,
steps 0.15 to 0.2 m, roof pitch 40 to 55 degrees for a cozy fantasy look.

Stylize with **exaggerated roofs** (steep, big overhangs), **chunky trim** (thick beams, deep
window frames), a **slight lean or sag** (a few degrees of `rotate` or a gentle `bend` on the
roof ridge), and **a strong base** (stone footing wider than the wall).

Design the facade like a face: the door is the focal point, windows balance it, and one
charming detail (flower box, lantern, sign, cat on the roof) tells a story. Keep the plain
wall areas plain.

## Construction recipes

- **Walls**: a rounded box; gables as an extruded triangle profile along the ridge axis.
- **Timber frame**: beams are boxes, but keep only the part near the wall surface by
  intersecting with a shell of the walls, so beams never fill openings:
  `wallSkin = walls.round(0.03).subtract(walls.round(-0.02))`. Limit posts that span through
  the house to the faces they belong to (intersect with a slab near the front and back), or a
  corner post will cover a whole end wall.
- **Stone** (foundations, chimneys, walls, paths): `noise.worley` cells — mortar where
  `f2 - f1` is small, a tint per cell id, and the cell relief in `bump`. Stretch the cells
  horizontally (`y * 1.6`) for laid stone; use rounder cells for cobbles.
- **Roof**: an extruded thick inverted V along the ridge. Shingles are **paint plus bump**: row
  index from the distance down the slope, columns offset every other row, a dark seam line,
  per-shingle tint, and a **continuous ramp** relief in `bump` (rise slowly toward the row's
  lower edge, then drop over a short distance). A sawtooth with a jump tears the surface.
  Thatch: a thick rounded roof with long vertical noise strokes in `bump` and a straw palette.
- **Doors and windows**: extrude an arched outline for doors (planks painted with gaps and
  grain, iron hinges as thin boxes, a ring handle as a small torus); window frames are a box
  minus an opening plus a cross; glass is a thin dark body with a faint warm `emissive`
  (0.1 to 0.2) so it looks lit from inside.
- **Chimney**: a stone box through the roof with a cap slab and a dark painted opening.
- **Details**: flower boxes (planter + foliage ellipsoid + saturated flower spheres), lanterns,
  signs, barrels by the door. One or two, not ten.

## Budget

A small house is 30k to 60k triangles. Walls and roofs are large and simple: keep all
fine texture in `bump` and use `detail` 0.012 to 0.016. Large meshes that come out heavy
almost always have noise in `displace`. Use a 1024 atlas for small buildings and 2048 only
for landmarks (the bake takes about four times longer).

## Modular pieces

For kits (wall segments, corners, floors, stairs), use a grid (2 m or 2.5 m), put the origin at
a corner or the center of the bottom edge consistently, and make matching edges identical so
pieces tile. Build shared parts as functions in one file or a small helper in `assets/_lib.ts`
(files starting with `_` are not listed as assets).

## Failure modes seen in practice

- **A post that covers a whole wall**: a post box spanning the full depth, intersected with
  the wall shell, colors an entire end wall.
- **Torn shingles**: a discontinuous sawtooth in `displace`.
- **188k triangles**: stone, plaster, and shingle noise in `displace`; moving it to `bump`
  gave 40k with the same look.
- **Beams across the door**: frame beams not clipped around openings; put the door in front
  (it protrudes further) or leave gaps.
