# greaves avatar fit rework -> assets/greaves.ts

Rework the existing file so that it fits the avatar base. The catalog marks it `rework` in docs/avatar-catalog.tsv. Reference: the `reference` path in the file.

Problem (from `./forge check greaves` on 2026-10-02): The greaves are too tall: the tops go into the hips, so the undershirt (spine and hips, about 140 points, up to 5.7 cm) and the pants come through.

Goal: Shorten the greaves so they cover the shin and the knee only and stop below the shirt hem, and enclose the shin and the foot with clearance (copy the avatar shin and foot primitives, scale by 2, grow). Keep `hides: ['shoes']`.

Read these first:
- docs/equipment-fit.md, section "Fit on the avatar base", and docs/equipment-parts.md, section "Avatar sockets and the equip block" (slots, sockets, `fitScale`, `origin`, `rotate`, `hides`).
- assets/avatar-base.ts: the body primitives that this slot covers (joint constants and the shapes tagged with the bones named in the check output below).
- A passing piece of the same slot as an example: boots (the same `feet` slot) and the `feet` socket in docs/equipment-parts.md.

Fit loop: `./forge check greaves` prints one line per avatar part (skin, undershirt, pants, shoes, hair) and ends `fit ok` or `fit FAIL`. "shows through at N points (... bone near (x, y, z))" gives the avatar bone and the worn point (avatar meters) where the base comes through the piece. The worn piece is the asset scaled by 1 / fitScale and placed at the socket, so 1 cm worn is fitScale cm in the asset. Grow the piece outward from the avatar body (clearance about 4 to 8 mm worn) instead of shrinking the avatar parts. A `note` line is allowed; every `FAIL` line must go.

Keep the look: the same design language, palette, and details as now; the standalone render must still read as the reference. Priority P1: the target score is 7.0 of 10 (record it honestly). Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` slot; change `origin`, `rotate`, `fitScale`, or `hides` only when the brief says so or the fit needs it, and write why in the design note.

Rules: put fine surface detail in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick.

Checks and budget (at most 6 image looks in total):
1. `./forge check greaves` after each shape change (text only, no slot, fast).
2. When it ends `fit ok`: `FORGE_WORKERS=2 ./forge render avatar-base --wear greaves --fast --views front,three-quarter,side,back` and look at out/avatar-base+greaves/render.png once. Nothing of the base may show through, and the piece must look worn, not floating.
3. `FORGE_WORKERS=2 ./forge render greaves --fast` and look at out/greaves/render.png; compare with the reference. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have.
4. `FORGE_WORKERS=2 ./forge all greaves` once at the end (it can wait for a build slot; give it a long timeout), then look at out/greaves/sprites/preview.png once. No `warning:` lines (grep the log).
5. `node scripts/typecheck-asset.mjs greaves`; fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`.

Update the design note at the top of the file. Only edit assets/greaves.ts. Never commit, never stage. Use FORGE_WORKERS=2 on every forge command.

Report: the final `./forge check greaves` result lines, triangles, warnings, the typecheck result, your score of 10 against the reference, the three largest remaining differences, and the number of image looks.
