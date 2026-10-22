# Review task: bench/sonnet/sprouts/cards/b5

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md
and follow it exactly. You review one asset, `sprout-adventurer`. Do not edit any file except the
output JSON. Never run git. Open at most two extra images (out/sprout-adventurer/render.png and
one gesture strip under out/sprout-adventurer/anim/).

Context: the Chibi Quest adventurer hero at age 5 on the accepted age-5 base (the shared avatar
head and face are by design: note them only). The reference panel is the hero mockup at full
age; judge the identity match (tousled brown hair, teal bandana with knot tails, red
neckerchief, cream shirt, grey-green short trousers, brown shoes, a small lantern at the left hip),
no sword or pack, the fit, and the 128 px sprites. The card's row 2 strip is the gesture clip
`gesture-clap` (hands meet in front of the chest); the gestures are the asset's purpose: the
hands must read in the pose, nothing enters the head or torso, and the figure stays unmirrored.
Bar: 7.5 (a character). Rated G. Critical errors: a weapon, a part through another part, a
gesture whose hands are hidden or wrong, text or letters.

Output JSON: bench/sonnet/sprouts/cards/b5/review.json under the key "sprout-adventurer", with the
brief's entry format plus `"critical": true|false` and `"criticalReason"`. Final message: one
table row with the rating and the largest issue.
