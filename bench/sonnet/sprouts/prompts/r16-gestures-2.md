# Review task: the 13 new Sprout gesture clips (weeks 2 to 6)

Work in /home/daniebo/Desktop/advantage-forge, read-only except the review file. Never run git.
Machine rule: every heavy job runs as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`,
one at a time; you need none.

Read the brief bench/sonnet/sprouts/prompts/b7-gestures-2.md (the table of 13 poses). LOOK at
every strip `out/sprout-sam/anim/gesture-<slug>.png` for the slugs point-up, reach,
count-fingers, sway, look, hop, stretch-up, eat, hug-self, bow, listen, stamp, march (the GIFs
beside them show the motion). Sam is a five-year-old; the clips are sung along by a kindergarten
class in a video, seen at about 900 px tall.

For each clip, rate 1 to 10 against the brief: does the pose at 1.0 s read as the named gesture
at a glance (a five-year-old would copy it), is the motion big and clear, does it start and end
in the idle stance, and is anything wrong (a hand through the head or body, a foot under the
floor, a limb that snaps, an arm that reaches past the age-5 limit). Mark a clip CRITICAL for
a hand or arm inside the head or body, or a foot below the floor. The bar is 7.5.

Write bench/sonnet/sprouts/cards/b7/review.json:
`{"clips": {"<slug>": {"rating": n, "critical": bool, "notes": "..."}}, "overall": n, "fixes": ["the largest problems first, one line each, at most 8"]}`.
Then report in 10 lines or fewer: the overall rating, the clips below the bar, the critical ones.
