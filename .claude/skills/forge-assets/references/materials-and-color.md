# Color, value, and materials

## Value first

Decide light, mid, and dark areas before hues. Squint at the render (or look at the 128 px
sprite): the focal point should have the strongest contrast, and big areas should sit in one
value band so they read as one shape. If everything is mid-value, the asset looks flat; if
everything contrasts, nothing stands out.

## Palettes

Use 3 to 5 main colors, 60/30/10: a dominant color, a secondary color, and a small accent at the
focal point. Take shadows toward a darker, more saturated, slightly shifted hue (warm objects:
toward red or brown; cool objects: toward blue), not toward gray. Avoid pure black (#000) and
pure white (#fff); use #1a1410-ish darks and #f2eadb-ish lights.

Starting palettes (sRGB hex). Adjust, do not copy blindly.

| Theme           | Dominant                   | Secondary              | Accent               |
| --------------- | -------------------------- | ---------------------- | -------------------- |
| Rustic village  | plaster #ece2cc, wood #7d4a27 | roof #b35a3c, stone #8d8a82 | flowers #e0533d, #f2c14e |
| Guard / soldier | tunic #2a7aa2, steel #626468 | leather #7a4827, trim #efe6d1 | scarf #16786f, gold #caa24a |
| Forest          | leaf #4f8a3a, dark #2f5a2a  | bark #6b4a33           | light leaf #9cc45a, mushroom #d9483b |
| Wild beast      | fur #6e3f28, dark #3c2116   | belly #a87650          | eyes #ff5a2a, tusk #efe4c9 |
| Dungeon         | stone #5b5d63, moss #4d6b3a | iron #3d4047, wood #4e2c13 | torch #ffb347, gem #35c2d6 |
| Treasure        | wood #7d4a27, iron #3d4047  | gold #d9a93a           | gem #35c2d6          |
| Spooky          | purple-gray #4b4459, bone #d8cfb8 | moss #5f6b3c     | ghost green #7dffb0 (emissive) |
| Desert          | sand #d9b27c, clay #b8633f  | cloth #e8dcc2          | turquoise #2fb5a9    |
| Frost           | ice #b9d9ea, snow #eef3f7   | stone #6f7d8a          | crystal #6fd0ff (emissive) |

## Material values

| Material                 | roughness   | metalness | Notes                                            |
| ------------------------ | ----------- | --------- | ------------------------------------------------ |
| Skin                     | 0.5 to 0.6  | 0         | warm base, pink blush, slightly lighter cheeks   |
| Hair, fur                | 0.7 to 0.9  | 0         | darker at the roots/underside                    |
| Cloth                    | 0.8 to 0.9  | 0         | trims lighter or contrasting                     |
| Leather                  | 0.6 to 0.7  | 0         | darker at edges and straps                       |
| Wood                     | 0.75 to 0.9 | 0         | boards with gaps, grain, per-board tint          |
| Stone                    | 0.85 to 0.95| 0         | worley cells, mortar, moss                       |
| Plaster                  | 0.95        | 0         | very light noise, keep plain                     |
| Iron (worn)              | 0.5 to 0.6  | 0.7       | dark; noise on metal shows strongly              |
| Steel (polished)         | 0.25 to 0.35| 1         | light; a darker center strip on blades           |
| Gold, brass              | 0.3         | 1         | the classic accent                               |
| Painted metal (helmets)  | 0.45 to 0.5 | 0.1 to 0.2| satin, reads as sturdy                            |
| Gems, glass              | 0.08 to 0.12| 0 to 0.3  | `flat: true` for gems, small `emissive`           |
| Horn, bone, ivory        | 0.35 to 0.5 | 0         | paler tips via `paintFn`                          |
| Glowing parts            | 0.2         | 0         | `emissive` = color, `emissiveIntensity` 1.5 to 2.5 |

## Paint recipes

- **Gradient**: `paintFn((x, y, z, base) => mixRgb(dark, light, clamp((y - y0) / h)))`.
- **Patches and variation**: mix toward a second color by `noise.fbm(x * f, y * f, z * f)`;
  frequency `f` sets patch size (3 = big patches, 30 = speckle).
- **Planks and boards**: index `Math.floor(v / size)`, dark line near `v % size`, tint by
  `noise.random(index, seed)`.
- **Stones and cells**: `noise.worley(x * s, y * s, z * s)`: mortar where `f2 - f1 < 0.12`,
  tint by `id`.
- **Stripes and bands**: `paintWhere(sdf.halfSpace(...))` or `paintWhere(sdf.box(...))`.
- **Marks through a surface**: extruded 2D profiles (`profile.arc`, `profile.polygon`) as
  stencils, pushed through the surface along its normal direction.
- **Soft blush or glow areas**: `paintWhere(region, color, soft)` with `soft` 0.01 to 0.03.
- Paint and `bump` often share a noise function, so dark grooves line up with relief.
