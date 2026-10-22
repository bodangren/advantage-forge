# Tool task: cut-out renders for Chibi Sprouts

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, conventions, performance),
measure/tracks/asset_chibi_sprouts_r1_20261022/spec.md (sections "Changes after the start" and
"Tool changes"), and bench/sonnet/sprouts/method.md (the delivery format). Never run git, not even stash or checkout.
`pnpm` is a slow shim: run tools from node_modules/.bin directly.

Goal: a CLI command that renders transparent cut-out PNGs of a built asset for a 2D compositor
(Workbooks), plus a manifest writer and a format check.

1. Command: `./forge cutout <name> --out <dir> [--views front,three-quarter,side] [--ppm 900]
   [--canvas 1024x1200] [--margin 16] [--clip <clip> --at <seconds>] [--stem <file-stem>] [--fast]`.
   Add it in src/cli/forge.ts beside `render`; it takes a build slot like `render` (textured by
   default, `--fast` for iteration). Render in the page (src/render/page.ts): add `renderCutouts` on
   `window.forge`, built like `renderViews` (same camera family, same lights, same supersampling).
2. Pixels: RGBA PNG with straight (not premultiplied) alpha and soft anti-aliased edges, no matte and
   no halo: the edge colour comes from covered samples only. No ground shadow (hide `studio.ground`),
   no background. Check the WebGL `toDataURL` path for premultiplication and fix it if it darkens
   or lightens edges (read pixels and encode the PNG yourself if needed).
3. One scale for every asset: `--ppm` is pixels per meter at the plane x = 0, z = 0 (the standing
   plane). The camera distance and the field of view come from `ppm` and the canvas, never from
   the asset's bounds, so two assets rendered with the same options share one scale. The ground
   point (0, 0, 0) lands on a fixed pixel: column = width / 2, row = height - margin. The
   three-quarter and side views orbit about the vertical axis through the origin. If the asset does
   not fit the canvas, fail with a message that names the needed canvas height.
4. Files: `<dir>/<name>/<view>.png` for views (`three-quarter.png`, not `3q`), or
   `<dir>/<name>/<stem>.png` with `--clip` and `--stem`. Update `<dir>/manifest.json` (create it
   when missing) with `ppm`, `canvas`, `footPoint`, and a `files` map `"<name>/<stem>": true`; keep
   existing keys. The week 1 manifest fields `cast`, `gestures`, and `scenes` are filled by hand
   later; do not design them.
5. Check script `scripts/cutout-check.mjs <dir>`: every PNG under the dir is RGBA, has the manifest
   canvas size, has fully transparent corners, has at least some alpha values between 1 and 254
   (soft edges), has no pixel with alpha 0 and non-zero colour at the outer edge of the opaque
   region (a halo test: compare the colour of the outermost partial pixels with their inner
   neighbours, and fail when they are darker than a 25 % drop), and its lowest opaque row is within
   4 px of `footPoint.row` unless the file name contains `hop`, `jump`, or `stretch`. Prints one
   line per file and ends with `result ok` or `result fail`.
6. Unit test (vitest, in the existing tests layout) for the alpha path with a synthetic
   supersampled buffer: a soft edge, and the edge colour from covered samples only.
7. Try it: `./forge cutout avatar-base --out /tmp/claude-1000/sprout-cutout --fast --ppm 900` and
   the same for `dog`, then `--clip walk --at 0.3 --stem walk-03` on avatar-base. Composite one
   PNG over magenta (sharp) and LOOK at it with the Read tool: no dark or light fringe. Run the
   check script on the dir.
8. `node_modules/.bin/tsc --noEmit -p .` (or the repo's typecheck script) and
   `flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/vitest run --maxWorkers=1 <changed test files>` pass.

Keep every existing command and output unchanged (the sprite pass keeps its binary alpha). Budget:
35 calls is a limit, not a target. Report: the command syntax, the manifest shape, the test file,
the check output, and anything you could not verify.

Machine rule (7 GB, shared with other sessions): run every heavy job (tsc, vitest, Chrome, textured
builds, vite) one at a time as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`.
Vitest: changed test files only, `--maxWorkers=1`.
