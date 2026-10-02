# enchanter-scroll avatar fit rework -> assets/enchanter-scroll.ts

Rework the existing file so that it fits the avatar base. The catalog marks it `rework` in docs/avatar-catalog.tsv. Reference: the `reference` path in the file.

Problem (from `./forge check enchanter-scroll` on 2026-10-02): The scroll with its flame is 0.64 m tall: worn, it goes 13 cm below the ground, and the sparks pass through the head in 2 clips (run and cast).

Goal: Give the piece an avatar size with `fitScale` and set `origin` and `offset` so it is carried at the side like the books, clear of the ground and the head in every clip. The standalone asset keeps its size. Then `./forge check enchanter-scroll` must end `fit ok` and its clip check `result ok`.

Read these first:
- docs/equipment-fit.md, section "Fit on the avatar base", and docs/equipment-parts.md, section "Avatar sockets and the equip block" (slots, sockets, `fitScale`, `origin`, `rotate`, `hides`).
- assets/avatar-base.ts: the body primitives that this slot covers (joint constants and the shapes tagged with the bones named in the check output below).
- A passing piece of the same slot as an example: mage-spellbook or cleric-book (`offhand`, `frame: 'body'`, `fit ok`).

Fit loop: `./forge check enchanter-scroll` prints one line per avatar part (skin, undershirt, pants, shoes, hair) and ends `fit ok` or `fit FAIL`. "shows through at N points (... bone near (x, y, z))" gives the avatar bone and the worn point (avatar meters) where the base comes through the piece. The worn piece is the asset scaled by 1 / fitScale and placed at the socket, so 1 cm worn is fitScale cm in the asset. Grow the piece outward from the avatar body (clearance about 4 to 8 mm worn) instead of shrinking the avatar parts. A `note` line is allowed; every `FAIL` line must go.

Keep the look: the same design language, palette, and details as now; the standalone render must still read as the reference. Priority off-catalog (hero part): the target score is 7.0 of 10 (record it honestly). Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` slot; change `origin`, `rotate`, `fitScale`, or `hides` only when the brief says so or the fit needs it, and write why in the design note.

Rules: put fine surface detail in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick.

Checks and budget (at most 6 image looks in total):
1. `./forge check enchanter-scroll` after each shape change (text only, no slot, fast).
2. When it ends `fit ok`: `FORGE_WORKERS=2 ./forge render avatar-base --wear enchanter-scroll --fast --views front,three-quarter,side,back` and look at out/avatar-base+enchanter-scroll/render.png once. Nothing of the base may show through, and the piece must look worn, not floating.
3. `FORGE_WORKERS=2 ./forge render enchanter-scroll --fast` and look at out/enchanter-scroll/render.png; compare with the reference. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have.
4. `FORGE_WORKERS=2 ./forge all enchanter-scroll` once at the end (it can wait for a build slot; give it a long timeout), then look at out/enchanter-scroll/sprites/preview.png once. No `warning:` lines (grep the log).
5. `node scripts/typecheck-asset.mjs enchanter-scroll`; fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`.

Update the design note at the top of the file. Only edit assets/enchanter-scroll.ts. Never commit, never stage. Use FORGE_WORKERS=2 on every forge command.

Report: the final `./forge check enchanter-scroll` result lines, triangles, warnings, the typecheck result, your score of 10 against the reference, the three largest remaining differences, and the number of image looks.
