# Builder task: Nan, Pat, May (Chibi Sprouts, batch b3)

Read bench/sonnet/sprouts/prompts/common-child.md first and follow it. Build the three children
in this order, each to its final `./forge all` before the next. Cards dir: bench/sonnet/sprouts/cards/b3.

## sprout-nan (assets/sprout-nan.ts)
Nan, a five-year-old girl. No picture exists; design her from the text and the style of
docs/sprout-mockups/pat.jpg (set `reference` to that file). Large dark-brown eyes; short black
hair in two small bunches (one small round bunch above each ear, tied with a small red band);
an orange T-shirt (#f08a2a) with one white five-point star on the chest (0.06 m across); red shorts
(#c8352e) to mid-thigh; white sneakers with grey soles. A friendly smile.

## sprout-pat (assets/sprout-pat.ts)
Pat, a five-year-old boy, the smallest of the children (scale the whole body 0.96 if the kind
allows it; otherwise same size). Picture: docs/sprout-mockups/pat.jpg. Large dark-brown eyes;
short black hair; a green T-shirt (#4f9a4a); brown shorts (#8a5a36); brown sandals (open straps
over the foot, no socks). He holds a small brown teddy bear (0.14 m tall, round ears, a lighter
muzzle) in the crook of his left arm against the chest, as a rigid body on `hand.L` or the chest
bone: `./forge check` must pass. A smile.

## sprout-may (assets/sprout-may.ts)
May, a five-year-old girl. Picture: docs/sprout-mockups/may.jpg. Large dark-brown eyes; long
straight black hair in a high ponytail (the `ponytail` style raised to the crown if it fits, else
a built chain) with a yellow five-point star clip (0.04 m) at the ponytail base; a yellow T-shirt
(#f2c23a); a blue pleated skirt (#3a62b8) to mid-thigh with 8 to 10 soft pleats; white socks to
the mid-shin; white sneakers. A smile.
