# Brief: wash-basin

## Role

A bathhouse prop for the Chibi Quest pack. It is a wash basin that stands on a bench or on the floor. A
player sees it small, so it must read at 128 px.

## Size and place

- 0.42 m across (X), 0.40 m deep (Z), 0.17 m tall (Y).
- It stands on y = 0 and it is centred on the Y axis.
- It faces +Z. The dipper sits on the +Z side.

## The one idea

A wide, shallow staved wooden bowl with a thick rim, 2 dark iron hoops, and still bright water inside. A
chunky wooden dipper leans across the rim. The dark hoops frame the bright water.

## Parts

1. The bowl: 10 fat staves in a shallow taper, wider at the rim than at the foot.
2. A thick rim ring, with the sawn stave tops that stand a little proud.
3. 2 iron hoops that hug the staves.
4. A foot ring, so the bowl stands with no gap.
5. The water: one flat disc about 3 cm below the rim.
6. The dipper: a short handle and a small cup, resting across the rim on the +Z side.
7. A stave seam line and wood grain in paint and `bump`.

## Colors

| Part | Color |
| --- | --- |
| Honey oak | `#b5814a` |
| Warm brown | `#8a5a35` |
| Pale cut wood | `#c9a06a` |
| Dark walnut | `#6b4226` |
| Iron | `#4a4f55` |
| Iron shade | `#363a3f` |
| Iron highlight | `#a8acb1` |
| Water | `#3fa8c8` |
| Water highlight | `#7fd6e8` |

Value plan: the dark iron hoops and the dark bowl foot hold the low values. The bright water is the
focal point. The pale rim catches the light.

## Materials

- Wood: roughness 0.82, metalness 0.
- Worn iron: roughness 0.5, metalness 0.7.
- Water: roughness 0.1, metalness 0.
- Keep iron `bump` small. A large iron bump makes wavy reflections.

## Checks

1. `./forge all <name>` exits 0 and prints no `warning:` line.
2. `out/<name>/<name>.glb` exists. `out/<name>/stats.json` names more than 0 triangles.
3. `out/<name>/render.png` and `out/<name>/sprites/preview.png` exist.
4. `node scripts/typecheck-asset.mjs <name>` exits 0.
5. The model bottom is within 5 mm of y = 0.
6. Look at `out/<name>/render.png`. The 4 views must show a basin with water, not a barrel or a plate.
7. Look at `out/<name>/sprites/preview.png`. The water and the rim must stay apart at 128 px.
8. `./forge inspect <name> --fast` names no floating part and no buried part. The dipper must touch the
   rim.

## Rules

- Write only the trial source that the orchestrator assigns: `assets/wash-basin-<label>.ts`. Set the
  `name` field to the file name without `.ts`, for example `wash-basin-a`.
- Set `reference` to `docs/bathhouse-mockups/wash-basin-mock.jpg`.
- Do not change any other file.
- Iterate with `./forge render <name> --fast` and look at the render. Then run `./forge all <name>` once.
- Keep the whole asset under 8,000 triangles.
- A clean, readable basin beats an ambitious broken one.
