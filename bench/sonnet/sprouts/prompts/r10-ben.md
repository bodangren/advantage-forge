# Review task: bench/sonnet/sprouts/cards/b4r2

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review one Chibi Sprouts child (second review; the first, bench/sonnet/sprouts/cards/b4/review.json, gave 7.0 and asked for fluffy hair with fringe tufts and a value step between the shirt and the jeans; rate the new build fresh; the walk is the shared base clip and is not rated): sprout-ben.
Do not edit any file except the output JSON. Never run git.

Context: Chibi Sprouts shows the Pip-world cast at age 5 in the Chibi Quest chibi style, on the
accepted age-5 base `sprout-base` (the avatar head and face are shared by design: do not rate the
face age or the back hair; note them only). The reference panel on each card is the Workbooks
cast-sheet painting at an older age (each has one).
Judge the design match (hair shape and colour, clothes and their colours, shoes, the signature
item), the fit (nothing pokes through, clothes follow the body), the walk strip, and the 128 px
sprites. Looks (the cast sheet):
- Ben: thick fluffy light-brown hair that falls over the forehead; a plain mid-blue T-shirt; blue jeans; grey sneakers; a smile.
Bar: 7.5 (a character). Rated G. Critical errors: a design element missing or wrong, a part
through another part, text or letters on the model.

Work in few steps: read the brief; read the card in one parallel step; open at most two
extra images in total; write the JSON with one Write call.
Output JSON: bench/sonnet/sprouts/cards/b4r2/review.json with one entry per name in the brief's
format plus `"critical": true|false` and `"criticalReason"`. Final message: a table with the
name, the rating, and the largest issue for each.
