# Builder task: sprout-pip, fix pass 2 (review 6.5, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, recipes),
assets/sprout-pip.ts, the options of assets/parts/wolf-kind.ts that it uses, and the review
bench/sonnet/sprouts/cards/b2/review.json. LOOK at docs/sprout-mockups/pip.jpg and
out/sprout-pip/render.png before the first edit. Never run git, not even stash or checkout.
Machine rule: every heavy job (tsc, textured forge commands) runs as
`flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time.

Do every numbered fix and name any conflict in the report:

1. The ears are flat, smooth paddles that stand out sideways from the head like wings. The mockup ears are soft flaps that hang close to the head and fold at the top. Bring the ears in against the head, give them a fold, and give them the fur texture of the body.
2. The ears are dark brown on most of their area. The mockup ears are golden fur with darker tips only. Paint the ears in the body color and keep the darker color at the lower tips.
3. The face reads less happy than the mockup. The mouth is a flat dark slot under the muzzle and the tongue hangs below it. The mockup mouth is an upturned smile with the tongue inside the mouth. Curve the mouth corners up and show the tongue inside the smile.
4. The eyes have white rings around the iris, and this gives a startled look. The mockup eyes are large brown irises with small highlights and short brows. Remove the white rings, enlarge the irises, and add brows.
5. The fur hue is mustard yellow (hue about 38 to 40 degrees). The mockup fur is warm orange gold (hue about 27 degrees). Move the fur color toward orange.
6. The legs are very short and the body is low, so the head looks too heavy. The mockup has longer legs and an upright chest. Lengthen the legs a little and raise the chest.
7. The cream chest is a small patch under the collar and the head hides most of it. The mockup has a large cream bib from the collar to the belly. Enlarge the cream bib.
8. The gold tag is small and dark, and the tongue covers most of it in the front view. The mockup tag is a bright round medallion at the center of the collar. Make the tag larger and brighter, and keep it clear of the tongue.
9. The forehead stripe continues over the top of the head to the back. The mockup stripe is on the forehead only. Stop the stripe at the top of the head.
10. The sit clip holds one pose with almost no movement, and the head hides the haunches in the three-quarter view. Add a small tail wag or a head tilt to the sit.

Start values: ears as two soft flaps (an ellipsoid 0.05 x 0.07 x 0.02 m, rounded, tagged on the
head bone) that hang down beside the head from the top corners, rotated about 20 degrees out
and 10 degrees forward, in the fur colour with the darker tip only on the lower third
(paintWhere with a half-space). Fur #d08a3c (hue 27). Mouth: an upturned smile arc
(profile.arc) painted on the muzzle plus a small open-mouth ellipsoid under it, the tongue
inside the opening; remove the white eye rings (keep the eye white only inside the lid area).
Legs: the kind's `legLength` back to 0 or above, so the body stands a little higher. Chest
patch larger (to the front of the shoulders). Tag: #f0c040, 0.035 m, hanging 0.02 m below the
collar at the front, clear of the tongue.

Checks, in this order: `./forge render sprout-pip --fast` and LOOK at out/sprout-pip/render.png
once after the last edit; `./forge animate sprout-pip --fast --clip sit` and LOOK once (the
ears, collar, and tag stay with the head and neck); `./forge check sprout-pip` ends with
"no held items" and `ground ok`; no `warning:` lines; under 65,000 triangles; typecheck
(`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`, no
error in sprout-pip.ts); then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-pip`.
No edits and no forge command after it. Then
`python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b2r2 sprout-pip=sit`.

Budget: 25 calls is a limit, not a target. Report: what changed, the check output, and anything
you could not verify.
