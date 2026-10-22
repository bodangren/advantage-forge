# Review task: bench/sonnet/sprouts/cards/b1

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review one asset, `sprout-base`. Do not edit any file except the output
JSON. Never run git. Open at most two extra images (out/sprout-base/render.png, out/sprout-base/anim/walk.png).

Context: Chibi Sprouts shows the Chibi Quest world at age 5. `sprout-base` is the humanoid kind
(the avatar-base head, face, and hair) on an age-5 body: a shorter torso and limbs, the same head.
The reference panel on the card is a Workbooks picture-book painting of a five-year-old at a
different style and an older look; it is a guide for the age feel, not a mockup to copy. Judge:
does the figure read as a five-year-old chibi child of the same family as avatar-base (compare
out/avatar-base/render.png if needed); the head sits on the neck; the arms and legs are in
proportion and not stiff; the clothes fit; the walk keeps the feet planted and the fists clear of
the body; the 128 px sprites read. Bar: 7.5 (a character). Rated G.

Output JSON: bench/sonnet/sprouts/cards/b1/review.json with the brief's entry format under the
key "sprout-base", plus `"critical": true|false` and `"criticalReason"`. Final message: one table
row with the rating and the largest issue.
