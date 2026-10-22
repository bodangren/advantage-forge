# Review task: bench/sonnet/sprouts/cards/b3r3

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review one Chibi Sprouts child (third review, the stop rule; the second, bench/sonnet/sprouts/cards/b3r2/review.json, gave 7.0 with a critical error: pleat tops through the shirt hem; it also asked for short socks with bare legs, real pleats, and a visible ponytail; a pass applied them; rate the new build fresh and check the waist first): sprout-may.
Do not edit any file except the output JSON. Never run git.

Context: Chibi Sprouts shows the Pip-world cast at age 5 in the Chibi Quest chibi style, on the
accepted age-5 base `sprout-base` (the avatar head and face are shared by design: do not rate the
face age or the back hair; note them only). The reference panel on each card is the Workbooks
cast-sheet painting at an older age (Nan has no painting; her card shows Pat's as a style guide).
Judge the design match (hair shape and colour, clothes and their colours, shoes, the signature
item), the fit (nothing pokes through, clothes follow the body), the walk strip, and the 128 px
sprites. Looks (the cast sheet):
- May: long straight black hair in a high ponytail with a yellow star clip; a yellow T-shirt; a blue pleated skirt; white socks; white sneakers.
Bar: 7.5 (a character). Rated G. Critical errors: a design element missing or wrong, a part
through another part, text or letters on the model.

Work in few steps: read the brief; read the card in one parallel step; open at most two
extra images in total; write the JSON with one Write call.
Output JSON: bench/sonnet/sprouts/cards/b3r3/review.json with one entry per name in the brief's
format plus `"critical": true|false` and `"criticalReason"`. Final message: a table with the
name, the rating, and the largest issue for each.
