# Builder task: sprout-adventurer, fix pass 2 (review 7.0, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, recipes),
assets/sprout-adventurer.ts, assets/parts/sprout-gestures.ts, and the review
bench/sonnet/sprouts/cards/b5/review.json. LOOK at bench/sonnet/sprouts/cards/b5/sprout-adventurer.png
and docs/hero-mockups/adventurer_001.jpg before the first edit. Never run git, not even stash or
checkout. Machine rule: every heavy job (tsc, textured forge commands) runs as
`flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time. Keep the gesture
clip names and their key times (0.5 and 1.0 s) exactly as they are: the cut-out script reads them.

Do every numbered fix and name any conflict in the report:

1. The hair is a smooth cap with drip-shaped blobs and short round nubs. It looks like melted clay. The mockup hair has tousled, swept, pointed locks with volume. Replace the drips with swept, pointed locks that go up and to the side.
2. Five hair drips hang over the top edge of the bandana at the front, and the band looks buried. Keep the band edge clear and let one lock fall across the band, as in the mockup.
3. The neckerchief is a flat red triangle on the shirt. The mockup has a loose cloth with a knot and folds. Give the neckerchief thickness, a knot, and one fold.
4. The right hand at rest has one stiff finger that points down and out. Relax the hand into a loose fist or an open hand.
5. The bandana knot tails at the back are short and lie flat on the hair. Make the tails longer and let them hang free.
6. In the gesture-clap clip, the hands are small and have low contrast against the cream shirt, and the body has almost no motion. Move the hands slightly forward from the neckerchief and add a small bounce in the torso.
7. The back view shows a rough seam where the hair meets the top edge of the bandana. Smooth this seam.
8. Note only (by design): the head and the face are the shared age-5 avatar parts. The open smile shows a flat white tooth band.

Start values: hair as one smooth shell above the bandana plus 6 to 8 swept tapered locks
(sdf.chain, three points, radii 0.035 to 0.012, smoothUnion 0.02) that sweep back and to one
side with volume above the band, ending in soft points; nothing hangs over the front edge of
the bandana (cut the hair with a half-space 0.005 m above the band's top edge); the bandana band
fully visible with two knot tails 0.07 m long that lift off the hair at the back. Neckerchief:
a small knot sphere (0.025 m) at the throat and two short triangular tails as bodies, not paint.
Right index finger: at rest it points forward and slightly down; make it shorter (0.02 m) and
tuck it along the fist so it reads as a pointing hand only in the point gestures (keep one
rigid finger body; fine). Keep the lantern, the clips, and the open grin.

Checks, in this order: `./forge render sprout-adventurer --fast` and LOOK once after the last
edit; `./forge animate sprout-adventurer --fast --clip gesture-wave` and LOOK once (the hand
beside the head, nothing in the head); `./forge check sprout-adventurer` ends with `result ok`
and `ground ok`; no `warning:` lines; under 65,000 triangles; typecheck
(`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`, no
error in the two files); then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-adventurer`.
No edits and no forge command after it. Then
`python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b5r2 sprout-adventurer=gesture-clap`.

Budget: 25 calls is a limit, not a target. Report: what changed, the check output, and anything
you could not verify.
