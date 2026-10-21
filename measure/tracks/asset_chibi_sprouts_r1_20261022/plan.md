# Chibi Sprouts, release 1 art

Status: in progress (started 2026-10-22). The plan records execution state. The
[specification](./spec.md) records the brief, the decisions, and the format. Art is due 2026-11-15.

## Method

- One character builder at a time (`forge-sonnet-high`), and one narrow step for each agent
  (`bench/sonnet/npc-serial/method.md`). An independent reviewer rates each batch; the builder
  never rates its own work.
- Textured builds and frame renders run one at a time under `heavy.lock`.
- The orchestrator context costs more than the agents: run the build orchestration from a session
  with a small context, and keep orchestrator calls to the minimum.

## Phase 1: Design and contract

- [x] Task: Record the brief, the owner decisions (S18, S19), the Storytime answers, and the
  Workbooks format rules in the specification (2026-10-22).
- [ ] Task: Write the age-5 proportion table (head, torso, limb lengths, joint positions) against
  the current humanoid kind, and decide how the kind takes it (an option with the current values
  as default, so that no existing asset changes).
- [ ] Task: Write the skeleton contract test: the age-5 base exports the same bone, clip, and
  socket names as the chibi base.
- [ ] Task: Ask Storytime where Forge delivers the files (a Forge folder that Workbooks reads, or a
  copy into a Workbooks path).

## Phase 2: Tools

- [ ] Task: Add the soft-edge option to the sprite pass (straight alpha, edge colour from covered
  samples only), with a unit test; the binary default stays for game sprites.
- [ ] Task: Write the placement step: one pixels-per-meter value for the cast, the 1024 canvas, the
  fixed ground point, the `<id>/<slug>/NNNN.png` names, and the delivery file with `baseline_row`
  and `centre_col`; and a format check script.

## Phase 3: Age-5 base

- [ ] Task: Build `sprout-base`; iterate with `./forge render sprout-base --fast` in front, side,
  and back; check that existing humanoid-kind assets build to the same meshes.
- [ ] Task: Check every shared clip on the base (sinking feet, self-intersection); independent
  review (bar 7.5).

## Phase 4: Cast, in order of first use

- [ ] Task: `sprout-adventurer` (lantern or map, no sword); review.
- [ ] Task: `sprout-wizard` (wizard hat); review.
- [ ] Task: `sprout-druid` (leaf cap); review.
- [ ] Task: `sprout-knight` (crest tabard, no helmet); review.
- [ ] Task: `sprout-pip` on the dog base, matched to the Origins 2 Pip; clips idle, wag, sit, run,
  jump, bark; review.
- [ ] Task: Render the cast views (front, three-quarter, side) at 2048 px with soft alpha.

## Phase 5: Gestures

- [ ] Task: Write the 24 gestures and the idle as 2 s loops in a shared module that every humanoid
  Sprout uses; review strips and GIFs; start with gestures 1 to 10.
- [ ] Task: Render the frame sequences (4 Sprouts x 25 clips, and Pip's 6), place them, and run
  the format check; key frames at 1024 px.

## Phase 6: Scenes and props

- [ ] Task: Fit-check the 19 reused props beside an age-5 Sprout; move a failed prop to the new
  list. Apply the Storytime cut list after the lyric sheets.
- [ ] Task: Build the new props; review in batches.
- [ ] Task: Compose the 8 scenes in week order; render 1920 x 1080 backgrounds with no people;
  render each prop at 1024 px.

## Phase 7: Delivery and close

- [ ] Task: Deliver the files and the delivery file; record the paths here; tell Storytime.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`, and close the track.
