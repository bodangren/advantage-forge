# Brief: duck

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the white duck for the song videos of weeks 2
and 6 (props, inventory section 5).
Date of the brief: 2026-11-17. The brief came from the maker role prompt of PM order 2026-11-17
(duck first).

## The brief: assets/duck.ts (name 'duck')

- A chibi white duck for the Chibi Sprouts song videos (weeks 2 and 6). One asset serves both
  weeks. Rated G, friendly, closed smiling beak.
- Build it on the bird kind exactly as assets/chicken.ts does: read assets/parts/bird-kind.ts and
  assets/chicken.ts, copy the chicken structure, and change only the options and the shapes this
  brief names. Keep the bird kind's skeleton and clips (walk and idle as the kind gives them).
- Size: 0.30 m tall to the top of the head, about 0.32 m long nose to tail. Stands on y = 0 on its
  two feet, faces +Z, centred.
- Body: a round, plump white body (#f4f1ea), a short upturned tail point, wings folded flat on
  the sides with a light grey-white shade (#dcd8cf) on the wing edges.
- Head: round, white, on a short thick neck. Eyes: 2 black dots (#1e1a18) with a small white
  catch-light, set on the sides toward the front so they read in the front view.
- Beak: a flat, broad duck bill (not a pointed chicken beak), orange (#e8892c), closed, slightly
  smiling line (#b8621c).
- Legs and feet: short orange (#e8892c) legs and webbed feet (3 toes joined by web), flat on
  y = 0.
- No comb, no wattle (remove the chicken's). Under 8,000 triangles. One body per material.

## Checks, in order

Every forge, render, animate, and mech-check command runs only as
`HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`;
exit 75 = wait and retry; never playwright install; batch commands to save steps.

a. `./forge render duck --fast`; look at out/duck/render.png: a duck, not a chicken (flat bill,
   no comb). Fix geometry, not design.
b. `./forge inspect duck --fast`: no floating part, no buried part.
c. `./forge check duck`: ends with "result ok" if the command applies.
d. `node measure/runs/asset_hy4_maker_trial_20261116/mech-check.mjs duck`: "ok":true, exit 0
   (it runs forge all).
e. `./forge cutout duck --out out/chibi-sprouts/r1/props --ppm 1024 --canvas 1024x1024 --views
   front,three-quarter`, then `node scripts/cutout-check.mjs out/chibi-sprouts/r1/props`: last
   line result ok.
f. `python3 scripts/review-cards.py out/prop-cards duck=walk`.

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a chibi white duck | Inventory section 5 of `forge-inventory.md` at monorepo commit 9255c2711, row "duck" (columns: id "duck", weeks "2, 6", count "5 (3)"): "white with an orange beak in both weeks since Workbooks b32ffed (one render; W2: three walking in a row; W6: one by a pond, one with the cat and frog)" |
| Weeks | weeks 2 and 6 | The same row: weeks "2, 6", and "in both weeks" |
| One asset | one asset serves both weeks | The same row: "one render", and the section rule "Ducks and birds have one look across weeks since Workbooks b32ffed" |
| Size | 0.30 m tall to the top of the head | PM default, check against the book |
| Size | about 0.32 m long nose to tail | PM default, check against the book |
| Colour | white body #f4f1ea | The row fixes white ("white with an orange beak"). The hex is a PM default, check against the book. Nearest Chibi Quest palette entry: the light rule "#f2eadb-ish lights" in `.claude/skills/forge-assets/references/materials-and-color.md` |
| Colour | light grey-white #dcd8cf on the wing edges | PM default, check against the book |
| Colour | black eye dots #1e1a18 | PM default, check against the book |
| Colour | orange bill #e8892c | The row fixes orange ("orange beak"). The hex is a PM default, check against the book. Nearest Chibi Quest palette entry: the accent "gold #e8a02c" in the same file |
| Colour | smile line #b8621c | PM default, check against the book |
| Colour | orange legs and feet #e8892c | PM default, check against the book. The row names orange for the beak only |
| Shape | a flat, broad duck bill, not a pointed chicken beak | PM default, check against the book |
| Shape | webbed feet, 3 toes joined by web | PM default, check against the book |
| Shape | a short upturned tail point | PM default, check against the book |
| Shape | no comb, no wattle | PM default, check against the book |
| Geometry | under 8,000 triangles | The common rule for the first prop batch (plan Phase 5 and the maker prompt) |

## Known differences

- smile line removed: does not read. The painted seam (#b8621c) did not show in the textured close-up
  of the bill (0.075 m focus, `forge render duck --focus 0,0.245,0.12,0.075`), so the bill is plain
  orange and closed. The maker role prompt of 2026-11-17 named this removal.
- The built duck measures 0.259 m wide, 0.300 m tall to the top of the head, and 0.327 m long from
  the bill to the tail (out/duck/stats.json). The brief asks for 0.30 m tall and about 0.32 m long.
  It holds 7,526 triangles, under the 8,000 limit.
- The bird kind splits one material across several bodies. White is on `body` and `tail-fan`;
  orange is on `legs`, `bill`, and `webs`. The brief's "one body per material" is therefore not
  literal for this asset; the kind's body plan is kept, as the brief asks ("copy the chicken
  structure").
- The kind's pointed `beak` and `jawBeak` bodies are dropped by a small build wrapper in
  `assets/duck.ts`; `extra` builds the broad bill instead. A hidden body would be reported as
  buried by `forge inspect`.
- No duck mockup exists in `docs/wildlife-mockups/`, so the asset carries no `reference` image. The
  bird kind declares `reference` as required, so `assets/duck.ts` gives the kind without that field
  and records the reason in a comment.
- The eye catch-light is one white sphere of radius 0.0025 m on each eye (the owner's decision of
  2026-11-17): the kind's painted glint does not survive the coarse vertex-color mesh at this size.
  `forge inspect duck` reports the part as "barely visible (under 0.3% of the silhouette in every
  view)" at its 512 px views. It is not floating and not buried; the owner fixed the radius.
- The short thick neck is `neckScale 1.15`. At 2.0 the neck swallowed the head and the painted eyes
  fell on the neck, not the skull.
- The wings use the kind's paddle at `wingRest -45`, `wingTurn 68`, `wingOut 0.03`. They read as
  folded wings at 1024 px; at 128 px they are a smooth pale mass (a weak point in the handoff).

## F1 and F2 (PM order 2026-11-17)

F1, F2 fixed (2026-11-17, PM).

- F1, the wings stood 34 mm out from the body and read as arms in the front and back views. The
  wing options changed: `wingTurn 68 -> 95`, `wingScale 0.62 -> 0.26`, `wingOut 0.03 -> 0.05`,
  `wingRest -45` kept. The wing now lies flat on the body's side with its tip toward the tail. The
  measured protrusion beyond the body's surface is 5.8 mm at the worst point; the limit is 8 mm.
  The measuring tool is `measure/runs/asset_chibi_sprouts_r1_20261022/wing-probe.ts`: it rebuilds
  the kind's trunk, raycasts its real smooth-union surface, and reports the worst protrusion for
  each set of options.
- F2, the catch-light was doubled and too large. The kind's painted glint is off (`glint: 0`) and
  the white sphere radius is 0.0025 m (was 0.004 m). One glint shows on each eye.
- The dot sits on the merged body's surface, not on the skull: the kind's smooth union pulls the
  surface in from the skull by up to 5.5 mm, so the ray hits `sdf.smoothUnion(0.05, b.trunk,
  b.skull)`. The dot's mesh cells are 0.002 m, because a 0.0025 m sphere needs cells under its
  radius.
- The wings are subtle: `forge inspect duck` reports `coverts` at 0.9% of the silhouette in the
  side view and `flight` as "barely visible". The wing reads as a fold, not as an arm.

