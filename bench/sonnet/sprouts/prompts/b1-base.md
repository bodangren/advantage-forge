# Builder task: sprout-base (the age-5 humanoid)

Work in /home/daniebo/Desktop/advantage-forge. Read AGENTS.md (the loop, conventions, API, rigging),
measure/tracks/asset_chibi_sprouts_r1_20261022/spec.md ("Changes after the start" and "Art rules"),
assets/parts/humanoid-kind.ts (all of it), the header of assets/parts/avatar-hair.ts, and
assets/avatar-base.ts. Never run git, not even stash or checkout. `pnpm` is a slow shim: run node_modules/.bin tools directly.

Goal: an age-5 proportion option on the humanoid kind that changes no existing asset, and the
first asset on it, `sprout-base`. Chibi Sprouts shows the Chibi Quest world at age 5: the same
chibi style, the same head and face, a smaller body.

1. Add `proportions?: HumanoidProportions` to `HumanoidKind`. Collect the kind's proportion numbers
   (HEAD_Y, HEAD, EYE, SHOULDER, ELBOW0, WRIST0, GRIP0, HIP, KNEE, ANKLE, the skeleton joints, the
   neck ends, the torso profile points, the fist offsets, the limb radii, and every literal y or z
   in the kind that follows from them: cheeks, chin, nose, ears, the face stencils, the clothes
   bands, the shoe and sole, the clip poses that move bones in meters) into one
   `HumanoidProportions` table. The default table holds exactly the current numbers, and the kind
   builds from the table. `avatarHair` hard-codes HEAD_Y and HEAD: give it the head position and
   size as a parameter with the current values as the default. Export the table type and `AGE5`.
2. `AGE5`: the same head size, face, and eyes; a shorter torso and shorter arms and legs, about
   0.85 m tall with the head about half of the height; the feet on y = 0; the same fist and grip
   design (scaled with the arm). Look at docs/sprout-mockups/pat.jpg and cast-lineup.jpg for the
   feel of a five-year-old body (a picture-book style; keep the chibi style and use them for the
   body proportion only). Keep the torso an upright scaled copy of the hero torso (the chest-armor
   contract), so clothes code on `h.torso`, `h.band`, and `h.joints` still works.
3. Prove nothing changed: `node scripts/mesh-same.mjs <name> --part assets/parts/humanoid-kind.ts
   --part assets/parts/avatar-hair.ts` prints SAME for avatar-base, baker, and acolyte.
4. Contract test (vitest, in the existing tests layout; find a test that builds an asset
   definition without a browser and copy its pattern): `sprout-base` has the same bone names, the
   same clip names, and the same `equip` socket names as `avatar-base`.
5. Build assets/sprout-base.ts with `humanoidAsset({ name: 'sprout-base', proportions: AGE5,
   reference: 'docs/sprout-mockups/pat.jpg', ... })` and the variants and hair of avatar-base,
   description "Chibi Sprouts age-5 base: the humanoid kind at five years old". Iterate with
   `./forge render sprout-base --fast` and LOOK at out/sprout-base/render.png (front, three-quarter,
   side, back) beside out/avatar-base/render.png. Check: the head sits on the neck with no gap and
   no overlap into the chest; the fists hang at about hip height; the feet stand on the ground; no
   part floats; the undershirt, pants, and shoes fit. Then the shared clips with
   `./forge animate sprout-base --fast --clip walk` (and idle, cheer): no sinking feet, and the
   fists never enter the torso or the head. `./forge check sprout-base` ends with `result ok` (or
   "no held items") and `ground ok`; no `warning:` lines.
6. Typecheck (`flock ~/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/tsc --noEmit -p .`) and `node_modules/.bin/vitest
   run` pass. Then one final `flock ~/Desktop/primary-parity-progress/heavy.lock ./forge all
   sprout-base`. No edits and no forge command after it. Then
   `python3 scripts/review-cards.py bench/sonnet/sprouts/cards/b1 sprout-base`.

Budget: 35 calls is a limit, not a target. Report: the AGE5 table, the three mesh-same results,
the test file, the check output, and anything you could not verify.

Machine rule (7 GB, shared with other sessions): run every heavy job (tsc, vitest, Chrome, textured
builds, vite) one at a time as `flock ~/Desktop/primary-parity-progress/heavy.lock <command>`.
Vitest: changed test files only, `--maxWorkers=1`.
