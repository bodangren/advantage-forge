# Builder task: sprout-pip (Pip the puppy, Chibi Sprouts)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, recipes), the spec
measure/tracks/asset_chibi_sprouts_r1_20261022/spec.md ("Changes after the start", "Art rules"),
assets/dog.ts, and the options of assets/parts/wolf-kind.ts (`wolfAsset`) and
assets/parts/scale-asset.ts. Never run git, not even stash or checkout. `pnpm` is a slow shim: run node_modules/.bin tools.

Build assets/sprout-pip.ts: Pip, the puppy of the Pip-world stories, on the dog kind. Pictures:
docs/sprout-mockups/pip.jpg (the cast sheet, the target design) and pip-source.jpg (a story
picture). Set `reference` to docs/sprout-mockups/pip.jpg and LOOK at it before the first edit.
Copy the design, not the painting style: the model is the chibi dog kind.

Look (the series bible, exact): golden-brown fur (#c8903c); a cream chest, a cream muzzle, and a
cream stripe up the forehead (#f4e4c4); floppy ears with darker tips (#8a5a2c tips on #b07a34
ears); large dark-brown eyes; a black nose; a fluffy tail (cream tip is fine); a red collar
(#d03a32) with one small round gold tag (#e8b43c, 0.025 m) hanging under the chin, no bell. A
happy open-mouth smile with the tongue. Size: a small puppy beside a 0.85 m five-year-old; about
0.40 m to the top of the head, standing on four legs. Big round head (the dog's `headScale` or
larger), short legs, a round body.

Variants: keep the kind's slots but put Pip's colours first (fur golden-brown, markings cream,
collar red); keep every existing option and add, never replace.

Clips: the kind's (idle, walk, run, sit, and the rest). Keep `sit: true` so the sit clip exists:
week 1 shows Pip sitting up. Check `./forge animate sprout-pip --fast --clip sit`: the collar and
the tag stay on the neck and the tongue stays in the mouth.

Loop: `./forge render sprout-pip --fast`, LOOK at out/sprout-pip/render.png, fix the largest
difference first (ear shape and the forehead stripe first, then the collar and tag, then the
tail). `./forge check sprout-pip` ends with `result ok` or "no held items" and `ground ok`; no
`warning:` lines; under 65,000 triangles. Typecheck (`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`), then
one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-pip`. No edits and
no forge command after it. Then `python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b2 sprout-pip=sit`.

Budget: 35 calls is a limit, not a target. Report: the kind options used, the check output, and
anything you could not verify.

Machine rule (7 GB, shared with other sessions): run every heavy job (tsc, vitest, Chrome, textured
builds, vite) one at a time as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`.
Vitest: changed test files only, `--maxWorkers=1`.
