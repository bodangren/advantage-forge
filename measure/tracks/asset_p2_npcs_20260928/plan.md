# Produce P2 npcs

Status: in progress (2026-10-09, owner goal: complete the P2 NPCs with Sonnet subagents). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map (batches below; settlement first, then wilderness, court and faction, and the fantasy peoples last).
- [x] Task: Record scale, palette, rig, clips, and game uses before generation (bench/sonnet/p2-npc-data.mjs, one row per NPC).

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch (Acceptance checks below).
- [ ] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.
- Note (2026-10-09): `baker` is at 7.2 after two reviews in the [Haiku trial](../asset_p2_npc_haiku_trial_20261009/), below the 7.5 character bar; one more pass under the stop rule. NPCs that carry an item in both hands can use the humanoid kind's `hold` option.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Acceptance checks (all batches)

Bar 7.5/10 (characters, owner 2026-10-02). Stop rule (owner 2026-10-08): after three reviews below
the bar, record the rating and put the asset on the follow-up list. Each NPC has a mockup in
`docs/npc-mockups/<name>_001.jpg` (mmx, clay-toy chibi style with the kind's big eyes), a brief in
`bench/sonnet/briefs/<name>.md` from `bench/sonnet/make-p2-npc-briefs.mjs`, one `forge-sonnet-high`
agent, `./forge check` with `result ok` and `ground ok`, a `forge all` build with no `warning:`
lines, and an independent review (measure/tracks/asset_review_audit_20261005/reviewer-brief.md)
recorded in `docs/character-reviews.json`. Builds queue on one `flock` (machine memory).

Base: `humanoidAsset` (assets/parts/humanoid-kind.ts). Options added on 2026-10-09: `hold` (both
hands on a held item in every clip, level, with a lift in cheer, cast, and attack) and `pose` (one
or both arms in a held rest pose, kept in every clip; `h.arms`, `h.perArm`). Without them the
avatar base and the baker build identical (A/B mesh, animation, and node comparison). Also on
2026-10-09: `lashes: false` (no winged lashes, for men, boys, and elders; the avatar base is
identical in the A/B), and the lid and lash paint now stop where the face turns into the temple
(a reviewer saw the old streak as a glasses arm in the side view; an intended change to every
humanoid face).
Mockups pick hands freely: the data rows follow each mockup (the character's right hand is on the
viewer's left).

## Batches

| Batch | NPCs | Status |
| --- | --- | --- |
| 1 | bartender, merchant, mayor, town-crier, herbalist, weaponsmith | done: herbalist 7.5 and weaponsmith 7.5 accepted (review 3); the other four on the follow-up list |
| 2 | apothecary, armorer, brewer, carpenter, cobbler, cook, fisher, gardener | done: apothecary, brewer, cobbler, cook accepted at 7.5 (review 2); armorer and gardener accepted at 7.5 (review 3); carpenter and fisher on the follow-up list |
| trial | baker | follow-up list: 6.8, 7.2, 7.0 after three reviews (stop rule) |
| 3 | acolyte, banker, beekeeper, butcher, candle-maker, courier, elder, forager | done: butcher accepted at 7.5 (review 2), candle-maker accepted at 7.5 (review 3); six on the follow-up list |
| 4 | glassblower, gravedigger, jeweler, librarian, lumberjack, magistrate, mason, midwife | midwife accepted at 7.5 (review 1); review 1: 7.0, 7.0, 6.0, 7.0, 7.0, 7.0, 6.5; second pass running |
| 5 | miller, miner, musician, orphan, peddler, performer, potter, refugee | review 1: 6.5, 6.5, 5.5, 7.0, 7.0, 6.5, 7.0, 6.0; second pass running |
| 6 | beggar, scholar, scribe, shepherd, stablekeeper, storyteller, student, tailor | building (beggar, scholar, scribe, shepherd started) |
| 7 | tanner, tax-collector, teacher, traveler, undertaker, watch-captain, weaver | briefs and mockups ready |
| 8 | archaeologist, caravan-driver, cartographer, chieftain, dockworker, ferryman, hermit | briefs and mockups ready (wilderness) |
| 9 | nomad, prospector, ranger-guide, riverboat-captain, ruin-keeper, shrine-keeper, trapper | briefs and mockups ready (wilderness) |

Still to write: court and faction (22), and the fantasy peoples
(9; some may need another body). `cultist`, `priest`, `healer`, `hunter`, `pilgrim`, `sailor`, and
`scout` have sources from earlier tracks.

Clip clearance (2026-10-10): `./forge check` passes at a contact limit of 0.3 cm, but in the shared
attack clip the free arm swings held items close to the head (armorer shield 0.0 cm before its arm
was posed, mason trowel 0.1 cm, gravedigger cuff 0.8 cm, musician bow 0.8 cm, jeweler gem 1.7 cm).
A posed arm (`pose`) keeps the item still in every clip and is the fix that worked (armorer).

Review evidence: `bench/sonnet/npc-cards/<batch>/review.json` (cards are local PNGs, not committed).
Reviewers see review cards with the idle strip for batches 1 and 2; later batches show the walk
strip (the card default), because the shared idle clip has little motion (motion 3 to 3.5).

## Follow-up list (three reviews below the bar)

| Asset | Ratings | Largest open issues |
| --- | --- | --- |
| baker | 6.8, 7.2, 7.0 | the hat is low with one lumpy puff; in the rest clip the chin goes into the apron bib; sharp mouth corners read as fangs at 128 px |
| bartender | 7.0, 6.5, 7.0 | the thick handlebar mustache covers the mouth (no smile shows); the mug is low; the foam is small |
| merchant | 6.5, 6.5, 7.0 | the coat is short and flares at the hip (the mockup coat is long and open, with green sleeves); the sash tails look like fingers; the side hair is a tube |
| mayor | 7.0, 7.0, 7.0 | no open grin, and the brows slope down (stern); the nose is too small; the coat is closed below the waist |
| town-crier | 6.0, 6.5, 7.0 | the shout is a small oval; the bell is at shoulder height, not head height; the front lock under the brim is missing |
| carpenter | 7.0, 7.0, 7.0 | the reviewer sees the saw pointing down with the blade edge-on from the front (the agent posed it 42 degrees up); no teeth, faceted streaks; the hair is a tall smooth mass |
| fisher | 7.0, 7.0, 7.0 | no black fringe under the hat; the large coat lapels are missing; four buttons in two rows where the mockup has two in one row |
| acolyte | 7.0, 7.0, 7.0 | the hair is one smooth swept slab (a helmet); long sleeves where the mockup has bare forearms |
| banker | 6.5, 7.0, 7.0 | the quill reads as a gray spoon and its vane goes into the sleeve cuff (defect cap 7.0) |
| beekeeper | 6.0, 6.5, 6.5 | hair locks go through the veil (dotted patches at the side and back); a dark patch on the suit at the hip in walk; narrow brim, short boots |
| courier | 6.5, 7.0, 7.0 | the hair is a ring of tight curls (the mockup has wavy locks); small letters and pack; the feather has saw teeth |
| elder | 6.0, 6.5, 7.0 | the hood is a big round ball (the mockup has a peak); narrow sleeves; sandal straps go through the sole |
| forager | 6.5, 7.0, 7.0 | a sharp V crease between the eyes reads as a frown; the mushroom, basket, and hood are small |
