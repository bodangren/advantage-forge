# Review task: bench/sonnet/sprouts/cards/b3r2

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review two Chibi Sprouts children (second review; the first, bench/sonnet/sprouts/cards/b3/review.json, gave 7.0 each and asked for a two-arm bear hug at the chest, hair tufts, and pockets on Pat, and a smooth long ponytail, side bangs, and real pleats on May; rate the new builds fresh): sprout-pat and sprout-may.
Do not edit any file except the output JSON. Never run git.

Context: Chibi Sprouts shows the Pip-world cast at age 5 in the Chibi Quest chibi style, on the
accepted age-5 base `sprout-base` (the avatar head and face are shared by design: do not rate the
face age or the back hair; note them only). The reference panel on each card is the Workbooks
cast-sheet painting at an older age (Nan has no painting; her card shows Pat's as a style guide).
Judge the design match (hair shape and colour, clothes and their colours, shoes, the signature
item), the fit (nothing pokes through, clothes follow the body), the walk strip, and the 128 px
sprites. Looks (the cast sheet):
- Pat: short black hair; a green T-shirt; brown shorts; brown sandals; a small brown teddy bear held against the chest.
- May: long straight black hair in a high ponytail with a yellow star clip; a yellow T-shirt; a blue pleated skirt; white socks; white sneakers.
Bar: 7.5 (a character). Rated G. Critical errors: a design element missing or wrong, a part
through another part, text or letters on the model.

Work in few steps: read the brief; read both cards in one parallel step; open at most two
extra images in total; write the JSON with one Write call.
Output JSON: bench/sonnet/sprouts/cards/b3r2/review.json with one entry per name in the brief's
format plus `"critical": true|false` and `"criticalReason"`. Final message: a table with the
name, the rating, and the largest issue for each.
