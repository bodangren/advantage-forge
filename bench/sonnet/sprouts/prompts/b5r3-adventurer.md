# Builder task: sprout-adventurer, fix pass 3 (review 7.0 twice, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, recipes),
assets/sprout-adventurer.ts, assets/parts/sprout-gestures.ts, and the review
bench/sonnet/sprouts/cards/b5r2/review.json. LOOK at bench/sonnet/sprouts/cards/b5r2/sprout-adventurer.png
and docs/hero-mockups/adventurer_001.jpg before the first edit. Never run git, not even stash or
checkout. Machine rule: every heavy job (tsc, textured forge commands) runs as
`flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time. Keep the gesture
clip names and their key times (0.5 and 1.0 s) exactly as they are.

Do every numbered fix and name any conflict in the report:

1. The hair is a vertical crown of flat locks with round, paddle-shaped tips. It looks like a flame and still looks like soft clay. The mockup hair sweeps to one side, with tapered, pointed locks and a fringe over the band. Sweep the locks to the side and taper each tip to a point.
2. A dark seam runs along the top edge of the bandana where the hair meets the band, in the front and three-quarter views. Blend the hair into the band edge or let the band sit slightly proud of the hair.
3. In the gesture-clap clip, the hands meet at the stomach, just above the belt, not in front of the chest. The small cream hands have low contrast against the cream shirt. Raise the clap to chest height and move it slightly forward.
4. In the gesture-clap clip, the torso and the head have almost no motion. The side view frames are nearly the same. Add a small bounce or lean on each clap.
5. The neckerchief now has a knot, but it is small and flat on the shirt. The mockup has a larger, loose cloth that drapes over the shoulders with folds. Make the cloth larger and give it one or two folds.
6. The bandana knot tails lie flat on the back hair in the back view. Lift the tails off the hair so that they hang free from the back as well.
7. The mockup has a brown pouch on the belt at the right hip. The model has none. Add a small pouch to support the adventurer role.
8. Note only (by design): the head and the face are the shared age-5 avatar parts. The open smile shows a flat white tooth band.

Start values. Hair: the locks must lie along the skull, not stand up. Build each lock as a chain
whose points follow the skull surface (start near the crown, end at the band or the nape), the
lock axis within 20 degrees of the surface tangent, all swept to the character's left (+X) and
back; tips pointed (end radius 0.006) and never paddle-shaped; one short fringe lock over the
band at the forehead side only (it may cross the band). The silhouette of the top of the head
is a soft dome plus 0.02 m, not a flame. Band seam: lift the band 0.003 m out of the hair and
round its top edge. Clap: hands meet at chest height, the fists at y = 0.30 (AGE5 chest, above
the belt) and z = 0.12, and keep the pass 2 body motion but double its amplitude. Neckerchief:
0.09 m wide at the shoulders, with the knot 0.03 m and tails 0.06 m long that hang off the
chest. Belt pouch: a small rounded brown pouch (0.05 m) on the right hip, rigid on `hips`,
mirroring the lantern.

Checks, in this order: `./forge render sprout-adventurer --fast` and LOOK once after the last
edit (hair lies down, band clear); `./forge animate sprout-adventurer --fast --clip gesture-clap`
and LOOK once (hands at chest, visible body motion); `./forge check sprout-adventurer` ends with
`result ok` and `ground ok`; no `warning:` lines; under 65,000 triangles; typecheck
(`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`, no
error in the two files); then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-adventurer`.
No edits and no forge command after it. Then
`python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b5r3 sprout-adventurer=gesture-clap`.

Budget: 25 calls is a limit, not a target. Report: what changed, the check output, and anything
you could not verify.
