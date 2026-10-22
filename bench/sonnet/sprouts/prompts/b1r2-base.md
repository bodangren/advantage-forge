# Builder task: sprout-base, fix pass 2 (review 7.0, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, rigging), the
`HERO`, `AGE5`, `scaled`, and `clips` code in assets/parts/humanoid-kind.ts, assets/sprout-base.ts,
tests/sprout-base.test.ts, and the review bench/sonnet/sprouts/cards/b1/review.json. Never run git,
not even stash or checkout. Machine rule: every heavy job (tsc, vitest, textured forge commands,
mesh-same) runs as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time.

Change only the `AGE5` table (and the scaled clip values that follow from it) and
assets/sprout-base.ts. The default `HERO` numbers and every other asset stay the same.
Do every numbered fix and name any conflict in the report:

1. Legs: the legs are too short; only a thin band of trousers shows between the shirt hem and
   the boots, so the lower body reads as a stump. Raise the AGE5 leg factor from 0.82 to about
   0.92 and keep the torso factor, so the trouser band between the hem and the shoe is at least
   0.05 m tall in the front view. Keep the total height at or below 0.88 m with hair (shorten the
   torso factor a little if needed, but keep the torso an upright scaled copy of the hero torso).
2. Boots: make the shoes smaller for the age-5 body: scale the shoe and sole bodies by about 0.85
   (length and height), and keep the foot inside them. The feet stay on y = 0.
3. Arms: the arms hang as stiff straight tubes in an A-pose. In AGE5, bend the rest elbow a
   little more (move ELBOW0 and WRIST0 so the forearm angles about 10 degrees forward and inward
   compared with the hero) and keep the fists clear of the hips. The hands keep the kind's fist.
4. Walk: the torso and the head do not bob and the arms swing only at the shoulder. In the scaled
   clips for AGE5, keep a visible bob (do not scale the bob and the lift below 0.9 of the hero's)
   and add a small forearm swing (about 8 degrees) where the hero's walk has none; apply the same
   to run.
5. Keep: the head, the face, the hair, the variants, the skeleton names, the clip names.

Checks, in this order:
- `./forge render sprout-base --fast`, LOOK at out/sprout-base/render.png once after the last edit
  (front, three-quarter, side, back): the trouser band shows, the boots are smaller, the arms bend.
- `./forge animate sprout-base --fast --clip walk`: LOOK at the strip once; feet planted, a bob,
  fists clear of the body.
- `flock ~/Desktop/primary-parity-progress/heavy.lock node scripts/mesh-same.mjs avatar-base --part assets/parts/humanoid-kind.ts`
  prints SAME (the HERO path is unchanged).
- `flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/vitest run tests/sprout-base.test.ts --maxWorkers=1` passes.
- `./forge check sprout-base` ends with "no held items" or `result ok`, and `ground ok`; no `warning:` lines.
- Typecheck: `flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .` shows no error in humanoid-kind.ts or sprout-base.ts.
- Then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-base`. No edits and no forge command after it.
- Then `python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b1r2 sprout-base`.

Budget: 25 calls is a limit, not a target. Report: the new AGE5 factors, the height, the mesh-same
result, the check output, and anything you could not verify.
