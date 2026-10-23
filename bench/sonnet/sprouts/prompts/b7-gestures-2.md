# Builder task: 13 new gesture clips for the Chibi Sprouts (weeks 2 to 6)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (rigging and animation, motion
helpers), assets/parts/sprout-gestures.ts (the seven week 1 clips: read every clip, keep the
helpers, the arm IK with `reach`, the hand frames, and the style), and assets/parts/humanoid-kind.ts
lines 660 to 760 (the kind's idle and walk, the leg joints, `motion.gait`, `legDrop`). Never run
git, not even stash or checkout. Machine rule: every heavy job (tsc, textured forge commands,
Chrome) runs as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`, one at a time;
`./forge animate --fast` and `./forge check` also go under the lock tonight (memory is tight).
Edit only assets/parts/sprout-gestures.ts.

Add 13 clips to `sproutGestures(k, h)`, each `gesture-<slug>`, 2 s, looping, starting and ending
in the idle stance, with the named pose held exactly at 1.0 s (ease in and out), the same style as
the seven clips there. They are sung by five-year-olds in a classroom video: big, clear, friendly,
no weapon motions. The hands are closed fists (the right fist may carry a short index finger).

| slug | pose at 1.0 s | motion over the loop |
| --- | --- | --- |
| point-up | right arm straight up, fist above the head, head tilted back 12 deg | arm rises 0.3 to 1.0 s, holds, returns |
| reach | both arms forward and up (fists at eye height, 0.1 m ahead of the face), spine leans 8 deg forward | arms rise together, a small stretch at 1.0 s, return |
| count-fingers | right fist raised beside the head, palm forward, elbow at shoulder height | the fist pumps up 0.03 m three times at 0.5, 0.85, 1.2 s (one, two, three), returns |
| sway | hips and spine roll 8 deg to +X, head counter-rolls 4 deg | a full left-right-left sway over the 2 s, arms relaxed, 2 cycles of the opposite arm swing (small) |
| look | right fist flat above the brow like a visor, head turned 25 deg to the left | the hand comes up by 0.5 s, the head turns left at 1.0 s and right at 1.5 s, returns |
| hop | both feet off the floor: hips up 0.06 m, knees bent 25 deg, arms swung up 60 deg | two hops per loop (take-off at 0.3 and 1.3 s), legs bend before take-off and after landing (`legDrop` on the landings) |
| stretch-up | both arms straight up, fists together above the head, hips up 0.015 m (tiptoe), head back 8 deg | arms rise, a hold, return |
| eat | right fist at the mouth, elbow out, head tilted 8 deg | the fist goes to the mouth twice (0.6 and 1.3 s), small chew nod |
| hug-self | both arms cross the chest, each fist on the opposite shoulder, head tilted 6 deg | arms close by 0.8 s, a small squeeze rock (spine roll 3 deg) at 1.0 to 1.3 s, return |
| bow | spine bent 35 deg forward, head down 15 deg, arms hanging straight | bend over 0.4 to 1.0 s, hold to 1.3 s, return |
| listen | right fist cupped behind the right ear, head tilted 15 deg to the right | the hand comes up by 0.7 s, the head tilts at 1.0 s, return |
| stamp | the right foot lifted 0.08 m with the knee bent 45 deg, arms out 20 deg | two stamps (lift at 0.3 s, down at 0.6 s; lift at 1.1 s, down at 1.4 s), a small hip drop on each stamp |
| march | marching on the spot: the left knee up 50 deg, the right arm forward 40 deg, the left arm back | four steps per loop (legs alternate every 0.5 s), no forward travel, the hips bob 0.01 m |

Rules from week 1: the age-5 arm reach is 0.138 m from the shoulder to the wrist, so a raised
hand beside the head is as high as the jaw line allows (`look`, `listen`, `count-fingers`,
`eat` sit at the jaw or the ear, never through the head). No hand enters the head or the body.
Feet never go below the floor. Clip names and key times of the seven existing clips stay as they are.

Checks: under the lock, `./forge animate sprout-sam --fast --clip gesture-<slug>` for each new
clip and LOOK at `out/sprout-sam/anim/gesture-<slug>.png` (every clip at least once; fix the
largest problem first); `./forge check sprout-sam` ends with `result ok` and `ground ok`;
`./forge animate sprout-pip`-style dog checks are not needed. Typecheck the module:
`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .` shows no
error in sprout-gestures.ts (other files have known errors; ignore them). Then one final
`flock ~/Desktop/primary-parity-progress/heavy.lock ./forge build sprout-sam` so the GLB holds the
clips. No edits and no forge command after it. Then report in 12 lines or fewer: the 13 clips
done, any pose that could not meet its spec and why, the triangle count unchanged, the checks.
