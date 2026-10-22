# Builder task: sprout-pip, fix pass 3 (review 7.0, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, recipes),
assets/sprout-pip.ts, the options of assets/parts/wolf-kind.ts that it uses, and the review
bench/sonnet/sprouts/cards/b2r2/review.json. LOOK at bench/sonnet/sprouts/cards/b2r2/sprout-pip.png
and docs/sprout-mockups/pip.jpg before the first edit. Never run git, not even stash or checkout.
Machine rule: every heavy job (tsc, textured forge commands) runs as
`flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time.

Do every numbered fix and name any conflict in the report:

1. The muzzle is too wide and too round. It fills almost the full face width and hides the collar and the tag from the front. Make the muzzle narrower and shorter, and spread the cream area onto the cheeks, as in the mockup.
2. The head is too large for the body, and the legs and the chest are short. The head is about 60% of the height in the model and about 45% in the mockup. Make the head smaller or the body and the legs longer.
3. The eyes are dark pits with white bead spheres. The beads stick out of the head profile in the side view. Paint the catch-lights flat on the eye and show the brown iris, as in the mockup.
4. The tail is a smooth tube. Make it fluffy, with a fur tuft and a lighter tip, as in the mockup.
5. The ears are narrow paddles that hang from a small knob at the top of the head. The dark tips are weak. Make the ears wider and softer at the top, and darken the tips.
6. The mouth is in two parts: a thin smile line on the muzzle and an open mouth below the muzzle. Join them into one open smile under the nose, as in the mockup.
7. The cream chest is small and the head hides it. Make the cream chest larger and continue it down between the front legs.
8. The pink cheek blush and the fur tufts on the top of the head are missing.
9. The sit clip shows only a small head motion. Add a tail wag to give the sit more life.

Start values: `headScale` 1.3 down to 1.15 and `snout` 0.045 down to 0.03, with the muzzle
narrower than two thirds of the face width, so the collar and the tag show under the chin in the
front view; raise `legLength` or the body a little, so the head is about half of the height.
Eyes: keep the eye spheres inside the head surface (move them back or paint the eyes on the head
with `paintWhere`), so the side profile is one smooth curve. Tail: a chain of three or four
tapered segments with a slight curl and a displace of 0.004 m for fluff, cream tip. Ears: wider
flaps (0.06 m), the dark tip in #7a4a22 on the lower third. Smile: one continuous upturned arc that
joins the open mouth. Chest: the cream bib up to the collar and out to the shoulders.

Checks, in this order: `./forge render sprout-pip --fast` and LOOK at out/sprout-pip/render.png
once after the last edit (front: collar and tag visible; side: no eye bulge);
`./forge animate sprout-pip --fast --clip sit` and LOOK once; `./forge check sprout-pip` ends
with "no held items" and `ground ok`; no `warning:` lines; under 65,000 triangles; typecheck
(`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`, no
error in sprout-pip.ts); then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-pip`.
No edits and no forge command after it. Then
`python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b2r3 sprout-pip=sit`.

Budget: 25 calls is a limit, not a target. Report: what changed, the head share of the height,
the check output, and anything you could not verify.
