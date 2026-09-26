# Items (weapons, tools, potions, pickups, shields)

Worked example: `assets/knight-sword.ts` (lens-section blade with a fuller, curved crossguard
with `bend`, grip with a spiral wrap in `bump`, gem pommel).

## Design first

Items are seen in two ways: in a character's hand (small, in motion) and as an icon or pickup
(large, static). Design for both: a **bold silhouette** that reads as an icon, and **one accent**
(a gem, a glowing rune, a colored grip) that reads in the hand.

Exaggerate the functional part: an axe head bigger than realistic, a hammer head chunky, a
potion bottle round with a tall neck, a shield with a big central boss. Fantasy items often
carry the faction's colors and one motif (a crest, a leaf, a flame).

Real sizes: sword 0.9 to 1.1 m, dagger 0.3 to 0.4 m, axe 0.6 to 0.9 m, staff 1.5 to 1.8 m,
round shield 0.6 to 0.8 m, potion 0.12 to 0.2 m, coin 0.03 m, key 0.1 m.

Orientation: stand long items upright on `y = 0` with the grip low, and the flat side facing
+Z (the front view shows the flat). For attaching to a character later, note where the grip
center is in the design note.

## Construction recipes

- **Blades**: an extruded outline (straight edges tapering to a point) intersected with a
  **lens cross-section** made of two big upright cylinders, so the edges are sharp-ish and the
  center is thick. Fuller: a flattened capsule subtracted from both faces (`mirror('z', 0)`).
  Steel: metalness 1, roughness 0.25 to 0.35, a slightly darker painted center strip.
- **Guards and bars**: a rounded box bent with `.bend(k)` so the tips sweep toward the blade,
  with spheres on the ends; gold or bronze.
- **Grips**: a cylinder with a spiral wrap in `bump`
  (`0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 160))`).
- **Axe and hammer heads**: extruded profiles with `radius` rounding, `displace` a little for a
  forged look, a darker edge painted along the cutting edge.
- **Shields**: a slightly domed disc (`sphere` intersected with a slab), a rim torus, a boss
  sphere, painted heraldry with extruded stencils.
- **Potions and bottles**: a revolved profile with a smooth body, neck, and lip; glass as low
  roughness and a saturated liquid inside (a smaller revolve) with a faint `emissive`; a cork.
- **Gems**: a box rotated on two axes intersected with a sphere, `flat: true`, roughness 0.1,
  a small `emissive` in the same color so they sparkle in sprites.

## Thin parts

Items are small and thin, which is where meshing struggles. Use `detail` 0.002 to 0.004,
keep every part at least two cells thick (a blade 16 mm thick needs cells of at most 8 mm; its
tip will still thin out), and prefer slightly thicker-than-real blades and handles: they read
better at game size too.

## Failure modes seen in practice

- **Faceted reflections on metal** in `--fast` renders: normal; the textured build's normal map
  smooths it. Lower `maxError` on that body if it persists.
- **Disappearing tip or edge**: thinner than two cells; lower `detail` for that body.
- **Icon that does not read**: the silhouette is a plain line; widen the guard, enlarge the
  pommel or head, add the accent color.
