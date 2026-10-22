# Builder task: Pat and May, fix pass 2 (review 7.0 each, bar 7.5)

Read bench/sonnet/sprouts/prompts/common-child.md first and follow it (never run git, not even
stash; heavy jobs under the lock). Then read bench/sonnet/sprouts/cards/b3/review.json and LOOK at
bench/sonnet/sprouts/cards/b3/sprout-pat.png and sprout-may.png before the first edit. Do every
numbered fix and name any conflict in the report. Cards dir: bench/sonnet/sprouts/cards/b3r2.
Fix Pat to his final `./forge all` first, then May.

## sprout-pat (assets/sprout-pat.ts)
1. The bear is low at the belly and he holds it with one hand. Move the bear up to the chest and bend both arms around it, as in the painting.
2. The hair is a smooth cap with one side sweep. The painting shows messy short tufts. Add tufts at the fringe and the crown.
3. The shorts are plain. The painting shows cargo shorts with side pockets. Add the pockets.
4. At 128 px the bear becomes a small brown spot. A larger bear at the chest will read better.
5. The walk is readable but stiff, with short steps.

Start values: hug the bear at the chest with both arms: set the kind's `hold` (a two-hand hold)
with the elbows at about [0.15, 0.28, 0.06] and the wrists at [0.07, 0.27, 0.13] (left-side
coordinates; the right mirrors), the bear 0.16 m tall between the fists with its head above
the fists, rigid on `hand.R` or the chest; `./forge check` must pass. Hair: keep one smooth shell
but add three or four soft rounded tufts at the fringe and crown (no spikes). Shorts: two small
cargo pockets (0.035 m boxes, rounded) on the sides.

## sprout-may (assets/sprout-may.ts)
1. The ponytail has a lumpy, segmented surface. The cast sheet shows long straight hair. Make the ponytail one smooth, tapered lock.
2. The skirt has a wavy ruffle hem but no pleats. Add vertical pleat folds from the waist to the hem.
3. From the front, the ponytail base reads as a topknot bun. Move the base a little back on the crown, as in the painting.
4. The painting shows side-swept bangs. The model has a bare forehead with a center point. Add a short side fringe.
5. The star clip is small and sits on the front of the ponytail base. The painting shows a larger star at the side. At 128 px the clip is almost lost.
6. The walk strip shows little or no ponytail swing. Add a small follow-through swing.

Start values: the ponytail as one smooth tapered chain (sdf.chain, 4 points from the crown
down to the shoulder blades, radii 0.035 to 0.012) with no visible segments, and a small flat
base under the clip, not a bun; two soft side bangs framing the face; a ponytail bone
('ponytail' on head) with a small swing in the walk. Skirt: 8 to 10 real pleats, each a
rounded ridge 0.008 m deep that runs from the waistband to the hem (an extruded star-like
profile revolved or a displace with a cos term in the angle), the hem at mid-thigh.
