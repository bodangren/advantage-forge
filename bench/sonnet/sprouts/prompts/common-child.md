# Common rules for the Chibi Sprouts children (read with every child prompt)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, recipes), the spec
measure/tracks/asset_chibi_sprouts_r1_20261022/spec.md ("Changes after the start", "Art rules"),
assets/parts/humanoid-kind.ts (the header, `HumanoidKind`, `HumanoidShape`, and the `proportions`
option with `AGE5`), assets/sprout-base.ts, and one dressed kind user, assets/baker.ts. Do not run
git. `pnpm` is a slow shim: run node_modules/.bin tools directly.

- Every child is `humanoidAsset({ ..., proportions: AGE5 })`: the sprout-base body, head, and
  face. Keep the base skeleton and clips. Faces are race-unmarked; eyes dark brown for every
  child (slot `eyes`, brown first). Keep the skin slot options of avatar-base with the default
  first. Rated G, no weapon, no text, no letters or numbers anywhere on the model.
- Reference: the Workbooks cast sheet picture at docs/sprout-mockups/<name>.jpg is a painted
  picture-book drawing at an older age. Set `reference` to it and LOOK at it before the first
  edit. Copy the design (hair shape, hair colour, clothes, colours, shoes), not the painting style
  and not the age: the model stays the chibi style at age 5 on sprout-base.
- Hair: one smooth hair shell over the skull with three or four broad waves, no thin locks, coils,
  spikes, or slabs; soft edges (smoothIntersect 0.02 or more). Use `avatarHair` styles when one
  fits (swept, short, long, ponytail) and build extra pieces (bunches, a ribbon, a clip) on the
  `head` bone. Hair never pokes through a hat or a ribbon.
- Clothes: the T-shirt is the kind's undershirt (slot `cloth`, the sheet colour first, then three
  options in the same saturation family). Shorts, a skirt, overalls, socks, and sandals are extra
  bodies on `h.torso`, `h.band`, `h.joints`, and `h.weighted` (the pants and shoes options of the
  kind can be turned off). A printed motif (a star, stripes) is paint on the shirt body with
  `paintWhere` from an extruded profile; keep it 0.03 m or larger so it reads at 128 px.
- Loop: `./forge render <name> --fast`, LOOK at out/<name>/render.png (front, three-quarter, side,
  back), fix the largest difference first. Then `./forge animate <name> --fast --clip walk`: the
  skirt or shorts do not tear and the legs do not pass through them. `./forge check <name>` ends
  with `result ok` (or "no held items to check") and `ground ok`; no `warning:` lines; under
  65,000 triangles.
- Finish: typecheck (`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`), then one final
  `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all <name>` per child. No edits and
  no forge command after it. Then the review card:
  `python3 scripts/review-cards.py bench/sonnet/sprouts/cards/<batch> <name> [<name> ...]`.
- Budget: 35 calls per child is a limit, not a target. Report per child: the hair and clothes
  bodies, the check output, and anything you could not verify.
- Machine rule (7 GB, shared with other sessions): run every heavy job (tsc, vitest, Chrome,
  textured builds) one at a time as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`.
  Vitest: changed test files only, `--maxWorkers=1`.
