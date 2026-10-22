# Builder task: Ben, fix pass 2 (review 7.0, bar 7.5)

Read bench/sonnet/sprouts/prompts/common-child.md first and follow it (never run git, not even
stash; heavy jobs under the lock). Then read bench/sonnet/sprouts/cards/b4/review.json and LOOK at
bench/sonnet/sprouts/cards/b4/sprout-ben.png before the first edit. Do every numbered fix and
name any conflict in the report. Cards dir: bench/sonnet/sprouts/cards/b4r2.

## sprout-ben (assets/sprout-ben.ts)
1. The hair is not fluffy. The fringe is one row of round lumps, and the crown and the sides are a smooth cap. The painting shows thick, tousled hair with volume over the full head and soft tufts at the edges. Add volume at the crown and break the outline with soft tufts at the top and the sides.
2. The shirt and the jeans have almost the same value. The shirt is a saturated royal blue, and the jeans are a dark blue. At 128 px the body reads as one blue block. Make the shirt a lighter mid-blue, as in the painting, and give the jeans a denim fade.
3. The hair color is a sandy tan. The painting shows a warmer chestnut light brown. Make the hair color a little warmer.
4. The hair has a straight, vertical edge at the temple in the three-quarter view. Soften this edge with a small tuft.
5. The walk is stiff in the upper body. The torso and the head stay rigid. Add a small torso turn and a small vertical bob.

Start values: hair as one smooth shell plus five or six soft overlapping mounds (spheres of
0.045 to 0.06 m, smoothUnion 0.025) over the crown and three rounded fringe tufts that fall over
the forehead to just above the brows; a light-brown #b08050 with #8a6038 in the grooves. Shirt
lighter: #4f8ad8; jeans darker and desaturated: #2e4470, so the shirt and the jeans differ by a
clear value step at 128 px. Keep the grey sneakers.
