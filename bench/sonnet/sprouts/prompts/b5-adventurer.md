# Builder task: sprout-adventurer and the week 1 gesture key frames

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, API, rigging and
animation, recipes), measure/tracks/asset_chibi_sprouts_r1_20261022/spec.md ("Changes after the
start", "Art rules"), assets/parts/humanoid-kind.ts (header, `HumanoidKind`, `HumanoidShape`,
the `proportions` option and `AGE5`, and the clip code), assets/sprout-base.ts, assets/adventurer.ts
(the hero at full age), assets/parts/adventurer-lantern.ts, and one dressed kind user,
assets/baker.ts. Never run git, not even stash or checkout. `pnpm` is a slow shim: run node_modules/.bin tools directly.

## 1. sprout-adventurer (assets/sprout-adventurer.ts)

The Chibi Quest adventurer at age 5 on the humanoid kind with `proportions: AGE5`. Reference:
docs/hero-mockups/adventurer_001.jpg (set `reference`; LOOK at it). Keep his identity: the tousled
brown hair (#84502c) with soft rounded tufts (no spikes), the teal bandana (#4f9c8a) with knot
tails, the red neckerchief (#c8413a), the cream shirt (#efe2c4, slot `cloth` first), grey-green
short trousers (#6e7560) to the knee, brown shoes. No sword, no pack, no map: his hands are free
for the gestures. One non-combat signature item: a small brass lantern (0.12 m) hangs from a
short strap on his belt at the left hip (rigid on `hips`), so both hands stay free. Rated G.
Keep the kind's variant slots and clips. Face: the kind's face with a wide happy grin.

## 2. The gesture clips (assets/parts/sprout-gestures.ts)

A shared module `sproutGestures(k, h)` (or an array of `AnimationDef`) that any humanoid Sprout
adds in `extra`; sprout-adventurer uses it. Each gesture is one clip named `gesture-<slug>` of
`duration: 2`, `loop: true`, on the base skeleton, that starts and ends in the idle stance. Key
frames are read at fixed times with the cut-out tool, so the clip must hold the named pose
exactly at these times (ease into and out of them):

| clip | key frames (seconds) | pose |
| --- | --- | --- |
| gesture-clap | 0.5 apart, 1.0 together | hands in front of the chest, palms facing, 0.14 m apart, then touching |
| gesture-wave | 0.5 left, 1.0 right | the right arm raised, the hand at head height beside the head, the hand swung 25 degrees to one side, then the other |
| gesture-nod | 0.5 up, 1.0 down | the head tilted 12 degrees up, then 15 degrees down, the body still |
| gesture-point-to-self | 1.0 | the right hand on the chest, the index finger direction toward the chest, the elbow out |
| gesture-point-forward | 1.0 | the right arm straight forward at shoulder height toward +Z |
| gesture-hands-out | 1.0 | both arms out to the sides at 45 degrees below horizontal, palms up and open |
| gesture-idle | 1.0 | the rest stance with a soft breath, arms at the sides |

Fists: the kind's hands are closed fists. Pointing and open palms need a hand shape. Choose the
simplest way that reads at 1024 px: a visible index finger on the pointing fist (a small cone
tagged `hand.R`, present in every clip, as the adventurer's hand style) is acceptable; do not
rebuild the hand system. Describe your choice in the report.

Checks: `./forge animate sprout-adventurer --fast --clip gesture-clap` (and wave, nod,
point-to-self, point-forward, hands-out): LOOK at each strip once. No hand enters the head or the
torso; the feet stay on the ground; the figure faces +Z and is unmirrored; the lantern stays at the
hip. `./forge check sprout-adventurer` ends with `result ok` or "no held items" and `ground ok`;
no `warning:` lines; under 65,000 triangles.

## 3. Finish

Typecheck (`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`), then one final
`flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all sprout-adventurer`. No edits and no
forge command after it. Then
`python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b5 sprout-adventurer=gesture-clap`.

Budget: 40 calls is a limit, not a target. Report: the bodies, the hand choice, the clip names and
key times, the check output, and anything you could not verify.

Machine rule (7 GB, shared with other sessions): run every heavy job (tsc, vitest, Chrome, textured
builds, vite) one at a time as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`.
Vitest: changed test files only, `--maxWorkers=1`.
