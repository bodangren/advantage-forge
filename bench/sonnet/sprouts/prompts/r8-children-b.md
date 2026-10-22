# Review task: bench/sonnet/sprouts/cards/b4

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review three Chibi Sprouts children: sprout-sam, sprout-mia, sprout-ben.
Do not edit any file except the output JSON. Never run git.

Context: Chibi Sprouts shows the Pip-world cast at age 5 in the Chibi Quest chibi style, on the
accepted age-5 base `sprout-base` (the avatar head and face are shared by design: do not rate the
face age or the back hair; note them only). The reference panel on each card is the Workbooks
cast-sheet painting at an older age (each has one).
Judge the design match (hair shape and colour, clothes and their colours, shoes, the signature
item), the fit (nothing pokes through, clothes follow the body), the walk strip, and the 128 px
sprites. Looks (the cast sheet):
- Sam: short neat dark-brown hair; a red T-shirt with two white stripes across the chest; blue denim shorts; blue sneakers with white soles; a laugh with the eyes open.
- Mia: shoulder-length wavy light-brown hair with a pink ribbon bow on one side (the brief put it on her left, +X; the painting shows the other side: not an error); a pink T-shirt; blue denim overalls with long legs, a bib, and straps; white sneakers; a laugh.
- Ben: thick fluffy light-brown hair that falls over the forehead; a plain mid-blue T-shirt; blue jeans; grey sneakers; a smile.
Bar: 7.5 (a character). Rated G. Critical errors: a design element missing or wrong, a part
through another part, text or letters on the model.

Work in few steps: read the brief; read all three cards in one parallel step; open at most two
extra images in total; write the JSON with one Write call.
Output JSON: bench/sonnet/sprouts/cards/b4/review.json with one entry per name in the brief's
format plus `"critical": true|false` and `"criticalReason"`. Final message: a table with the
name, the rating, and the largest issue for each.
