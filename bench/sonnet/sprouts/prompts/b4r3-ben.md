# Builder task: Ben, fix pass 3 (review 7.0 twice, bar 7.5)

Read bench/sonnet/sprouts/prompts/common-child.md first and follow it (never run git, not even
stash; heavy jobs under the lock). Then read bench/sonnet/sprouts/cards/b4r2/review.json and LOOK
at bench/sonnet/sprouts/cards/b4r2/sprout-ben.png and docs/sprout-mockups/ben.jpg before the first
edit. Do every numbered fix and name any conflict in the report. Cards dir:
bench/sonnet/sprouts/cards/b4r3. Keep the shared base walk: do not wrap or replace any clip.

## sprout-ben (assets/sprout-ben.ts)
1. The hair surface is a mass of round balls, so the hair reads as curly. The painting shows straight, tousled hair with soft, pointed locks that point in different directions. Replace the round lumps with tapered locks that end in soft points. Keep the volume. Let three or four fringe locks of different lengths fall to the eyebrows, and add pointed tufts at the crown and above the ears.
2. The jeans are baggy and have a tight, gathered cuff at the ankle, so they look like jogger pants. The colour is a dark navy. The painting shows straight-leg jeans in a mid denim blue with a lighter fade at the thighs and the knees. Make the legs straight with an open hem on the shoe. Make the denim a little lighter, but keep it darker than the shirt.
3. The smile is a small, closed line. At 128 px the mouth does not read, and with the heavy base eyebrows the S sprite looks stern. The painting shows a wide, open smile with teeth. Make the smile wider and open it with a white tooth band.
4. The sneakers are plain grey round shapes with no sole. At 128 px they read as grey feet. Add a white sole band and a toe-cap line so that the shoes read as sneakers.
5. The hair colour is a little too orange and saturated. The painting shows a chestnut light brown with lighter highlights. Make the hair colour a little less saturated.

Start values: replace the round mounds with 8 to 10 soft tapered locks (sdf.chain of three
points each, radii 0.03 to 0.01, smoothUnion 0.02 onto one smooth shell) that sweep in
different directions over the crown and three that fall over the forehead; no spikes, each lock
rounded. Hair #a07048 (less orange). Jeans straight to the ankle with no cuff, mid-blue denim
#3e5a9c with the fade; the shirt a step lighter, #5c94e0. Smile: a wide open smile (an arc 0.07 m
wide plus a small open mouth ellipsoid with a white tooth band) painted as the other laughing
children (see assets/sprout-sam.ts for the open-smile paint). Sneakers: a white sole band 0.008 m
tall around the grey shoe.
