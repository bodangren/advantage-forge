# Sample map rework: shared rules

You improve one Chibi Quest sample map so that it matches its mockup. A map is a list of
placements (`Place`: `asset`, `at` [x, y, z] in meters, `yaw` degrees around Y with 0 facing
south (+Z), optional `scale`). The viewer loads `out/<asset>/<asset>.glb` for each placement.
North is -Z, east is +X. Ground tiles are 0.3 m slabs with the walkable top at y = 0; props
and characters stand at y = 0 unless they sit on a surface.

## What you may edit

- The map source named in your brief. For a generated map, edit the generator
  `scripts/design-<map>.mjs`, run `node scripts/design-<map>.mjs`, and never edit the generated
  `scenes/<map>.ts` by hand.
- The component list `docs/<env>-mockups/components.tsv`: set each count to the final placement.
- Nothing else unless your brief names it. Never edit `src/`. Never commit or stage.

Use only existing assets (`ls assets/`). Each asset needs a built GLB in `out/<name>/<name>.glb`.
If the map needs an asset that does not exist, place nothing for it and name it in the report.

## Shots (the scene server runs on port 5232)

```bash
FORGE_SHOT_BASE=http://127.0.0.1:5232/hamlet.html node scripts/shoot-map.mjs <outdir> \
  '3q=scene=<scene>&clean&az=35&el=44&dist=19&tx=0&tz=0' 'top=scene=<scene>&clean&az=0&el=86&dist=17&tx=0&tz=0'
```

Your brief gives the exact views. A shot takes about one minute; the script prints
`shot <name> <N> pieces.` and any page error (a 404 is a missing GLB). Write work shots to
`/tmp/claude-1000/maps-<scene>/`. When you finish, shoot the final views into
`docs/<env>-mockups/render-<view>.png` (the paths in your brief).

## How to work

1. Read the brief, the mockup image, the map source, and the construction or README file.
2. Look at the current shots in the brief (do not shoot them again).
3. Plan all changes on paper first: zones, the focal object, paths, then dressing.
4. Make the changes in one pass, then shoot. Fix the largest remaining difference, then shoot again.
5. Check that nothing floats, nothing sinks into a wall or another object, and no character or
   prop stands outside the map edges.

Budget: at most 6 image looks in total (the mockup and the given shots count), and about 35 tool
calls. Stop when the map reaches the target or the budget ends.

## Report

The files you changed, the final piece count, your score of 10 against the mockup (the target
is 7.5; record it honestly), the three largest remaining differences, any missing asset, and the
number of image looks.
