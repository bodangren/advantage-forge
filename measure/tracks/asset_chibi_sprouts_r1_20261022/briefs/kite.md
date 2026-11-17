# Brief: kite

Track: asset_chibi_sprouts_r1_20261022, Phase 5, first prop batch of 15 new props.
Date of the brief: 2026-11-17 18:04. The brief came from the maker role prompt of commit 1dcca329.
No track file held the brief before this file. The audit of 2026-11-17 (F-D5) asked for this file.

## The brief as given to the maker (2026-11-17 18:04)

A paper kite, 0.5 m tall, 0.36 m wide, standing on its two lower wing tips, tilted back about 10
degrees, a tail of 3 cloth bows on the ground behind. Red (#c0503c) sail, cream (#efe6d2) cross spars
and edge band, wooden spars (#8a5a35) on the front, a string loop at the top. Sail 0.01 m thick or
more.

## Common rules for all five props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a paper kite | Inventory section 5, `forge-inventory.md` at 9255c2711: W2 "two kites, one red and one yellow, high in sky"; W7 "one red-and-yellow kite, flies high over green park". The track spec Props row lists "kite" among the 15 new props |
| Size | 0.5 m tall | PM default, check against the book |
| Size | 0.36 m wide | PM default, check against the book |
| Size | 0.01 m thick sail or more | PM default, check against the book |
| Angle | tilted back about 10 degrees | PM default, check against the book |
| Part | a tail of 3 cloth bows | PM default, check against the book. The inventory names no tail |
| Colour | red #c0503c sail | The inventory fixes red for the W2 kite. The hex is a PM default, check against the book. Nearest Chibi Quest palette entry: the accent "flowers #e0533d" in `.claude/skills/forge-assets/references/materials-and-color.md` |
| Colour | cream #efe6d2 spars and edge band | PM default, check against the book. Nearest Chibi Quest palette entry: the light rule "#f2eadb-ish lights" and the trim #efe6d1 in the same file |
| Colour | wooden spars #8a5a35 | PM default, check against the book. Nearest Chibi Quest palette entry: the rustic wood #7d4a27 in the same file |
| Part | a string loop at the top | PM default, check against the book |

## r2 (book colours, 2026-11-18)

PM order 2026-11-18: the group 2 reworks to match the book (Storytime inventory section 5,
monorepo 9255c2711). Book lines: W2 "two kites, one red and one yellow, high in sky"; W7 "one
red-and-yellow kite, flies high over green park".

The sail outline, the spars, the binding cross and the string loop stay. The changes are:

- The cross spars cut the sail into four quarters. Two colour slots: `sailA` (the top-left and
  bottom-right quarters) and `sailB` (the other two). In the front view world -X is the viewer's
  left, so the top-left quarter is x < 0.
- Presets: redyellow #d9443a and #f2c230 (default; W7); red #d9443a and #d9443a; yellow #f2c230
  and #f2c230 (W2 places one red kite and one yellow kite). The edge band and the binding cross
  stay cream #efe6d2 in every preset; the bow knots stay red #c0503c.
- Flying pose: the kite stands upright, so the 10 degree backward tilt is gone. The tail hangs
  0.45 m down below the sail's bottom notch in a gentle S curve, with the same 3 cloth bows. The
  lowest bow touches y = 0 and nothing else touches the ground, so the sail floats with its lower
  wing tips at y = 0.42.

The kite measures 0.359 x 0.930 x 0.041 m and holds 5,150 triangles.

## Known differences

- The inventory wants the kite in the sky. The kite now flies: the sail floats upright at 0.42 m
  and only the lowest tail bow touches the ground at y = 0.
- The inventory wants two kites for W2, one red and one yellow. One source serves both through
  the `red` and the `yellow` presets. Placing two kites in the sky is the scene's job.
- The built kite measures 0.359 m wide, 0.930 m tall with the tail, and 0.041 m deep. It matches
  the brief for the sail and the tail length.
- The inspect still reports the warning "the side silhouette is very thin compared with the
  front". The sail is a flat sheet 14 mm thick; the brief allows 10 mm. The warning is expected
  for a paper kite.
- The built kite holds 5,150 triangles. It is under the limit of 8,000.
