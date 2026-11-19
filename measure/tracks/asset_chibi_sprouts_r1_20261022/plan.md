# Chibi Sprouts, release 1 art

Status: in progress (started 2026-10-22). The plan records execution state. The
[specification](./spec.md) records the brief, the decisions, and the format; its section "Changes
after the start" wins where it differs from the rest. Art is due 2026-11-15.

## Method

- The owner chose a fresh Forge session for the build work (2026-10-22): a long orchestrator
  context costs more than the agents (`bench/sonnet/npc-serial/method.md`). Keep orchestrator
  calls to the minimum.
- One character builder at a time (`forge-sonnet-high`), and one narrow step for each agent. An
  independent reviewer rates each batch; the builder never rates its own work. Bar 7.5 for
  characters.
- Textured builds and renders run one at a time under `heavy.lock`.
- Contacts: `Storytime [17cf32]` and `Workbooks [bfc01e]` (cross-session names). At the start,
  message both once with the delivery folder. When the week 1 set is complete, send both the
  manifest path. Otherwise send short notes at finished stages only, with no daily reports.
- The cast beyond 8 is the owner's item S26 on the Storytime approval page; he answers after the
  week 1 look check. Do not ask him again.

## Phase 1: Design and contract

- [x] Task: Record the brief, the owner decisions (S18, S19), the Storytime answers, the inventory (f9879c55)
  change, and the week 1 format in the specification (2026-10-22). Commit: f9879c55.
- [x] Task: Delivery folder: `out/chibi-sprouts/r1/` with a JSON manifest (Storytime, 2026-10-22). (f9879c55)
  Week 1 layout and manifest keys: `bench/sonnet/sprouts/method.md`. Storytime and Workbooks got the
  folder on 2026-10-22 (session chibi-sprouts). Prompts and the run log: `bench/sonnet/sprouts/`.
  Commit: f9879c55.
- [x] Task: Age-5 proportion table: `HERO` and `AGE5` in `assets/parts/humanoid-kind.ts` (96cfd025)
  (`proportions` option; AGE5 = leg 1.05, torso 0.84, arm 0.8, shoe 0.72, forearm turn, bob 1.0).
  Proof: `bench/sonnet/sprouts/mesh-same-batch.sh` prints SAME for 9 kind users and 4 hair assets
  (2026-10-22). Commit: 96cfd025.
- [x] Task: Skeleton contract test `tests/sprout-base.test.ts` (bones, parents, clips, sockets equal (96cfd025)
  avatar-base; the head equals HERO) (2026-10-22). Commit: 96cfd025.

## Phase 2: Tools

- [x] Task: `./forge cutout <name> --out <dir> --ppm --canvas --clip --at` renders straight soft (96cfd025)
  alpha with no shadow at one scale (`src/render/cutout.ts`, `src/png.ts`, `tests/cutout.test.ts`);
  the sprite pass keeps binary alpha (2026-10-22). Commit: 96cfd025.
- [x] Task: Delivery step: the cutout command writes `manifest.json` (ppm, canvas, footPoint, files); (96cfd025)
  `scripts/cutout-check.mjs <dir>` checks size, alpha, halo, and foot row. Week 1 scale: 1080 px/m
  on 1024 x 1200, foot point (512, 1184) (2026-10-22). Commit: 96cfd025.

## Phase 3: Week 1 test set (owner direction: first)

- [x] Task: `sprout-base` built and accepted at 7.5 after three passes and three independent (96cfd025)
  reviews (7.0, 7.0, 7.5; `bench/sonnet/sprouts/cards/b1*/review.json`, 2026-10-22). Open notes:
  stiff upper body in the walk; the shared avatar face reads older than five.
  Commit: 96cfd025.
- [x] Task: `sprout-pip` built; three passes, three reviews (6.5, 7.0, 7.0): the stop rule applies. (124f0276)
  Rated 7.0, on the follow-up list: replace the two crown spikes with one soft cream tuft; ears
  golden with dark tips only; a larger chest bib; round paws (2026-10-22). Ships in week 1 for the
  owner's look check.
  Commit: 124f0276.
- [x] Task: Nan 7.5, Sam 7.5, Mia 7.5 (first review), Pat 7.5 (second), May 7.5 (third, after a (cdeae0e6, b786231f, d866bab1, 88b68946, c64fee4d)
  waist clash) on `sprout-base`; cut-outs in `out/chibi-sprouts/r1/week1/cast/` (2026-10-23). Ben 7.0 after three
  reviews (stop rule), on the follow-up list: soft fluffy hair instead of clay-like locks (two point up
  in the side view), a clearer smile at 128 px, a visible sole band. Reviews: `bench/sonnet/sprouts/cards/b3*`, `b4*`.
  Debt: two builders wrapped `k.animation` for per-character motion (Ben's removed; May's ponytail
  swing kept); the kind needs an extra-pose hook for a character's own bones.
  Commits: cdeae0e6 (Nan), b786231f (Sam, Mia), d866bab1 (Pat), 88b68946 (May), c64fee4d (Ben).
- [x] Task: `sprout-adventurer` 7.5 (third review) with the shared gesture module (020baa34, 43c96d3c)
  `assets/parts/sprout-gestures.ts` (clips `gesture-<slug>`, key frames at 0.5 and 1.0 s); ten key
  frames in `out/chibi-sprouts/r1/week1/gestures/adventurer/` (2026-10-23). Limit: the wave hand
  reaches the jaw, not the eye (the age-5 arm reach). Commits: 020baa34, 43c96d3c.
- [x] Task: Classroom scene `scenes/maps/classroom.ts` (generator `scripts/design-classroom.mjs`, (96cfd025)
  `bright` interior mode in `src/scene/main.ts`, `FORGE_SHOT_SIZE` in `scripts/shoot-map.mjs`);
  `out/chibi-sprouts/r1/week1/scenes/classroom.png` and `rug.png` (450 px/m) (2026-10-22). Look
  check items: dark window panes, half-timber walls. Commit: 96cfd025.
- [x] Task: Delivered 2026-10-23: `out/chibi-sprouts/r1/week1/manifest.json`, 8 cast x 2 views (43c96d3c)
  (plus Pip's sit), 10 gesture frames, classroom and rug, `cast-sheet.png` and `gesture-sheet.png`;
  `scripts/cutout-check.mjs` result ok on cast and gestures; Storytime and Workbooks told.
  Workbooks (2026-10-23, commit 7213f4e): the set works in the compositor with no change to the
  canvas, the scale, or the foot point; the week 1 test video is rendered (actors at 556 screen
  px/m, from the rug in classroom.png; the gesture inset box is x 222 to 799, y 240 to 1183).
  Storytime: the set is on the owner's page as F1 to F4. Commit: 43c96d3c.
- [x] Task: The owner's look check. Passed 2026-10-23 04:51 (via Storytime): F1 cast sheet, F2 (c6e1b13b)
  Pip and Ben close up, F3 gesture sheet, F4 classroom and rug, no comments. The age-5 base and
  the cast style are approved. Commit: c6e1b13b.
- [x] Task: F5, the owner's pass on the week 1 test video (2026-10-23 04:55, via Storytime). Pass (37c22171)
  on the video plan, with two comments: the video is not engaging because the static assets do
  not move much ("We should rethink static assets"), and F7: the characters do not appear on the
  rug but in front of a screen ("We really should rethink our entire model").
  Commit: 37c22171.
- [ ] Task: S27, the owner's decision on the delivery model (Storytime page). My costs sent
  2026-10-23: (B) alpha PNG loops per gesture, 3 to 4 days (a --frames cut-out option, hop clip,
  a face rig for sing-mouth and blink), 3 to 4 min per loop; (C) full in-scene video renders from
  a timeline tool on the scene page plus the showcase recorder, 3 to 4 days, 15 to 30 min per
  85 s song at 24 fps, fixes F5 and F7; (D) in-scene stills per line, 2 to 3 days, 1 to 2 s per
  still, fixes F7 only. Engine: three.js in headless Chromium, software GL, one Chrome at 0.8 to
  1.5 GB RSS. Weeks 2 to 7 are on hold until S27 and S26 (cast size: 13 or the cap of 8).
  Storytime recommended C. Input format for C (sent 2026-10-23): Workbooks' spec.json unchanged
  (`../Workbooks/video/storytime-song/public/l2/w01/spec.json`: lines with start, end, actors,
  gesture text, word times) plus a stage.json from Storytime (marks in rug metres with yaw,
  camera keys in seconds with az/el/dist/tx/tz, optional moves and a portrait camera list).
  Output: song.mp4 1920x1080 at 24 fps without sound, song-phone.mp4 on request, optional JPEG
  frames. Workbooks muxes the audio and overlays lyrics and the inset.
  Follow-ups after F5: Pip (crown spikes, ear colour, bib, paws), Ben (fluffy hair, smile at
  128 px, sole band), the classroom window panes, the stiff base walk, the kind extra-pose hook.

## Phase 4: In-scene song renders (option C, approved 2026-10-23 15:30)

The owner approved S27: full in-scene renders. Forge renders the silent song video with the cast
on the classroom rug; Workbooks muxes the audio and overlays lyrics, the inset, and the screens.
Contract and commands: `docs/storytime-song.md`.

- [x] Task: The timeline tool: `src/song/timeline.ts` (pure: spec.json + stage.json to actor (e43ccce0)
  paths, clip cues, camera keys; `tests/song-timeline.test.ts`, 9 tests), `song.html` +
  `src/song/main.ts` (the classroom with the scene page's lighting, skinned actors, a mixer,
  `__song.load/seek`), `scripts/song-record.ts` (sheet, stills, record to H.264 through ffmpeg).
  The six children got the gesture clips (`sproutGestures` in `extra`) and were rebuilt (2026-10-23).
  Commit: e43ccce0.
- [x] Task: Test cut 1 of week 1 ("Hello, I Am Pip", 78.4 s): `out/chibi-sprouts/r1/week1/song/` (e43ccce0, 8370c263)
  sheet.png (12 stills) and song.mp4 (1920x1080, 24 fps, no sound, 35 MB). Storytime's stage.json:
  Pip and Nan front, five children in a row behind, 31 camera keys, yaw 0. Cost: page load 46 s,
  1881 frames in 344 s (0.18 s per frame), 1 GB RSS. Pointer sent to Storytime 2026-10-23 17:00.
  Commits: e43ccce0, 8370c263.
- [ ] Task: The owner's pass on test cut 1 (Storytime relays; page items C1 the scene cut, C2 the
  contact sheet, C3 the sun high or side, C4 Pip's howl or a quieter Pip, C5 the face rig now or
  later), then cut 2 with Storytime's framing fix (the back row moves in to x ±1.2, ±0.6, 0: Ben
  was cut by the right edge in the singles on Nan at 17.5 s and 33 s), then the portrait cut (F9, on hold:
  Workbooks keeps the 16:9 video as a band) and stage.json for weeks 2 to 7.
- [x] Task: Tonight's order (owner, 2026-10-23 night, via Storytime: develop Storytime as far as (46342fe9, 0a425ef7)
  possible until 05:00). Cut 2 of week 1 (back row at x ±1.2, ±0.6, 0; `song-cut2.mp4`, 10 min).
  The singing face: kind option `sing` (open mouth on a `mouth` bone, eyelids on an `eyelids`
  bone, hidden 3 cm inside the head at rest; the page moves them per word and per blink;
  `SING_OUT` 0.046 / 0.038 m; commits 46342fe9, 0a425ef7). Seven Sprouts rebuilt twice. Cut 3
  of week 1 with the singing face (`song-cut3.mp4`). Render script
  `bench/sonnet/sprouts/render-week.sh <week> <cut>`.
- [x] Task: 13 new gesture clips for weeks 2 to 6 (point up, reach, count fingers, sway, look, (0bb18f6e)
  hop, stretch up, eat, hug self, bow, listen, stamp, march) on the shared module (0bb18f6e):
  three builder passes (b7, b7r2, b7r3) and three Opus reviews (6.2, 7.0, 7.2; stop rule). At the
  bar: hop 8.0, bow 8.0, stretch-up, sway, hug-self 7.5. Under it: point-up, look, listen, eat,
  stamp 7.0; reach, count-fingers, march 6.5. The chibi arm (0.138 m) never clears the head, so
  every gesture is a whole-body silhouette. Follow-up list (debt): fix the shorts-leg and shoe-cuff
  skin weights on the age-5 base, then restore the taller march and stamp lifts (the stamp shows
  a shoe notch for 0.15 s at the peaks); reach reads as "paws up" in the front view; point-up has
  no visible finger at video size; count-fingers reads as a fist pump; look reads as "airplane".
- [x] Task: Cut 1 of weeks 2, 3, 5, 6 from Storytime's drafts (fdcc0957)
  (`~/Desktop/primary-parity-progress/storytime-stage/l2/w0N/stage.json`, all in the classroom):
  `out/chibi-sprouts/r1/week{2,3,5,6}/song/song-cut1.mp4` + sheets, 5 to 6 min each (2026-10-24
  00:21). Notes to Storytime: Pip hidden behind Pat in week 2; the week 5 solo needs a closer camera.
  Both applied in the stage files; cut 2 of weeks 2 and 5 rendered 00:38 (`song-cut2.mp4`). The
  stage file now takes `sun` (high or side) and `dog` (howl or quiet) for the owner's C3 and C4;
  side-sun comparison stills in `out/chibi-sprouts/r1/week1/song/sun-side/` (Ben's hair shades
  his eyes with the side sun). Commit: fdcc0957.
- [ ] Task: The owner's notes on cut 2 (2026-10-24 04:48, via Storytime): week 5 PASS ("a body
  and the context is there"); weeks 2, 3, 6 FAIL for one cause: the objects the song names are
  not in the picture (the apple, the sky, the animals, the numbers), and one sustained take feels
  lifeless. Stage contract v2 (`~/Desktop/primary-parity-progress/forge-stage-contract-v2-20261024.md`,
  `docs/storytime-song.md`): `sets` keyed by the spec's scene names (map, light, sun, marks,
  camera, props, pictures), hard `cuts` (default: every line whose scene changes), `props`
  (built Forge assets at x/z, count, or held on a hand bone), `pictures` (image cards from files
  next to the stage file, served at `/stage/`). The page keeps every room loaded and switches
  per shot; outdoor maps get the scene page's outdoor light. v1 stage files stay valid.
  Storytime accepted the contract and rewrote the week 2, 3, 6 stage files on it (06:50, with
  stand-in PNG cards for the duck, kite, ball, grape, sun, cloud, numbers). Stills per set:
  `out/chibi-sprouts/r1/week{2,3,6}/song/v2/v2-sheet.png`. Found and fixed from the stills: the
  meadow's rug origin stands in a flower bed (now `MAP_ORIGINS`: a clear stage and camera
  corridor per map, `origin` and `heading` per set); Pip has no hand bone (a held prop falls
  back to `jaw`, then `head`; `bone` names one); the GLTF loader strips dots from bone names
  (`hand.R` is `handR` in the page); the outdoor sun offset is in stage space so a set facing
  180 keeps lit faces. Not built (pictures for now): duck, kite, ball, grape, sun, cloud, easel.
- [x] Task: Full renders on contract v2 (2026-10-24): week 2 cut 3 (09:16), week 3 cut 2 (11:38, (697ae4a9, 5955458d)
  re-rendered 11:54 after Storytime moved the board pictures in front of the board face and set a
  closer classroom camera), week 6 cut 2 (11:48; re-rendered 12:30 after Storytime's lake camera fix, which
  framed the cast close and took the boulder out). Paths `out/chibi-sprouts/r1/week{2,3,6}/song/song-cut<N>.mp4` with `-sheet.png`.
  Storytime muxed the song audio and put weeks 2, 3, 6 on the owner's page (C1W2, C1W3, C1W6).
  A 74 s song renders in about 6 minutes (0.20 s per frame) after a page load of 8 to 60 s.
  Commits: 697ae4a9, 5955458d.
- [x] Task: Adventurer gesture stills for weeks 2 to 7 (Workbooks request through the Forge (697ae4a9, e7816ae8)
  session, 2026-10-24; the owner's order of 2026-10-23 item 3 covers it): 22 frames of 14 gestures
  (set 2 plus the new `gesture-turn`, a spin for week 7 "Is it a top?") at the week 1 scale in
  `out/chibi-sprouts/r1/week2-7/gestures/` with a manifest in the Workbooks shape
  (`bench/sonnet/sprouts/cutout-gestures-w2-7.sh`). Handoff note:
  `~/Desktop/primary-parity-progress/forge-gestures-w2-7-20261024.md`. `gesture-turn` has no
  independent review yet. `reach` stands on tiptoe (lowest opaque row 1174), flagged by the check.
  Workbooks used the set in its commit bc025fb (45 song-line pictures) and asked for three held
  picture poses that read in a 64 px head-to-belt crop: `picture-march`, `picture-stamp`,
  `picture-sway` (clips for pictures only), delivered as `*-picture.png` with extra manifest keys.
  Commits: 697ae4a9 (stills), e7816ae8 (picture poses).
- [ ] Task: STOP (owner, 2026-10-24 17:38): Daniel failed C1W2 (week 2 cut 3): cuts not on the
  beat, no opening scene, the sky set reads as a small sun on a blue background, props appear
  before the line names them, the animation does not match the tempo. No song render until he
  passes an option from Storytime's re-evaluation. Forge engine facts for it:
  `out/chibi-sprouts/forge-engine-facts-20261024.md` (beat grid from the spec bpm, measured
  100/95/100 bpm; opening shot; real sky and props to build; hybrid 2D backgrounds; render
  time 4.5 to 5 min per song minute).
- [ ] Task: Week 4 (Lily, Tom, Mom, Dad, Grandma, Grandpa) waits for S26: six characters beyond
  the eight. Do not build before the owner's answer; do not ask him.
  - PM decision 2026-11-19 (S26 interim): build the six week-4 characters now (Lily, Tom, Mom,
    Dad, Grandma, Grandpa) with a new adult base, in the normal Forge flow and look rules;
    Daniel's S26 answer has no date and must not be asked; if he later answers 8, the six stay
    as assets for later weeks. Due 11-24.
- [ ] Task: After the owner's C1 to C5 answers: a side sun if he wants longer shadows, a quieter
  Pip if he wants it, the portrait cut (F9).

## Phase 5: The rest of the inventory (after the look check)

Role gate: the jr-green role gate fails while this phase has open tasks (2026-11-16: 6 open; 2026-11-17: 3 open and [x] tasks without SHA). A failed gate is a failed gate; the orchestrator owns a green gate at phase end.

Note (Workbooks, 2026-10-23): the phone cut of the week 1 song video is portrait (9:16). Workbooks
uses the week 1 set unchanged: classroom.png full width at 16:9 in the top band, cast fronts at the
landscape scale rule, the Adventurer gesture frames about 900 px tall in the bottom part of a
1920 px frame. A portrait classroom render (1080x1920) is a candidate for the Phase 4 scene work;
Workbooks does not wait for it.

- [ ] Task: The owner confirms the cast beyond 8 (Lily, Mom, Dad, Grandma, Grandpa, Tom) and the
  cost.
  - PM decision 2026-11-19 (S26 interim): build the six week-4 characters now with a new adult
    base; Daniel's S26 answer has no date and must not be asked. Due 11-24.
- [~] Task: The remaining cast (an adult base for Mom, Dad, Grandma, Grandpa; Tom at about eight).
  - PM decision 2026-11-19 (S26 interim): build the six week-4 characters now (Lily, Tom, Mom,
    Dad, Grandma, Grandpa) with a new adult base, in the normal Forge flow and look rules. Due 11-24.
  - adult base: `ADULT` proportion set in `assets/parts/humanoid-kind.ts` plus
    `assets/sprout-adult-base.ts` (neutral clothes), same skeleton bone names, `sproutFace`,
    `sproutHands`, `sing`, and `sproutGestures` support; AGE5 and HERO output unchanged.
    Base 776fc435; look-check fix round ca186c82 (slim 4.7-head adult, thin-disc sing lids);
    review round 50795b06 (smaller flatter shoes, tapered legs, arms in). Check waived for
    intentional face touch (orchestrator 2026-11-19).
  - Lily: `assets/sprout-lily.ts` 0e6fe74b (chin bob, straight bangs, blue shirt white collar,
    red pleated skirt, mid-calf socks, red sneakers); look-check fix ef28cfc9 (side/back bob to
    the jaw/nape covering the ears with flared ends, strand-cut fringe with cut line, longer
    flared 10-pleat A-line skirt); 25 key frames in
    out/chibi-sprouts/r1/week2-7/gestures/lily/ with gestures.lily manifest key (script generic,
    no change); cutout-check flags only the known reach tiptoe.
  - Mom (young mother, medium height)
  - Dad (young father, tallest of the family)
  - Grandma (older woman, a little shorter than Mom)
  - Grandpa (older man, as tall as Mom)
  - Tom (nine-year-old boy, one of the tallest children)
- [x] Task: The remaining gesture key frames (20 gestures in use, inventory section 3): the (0bb18f6e, 697ae4a9)
  week 2 to 7 set above covers set 2 and `turn`; only the week 4 family cast gestures wait for S26.
  Commits: 0bb18f6e (set 2), 697ae4a9 (`turn`).
- [~] Task: Scenes (inventory section 4) and the 30 props and animals (section 5): fit-check reused
  assets, build the new ones, and review in batches. Week 7 waits for its new song.
  - First prop batch (5 of the 15 new): commit 1dcca329; cutout-check "result ok"; cards at out/prop-cards/
  - Briefs: briefs/<name>.md (sources per value; audit 2026-11-17 F-D5).
  - paint-pot r2 (audit 2026-11-17 item 2): commit b51f0ae7; mech-check ok; cutout-check result ok; card out/prop-cards/paint-pot.png
  - duck (song video, PM order 2026-11-17): commit 4549de51; mech-check ok; cutout-check result ok; card out/prop-cards/duck.png; brief briefs/duck.md
  - week 3 set and duck fixes (PM order 2026-11-17): commits 2f8ee4a6 (review-cards F7), f098d5b9 (duck F1 and F2), 6df0d874 (sun), 6057feaa (cloud), 9863c547 (flower), 34249914 (grape-bunch), d6e0414e (paint-splash); mech-check ok for duck, sun, cloud, flower, grape-bunch, paint-splash; cutout-check result ok; cards at out/prop-cards/; review-cards F7 fixed 2f8ee4a6
  - paint-splash r2 (B1 of acceptance-week3-03d1114): commit e5e2350c; mech-check ok; cutout-check result ok; preset cutouts done
  - lily pad (PM order 2026-11-17): commit f8e89036; mech-check ok; cutout-check result ok; card out/prop-cards/lily-pad.png; brief briefs/lily-pad.md
  - fix round 1 and 2 (PM 2026-11-18): seam cause one lost row in the whole-buffer readPixels (now read in strips); commits a330434d, 51fee130, b3460c68; all props re-cut, cutout-check result ok with the seam check; lily pad high cutout at props/high
  - fix round 3 (PM 2026-11-18): splash lens commit 2514a96a; mech-check ok; cutout-check result ok in 3 folders; SHA on the first line of every [x] task
  - group 2 reworks (PM 2026-11-18): ball 2da0e605, kite 757a6948, brush 2901d092; mech-check ok; cutout-check result ok in props and presets folders
  - preset colour gate (PM order 2026-11-18, N1 and N2): commit 6a04c63e adds scripts/preset-colour-check.mjs, scripts/make-preset-pin.mjs, tests/preset-colour.test.ts, and tests/fixtures/preset-pin.json (387 assets, 902 presets, 3166 preset slots); the check exits 1 on 10 ball slots and kite/yellow/sailA; the formula tests and the pin test pass; log measure/runs/asset_chibi_sprouts_r1_20261022/red-p5-preset.log
  - preset colour fix (PM 2026-11-18): Red 6a04c63e; Green de94485e (ball), 86debd54 (kite), 2cff4c97 (brush); preset-colour-check exit 0 on ball kite paint-splash paint-pot; pin unchanged (387 assets); N3 brush
  - group 3 fit check (PM order 2026-11-17/18): 7 OK, 4 need rework: cat, messenger-bird, pond, rug; table in maker-p5-group3-fit.log. Cat: the `grey` preset paints cyan patches and the mouth is a closed line (the book asks for a wide open mouth). Messenger-bird: cream only, no blue variant or preset, closed beak. Pond and rug: the water and the face do not read at el 0, and both, with the oak tree, do not fit a 1024 canvas at 512 px/m (cut at 192 px/m in props-xl). cutout-check result ok in props, props-large, and props-xl.
  - group 3 rework 1 (PM order 2026-11-18): storytime-bird 393a2854 (blue #3f6fa8 body and wings, #2f5584 wing tips, #a9c8e8 breast, beak open at 18 degrees, no message item; mech-check ok; cutout-check ok; brief briefs/storytime-bird.md); rug look-down cutout at el 35 in props-high-xl (ppm 192, margin 150, foot row 874; cutout-check ok); the pond look-down cutout waits for a PM decision: at el 35 the bank's near rim is unlit dark (dark halo on 210 of 1118 edge pixels, worst drop 52 %), and the ordered ppm 160 fallback cuts the near edge at margin 16; the cat waits for rework 2. Log maker-p5-group3-rw1.log.
  - group 3 rework 2 (PM order 2026-11-18): storytime-cat 0227972e (grey #9a9a9e first fur option, white #fff6ec markings, amber #d89a20 eyes, open oval mouth #4a2224 with the pink tongue #e88a9a, path B `openMouth` on the cat kind; cat and familiar-cat GLB sha256 unchanged; mech-check ok, 28,138 triangles; cutout-check ok in props; brief briefs/storytime-cat.md); pond look-down at el 55, margin 220, in props-high55-xl; cutout-check halo exception accepted by the orchestrator: dark bank surface, 47 % worst drop; TD-34. Log maker-p5-group3-rw2.log.
  - cast insets and week 4/7 scenes (PM request 2026-11-19, due 11-24): commit 65e233fb; bench/sonnet/sprouts/cutout-gestures-cast.sh renders the 25 Adventurer frames for pat, sam, mia, and may (100 files at the week 1 scale). Folders: out/chibi-sprouts/r1/week2-7/gestures/{pat,sam,mia,may}/ and out/chibi-sprouts/r1/week{4,7}/scenes/ (fresh classroom.png, classroom.txt, manifest.json, rug.png). Week 4 uses the stage classroom; week 7 has no stage file yet and defaults to classroom. The cast GLBs were stale (sproutHands f2de196f came after the builds), so all four were rebuilt first. cutout-check flags only the reach tiptoe pose (lowest opaque rows 1174 to 1176, foot row 1184; pat/reach passes at row 1181). The week 4/7 classroom shows the full centre bookcase from e4e5c593; framing matches week 1. Lily (week 4) waits for S26.
  - D1 sing plates in back views (look check 2026-11-19): the eyelid discs showed through the hair in may and sam turn-back and in may turn-side. Cause: the `sing` lid bodies fill the head depth, and their back caps clear the skull into the hair. The Adventurer GLB predates the sproutFace lids, so it stayed clean. Fix e091dd55: `./forge cutout --hide-sing` hides `eyelid-skin` and `mouth-open` in cut-outs only; the song page keeps them (src/render/cutout.ts, page.ts, cli/forge.ts; flag passed by cutout-gestures-cast.sh). Test: tests/cutout.test.ts gains singBodyVisible cases (9 tests pass); tsc shows 38 pre-existing errors, none in the touched files. All 100 cast frames re-rendered with the flag: 94 changed, 31 identical (25 Adventurer plus 6 cast views where the plates stayed inside). cutout-check flags only the known reach tiptoe pose. Pixel proof: May turn-back changed 38,487 pixels, 34,710 back to transparent; Pat head-back box went from 18,632 skin pixels to 0. The darker patches left on the hair match the surrounding shade (26,16,12 vs 25,14,14): natural shading, no second defect.

## Phase 6: Delivery and close

- [ ] Task: Deliver the files and the manifest; record the paths here; tell Storytime.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`, and close the track.
