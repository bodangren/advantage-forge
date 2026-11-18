# Brief: towel-stack

## Role

A bathhouse prop for the Chibi Quest pack. It is a background prop for a shelf board. A player sees it
small, so it must read at 128 px.

## Size and place

- 0.30 m wide (X), 0.24 m deep (Z), 0.22 m tall (Y).
- It stands on y = 0 and it is centred on the Y axis.
- It faces +Z.
- The shelf board is 0.3 m deep. The footprint must fit that depth.

## The one idea

Three folded towels in one stack, with a slight lean and one folded corner that breaks the outline. The
stack must read as soft cloth against the hard wood of the shelf.

## Parts

1. The bottom towel: the largest, a flat folded slab with 2 rolled folds at its front edge.
2. The middle towel: a teal slab, a little narrower, turned about 8 degrees against the bottom towel.
3. The top towel: a small terracotta towel, turned the other way, with one folded corner that hangs over
   the stack edge.
4. A stitched band on the top towel, and 2 seam lines on the middle towel.
5. A soft dent in the middle of the stack, so the cloth reads as pressed.

## Colors

| Part | Color |
| --- | --- |
| Linen cream | `#efe6d2` |
| Linen shade | `#d8ccb2` |
| Teal | `#4f8f8a` |
| Teal shade | `#3d6f6b` |
| Terracotta | `#b5654a` |
| Terracotta shade | `#8e4a36` |
| Stitch thread | `#f3ead8` |

Value plan: the cream towel is the light mass, the teal is the mid mass, and the terracotta is the small
accent. The 3 colors must differ in value, so the stack reads at 128 px.

## Materials

- Cloth: one body with roughness 0.9 and metalness 0.
- The seams, the stitch band, and the fold shade are paint or `bump`, not separate bodies.
- Use a soft `displace` of no more than 3 mm for the cloth wrinkles. Keep the fine weave in `bump`.

## Checks

1. `./forge all <name>` exits 0 and prints no `warning:` line.
2. `out/<name>/<name>.glb` exists. `out/<name>/stats.json` names more than 0 triangles.
3. `out/<name>/render.png` and `out/<name>/sprites/preview.png` exist.
4. `node scripts/typecheck-asset.mjs <name>` exits 0.
5. The model bottom is within 5 mm of y = 0.
6. Look at `out/<name>/render.png`. The 4 views must show a towel stack, not a box or a cake.
7. Look at `out/<name>/sprites/preview.png`. The 3 colors must stay apart at 128 px.
8. `./forge inspect <name> --fast` names no floating part and no buried part.

## Rules

- Write only the trial source that the orchestrator assigns: `assets/towel-stack-<label>.ts`. Set the
  `name` field to the file name without `.ts`, for example `towel-stack-a`.
- Set `reference` to `docs/bathhouse-mockups/towel-stack-mock.jpg`.
- Do not change any other file.
- Iterate with `./forge render <name> --fast` and look at the render. Then run `./forge all <name>` once.
- Keep the whole asset under 8,000 triangles.
- A clean, readable towel stack beats an ambitious broken one.
