# Brief: lily pad

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the week 6 lily pad for the song videos
(props, inventory section 5).
Date of the brief: 2026-11-18. The brief came from the maker role prompt of PM order 2026-11-17
(the lily pad after the week 3 set).

## The brief: assets/lily-pad.ts (name 'lily-pad')

Book (Storytime inventory section 5, monorepo 9255c2711): "lily pad | 6 | frog hops from it". The
book gives no size or colour: mark them "PM default, check against the book". The frog
(assets/frog.ts) must fit on it: read the frog's size from out/frog/stats.json if present (do not
rebuild the frog).

- A round, flat lily pad 0.40 m across, 0.02 m thick, lying flat on y = 0 (the water surface),
  centred, its notch facing +Z.
- The notch: a V cut from the rim to the centre, 30 degrees wide.
- The rim curls up a little: the outer 0.03 m rises 0.012 m, so the pad reads in the front view.
  The top surface has a gentle dish (centre 0.004 m lower than the rim start).
- Colours: top leaf green #5fa364, rim edge and underside a darker green #4f8f5a; 9 radial veins
  from the centre in #4f8f5a, 0.006 m wide, painted by extruded strokes through the top surface
  (AGENTS.md "Paint" recipe); roughness 0.45 (a wet leaf).
- One body, under 8,000 triangles, rated G. No flower, no frog, no water (the scene has the pond).

## Checks, in order

Every forge, cutout, and mech-check command runs only as
`HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`;
exit 75 = wait and retry; never playwright install; no --fast or inspect after the mech-check.

a. ONE call: `./forge render lily-pad --fast && ./forge inspect lily-pad --fast`; look once; fix at
   most twice.
b. ONE call: `mech-check lily-pad && ./forge cutout lily-pad --out out/chibi-sprouts/r1/props --ppm
   1024 --canvas 1024x1024 --views front,three-quarter && node scripts/cutout-check.mjs
   out/chibi-sprouts/r1/props && python3 scripts/review-cards.py out/prop-cards lily-pad`.
   mech-check "ok":true exit 0; cutout-check last line "result ok".

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a lily pad | Book row (Storytime inventory section 5 of `forge-inventory.md` at monorepo commit 9255c2711, columns: id "lily pad", week "6", note "frog hops from it") |
| Week | week 6 | The same row: week "6" |
| Use | the frog hops from it | The same row: "frog hops from it" |
| Width | 0.40 m across | PM default, check against the book |
| Thickness | 0.02 m | PM default, check against the book |
| Placement | flat on y = 0 (the water surface), centred, notch facing +Z | PM default, check against the book |
| Notch | a V cut from the rim to the centre, 30 degrees wide | PM default, check against the book |
| Rim curl | the outer 0.03 m rises 0.012 m | PM default, check against the book |
| Dish | the centre 0.004 m lower than the rim start | PM default, check against the book |
| Colour, top | leaf green #5fa364 | The book gives no colour. PM default, check against the book |
| Colour, rim edge and underside | darker green #4f8f5a | The book gives no colour. PM default, check against the book |
| Veins | 9 radial veins, 0.006 m wide, #4f8f5a | The book gives no vein count or colour. PM default, check against the book |
| Material | one wet leaf body, roughness 0.45, metalness 0 | PM default, check against the book |
| Frog fit | the frog (assets/frog.ts) must fit on the pad | `out/frog/stats.json`: bounds 0.347 m x 0.222 m at the feet, so the frog stands inside the 0.40 m pad with about 2 cm of leaf around the body |
| Geometry | one body, under 8,000 triangles, rated G | The common rule for the first prop batch (plan Phase 5 and the maker prompt) |

## Known differences

- The rendered pad is 0.400 m wide, 0.032 m tall at the top of the curled rim, and 0.393 m deep
  in Z (out/lily-pad/stats.json). The notch removes the rim at +Z, so the Z size stops at the
  30 degree cut edges. The disc is 0.02 m thick at the rim start; the curl adds the 0.012 m.
- The frog's feet (0.347 m x 0.222 m) leave about 26 mm of leaf at the widest point and touch the
  rim at the notch. The brief fixes the 0.40 m width, so the fit is a note for the scene, not a
  change here.
- The veins are painted, so they do not show in the vertex-color `--fast` render; they show in
  the textured build and in the cutout.
- The pad holds 3,812 triangles, under the 8,000 limit, in one body.
