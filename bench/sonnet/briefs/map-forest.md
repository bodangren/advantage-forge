# Forest map rework -> scripts/design-old-oak-clearing.mjs

Read `bench/sonnet/briefs/map-rules.md` first. Priority P0: target 7.5 of 10.

Mockup: `docs/forest-mockups/forest-quest_001.jpg`. Layout and zones: `docs/forest-mockups/README.md` and `docs/forest-mockups/map.md`.
Map source: the generator `scripts/design-old-oak-clearing.mjs`; run `node scripts/design-old-oak-clearing.mjs`
to write `scenes/old-oak-clearing.ts` and `docs/forest-mockups/map.md`. Scene name: `forest`.
Current shots (2026-10-02): `docs/forest-mockups/render-3q.png`, `docs/forest-mockups/render-top.png`.
Orchestrator score now: 6.0.

Faults, largest first:
1. There is no clearing. 25 border trees (13 oak, 12 pine) crowd the interior, and their canopies
   cover the campfire and most of the trail. The mockup's center is a wide open clearing of bare
   earth and grass ringed by trees. Keep the trees on the border rows and columns (README zones),
   pull them out of the clearing (columns 3 to 10, rows 2 to 7), and keep the trail in the open.
2. The ancient oak does not read as THE tree: other canopies of similar size stand beside it. Give
   it open space all around (no other tree within about 5 m) so its buttress roots and crown read.
3. The campfire is the warm focal accent by the stream (mockup bottom-left) and must be visible in
   the three-quarter shot: open its surroundings, add a log seat (fallen-log) and a stump beside it.
4. The roofed `well` is a hamlet piece and clashes with the wild site; remove it or replace it with
   a rock-cluster or boulder group.

Final shots (overwrite):
```
FORGE_SHOT_BASE=http://127.0.0.1:5232/hamlet.html node scripts/shoot-map.mjs docs/forest-mockups \
  'render-3q=scene=forest&clean&az=25&el=50&dist=32&tx=0&tz=0' 'render-top=scene=forest&clean&az=0&el=88&dist=36&tx=0&tz=0'
```
Also update `docs/forest-mockups/components.tsv` counts.
