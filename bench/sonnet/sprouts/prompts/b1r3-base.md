# Builder task: sprout-base, fix pass 3 (review 7.0 twice, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API), the `HERO`, `AGE5`,
`scaled`, and `clips` code in assets/parts/humanoid-kind.ts, assets/sprout-base.ts,
tests/sprout-base.test.ts, and the review bench/sonnet/sprouts/cards/b1r2/review.json. LOOK at
bench/sonnet/sprouts/cards/b1r2/sprout-base.png before the first edit. Never run git, not even
stash or checkout. Machine rule: every heavy job (tsc, vitest, mesh-same, textured forge commands)
runs as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time.

Change only the `AGE5` table (and values derived from it) and assets/sprout-base.ts. `HERO` and
every other asset stay the same. Do every numbered fix and name any conflict in the report:

1. Legs: two reviews say the lower body reads as a stub (less than one fifth of the height).
   Raise the AGE5 leg factor to 1.05 (longer than the hero's legs; the hips rise with them) and
   lower the torso factor to 0.84, so the figure stays about 0.86 to 0.88 m with hair and the
   lower body (ground to hip) is at least one quarter of the height. Keep the knee split and the
   foot inside the shoe; the feet on y = 0.
2. Shoes: the boots are still long. Shoe factor 0.72 of the leg factor (length and height); keep
   the sole on the ground and the foot inside.
3. Trousers: the dark hero trousers merge with the boots, so no leg shows. On sprout-base set
   the kind's `pants` option to a mid grey-blue (#6a7a94) and keep the shoe brown, so the trouser
   band reads between the shirt hem and the shoe (the children set their own clothes later).
4. Keep every other AGE5 value (arm 0.8, thickness 0.92, forearm turn, bob 1.0, foreSwing 8),
   the head, the face, the hair, the variants, the skeleton names, and the clip names.

Checks, in this order:
- `./forge render sprout-base --fast`, LOOK at out/sprout-base/render.png once after the last
  edit: the legs read, the boots are small, the trouser band shows.
- `./forge animate sprout-base --fast --clip walk`: LOOK once; feet planted, no foot through the trouser.
- `flock ~/Desktop/primary-parity-progress/heavy.lock node scripts/mesh-same.mjs avatar-base --part assets/parts/humanoid-kind.ts` prints SAME.
- `flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/vitest run tests/sprout-base.test.ts --maxWorkers=1` passes.
- `./forge check sprout-base` ends with "no held items" and `ground ok`; no `warning:` lines.
- Typecheck: `flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .` shows no error in humanoid-kind.ts or sprout-base.ts.
- Then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-base`. No edits and no forge command after it.
- Then `python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b1r3 sprout-base`.

Budget: 20 calls is a limit, not a target. Report: the AGE5 factors, the height and the hip
height, the mesh-same result, the check output, and anything you could not verify.
