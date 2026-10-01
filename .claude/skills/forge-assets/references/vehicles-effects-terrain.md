# Vehicles, effects geometry, and terrain parts

These families have no worked example yet. Build them with the same process and the recipes
below; the closest examples are named for each.

## Vehicles (wagons, carts, boats, airships)

Closest examples: `treasure-chest.ts` (planks, iron fittings, hinged parts), `barrel.ts`.

- Real sizes: hand cart 1.5 m long, hay wagon 3 to 4 m, rowboat 3 to 4 m, longship 15 to 20 m
  (build large vehicles at real size and raise `detail` to 0.02 to 0.04).
- Hulls and bodies: boats are a `revolve` or an extruded profile lofted by `scale` along the
  length, or several ellipsoids blended and cut flat on top with a half space; hollow them with
  `shell` or by subtracting an inner copy. Planking is `paintFn` plus `bump`, following the
  hull's length.
- Wheels: a torus rim, a cylinder hub, and spokes (thin boxes rotated around the axle, at least
  two cells thick), in iron-banded wood. Give each wheel its own bone at the axle so a `roll`
  clip can rotate it (`rotate: [360 * phase, 0, 0]` around the axle axis; build wheels facing
  along the axle so that is X).
- Sails, banners, canopies: an `extrude` of a curved outline with a gentle `bend`, cloth colors
  with a painted stripe or emblem, and a `sway` or `billow` clip on a bone at the mast.
- Silhouette: a vehicle reads by its big masses (hull, wheels, sail). Exaggerate them: bigger
  wheels, a taller sail, a curled prow.

## Effects geometry (slash arcs, fireballs, magic circles, mist)

Effects are meshes that a game draws with glow or transparency. Make them bold and simple.

- Materials: `emissive` equal to the color with `emissiveIntensity` 1.5 to 3; `opacity` below 1
  (0.4 to 0.8) for mist, smoke, and energy; roughness about 0.3.
- Slash arc: an `extrude` of a crescent (`profile.arc` with a large width that tapers, or a
  polygon of a crescent) with a `bend`, thin at the tips, painted from a hot core color to a
  darker rim with `paintFn` along the arc.
- Fireball and orbs: a sphere with large low-frequency `displace` for flame lobes, a smaller
  brighter core as a second body, and a trailing cone of blobs behind; hot yellow core, orange
  body, red edge.
- Magic circles and runes: a flat torus plus extruded glyph polygons, emissive, lying on
  `y = 0.01`; animate with a `spin` clip (`rotate: [0, 360 * phase, 0]`).
- Mist and clouds: overlapping flattened ellipsoids with smooth blends and fbm `displace`, very
  light value, `opacity` 0.4 to 0.6.
- Effects are usually animated: a root bone with `scale` pulses (`1 + 0.1 * wave(p)`), `spin`,
  or `move`. Keep loops seamless.
- Pixel-art note: sprites have binary alpha, so transparent effects render as solid shapes in
  sprites; give them strong value steps so they still read.

## Terrain parts (ground tiles, roads, rivers, cliffs, slopes)

Closest examples: `cottage.ts` (stone with `noise.worley`, bump), `oak-tree.ts` (moss, noise).

- Build on a **grid**: tiles are exactly 2 m x 2 m (or the grid the set uses), origin at the
  tile center at ground level, top surface at `y = 0`, with edges that match the neighbors so
  tiles repeat without seams. Keep noise and paint continuous across tile borders by using
  world-space noise (`noise.fbm(x, y, z)`), and keep edge heights exactly equal on all tiles.
- A ground tile is a 0.3 m slab: a box from `y = -0.3` to `y = 0` (make it 2 mm larger than the
  tile so neighbours never show a gap), whose top gets gentle `displace` (keep it at 0 near the
  edges with a falloff so edges match) and `paintFn` for grass, dirt, or stone. Paint the sides
  as the mockups show: a lip of the top material over soil, sandstone, or a stone foundation.
  Do not add a flat `k.add` plane on top: it bakes dark blocks in a textured build. Recipe and
  worked example: `bench/sonnet/briefs/ground-slab-recipe.md`, `assets/grass-ground.ts`.
- Roads and paths: paint a band (`paintWhere` with a box or an extruded path profile) in a dirt
  or cobble color, slightly lowered, with pebbles as small spheres or Worley cobbles in `bump`.
  Make straight, corner, T, and cross pieces from one shared function.
- Rivers and water edges: a lowered channel, banks as smooth blends, a separate water body with
  low roughness (0.05 to 0.1), slight `opacity` (0.8), and a blue-green gradient from the bank to
  the middle.
- Cliffs and slopes: stacked, faceted rock slabs (spheres intersected with tilted half spaces,
  then `round`), strata as horizontal paint bands, grass tufts on the top edge.
- Use `detail` 0.02 to 0.04 for 2 m tiles and keep fine texture in `bump`; a tile should be
  2k to 10k triangles.

## Wildlife (deer, ravens, horses)

Use `references/creatures.md`, but lean toward realism of silhouette and calmer shape language:
correct leg joints (a deer's hind leg bends back at the hock), long necks and ears as
recognition features, and muted natural palettes with a lighter belly.
