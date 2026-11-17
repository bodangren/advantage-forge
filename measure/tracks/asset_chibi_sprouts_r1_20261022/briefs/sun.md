# Brief: sun

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the week 3 props for the song videos.
Date of the brief: 2026-11-17. The brief came from the maker role prompt of PM order 2026-11-17
(week 3 props).

## The brief as given to the maker (2026-11-17)

assets/sun.ts (name 'sun'). Book: W2 "one, big, bright, blue sky, happy face"; W3 "big, bright,
yellow, happy face". One asset serves both weeks. A thick disc 0.50 m across and 0.12 m deep
(rounded edge 0.03 m), facing +Z, with 10 rounded cone rays around the rim, each 0.10 m long, base
radius 0.035 m, all in the disc plane. The lowest ray tip touches y = 0. Colour yellow #f6c936 for
disc and rays, emissive #f6c936 at intensity 0.4, roughness 0.8. Happy face painted on the front:
2 dark brown (#3a2a1e) oval eyes 0.035 x 0.05 m, 0.07 m apart from centre each side, 0.04 m above
centre; a smile arc (#3a2a1e) radius 0.09 m, width 0.016 m, from 200 to 340 degrees, centred
0.01 m below centre; 2 soft pink (#f29a7a) cheek dots radius 0.03 m beside the smile. Paint the
face with an extruded profile through the front face (AGENTS.md "Paint" recipe).

## Common rules for all the week 3 props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

Source: Storytime inventory section 5, monorepo commit 9255c2711
(`git -C ../reading-advantage-monorepo show 9255c2711:measure/tracks/storytime_advantage_program_20261021/forge-inventory.md`).

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a big bright sun with a happy face | Inventory section 5, row "sun": "W2: one, big, bright, blue sky, happy face. W3: big, bright, yellow, happy face" |
| Weeks | weeks 2 and 3 | The same row: weeks "2, 3" |
| One asset | one asset serves both weeks | The same row: two lines, one in W2 and one in W3 |
| Face | a happy face | The same row: "happy face" in both weeks |
| Colour | yellow | The same row fixes yellow for W3 ("big, bright, yellow"). The hex #f6c936 is a PM default, check against the book |
| Size | 0.50 m across | PM default, check against the book |
| Size | 0.12 m deep | PM default, check against the book |
| Size | 0.03 m rounded edge | PM default, check against the book |
| Count | 10 rays | PM default, check against the book |
| Size | 0.10 m ray length | PM default, check against the book |
| Size | 0.035 m ray base radius | PM default, check against the book |
| Colour | dark brown #3a2a1e eyes and smile | PM default, check against the book |
| Colour | soft pink #f29a7a cheeks | PM default, check against the book |
| Finish | roughness 0.8, emissive #f6c936 at 0.4 | PM default, check against the book |

## Known differences

- The disc stands on the lowest ray tip, so it floats above the ground with its centre at
  y = 0.35 m. The inventory names no stand for the sun.
- The built sun measures 0.666 m wide, 0.699 m tall and 0.122 m deep, and holds 2,662 triangles
  (out/sun/stats.json). The brief asks for a 0.50 m disc; the rays add 0.20 m across.
- The cone's tip cap reaches 8 mm past the cone's tip point, so the tip point sits at 0.342 m
  from the centre and the lowest cap touches y = 0.
- The rays blend into the disc with a 0.032 m fillet, so they read as rounded rays and not as
  glued-on spikes.
- The smile looks ragged in the `--fast` vertex-colour render, because the mesh cells (0.008 m)
  are wider than the smile's 0.016 m stroke. The textured build paints it smooth.
