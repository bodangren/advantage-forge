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
- [ ] Task: Write the age-5 proportion table (head, torso, limb lengths, joint positions) against
  the current humanoid kind, and decide how the kind takes it (an option with the current values
  as default, so that no existing asset changes).
- [ ] Task: Write the skeleton contract test: the age-5 base keeps the bone and socket names of the
  chibi base.

## Phase 2: Tools

- [ ] Task: Add the soft-edge option to the render and sprite passes (straight alpha, edge colour
  from covered samples only), with a unit test; the binary default stays for game sprites.
- [ ] Task: Write the delivery step: one scale for the cast, the foot point, the file names, the
  JSON manifest, and a format check (size, alpha, no text, foot point).

## Phase 3: Week 1 test set (owner direction: first)

- [ ] Task: Build `sprout-base` (age 5); iterate with `./forge render sprout-base --fast` in
  front, side, and back; check that existing humanoid-kind assets build to the same meshes;
  independent review.
- [ ] Task: `sprout-pip` on the dog base, with the series bible look; front and three-quarter.
- [ ] Task: Nan, Pat, May, Sam, Mia, and Ben at age 5 on `sprout-base` (hair, clothes, and colours
  from the Workbooks cast sheet; Nan from inventory section 2); review in one batch.
- [ ] Task: `sprout-adventurer` (lantern or map, no sword) and the week 1 gesture key frames:
  clap (apart, together), wave (left, right), nod (up, down), point to self, point forward, hands
  out, and idle, on one canvas with the feet at one point; review.
- [ ] Task: The classroom scene (1920 x 1080, opaque, no people, floor at about y 700 to 850) and
  the rug as a separate PNG.
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
