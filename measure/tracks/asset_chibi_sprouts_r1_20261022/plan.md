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
    flared 10-pleat A-line skirt); look-check fix r3 697cdab6 (proud side panels to the jaw,
    shell fringe with geometric cut line and strand grooves, longer A-line skirt with level hem
    at 0.16 and shallow groove pleats); preset pin gains Lily 86e44114 (388 assets); 25 key frames in
    out/chibi-sprouts/r1/week2-7/gestures/lily/ with gestures.lily manifest key (script generic,
    no change); cutout-check flags only the known reach tiptoe; look-check fix r6 e05285e6:
    the cap margins are now +0.015/+0.015/+0.010 at (0, 0, -0.005), so the top and the upper
    sides sit 0.015 m from the skull and the back gap drops from 0.030 to 0.015 m, and the top
    corners read round; the sides reach r 0.231 in the ear band (ear outer x 0.2264), so the
    ear is hidden in the side and three-quarter views; the sides then tuck to a straight
    0.177 m panel that runs to the chin-length cut, which clears the raised-hand clips; the
    fringe lip (ellipsoid band y 0.057 to 0.092) stands 0.014 m proud of the forehead just
    above the brows as one geometric step; the skirt half-space sign cut nothing, so the hem
    is now a level cut at 0.161 m = two thirds from hip 0.205 to knee 0.139, with 0.004 m
    pleat grooves at paint 0.45. `./forge check sprout-lily` fails only the 6 waived clips
    (point-up closest 0.0 cm, stretch-up 1.3 cm, picture-sway 1.3 cm, cheer 1.9 cm; ground
    ok). `./forge all sprout-lily` exits 0 with 0 warnings (24,978 tris textured, 28,045
    fast). cutout-check fails only the known reach tiptoe flag (adventurer, lily, may, mia,
    sam). typecheck shows the 38 pre-existing errors and none in sprout-lily; the 3 sprout
    test files pass 10/10. Log green-p5-adult-base.log.
  - Lily r6 OPEN hair defects (PM decision 2026-11-20, look check): (1) horizontal stepped
    bands on the sides and back; (2) a mushroom/helmet ledge instead of a straight bob;
    (3) bare skin between the hair and the face below the ear in the side view.
  - Lily r7 (gpt-6-luna) and r8 (claude-haiku-5-5) FAILED: a bob wide enough to cover the
    jaw (about 0.22 m) collides with the hands in point-up, cheer, picture-sway. No waiver
    for these three clips (a hand through hair is a visible fault).
  - Lily bob hair fix bd5ecf87 (2026-11-20). All three r6 defects are closed. One Catmull-Rom
    revolve draws the whole bob. The back and sides now read as one smooth mass. No separate
    cap remains, so the mushroom shelf is gone. The face window stays wide at the eyes and narrow
    at the jaw. Hair side panels now cover the jaw skin in the side view. The eye band and mouth
    stay clear from the front. The lower panel is 0.20 m at y -0.14. Stretch-up clears it by
    0.2 cm. Lily opts in with handClearance 0.04 on her kind and in her sproutGestures call.
    Thick brows, the small mouth, and the short frill skirt stay unchanged. `./forge all
    sprout-lily` exits 0 with no warning lines (24,068 tris textured, 0.458 x 0.844 x 0.405 m,
    GLB 3225 KB). `./forge check sprout-lily` fails only the six waived clips. Point-up closest
    3.5 cm. Picture-sway and cheer report nothing within 5.0 cm. Stretch-up closest 0.2 cm.
    Ground ok. The Red command exits 0 with 13/13 tests. The three sprout test files pass 15/15.
    typecheck-asset reports 0 errors. The preset pin is unchanged. Lily's 25 cut-out frames were
    re-rendered at 1024x1200. The gestures.lily key and every other manifest key stay. cutout-check
    flags only the known reach tiptoe (adventurer, lily, may, mia, sam, tom). Log
    green-p5-adult-base.log.
  - Lily hair r3 5a1ab257 (2026-11-20, orchestrator look check). The tapered extruded face window
    at bd5ecf87 left dark hair under the chin in point-up and in the front view. That read as a
    chin strap. The face border was jagged. The window is now one half-space cut. It removes hair
    in front of the ear plane (z -0.01) below the fringe line. No hair sits in front of the chin.
    The fringe is one clean straight edge above the brows. Ears stay visible. The smooth one-piece
    bob, the straight chin-length hem, the jaw-side coverage, and handClearance 0.04 stay unchanged.
    `./forge all sprout-lily` exits 0 with no warning lines (22,596 tris textured,
    0.457 x 0.844 x 0.405 m). `./forge check sprout-lily` fails only the six waived clips.
    Point-up closest 3.5 cm. Picture-sway and cheer report nothing within 5.0 cm. Stretch-up
    closest 0.3 cm. Ground ok. The Red command exits 0 with 13/13 tests. The three sprout test
    files pass 15/15. typecheck-asset reports 0 errors. The preset pin is unchanged. Lily's 25
    cut-out frames were re-rendered at 1024x1200. cutout-check flags only the known reach tiptoe
    (adventurer, lily, may, mia, sam, tom). Log green-p5-adult-base.log.
  - Lily soft fringe 53f33ae4 (2026-11-20, orchestrator look check). The chin wrap and the jaw
    wedges stay fixed. The old fringe lip read as a helmet visor. The face cut was a flat vertical
    wall. The fringe lip is gone. A large ellipsoid now cuts the face with a gentle curve, so the
    side hair has a rounded front edge. A shallow wave on the cut gives soft bang tips above the
    brows. The bob is hollowed into a thin shell, capped below y 0.12, so the cut edge is thin and
    the crown stays clean. The outer surface is unchanged. Ears, thick brows, small mouth, short
    frill skirt, the straight chin-length hem, and handClearance 0.04 stay. `./forge all
    sprout-lily` exits 0 with no warning lines (24,830 tris textured, 0.458 x 0.844 x 0.402 m).
    `./forge check sprout-lily` fails only the six waived clips. Point-up closest 3.5 cm.
    Picture-sway and cheer report nothing within 5.0 cm. Stretch-up closest 0.2 cm. Ground ok.
    The Red command exits 0 with 13/13 tests. The three sprout test files pass 15/15.
    typecheck-asset reports 0 errors. The preset pin is unchanged. Lily's 25 cut-out frames were
    re-rendered at 1024x1200. cutout-check flags only the known reach tiptoe (adventurer, lily,
    may, mia, sam, tom). Log green-p5-adult-base.log.
  - Adult sleeve skin breakthrough fix ef5be6c4 (2026-11-21, orchestrator look check F1). The
    cuff carried a hand bone tag. In point-up the cuff followed the wrist while the skin forearm
    stayed on the forearm bone, so jagged skin patches showed through the raised sleeve. Each
    adult now cuts the covered arm skin with `paintSkin` and keeps a 4 mm wrist stub inside the
    cuff. The cuffs take forearm tags, and the sleeve cones use the skin arm's 0.02 m elbow
    fillet. Mom's sleeves are a separate body, so the hem keeps hips and spine weights only and
    no longer points. `./forge all` exits 0 for all four with no warning lines. `./forge check`
    fails only the six waived clips; point-up reports no head contact. All 100 adult cut-out
    frames were re-rendered. cutout-check flags only the four known reach tiptoe frames. Three
    sprout vitest files pass 15/15. typecheck-asset reports 0 errors. The preset pin is unchanged.
    Log green-p5-adult-base.log.
  - Lily hair r5 4f7a6776 (2026-11-21, independent look judge F2: 7.0 below the 7.5 bar).
    The fringe is now five soft Gaussian bangs with different depths and lengths, not one solid
    visor edge; a second lower face cut recedes to z -0.025 at the jaw so the side cut curves back
    instead of falling flat; a warm paint lift narrows the dark inner rim. A thinner-shell trial
    produced crown specks at the inner cap edge and was reverted to the original 0.93/0.006 shell,
    so the clean crown stays. No chin wrap, jaw wedge, or ear coverage; handClearance stays 0.04.
    `./forge all sprout-lily` exits 0 with no warning lines (24,912 textured tris, GLB 3293 KB).
    `./forge check sprout-lily` fails only the six waived clips; point-up closest 3.5 cm,
    stretch-up 0.3 cm, picture-sway and cheer nothing within 5.0 cm, ground ok. The Red command
    exits 0 with 13/13 tests and the three sprout test files pass 15/15. typecheck-asset reports
    0 errors. Lily's 25 cut-outs were re-rendered at 1024x1200; cutout-check flags only the known
    reach tiptoe. Log green-p5-adult-base.log.
  - Lily face r2 7cb58934 (2026-11-22, Faces r2 Step 1): paint-only `lilyFace` in
    `assets/sprout-lily.ts` via `paintSkin`, matched to `docs/sprout-mockups/lily.jpg`:
    dark round iris with one big catchlight over the shared amber eye, shorter thinner
    brow over an exact-footprint skin cover (a wider cover left a pale slab; a soft edge
    left a halo; both reverted to an exact hard cover), open toothy smile with tongue,
    soft nose shade, freckles, strand grooves in the fringe paint. The shared kind is
    untouched: sprout-sam and teacher GLBs keep byte-identical hashes (3b6c6796, ec71c3d8).
    `./forge all sprout-lily` exits 0 with no warning lines (24,912 textured tris,
    0.458 x 0.844 x 0.403 m, GLB 3382852). `./forge check sprout-lily` output
    byte-identical to the pre-pass baseline. Lily's 25 cut-outs were re-rendered at
    1024x1200; cutout-check flags only the known reach tiptoe (lily row 1176, foot 1184).
    The three sprout vitest files pass 15/15. typecheck-asset reports 0 errors. The preset
    pin is unchanged. Log green-p5-adult-base.log.
  - Mom face r2 8749d9fe (2026-11-22, Faces r2 Step 1): `assets/sprout-mom.ts` only,
    matched to `docs/sprout-mockups/mom.jpg`. The hairline is flowing geometry: three
    overlapping curved strands sweep from the side part across the forehead to the
    right temple (staggered ends, grooves between strands, sideways tips, nothing
    hanging vertical). Paint-only face through the existing `paintSkin` hook (arm cut
    kept, then face): dark round iris with one big catchlight, shorter thinner brow
    over an exact-footprint hard skin cover, a gentle open smile with one rounded
    white teeth band and tongue, soft nose shade, freckles (their paint lines were
    missing until this round; now wired). One finding: a red chin dot seen at 5x zoom
    persists with mouth, tongue and teeth paint all off, so it predates this pass (a
    shared-smile vertex artifact, invisible at sheet scale); the open smile is kept.
    `./forge all sprout-mom` exits 0 with no warning lines (34,846 textured tris,
    0.544 x 1.552 x 0.37 m, GLB 4274244). `./forge check sprout-mom` output
    byte-identical to the pre-pass baseline. Mom's 25 cut-outs were re-rendered at
    1760x1856; cutout-check flags only the four known reach tiptoes (mom row 1833,
    foot 1840). The three sprout vitest files pass 15/15. typecheck-asset reports 0
    errors. The shared kind is untouched: sprout-sam and teacher GLBs keep
    byte-identical hashes (3b6c6796, ec71c3d8); the preset pin is unchanged. The
    sleeve fix ef5be6c4 and the waist/hem fixes a73bc9a7 and 99fe921a stand. Log
    green-p5-adult-base.log.
  - Tom face r2 e8625666 (2026-11-22, Faces r2 Step 1): `assets/sprout-tom.ts` only,
    matched to `docs/sprout-mockups/tom.jpg`. The hairline is geometry, not paint:
    five separate tapered locks swept from his-right part to his-left temple (0.008
    fillet, wide tip spacing, varied tip depths, skin between the tips), thin sideburn
    strands to mid-ear, a flatter tousled crown tuft. Paint-only face via `paintSkin`:
    near-black round iris with one big catchlight, shorter thinner brow over an
    exact-footprint hard skin cover, one rounded white teeth band with tongue, soft
    nose shade, freckles. One in-round fix: the first teeth band split into buck teeth
    (its top poked above the mouth middle); the band now sits fully inside the mouth.
    `./forge all sprout-tom` exits 0 with no warning lines (28,428 textured tris,
    0.483 x 0.915 x 0.446 m, GLB 3518008). `./forge check sprout-tom` output
    byte-identical to the pre-pass baseline. Tom's 25 cut-outs were re-rendered at
    1024x1200; cutout-check flags only the known reach tiptoe (tom row 1175, foot 1184).
    The three sprout vitest files pass 15/15. typecheck-asset reports 0 errors. The
    shared kind is untouched: sprout-sam and teacher GLBs keep byte-identical hashes
    (3b6c6796, ec71c3d8); the preset pin is unchanged. Log green-p5-adult-base.log.
  - Tom face r3 9a822cf5 (2026-11-22, judge fix): `assets/sprout-tom.ts` only. The five
    fringe locks are diagonal swept spikes now (tapering chains, 0.004 tips landing
    sideways of their roots, 0.006 fillet grooves, staggered depths), not vertical
    tubes; the cowlick moved to the front crown and sweeps forward. The teeth band is
    thinner (0.009) at the mouth top and the tongue wider (0.03), so the open smile
    reads at 128 px. `./forge all sprout-tom` exits 0 with no warning lines (28,808
    textured tris, 0.483 x 0.925 x 0.44 m, GLB 3521 KB). `./forge check sprout-tom`
    output byte-identical to the role_base_sha baseline (cc690c95). Tom's 25 cut-outs
    were re-rendered at 1024x1200; cutout-check flags only the known reach tiptoe
    (tom row 1175, foot 1184). The three sprout vitest files pass 15/15.
    typecheck-asset reports 0 errors. sprout-sam and teacher GLBs keep byte-identical
    hashes (3b6c6796, ec71c3d8). Log green-faces-tom-r3.log.
  - Dad face r2 15f5863c (2026-11-22, Faces r2 Step 1): `assets/sprout-dad.ts` only,
    matched to `docs/sprout-mockups/dad.jpg`. Paint-only face through the existing
    `paintSkin` hook (arm cut kept, then face): dark round iris with one big
    catchlight, shorter stronger brow over an exact-footprint hard skin cover
    (fixed dark brown #2e2013: the shared tint.brow resolves to mid-brown #5a3422,
    which read auburn against Dad's black hair), a gentle open smile with one
    rounded white teeth band clipped inside the mouth and tongue, soft nose shade;
    no freckles (the reference cheeks are smooth) and no facial hair
    (clean-shaven). The hairline is geometry, not paint: three overlapping swept
    strands cross the forehead from the side part (a mirror of Mom's fringe),
    staggered ends, grooves between strands, sideways tips, nothing hanging
    vertical. One finding: a red chin dot seen at 5x zoom persists with mouth,
    tongue and teeth paint all off, so it predates this pass (the same
    shared-smile vertex artifact Mom documented, invisible at sheet scale); the
    open smile is kept. `./forge all sprout-dad` exits 0 with no warning lines
    (35,538 textured tris, 0.544 x 1.61 x 0.357 m, GLB 4351196). `./forge check
    sprout-dad` output byte-identical to the pre-pass baseline (sha b1fcc16f,
    exit 1 on the three known waived clips). Dad's 25 cut-outs were re-rendered
    at 1760x1856; cutout-check flags only the four known reach tiptoes (dad row
    1834, grandma 1833, grandpa 1834, mom row 1833; foot row 1840). The three
    sprout vitest files pass 15/15. typecheck-asset reports 0 errors. The shared
    kind is untouched: sprout-sam and teacher GLBs keep byte-identical hashes
    (3b6c6796, ec71c3d8); the preset pin is unchanged. The sleeve fix ef5be6c4
    and the listen fix c3307a6b stand (fresh listen.png waist clean). Log
    green-faces-dad.log.
  - Grandma face r2 d470ef24 (2026-11-22, Faces r2 Step 1): `assets/sprout-grandma.ts`
    only, matched to `docs/sprout-mockups/grandma.jpg`. Paint-only face through the
    existing `paintSkin` hook (arm cut kept, then face): dark round iris with one big
    catchlight, shorter thinner brow over an exact-footprint hard skin cover in fixed
    pale grey #a8a39c (the shared tint.brow follows the white hair and would wash out;
    Dad fixed his dark for the mirror reason), a gentle open smile with one rounded
    white teeth band clipped inside the mouth and tongue, soft nose shade, freckles,
    plus age marks the reference shows (nasolabial smile lines, crow's feet, both as
    soft crease chains sunk 1 mm). One in-round fix: the first mouth at scale 0.85 left
    dark shared-smile corners, so the outline is the parents' 0.9 and the corners read
    clean. The hairline is geometry: three overlapping swept cords per side run from
    the center part over the crown to the temples (staggered tips, grooves between
    strands, sideways tips, inside outerHug above the face opening, nothing hanging
    vertical). One finding: the red chin dot persists (the same shared-smile vertex
    artifact Mom and Dad documented, invisible at sheet scale); the open smile is kept.
    `./forge all sprout-grandma` exits 0 with no warning lines (34,828 textured tris,
    0.544 x 1.53 x 0.394 m, GLB 4348 KB). `./forge check sprout-grandma` output
    byte-identical to the role_base_sha baseline (sha dc8a1833, exit 1 on the waived
    touch-nose). Grandma's 25 cut-outs were re-rendered at 1760x1856; cutout-check flags
    only the four known reach tiptoes (grandma row 1833, foot 1840). The three sprout
    vitest files pass 15/15. typecheck-asset reports 0 errors. The shared kind is
    untouched: sprout-sam and teacher GLBs keep byte-identical hashes (3b6c6796,
    ec71c3d8); the preset pin is unchanged. The cuffs fix 4fa91ee8 stands (fresh
    listen.png cuffs and waist clean). Log green-faces-grandma.log.
  - [x] Mom (young mother, medium height, due 11-21). `assets/sprout-mom.ts` ac97d422
    (ADULT proportions; long wavy medium-brown hair past the shoulders, cream cable-knit
    sweater with collar/cuffs/ribbed hem, blue jeans, brown flats, pearl studs; look target
    docs/sprout-mockups/mom.jpg). Hair is one smooth union (cap, side part + swept fringe,
    jaw-length inner locks, thin outer curtains behind the shoulders, flattened back panel);
    the clap bounce is softened for Mom only (same hand goals; the full dip carries the long
    hair ends into the meeting hands). `./forge check sprout-mom` fails only the waived
    touch-nose and listen (wave ok; touch-neck closest 0.0 cm; count-fingers 3.5 cm; eat
    1.7 cm; clap closest 0.8 cm; ground ok). `./forge all sprout-mom` exits 0, no warnings
    (36,084 tris textured; adult base is 34,995). 25 gesture frames in
    out/chibi-sprouts/r1/week2-7/gestures-adult/mom/ (same 1080 px/m week-1 scale, own
    manifest; a grown-up needs a taller canvas than the children's 1024x1200: 1664x1856;
    script change, no frame changes for the other cast). cutout-check flags only the known
    reach tiptoe (lowest opaque row 1833, foot row 1840). typecheck 0 errors in sprout-mom;
    the 3 sprout vitest files pass 10/10. Log green-p5-adult-base.log.
  - Mom listen waist/hem fix a73bc9a7 (2026-11-22, orchestrator look check:
    a blue jeans oval through the sweater's right side at the waist in listen, and
    a skin patch under the hem centre). Same cause as Grandpa 10632c67: the rigid
    jean-leg cone ran to the HIP joint (sharp cap rim at chest height) and the
    listen spine roll swung the sweater side off the static rim. Leg cones start
    tucked inside the hip mass (hipsY - 0.03, top radius 0.058); hip mass on the
    torso weight bands, 0.90/0.92 slimmer; hem 12 mm lower (0.688, still flat).
    Separate sleeve body and ef5be6c4 sleeve fix unchanged. `./forge all
    sprout-mom` exits 0 with no warning lines (34,468 tris, 0.544 x 1.552 x 0.37
    m). `./forge check sprout-mom` fails only the two earlier waived clips
    (touch-nose, listen); ground ok. Mom's 25 cut-outs were re-rendered at
    1760x1856; cutout-check flags only the four known reach tiptoe frames. The
    three sprout vitest files pass 15/15. typecheck-asset reports 0 errors. In the
    fresh listen.png the waist side is clean cream with no blue, and the pixel map
    under the hem shows only sweater, jeans, and background, no skin; turn-side,
    reach, hug-self, and point-up are clean. Log green-p5-adult-base.log.
  - Mom hem closes on the jeans 99fe921a (2026-11-22, look judge r3: the area
    under the sweater hem between the legs read as a skin-toned patch in listen,
    point-up, stretch-up, hug-self, and reach). The pale lobe was the sweater
    revolve's closed bottom hanging between the leg tops, cable-ribbed like skin
    at sprite size; the a73bc9a7 hem drop never moved geometry (the cut sat below
    the closure, so only the rib paint moved). The hem is a true cut at 0.75 now:
    one clean straight edge across both hips like the mockup. A jeans crotch bib
    fills the leg gap in blue, and a blue inner liner just inside the sweater
    (torso wall 2 mm in, same torso weights, clearances constant in every clip)
    swallows the kind skin torso bottom, so the hem window reads jeans-blue.
    Tucked cones, weighted slimmer hips, side-waist fix, ef5be6c4 sleeves
    unchanged. `./forge all sprout-mom` exits 0 with no warning lines (34,764
    tris, 0.544 x 1.552 x 0.37 m). `./forge check sprout-mom` fails only the two
    earlier waived clips (touch-nose, listen); ground ok. Mom's 25 cut-outs were
    re-rendered at 1760x1856; cutout-check flags only the four known reach tiptoe
    frames. The three sprout vitest files pass 15/15. typecheck-asset reports 0
    errors. Colour probe (box rows 1000-1140, cols 800-1000): listen blue
    24,902 cream 2,537 skin 0; point-up blue 24,884 cream 2,550 skin 0;
    stretch-up blue 27,724 cream 0 skin 0; hug-self blue 24,884 cream 2,550 skin
    0; reach blue 27,667 cream 0 skin 0 (remaining cream is the sweater body above
    the hem line). All five frames viewed: straight ribbed hem with blue jeans
    directly below, no lobe, no skin. Log green-p5-adult-base.log.
  - [x] Dad (young father, tallest of the family, due 11-22; feat 633a40c5)
  - Dad listen waist/hem fix c3307a6b (2026-11-22, orchestrator look check:
    a blue jeans oval through the shirt/tee's right side at the waist in listen,
    and a small skin patch under the tee hem centre). Same cause as Grandpa
    10632c67: the rigid jean-leg cone ran to the HIP joint (sharp cap rim at
    chest height) and the listen spine roll swung the shirt side off the static
    rim. Leg cones start tucked inside the hip mass (hipsY - 0.03, top radius
    0.058); hip mass on the torso weight bands, 0.90/0.92 slimmer; tee and
    open-shirt hems 12 mm lower (hemY - 0.062). Open plaid shirt design and
    ef5be6c4 sleeve fix unchanged. `./forge all sprout-dad` exits 0 with no
    warning lines (35,570 tris, 0.544 x 1.61 x 0.357 m, dims unchanged).
    `./forge check sprout-dad` fails only the three earlier waived clips
    (touch-nose, touch-neck, listen); ground ok. Dad's 25 cut-outs were
    re-rendered at 1760x1856; cutout-check flags only the four known reach tiptoe
    frames. The three sprout vitest files pass 15/15. typecheck-asset reports 0
    errors. In the fresh listen.png the waist side is clean plaid/tee with no
    blue (the few grey pixels are edge anti-aliasing), and the white tee dips
    between the legs with no skin showing; turn-side, reach, hug-self, and
    point-up are clean. Grandma's listen.png shows no fault of this class (long
    skirt, clean cardigan sides), so she is untouched. Log
    green-p5-adult-base.log.
  - [x] Grandma (older woman, a little shorter than Mom, due 11-23; feat 588f82c4)
    `assets/sprout-grandma.ts` on a GRANNY set (ADULT shrunk 6 % in height only, in this
    file only; widths stay the adult's, roundness from the cardigan and skirt bodies;
    ADULT unchanged): white neat hair (cap, center part, compact sides to the nape, round
    top bun), light-green cable-knit cardigan (V neck with top showing, button column,
    long sleeves, ribbed cuffs and hem), light-green top, long light-green skirt with
    waistband, brown flats, pearl studs; lashes off. `./forge check sprout-grandma` fails
    only the waived touch-nose (index/fingers into the nose skin, intentional face touch;
    wave ok; touch-neck closest 3.0 cm; count-fingers, point-up, stretch-up ok; eat 4.2 cm;
    listen 4.3 cm; clap closest 0.8 cm into the cardigan body line; ground ok). No hand
    through hair or bun in any frame. `./forge all sprout-grandma` exits 0, no warning
    lines (36,312 tris textured; Mom 36,084, Dad 37,892; 0.544 x 1.53 x 0.394 m, below
    Mom's 1.552). 25 gesture frames in out/chibi-sprouts/r1/week2-7/gestures-adult/grandma/
    (same 1080 px/m scale, adult canvas unchanged 1760x1856; manifest gains gestures.grandma,
    mom and dad keys untouched); cutout-check flags only the known reach tiptoe (lowest
    opaque row 1833, foot row 1840). typecheck 0 errors in sprout-grandma; preset pin gains
    only the sprout-grandma block (391 assets, pure addition); the 3 sprout vitest files
    pass 10/10. Fixed in the round: the untagged waistband fell back to segment-distance
    weights and its verts followed the arms and legs (long blades in point-up, sway, and
    stretch-up); now rigid on the hips bone like the skirt. Log green-p5-adult-base.log.
  - Grandma cuffs fix 4fa91ee8 (2026-11-21, orchestrator finding at adb317ce: a peach skin oval in
    the raised cuff and a skin patch on the lowered cuff). GRANNY scales every Y by 0.94 but kept
    ADULT.fist.palmAt, so the hand's own skin cuff sat above the shortened wrist and poked through
    the green sleeve. The fix scales fist.palmAt with the body; the ef5be6c4 sleeve fix, wrist bone,
    grip anchor, and all clips stay. `./forge all sprout-grandma` exits 0 with no warning lines
    (34,794 triangles, GLB 4337 KB). `./forge check sprout-grandma` fails only the waived
    touch-nose; point-up, stretch-up, picture-sway and cheer stay clean; ground ok. The Red command
    still passes 13/13 and the three sprout test files pass 15/15. typecheck-asset reports 0 errors.
    Grandma's 25 cut-outs were re-rendered at 1760x1856; cutout-check flags only the four known
    reach tiptoe frames. Log green-p5-adult-base.log.
  - [x] Grandpa (older man, as tall as Mom, due 11-24; feat 95931d6b)
  - Grandpa listen waist/hem fix 10632c67 (2026-11-22, orchestrator look check:
    a brown oval through the sweater's right side at the waist in listen, and a
    skin patch below the hem centre between the legs). A magenta/cyan probe
    cut-out identified the oval as the trousers: the rigid leg cone ran up to the
    HIP joint (a sharp cap rim at y 0.945, chest height), and the listen spine
    roll swung the sweater side off that static rim. The leg cones now start
    tucked inside the hip mass (hipsY - 0.03, top radius 0.058); the visible leg
    below the hem is unchanged. The hip mass takes the torso weight bands like
    the sweater (Ben's jeans recipe) and runs 0.90/0.92 slimmer than the sweater
    waist for roll clearance. The hem sits 12 mm lower (0.688*TALL), covering the
    crotch skin wedge. The ef5be6c4 sleeve fix and all other gestures are
    unchanged. `./forge all sprout-grandpa` exits 0 with no warning lines
    (38,562 tris, 0.544 x 1.548 x 0.355 m, silhouette unchanged). `./forge check
    sprout-grandpa` fails only the three
    waived clips (touch-nose, count-fingers, eat); listen closest 0.5 cm, ground
    ok. Grandpa's 25 cut-outs were re-rendered at 1760x1856; cutout-check flags
    only the four known reach tiptoe frames (dad 1834, grandma 1833, grandpa
    1834, mom 1833; foot row 1840). The three sprout vitest files pass 15/15.
    typecheck-asset reports 0 errors. In the fresh listen.png the waist side is
    clean green and the hem dips green between the legs with no skin showing;
    turn-side, reach, hug-self, and point-up are clean. Note for the
    orchestrator: Mom's and Dad's listen frames show the same class of fault
    (blue/jeans oval at the side edge in the roll); their files keep the old
    rigid construction and are out of scope here. Log green-p5-adult-base.log.
  - [x] Tom (nine-year-old boy, one of the tallest children, due 11-25; feat c402738f, fix 71c48a26)
- [~] Task: Faces r2 and the Muse likeness test (Daniel 2026-11-22)
  - Source: Daniel's look reply of 2026-11-22, relayed by the PM: "Can we meet more details, especially
    in the faces? Then check passing the 3D model to Muse as a reference in a scene (the way we will in
    production, right?), then comparing *that* output to the original reference?"
  - Reference picture per character, as each asset file declares it: Lily `docs/sprout-mockups/lily.jpg`,
    Tom `docs/sprout-mockups/tom.jpg`, Mom `docs/sprout-mockups/mom.jpg`, Dad `docs/sprout-mockups/dad.jpg`,
    Grandma `docs/sprout-mockups/grandma.jpg`, Grandpa `docs/sprout-mockups/grandpa.jpg`. The adult base
    declares `docs/sprout-mockups/cast-lineup.jpg`, the cast line-up; no portrait of a neutral adult exists.
  - The face is one paint program in `assets/parts/humanoid-kind.ts`: the eye white, the iris rim, the iris,
    the pupil, the lid arc, the lash, the two brow arcs, the smile arc, the nose ellipsoid, and the ear.
    The hair edge comes from the hair part of each asset.
  - Step 1, face detail for the seven models (Lily, Tom, Mom, Dad, Grandma, Grandpa, adult base): eyes,
    brows, mouth, nose, and hair edge, matched to the reference picture of that character. One character
    per maker run.
    - Tune the shared paint through a new kind option, or through `paintSkin` and `extra` in the asset
      file. A shared default keeps today's look, so the hero, the NPCs, and every other sprout keep
      byte-identical faces.
    - A shared change rebuilds every user of the kind. Name each rebuilt asset in this plan and repeat
      its gates.
    - Every heavy command runs through `HEAVY_MIN_AVAIL_MB=1500 bash
      /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit 75 means hold
      and retry later.
    - The gates for one character follow. `./forge all sprout-<name>` exits 0 with no `warning:` line.
      `./forge check sprout-<name>` prints output byte-identical to the baseline at the same SHA; the
      face sits inside the head, so a moved clearance number is a stop.
      `bench/sonnet/sprouts/cutout-gestures-cast.sh <name>` re-renders the 25 manifest frames at
      1080 px/m on 1024x1200 (children) or 1760x1856 (adults). `node scripts/cutout-check.mjs <folder>`
      flags only the known reach tiptoe: children lowest opaque row 1174 to 1176, adults 1833 or 1834;
      foot rows 1184 and 1840. The grandma folder also holds a stray `point-up-r6.png` that is not in
      the manifest. The three sprout vitest files pass 15/15. `scripts/typecheck-asset.mjs` reports
      0 errors.
    - The adult base has no cut-out set and no gesture folder. Its gates are `./forge all`, `./forge
      check`, the three test files, and the type check. A face change on the base changes the four
      adults too, so their four cut-out sets are re-rendered in the same run.
    - Bar: an independent judge rates the face 7.5 or more, as the cast rule says. The maker never rates
      its own work.
  - Step 2, the element sheet and the classroom set, made the production way. The archive recipe has no
    per-character scene render. Production passes the Forge render sheet and the empty set picture to
    Muse, so this step builds those two inputs and no composite.
    - Set: shoot the clean classroom set once at 1600x1200, from the week 2 stage recipe
      `scene=classroom&clean&az=0&el=14&dist=10&tx=0&tz=0` with `FORGE_SHOT_SIZE=1600x1200 node
      scripts/shoot-map.mjs`, saved as `out/chibi-sprouts/faces-r2/scene/classroom.png`. One shot serves
      every call.
    - Element sheet: after the face pass of a character, copy its Forge sheet
      `out/sprout-<name>/render.png` (2060x1028; front, three-quarter, side, back) to
      `out/chibi-sprouts/faces-r2/muse/elements/<name>-ref-render.png`. The copy is a file operation and
      is not a Muse call.
    - No cut-out, no composite, and no scene picture per character. These two files are the whole input
      of a call.
  - Step 2b, the guard change, Red test then Green change, as its own sub-step before any Muse call.
    - Red: write `tests/storytime-faces-r2-guards.test.ts`. It takes `tests/storytime-cover-guards.test.ts`
      as its model. It requires the exact folder, the cap, the report point, the margin, the try cap, and
      the scan of that folder's own `costs.tsv` only, and it fails before the Green change.
    - Green: add one run constant `FACES_R2_RUN` to `scripts/storytime-muse-guards.mjs`, with a start
      time, `capUsd` 0.08, `reportAtUsd` 0.06, `marginUsd` 0.01, `maxTries` 1, and `outDir`
      `out/chibi-sprouts/faces-r2/muse`. Class it like `COVER_RUN`: one exact folder, and a scan of that
      folder's own `costs.tsv` only. The element folder is a copy destination and takes no call, so the
      guard allows only the exact `muse` folder.
    - The guard keeps the stop for 7 calls at 1 try each and about 0.07 USD. The cap of 0.08 holds that
      headroom, because the guard projects one margin per call plus one cushion for a color pool. Step 3
      makes 6 calls at about 0.06 USD, so the stop stays above the plan.
    - PM approved 2026-11-22. The guard change and its test belong to this track.
    - Red (2026-11-22): `tests/storytime-faces-r2-guards.test.ts` (FRG1 to FRG8, blob
      20be93f0, commit 33655cec) requires `FACES_R2_RUN` (cap 0.08, report 0.06, margin
      0.01, maxTries 1, outDir `out/chibi-sprouts/faces-r2/muse`), the `facesR2` kind for
      exactly that folder (`invalid` for `muse2`, the bare folder, `muse/extra`,
      `muse/elements`, `scene`, `faces-r1/muse`), the cap stop, the 2nd-try stop, the
      `facesR2CapUsd` test-only cap, and single-folder scans (book/app spend out of the
      faces cap; faces spend out of the book/app caps). Command: `HEAVY_MIN_AVAIL_MB=1500
      bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node
      node_modules/vitest/vitest.mjs run --maxWorkers=1
      tests/storytime-faces-r2-guards.test.ts'`. Exit 1 with 8 failed, 0 passed:
      `FACES_R2_RUN` is undefined (TypeError on use) and the exact folder classifies as
      `invalid` (assertion, no syntax or import error). `tests/storytime-cover-guards.test.ts`
      still passes 10/10. `prettier --check` passes on the new file. Log
      red-faces-r2-guard.log.
    - Green (2026-11-22, implementation commit `4b1dd5af817d93a0106639c019093b4b2efce8ae`):
      `scripts/storytime-muse-guards.mjs` gains `FACES_R2_RUN` (start `2026-11-22T09:43:00Z`, cap
      0.08, report 0.06, margin 0.01, 1 try, outDir `out/chibi-sprouts/faces-r2/muse`), the
      `FACES_R2_CAP_MESSAGE` refusal, `isFacesR2OutDir`, and `scanFacesR2CostFiles`.
      `classifyOutDir` returns `facesR2` for exactly that folder and `invalid` for every sibling,
      child, elements, and scene path. A faces call reads only that folder's own `costs.tsv`, so
      book, app, and cover spend stay out of the faces cap and faces spend stays out of their caps.
      `cliGuardOptions` drops the test-only `facesR2CapUsd` key. `scripts/storytime-muse.mjs` needs
      no change: the guard resolves the fixed folder from the spec outDir. The file needed a full
      Prettier format because it failed the current Prettier at role base; no behavior changed
      outside the faces class. The targeted command
      `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/storytime-faces-r2-guards.test.ts'`
      exits 0 with 8 of 8 tests. Its first rerun waited on the heavy lock held by the parallel Dad
      face pass and ran after this edit; the Red log records the failing-first state. The 18-file
      storytime guard subset exits 0 with 243 of 243 tests. `prettier --check` exits 0 on the
      script. The wider `tests/storytime-*.test.ts` run exits 1 on 9 assertions in
      `tests/storytime-book-pictures.test.ts`, a file that does not import the guard module: its
      fixtures read a live Workbooks picture list (227 rows against 196 expected) and a
      `/tmp/opencode` TMPDIR path. All guard files pass in that run. No provider call was made and
      nothing was written under the real `out/`. `phase_base_sha` was not supplied; role base
      `a293e443` is the fallback baseline, and Red commit `33655cec` is an ancestor of it. Log
      `measure/runs/asset_chibi_sprouts_r1_20261022/green-faces-r2-guard.log`.
  - Step 3, one Muse call per character, with both references of the production recipe, through
    `node scripts/storytime-muse.mjs color <spec>`. One spec file per character at
    `docs/chibi-sprouts/faces-r2/<character>.json`, with `references:
    ["out/chibi-sprouts/faces-r2/muse/elements/<name>-ref-render.png",
    "out/chibi-sprouts/faces-r2/scene/classroom.png"]`, `aspect` "4:3", `print` "crop", and `outDir`
    `out/chibi-sprouts/faces-r2/muse`. The colorPrompt follows the production shape: name the character
    in the picture, keep the soft round bright 3D render look, keep the room, and copy the face and the
    clothes.
    - Call count: 6 calls, for Lily, Tom, Mom, Dad, Grandma, and Grandpa. The adult base has no portrait;
      its reference is the cast line-up, so it takes the face pass of Step 1 and no Muse call.
    - Spend: 6 calls, 1 try each, about 0.06 USD in total, approved by Daniel through the PM on
      2026-11-22. No retry. A failed call at 0 USD still uses its try.
    - Record each cost in this plan, one line per character, from the `usage_cost` column of
      `out/chibi-sprouts/faces-r2/muse/costs.tsv`.
  - Step 4, one compare sheet per character: the original reference picture, the 3D
    `out/sprout-<name>/render.png` sheet (the four views), and the Muse output, side by side, with the
    character name. `bench/sonnet/sprouts/faces-r2.sh` builds the six sheets with sharp into
    `out/chibi-sprouts/faces-r2/sheets/<character>-compare.png`.
    - An independent look judge, not the maker family, writes one line on the face likeness and one line
      on the clothes for each sheet. The judge sees the sheet only. Both lines go into this plan.
    - A likeness line names the largest difference, or says "match" for the face and for the clothes.
  - Step 5, upload the six sheets to Drive folder `1W6iwGCe0qQ3EXqPASvzat5fLqNnEIbaA`, sub-folder
    `faces-r2`, one file per character named `<character>-compare.png`, with the `gws` CLI.
    - Create the sub-folder once: `gws drive files create --json '{"name":"faces-r2","mimeType":"application/vnd.google-apps.folder","parents":["1W6iwGCe0qQ3EXqPASvzat5fLqNnEIbaA"]}'`.
    - Upload each file with `gws drive files create --upload <path> --upload-content-type image/png`.
    - Check each file with `gws drive files get`; its `md5Checksum` must equal the local MD5.
  - Done-when: the six sheets sit in the `faces-r2` Drive sub-folder with six equal MD5 values;
    `costs.tsv` sums to 0.06 USD or less, plus rounding; this plan holds one line per Muse character
    with the face judgment, the clothes judgment, and the cost; and `node measure/tools/generate.mjs
    --check` exits 0.
- [x] Task: Per-character hand offset in assets/parts/sprout-gestures.ts for bob hair (moves
  the hands of point-up, cheer, picture-sway out for a character that opts in). Red tests
  first: the gesture poses of every other character (Pat, Sam, Mia, May, Nan, adult base)
  stay unchanged. Then one Lily hair round.
  - Red r3 (2026-11-20, Lily opts in): Lily leaves the default pins (digests and key
    pins now cover Pat, Sam, Mia, May, Nan, adult base, hero only). New test loads the real
    sprout-lily and requires point-up, picture-sway, cheer head distances at least AGE5
    default + 0.035 m (no exact pin). Red command: 12 pass, 1 fail (Lily at default
    0.21599 m vs 0.25099 m floor, no opt-in yet). tsc clean for the test file (via heavy-run).
  - Green (2026-11-20): `handClearance` (meters, default 0) threads from the fourth argument
    of `sproutGestures(k, h, P, opts)` into the point-up and picture-sway arm goals, and from
    `kind.handClearance` into the cheer fist goal. The arm swings out along the reach circle;
    the hand axis stays up. Zero leaves every pose byte-identical for every character.
    Implementation commit: e922ce20.
  - Gates (all through heavy-run): the Red command exits 0 with 12/12 tests. The 3 sprout
    vitest files exit 0 with 14/14 tests. `scripts/typecheck-asset.mjs` reports 0 errors in
    both changed source files. `./forge check sprout-pat` and `./forge check sprout-adult-base`
    print output byte-identical to the baseline at the same SHA; both exit 1 on the known
    head-contact clips (Pat's teddy and the six waived clips). Gain at 0.04 m on the
    head-distance metric: point-up 0.04777 m, picture-sway 0.04372 m, cheer 0.04116 m.
    Closest distances in `forge check` are unchanged: Pat point-up 0.3 cm, cheer 4.4 cm,
    picture-sway 0.1 cm; adult base reports no contact within 5 cm in those three clips.
    `measure/doctor.sh` exits 1 on stale generated facts (generated/status.md and
    asset-inventory.json); generate.sh is out of scope in this role. Log: green-p5-hand-offset.log.
  - Done: Lily opts in with `handClearance: 0.04` on her kind and in her `sproutGestures` call.
    API implementation commit e922ce20. Lily hair fix and bob mesh proof bd5ecf87.
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
