# Brief: towel-rack

## Role

A bathhouse prop for the Chibi Quest pack. It is a small wooden stand that holds towels. A player sees it
small, so it must read at 128 px.

## Size and place

- 0.62 m wide (X), 0.34 m deep (Z), 0.82 m tall (Y).
- It stands on y = 0 and it is centred on the Y axis.
- It faces +Z. The hanging towel faces the viewer.

## The one idea

A light wooden frame with 2 A-frame feet and a top rail, and one wide linen towel that hangs over the
top rail with a teal stripe near its hem. A small hand towel hangs from an iron peg on the side. The
towel breaks the outline of the frame.

## Parts

1. 2 A-frame feet: 4 legs that lean together, joined at the top.
2. A top rail, round and thick, between the 2 frame tops.
3. A lower rail, thinner, about 0.30 m above the floor.
4. The wide towel over the top rail: a soft slab with a fold over the rail and a wavy hem at about
   0.35 m.
5. A teal stripe on the towel hem, and a cream fringe.
6. An iron peg on the +X side, with a small folded hand towel.
7. A rope tie at the top rail and the leg joints.

## Colors

| Part | Color |
| --- | --- |
| Honey oak | `#b5814a` |
| Warm brown | `#8a5a35` |
| Pale cut wood | `#c9a06a` |
| Dark walnut | `#6b4226` |
| Linen cream | `#efe6d2` |
| Linen shade | `#d8ccb2` |
| Teal | `#4f8f8a` |
| Iron | `#4a4f55` |
| Rope | `#c9a06a` |

Value plan: the wood frame holds the dark values at the legs. The cream towel is the large light mass.
The teal stripe is the small accent.

## Materials

- Wood: roughness 0.82, metalness 0.
- Cloth: roughness 0.9, metalness 0.
- Worn iron: roughness 0.5, metalness 0.7.
- Rope: roughness 0.9, metalness 0.

## Checks

1. `./forge all <name>` exits 0 and prints no `warning:` line.
2. `out/<name>/<name>.glb` exists. `out/<name>/stats.json` names more than 0 triangles.
3. `out/<name>/render.png` and `out/<name>/sprites/preview.png` exist.
4. `node scripts/typecheck-asset.mjs <name>` exits 0.
5. The model bottom is within 5 mm of y = 0.
6. Look at `out/<name>/render.png`. The 4 views must show a towel stand, not a chair or a ladder.
7. Look at `out/<name>/sprites/preview.png`. The towel and the frame must stay apart at 128 px.
8. `./forge inspect <name> --fast` names no floating part and no buried part. The towel must touch the
   top rail and must not pass through the legs.

## Rules

- Write only the trial source that the orchestrator assigns: `assets/towel-rack-<label>.ts`. Set the
  `name` field to the file name without `.ts`, for example `towel-rack-b`.
- Set `reference` to `docs/bathhouse-mockups/towel-rack-mock.jpg`.
- Do not change any other file.
- Iterate with `./forge render <name> --fast` and look at the render. Then run `./forge all <name>` once.
- Keep the whole asset under 10,000 triangles.
- A clean, readable towel stand beats an ambitious broken one.
