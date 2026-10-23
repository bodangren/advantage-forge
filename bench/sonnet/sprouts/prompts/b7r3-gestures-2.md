# Builder task: 13 gesture clips, fix pass 3 (review 7.0, bar 7.5, last pass)

Work in /home/daniebo/Desktop/advantage-forge. Read bench/sonnet/sprouts/cards/b7r2/review.json
and this brief. Never run git. Every forge command and tsc under
`flock ~/Desktop/primary-parity-progress/heavy.lock`. Edit only assets/parts/sprout-gestures.ts.
Keep hop, bow, stretch-up, sway, hug-self, point-up, look, listen, eat, count-fingers as they are.

Three fixes:

1. march and stamp: the thigh comes through the shorts at the hip (a jagged flap) and the shin
   comes through the shoe top at every lift. Lower the lifts until the strips show no poke-through:
   march thigh 40 deg forward with the knee bent 35 deg (the foot stays level, toes down a little);
   stamp knee bent 35 deg with the foot lifted 0.05 m, the foot level. If a flap still shows at
   those angles, lower again by 10 deg; a clean smaller step beats a tall broken one. Keep the fast
   stamp down-stroke (0.1 s) and the hip drop; keep the march arm swing and hip bob.
2. reach: make it different from stretch-up. Both arms STRAIGHT FORWARD, 15 deg above horizontal
   and 10 deg out, toward something in front of the child; the spine leans 18 deg forward from
   the hips; the head looks at the hands (down 5 deg); hips up 0.015 m at 1.0 s. In the front
   view the fists point at the camera at chest height, not at the jaw.
3. stamp: `./forge check sprout-sam` must end with `ground ok` (the reviewer saw the right shoe
   0.02 m lower at 0.15, 0.35, 1.15 s; if it is a sink, fix it with legDrop).

Checks, under the lock: `./forge animate sprout-sam --fast --clip gesture-march`, `-stamp`,
`-reach` and LOOK at each strip at the lift peaks (no thigh through the shorts, no shin through
the shoe); `./forge check sprout-sam` ends with `ground ok`; no `warning:` lines; typecheck shows
no error in sprout-gestures.ts; then one final
`flock ~/Desktop/primary-parity-progress/heavy.lock ./forge build sprout-sam`. No edits and no
forge command after it. Report in 8 lines or fewer.
