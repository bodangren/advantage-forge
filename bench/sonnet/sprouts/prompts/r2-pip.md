# Review task: bench/sonnet/sprouts/cards/b2

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review one asset, `sprout-pip`. Do not edit any file except the output
JSON. Never run git. Open at most two extra images (out/sprout-pip/render.png and
docs/sprout-mockups/pip-source.jpg).

Context: Pip is the puppy of the Pip-world stories, for Chibi Sprouts (the Chibi Quest world at
age 5), built on the chibi dog kind. The reference panel is the Workbooks cast-sheet painting:
copy the design (golden-brown fur, cream chest, muzzle, and forehead stripe, floppy ears with
darker tips, large dark-brown eyes, black nose, fluffy tail, red collar with one small round gold
tag, happy open-mouth smile), not the painting style. The card's row 2 strip is the `sit` clip
(the mockup sits; the rest pose stands). Bar: 7.5 (a character). Rated G. Critical errors: a
design element missing or wrong (no collar, no stripe, pointed ears), parts through other parts.

Output JSON: bench/sonnet/sprouts/cards/b2/review.json under the key "sprout-pip", with the
brief's entry format plus `"critical": true|false` and `"criticalReason"`. Final message: one
table row with the rating and the largest issue.
