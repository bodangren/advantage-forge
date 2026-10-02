# gloves avatar fit rework -> assets/gloves.ts

Rework the existing file so that it fits the avatar base. The catalog marks it `rework` in docs/avatar-catalog.tsv. Reference: the `reference` path in the file.

Problem (from `./forge check gloves` on 2026-10-02): The gloves have no `equip` block, so they cannot be worn. The avatar base has closed fists.

Goal: Follow the recipe of assets/gauntlets.ts: build the left glove around the avatar fist (copy the fist ellipsoid, the finger roll, the thumb, and the forearm cone from avatar-base, translate so the WRIST is the origin, scale by 2, and grow by 0.01 to 0.012 m for leather). Keep the glove design language of the current file (cuff, stitching, color). Add `equip: { slot: 'hands', fitScale: 2, origin: [CX, OY, 0] }`; mirror across x = 0 for the standalone pair.

Read these first:
- docs/equipment-fit.md, section "Fit on the avatar base", and docs/equipment-parts.md, section "Avatar sockets and the equip block" (slots, sockets, `fitScale`, `origin`, `rotate`, `hides`).
- assets/avatar-base.ts: the body primitives that this slot covers (joint constants and the shapes tagged with the bones named in the check output below).
- A passing piece of the same slot as an example: gauntlets (hands, fitScale 2, `fit ok`: a closed-fist pair built from the avatar fist).

Fit loop: `./forge check gloves` prints one line per avatar part (skin, undershirt, pants, shoes, hair) and ends `fit ok` or `fit FAIL`. "shows through at N points (... bone near (x, y, z))" gives the avatar bone and the worn point (avatar meters) where the base comes through the piece. The worn piece is the asset scaled by 1 / fitScale and placed at the socket, so 1 cm worn is fitScale cm in the asset. Grow the piece outward from the avatar body (clearance about 4 to 8 mm worn) instead of shrinking the avatar parts. A `note` line is allowed; every `FAIL` line must go.

Keep the look: the same design language, palette, and details as now; the standalone render must still read as the reference. Priority P1: the target score is 7.0 of 10 (record it honestly). Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` slot; change `origin`, `rotate`, `fitScale`, or `hides` only when the brief says so or the fit needs it, and write why in the design note.

Rules: put fine surface detail in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick.

Checks and budget (at most 6 image looks in total):
1. `./forge check gloves` after each shape change (text only, no slot, fast).
2. When it ends `fit ok`: `FORGE_WORKERS=2 ./forge render avatar-base --wear gloves --fast --views front,three-quarter,side,back` and look at out/avatar-base+gloves/render.png once. Nothing of the base may show through, and the piece must look worn, not floating.
3. `FORGE_WORKERS=2 ./forge render gloves --fast` and look at out/gloves/render.png; compare with the reference. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have.
4. `FORGE_WORKERS=2 ./forge all gloves` once at the end (it can wait for a build slot; give it a long timeout), then look at out/gloves/sprites/preview.png once. No `warning:` lines (grep the log).
5. `node scripts/typecheck-asset.mjs gloves`; fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`.

Update the design note at the top of the file. Only edit assets/gloves.ts. Never commit, never stage. Use FORGE_WORKERS=2 on every forge command.

Report: the final `./forge check gloves` result lines, triangles, warnings, the typecheck result, your score of 10 against the reference, the three largest remaining differences, and the number of image looks.
