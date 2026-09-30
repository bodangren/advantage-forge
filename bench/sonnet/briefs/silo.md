# silo (architecture/structure/silo) -> assets/silo.ts

A grain silo 2.4 m wide and 6 m tall: a round plank tower with three iron bands, a conical shingle roof with a ball finial, and a small arched hatch door at the base. Stand on y = 0, centered on Y, the door faces +Z. Bar 7/10 (structure).

Mockup: bench/overnight/refs/p1-village/silo-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Start file: /home/daniebo/forge-trials/ov-p1f-r2/silo/kimi-for-coding/ws/assets/silo.ts is an external trial of this asset (2,390 triangles, an accepted-looking render). Copy it to assets/silo.ts first, then run `./forge render silo --fast` and fix what the current tools reject (the API may have moved since 2026-09-28). Keep its design note and structure.

Palette (village scene): honey oak #b5814a planks with dark walnut #6b4226 seams; shingles warm brown #8a5a35; door frame and finial pale cut wood #c9a06a; iron bands #4a4f55 with #a8acb1 highlights (roughness 0.5, metalness 0.7). Wood roughness 0.82 to 0.85.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

What to check and improve on the trial:
1. The tower must bulge a little (a barrel profile, r 1.2 at the middle, r 1.14 at the ends) so it reads as staves, with 14 vertical plank seams in paint and bump.
2. The roof eave must overhang the tower by 0.25 m with a soft curled edge; shingle rows in paint and bump (about 9 rows).
3. The three iron bands sit at y 1.2, 2.7, 4.2 with a small buckle plate on the front of each.
4. The hatch door (0.7 m wide, 1.1 m tall) has a pale arched frame, a walnut leaf with two iron straps and a ring handle.
5. Add a small ladder of 8 rungs up the back (-Z) from y 1.5 to y 4.6, iron, so the back view has one feature.

Limits: whole asset under 6,000 triangles; `detail` 0.02 on the tower and roof, 0.012 on the door, bands, and ladder. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/silo.ts. Finish with one `./forge all silo`.
