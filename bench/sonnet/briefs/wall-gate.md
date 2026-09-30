# wall-gate (architecture/structure/wall-gate) -> assets/wall-gate.ts

A city wall gate 4 m wide, 4 m tall, 1 m deep: a stone gatehouse with an arched opening, a raised iron portcullis, crenellations on top, and two hanging banners. Stand on y = 0, centered on Y, the banners face +Z. Bar 7/10 (structure).

Mockup: bench/overnight/refs/p1-village/wall-gate-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Start file: /home/daniebo/forge-trials/ov-p1f-r2/wall-gate/kimi-for-coding/ws/assets/wall-gate.ts is an external trial of this asset (an accepted-looking render). Copy it to assets/wall-gate.ts first, then run `./forge render wall-gate --fast` and fix what the current tools reject (the API may have moved since 2026-09-28). Keep its design note and structure.
Pattern file: assets/city-wall.ts (accepted 2026-09-29) sets the stone style for this wall; read it and reuse its stone paint and block bump so the gate and the wall match end to end.

Palette (village scene): the city-wall stone (the same colors as assets/city-wall.ts); iron portcullis #4a4f55 with #363a3f shadow (roughness 0.5, metalness 0.7); banner leaf green #5cb85c with a straw #e0bb60 tail band; banner poles honey oak #b5814a with gold #d4a93a ball ends.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

What to check and improve on the trial:
1. The opening must go all the way through (2 m wide, 3 m tall at the arch top) so the back view shows daylight, not a dark plate.
2. The portcullis is raised to two thirds of the arch: 7 vertical bars with pointed tips and 2 cross bars, a body of its own so it can lower later (`k.group('portcullis', { at: [0, 3.2, 0] }, ...)`).
3. The crenellations: 5 merlons on the front and back edges, a walkway between them, and a small stair block at one end on the back.
4. The stone: block courses in bump, a stone color variation in paint, and a pale arch ring of 11 voussoir blocks around the opening.
5. The banners hang flat on both sides of the arch, 0.5 m wide, with a swallow tail; the side view must show them clear of the wall by 0.08 m.
6. The ends of the gate are flat and square at x = -2 and x = 2 so a city-wall segment butts against them.

Limits: whole asset under 8,000 triangles; `detail` 0.02 on the stone, 0.012 on the portcullis, banners, and poles. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/wall-gate.ts. Finish with one `./forge all wall-gate`.
