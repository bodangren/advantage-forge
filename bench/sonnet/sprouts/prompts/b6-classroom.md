# Scene task: the week 1 classroom (Chibi Sprouts)

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_chibi_sprouts_r1_20261022/spec.md
("Changes after the start": the week 1 format, item 3), src/scene/main.ts (the hamlet page: `?scene=`,
`clean`, `az`, `el`, `dist`, `tx`, `tz`, the interior and dark sets), scenes/maps/school.ts (an
existing school map) and its generator scripts/design-school.mjs, scripts/shoot-map.mjs, and
bench/sonnet/sprouts/method.md (the delivery). Never run git, not even stash or checkout. `pnpm` is a slow shim: run
node_modules/.bin tools directly.

Goal: one 1920 x 1080 opaque background PNG of a kindergarten classroom with no people, and one
transparent cut-out PNG of a rug, for a 2D compositor. Children (about 0.85 m tall, rendered
separately) are placed by the compositor with their feet in the floor area at rows about 700 to
850 of the 1080 image, so the floor there is open, flat, and lit, and the camera is a
three-quarter or near-front view at about child eye height (a low elevation of about 12 to 18
degrees), with the back wall filling the top of the frame.

1. Write scripts/design-classroom.mjs and generate scenes/maps/classroom.ts (the generator
   pattern of design-school.mjs). Use existing assets only (assets/*.ts with a built GLB in
   out/<name>/<name>.glb; build a missing one with `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge build <name>`):
   wood-floor, plaster-wall and plaster-wall-window (daylight through the window), a bookshelf or
   shelf with books, a low table and small chairs or stools at the sides, a cupboard, a crate or
   basket of toys, a potted plant, and the rug in the middle of the open floor area. Add
   'classroom' to the interior lighting set in src/scene/main.ts if the page needs it for an
   indoor map. No notice board with writing, no sign, no letters or numbers anywhere in view.
   Bright, warm, friendly: daylight, no fog, no dark corners.
2. Start the dev server (`node_modules/.bin/vite --port 5199`, in the background) and shoot with
   scripts/shoot-map.mjs; add a `FORGE_SHOT_SIZE=1920x1080` environment option to it (the viewport
   and the screenshot at 1:1), so the output is exactly 1920 x 1080. LOOK at the shot with the
   Read tool and adjust the camera query until: the floor area at rows 700 to 850 is open; the rug
   sits in that area; the walls, the window, and the shelves read; nothing is cut at the edges in
   an ugly way. Save the final shot as out/chibi-sprouts/r1/week1/scenes/classroom.png and the
   query string you used in out/chibi-sprouts/r1/week1/scenes/classroom.txt. Stop the dev server.
3. The rug cut-out: `./forge cutout rug --out out/chibi-sprouts/r1/week1/scenes --views three-quarter`
   (the rug keeps its own scale in scenes/manifest.json) (if `./forge cutout` does not
   exist yet, report that and skip this step). Rename the file to scenes/rug.png.
4. Run `python3 - <<'EOF'` style checks: classroom.png is 1920 x 1080 RGB (opaque), rug.png is RGBA.

Budget: 30 calls is a limit, not a target. Report: the assets used, the camera query, the file
paths, and anything you could not verify.

Machine rule (7 GB, shared with other sessions): run every heavy job (tsc, vitest, Chrome, textured
builds, vite) one at a time as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`.
Vitest: changed test files only, `--maxWorkers=1`.
