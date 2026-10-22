# Builder task: May, fix pass 3 (review 7.0 with a critical error, bar 7.5)

Read bench/sonnet/sprouts/prompts/common-child.md first and follow it (never run git, not even
stash; heavy jobs under the lock). Then read bench/sonnet/sprouts/cards/b3r2/review.json and LOOK
at bench/sonnet/sprouts/cards/b3r2/sprout-may.png before the first edit. Do every numbered fix
and name any conflict in the report. Cards dir: bench/sonnet/sprouts/cards/b3r3.

## sprout-may (assets/sprout-may.ts)
Critical (fix first): the tops of the skirt pleats go through the hem of the T-shirt and make a
jagged zigzag at the waist. Keep the whole skirt top (waistband and pleat tops) at least 0.015 m
inside the shirt: intersect the skirt with a half-space below the shirt hem minus 0.015 m, and
let the pleat ridges start only below the hem. Then verify with `./forge render sprout-may --fast
--focus 0,0.25,0.08,0.1` (LOOK): the hem is one clean line.

1. The line between the T-shirt and the skirt is a jagged zigzag in the front, three-quarter, and back views. The skirt pleat tops go through the T-shirt hem. Give the T-shirt a smooth, straight hem that covers the top of the skirt.
2. The white socks start at the skirt hem and merge with the white shoes, so the legs read as white boots. The painting shows bare legs, short white socks, and sneakers with a gray sole and laces. Show skin above the socks and add a sole line and laces to the shoes.
3. The skirt has rounded waves at the hem. It reads as a ruffle skirt, not a pleated skirt. Make the pleats straight, crisp folds from the waist to the hem.
4. From the front, the ponytail is hidden behind the head, so she reads as a girl with a short bob. The painting shows the ponytail at the side of the head. Turn the ponytail a little to one side so that it shows from the front.
5. The walk strip shows no ponytail swing. Add a small follow-through swing.

Start values: socks as short ankle socks (0.03 m above the shoe) with bare skin between the
sock and the skirt hem; the skirt hem at mid-thigh with 8 to 10 ridge pleats (a displace of the
skirt radius by 0.006 * cos(9 * angle), constant from below the hem line to the skirt hem), the
hem edge following the ridges; the ponytail base at the crown and the lock long enough to show
beside the head in the front view; keep the walk swing on the cloak bone.
