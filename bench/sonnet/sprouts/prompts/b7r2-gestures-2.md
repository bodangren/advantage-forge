# Builder task: 13 gesture clips, fix pass 2 (review 6.2, bar 7.5)

Work in /home/daniebo/Desktop/advantage-forge. Read bench/sonnet/sprouts/cards/b7/review.json
(the independent review of your 13 clips) and this brief. Never run git. Every forge command
and tsc under `flock ~/Desktop/primary-parity-progress/heavy.lock`. Edit only
assets/parts/sprout-gestures.ts. Keep the seven week 1 clips as they are.

The reach limit is a fact of the chibi body: the fist can never go above the head, onto the
opposite shoulder, to the mouth, or to the ear. So design each gesture as a SILHOUETTE: straight
arms angled OUT so the fist clears the head outline in the front view, plus a whole-body motion
(head turn, spine lean or roll, hips up or down) that makes the gesture different from the
others at a glance. Five clips (point-up, look, listen, count-fingers, eat) all showed a fist at
the jaw; after this pass no two clips may share a pose. Do every numbered fix:

1. point-up: the right arm STRAIGHT, 50 deg out from vertical in the front view (the fist is beside
   and above the ear line, outside the head outline), index finger up; the head tilts 12 deg
   toward that side and back; the left arm hangs. Hold 0.8 to 1.3 s.
2. stretch-up: both arms STRAIGHT in a wide V, 55 deg out from vertical, fists outside the head
   outline; head back 10 deg; hips up 0.015 m (tiptoe). Hold 0.8 to 1.3 s.
3. reach: both arms STRAIGHT forward and up, 40 deg above horizontal and 25 deg out to the sides
   (clear of the head in the front view), spine leans 12 deg forward, hips up 0.015 m, head
   tilted back 8 deg. A small extra stretch at 1.0 s. Not "chin on fists".
4. count-fingers: the right arm bent, the fist beside the jaw (its limit), knuckles forward;
   three pumps of 0.04 m up at 0.5, 0.85, 1.2 s, and the WHOLE BODY bobs with each pump (hips
   down 0.012 m and back up, head nods 8 deg). The left arm on the hip (elbow out, fist at the
   hip). The bob and the hip hand make it different from point-up and look.
5. look: BOTH arms out to the sides, straight, 20 deg below horizontal (like balancing), and the
   body turns: spine yaw +30 deg at 0.5 s, -30 deg at 1.2 s, back at 1.8 s, the head leading
   the turn by 10 deg more, with a 5 deg forward lean. No hand at the face.
6. listen: the right arm bent with the fist beside the right cheek at the jaw line, the head
   tilted 25 deg to the right INTO the fist, the spine rolls 8 deg to the right, and the left arm
   out 30 deg. Hold 0.8 to 1.4 s. The strong tilt makes it different from count-fingers.
7. eat: the right fist comes to the CHIN (its limit) and the head lowers 15 deg to meet it, twice
   (0.5 and 1.2 s), with two chew nods of 5 deg after each; the left arm hangs. Hold the bite
   pose at 1.0 s is not required; the two bites are the gesture.
8. hop: a continuous arc, never a stop in the air: take-off 0.3 s, apex 0.5 s (hips +0.06 m),
   landing 0.7 s, knees bend 25 deg on the landing (legDrop), second hop 1.2 to 1.6 s. Arms swing
   up 60 deg on each take-off.
9. stamp: the right foot lifts 0.08 m with the knee bent 45 deg over 0.25 s and comes down in
   0.1 s, twice (lift at 0.3 and 1.1 s), with the hips dropping 0.015 m on each hit; arms out
   20 deg. The fast down-stroke is the stamp.
10. march: the knee comes up 60 deg and the foot lifts 0.1 m (the shoe clearly rises in the
    front view), four steps per loop, arms swinging 45 deg opposite, hips bob 0.012 m.
11. bow, sway, hug-self: keep as they are (8.0, 7.5, 7.5).

Checks, under the lock: `./forge animate sprout-sam --fast --clip gesture-<slug>` for each changed
clip and LOOK at the strip (the fists clear the head outline; the poses are distinct);
`./forge check sprout-sam` ends with `ground ok` and no clip sinks; no `warning:` lines;
typecheck shows no error in sprout-gestures.ts; then one final
`flock ~/Desktop/primary-parity-progress/heavy.lock ./forge build sprout-sam`. No edits and no
forge command after it. Report in 10 lines or fewer: each fix done or why not.
