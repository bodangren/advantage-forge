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

- [x] Task: Record the brief, the owner decisions (S18, S19), the Storytime answers, the inventory
  change, and the week 1 format in the specification (2026-10-22).
- [x] Task: Delivery folder: `out/chibi-sprouts/r1/` with a JSON manifest (Storytime, 2026-10-22).
  Week 1 layout and manifest keys: `bench/sonnet/sprouts/method.md`. Storytime and Workbooks got the
  folder on 2026-10-22 (session chibi-sprouts). Prompts and the run log: `bench/sonnet/sprouts/`.
- [x] Task: Age-5 proportion table: `HERO` and `AGE5` in `assets/parts/humanoid-kind.ts`
  (`proportions` option; AGE5 = leg 1.05, torso 0.84, arm 0.8, shoe 0.72, forearm turn, bob 1.0).
  Proof: `bench/sonnet/sprouts/mesh-same-batch.sh` prints SAME for 9 kind users and 4 hair assets
  (2026-10-22).
- [x] Task: Skeleton contract test `tests/sprout-base.test.ts` (bones, parents, clips, sockets equal
  avatar-base; the head equals HERO) (2026-10-22).

## Phase 2: Tools

- [x] Task: `./forge cutout <name> --out <dir> --ppm --canvas --clip --at` renders straight soft
  alpha with no shadow at one scale (`src/render/cutout.ts`, `src/png.ts`, `tests/cutout.test.ts`);
  the sprite pass keeps binary alpha (2026-10-22).
- [x] Task: Delivery step: the cutout command writes `manifest.json` (ppm, canvas, footPoint, files);
  `scripts/cutout-check.mjs <dir>` checks size, alpha, halo, and foot row. Week 1 scale: 1080 px/m
  on 1024 x 1200, foot point (512, 1184) (2026-10-22).

## Phase 3: Week 1 test set (owner direction: first)

- [x] Task: `sprout-base` built and accepted at 7.5 after three passes and three independent
  reviews (7.0, 7.0, 7.5; `bench/sonnet/sprouts/cards/b1*/review.json`, 2026-10-22). Open notes:
  stiff upper body in the walk; the shared avatar face reads older than five.
- [x] Task: `sprout-pip` built; three passes, three reviews (6.5, 7.0, 7.0): the stop rule applies.
  Rated 7.0, on the follow-up list: replace the two crown spikes with one soft cream tuft; ears
  golden with dark tips only; a larger chest bib; round paws (2026-10-22). Ships in week 1 for the
  owner's look check.
- [x] Task: Nan 7.5, Sam 7.5, Mia 7.5 (first review), Pat 7.5 (second), May 7.5 (third, after a
  waist clash) on `sprout-base`; cut-outs in `out/chibi-sprouts/r1/week1/cast/` (2026-10-23). Ben 7.0 after three
  reviews (stop rule), on the follow-up list: soft fluffy hair instead of clay-like locks (two point up
  in the side view), a clearer smile at 128 px, a visible sole band. Reviews: `bench/sonnet/sprouts/cards/b3*`, `b4*`.
  Debt: two builders wrapped `k.animation` for per-character motion (Ben's removed; May's ponytail
  swing kept); the kind needs an extra-pose hook for a character's own bones.
- [ ] Task: `sprout-adventurer` (lantern or map, no sword) and the week 1 gesture key frames:
  clap (apart, together), wave (left, right), nod (up, down), point to self, point forward, hands
  out, and idle, on one canvas with the feet at one point; review.
- [x] Task: Classroom scene `scenes/maps/classroom.ts` (generator `scripts/design-classroom.mjs`,
  `bright` interior mode in `src/scene/main.ts`, `FORGE_SHOT_SIZE` in `scripts/shoot-map.mjs`);
  `out/chibi-sprouts/r1/week1/scenes/classroom.png` and `rug.png` (450 px/m) (2026-10-22). Look
  check items: dark window panes, half-timber walls.
- [ ] Task: Deliver to `out/chibi-sprouts/r1/week1/` with the manifest; tell Storytime the path,
  the file names, and the date; wait for the owner's look check.

## Phase 4: The rest of the inventory (after the look check)

- [ ] Task: The owner confirms the cast beyond 8 (Lily, Mom, Dad, Grandma, Grandpa, Tom) and the
  cost.
- [ ] Task: The remaining cast (an adult base for Mom, Dad, Grandma, Grandpa; Tom at about eight).
- [ ] Task: The remaining gesture key frames (20 gestures in use, inventory section 3).
- [ ] Task: Scenes (inventory section 4) and the 30 props and animals (section 5): fit-check reused
  assets, build the new ones, and review in batches. Week 7 waits for its new song.

## Phase 5: Delivery and close

- [ ] Task: Deliver the files and the manifest; record the paths here; tell Storytime.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`, and close the track.
