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

Bar 7.0/10 for NPCs (owner 2026-10-10): an NPC at 7.0 is accepted unless the model has a critical error, such as hair through a head covering or an accessory that points the wrong way (the earlier bar was the 7.5 character bar of 2026-10-02). Stop rule (owner 2026-10-08): after three reviews below
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
| 4 | glassblower, gravedigger, jeweler, librarian, lumberjack, magistrate, mason, midwife | midwife accepted at 7.5 (review 1); glassblower and librarian accepted at 7.5 (review 2); lumberjack 8.0, magistrate 8.0, and gravedigger 7.5 accepted (review 3); jeweler and mason on the follow-up list |
| 5 | miller, miner, musician, orphan, peddler, performer, potter, refugee | performer and potter accepted at 7.5 (review 2); miller, orphan, and peddler accepted at 7.5 (review 3); miner, musician, and refugee on the follow-up list |
| 6 | beggar, scholar, scribe, shepherd, stablekeeper, storyteller, student, tailor | scholar accepted at 7.5 (review 1); scribe, storyteller, student, tailor, shepherd accepted at 7.5 (review 2); beggar accepted at 7.5 (review 3); stablekeeper on the follow-up list |
| 7 | tanner, tax-collector, teacher, traveler, undertaker, watch-captain, weaver | traveler and undertaker accepted at 7.5 (review 1); weaver accepted at 7.5 (review 2); tax-collector and watch-captain accepted at 7.5 (review 3); tanner and teacher on the follow-up list |
| 8 | archaeologist, caravan-driver, cartographer, chieftain, dockworker, ferryman, hermit | archaeologist accepted at 7.5 (review 2, after a check fix); dockworker 8.0, ferryman 7.5, chieftain 7.5, caravan-driver 7.5 accepted (review 2); cartographer and hermit on the follow-up list |
| 9 | nomad, prospector, ranger-guide, riverboat-captain, ruin-keeper, shrine-keeper, trapper | prospector accepted at 7.5 (review 1); ranger-guide and shrine-keeper accepted at 7.5 (review 3); trapper accepted at 7.5 (review 2); nomad, riverboat-captain, ruin-keeper on the follow-up list |
| 10 | ambassador, commander, court-wizard, diplomat, general, guild-master, guild-member, inquisitor | court-wizard accepted at 8.0 (review 1); ambassador and diplomat accepted at 7.5 (review 2); guild-member accepted at 7.5 (review 1); inquisitor accepted at 8.0 (review 2); commander, general, guild-master on the follow-up list |
| 11 | king, queen, prince, princess, lady, lord, noble, leader | king accepted at 7.5 (review 1); queen, prince, princess accepted at 7.5 (review 2); lady accepted at 7.5 (review 4); lord, noble, leader accepted at 7.0 (owner rule) |
| 12 | masked-agent, spy, rebel, regent, royal-guard, soldier, veteran | masked-agent (review 2) and rebel (review 1) accepted at 7.0; spy (second pass, hair inside the hood) and regent accepted at 7.5, royal-guard, soldier, and veteran accepted at 7.0 (review s17, no critical error) |
| 13 | dwarf-citizen, elf-citizen, fae-citizen, gnome-citizen, halfling-citizen, goblin-citizen, orc-citizen, lizardfolk-citizen, merfolk-citizen | halfling-citizen accepted at 7.5; dwarf, elf, fae, and gnome citizens accepted at 7.0 (review s18, no critical error); goblin, orc, lizardfolk, and merfolk citizens in the serial builder queue (new builds) |

Every catalog NPC row now has a brief. `cultist`, `priest`, `healer`, `hunter`, `pilgrim`, `sailor`,
and `scout` have sources from earlier tracks. Batch 13 bases: the dwarf, elf, fae, gnome,
halfling, and merfolk citizens are the humanoid kind (the small peoples through `scaleAsset`); the goblin
citizen is the goblin kind; the orc and lizardfolk citizens start from copies of
`orc-warrior` and `kobold-warrior`. The merfolk mockup shows two bare feet, scaled shorts, and a
tail at the back, so the merfolk citizen is the humanoid kind too.

Clip clearance (2026-10-10): `./forge check` passes at a contact limit of 0.3 cm, but in the shared
attack clip the free arm swings held items close to the head (armorer shield 0.0 cm before its arm
was posed, mason trowel 0.1 cm, gravedigger cuff 0.8 cm, musician bow 0.8 cm, jeweler gem 1.7 cm).
A posed arm (`pose`) keeps the item still in every clip and is the fix that worked (armorer).

Review evidence: `bench/sonnet/npc-cards/<batch>/review.json` (cards are local PNGs, not committed).
Reviewers see review cards with the idle strip for batches 1 and 2; later batches show the walk
strip (the card default), because the shared idle clip has little motion (motion 3 to 3.5).

## Accepted at 7.0 (owner rule of 2026-10-10)

A critical-error check (no new rating) found no critical error in these NPCs, so they are accepted at their last rating of 7.0:
acolyte, bartender, carpenter, cartographer, commander, courier, elder, fisher, forager, guild-master, leader (check c1); lord, mason, mayor, merchant, miner, noble, nomad, refugee, ruin-keeper, stablekeeper, teacher, town-crier (check c2); banker, hermit, tanner, baker after a critical-error fix (review s16, part B).

## Follow-up list (three reviews below the bar)

| Asset | Ratings | Largest open issues |
| --- | --- | --- |
| beekeeper | 6.0, 6.5, 6.5 | hair locks go through the veil (dotted patches at the side and back); a dark patch on the suit at the hip in walk; narrow brim, short boots |
| jeweler | 6.0, 6.5, 6.5 | the open red mouth with white pointed teeth reads as a fanged grin (the mockup smile is closed); the tall ridged hair reads as a cap |
| musician | 5.5, 6.0, 6.5 | the fiddle is flat across the chest, not under the chin (pose cap 6.5); the fiddle is small and reads as a stick at 128 px |
| riverboat-captain | 6.5, 7.0, 6.5 | the brows slant down and the mouth is a flat dark rectangle, so he looks angry (expression cap 7.0); the nose reads as a clown nose |
| general | 6.5, 7.0, 6.5 | the telescope reads as a striped stick; the smile is a small flat line; the coat is short with no cream breeches or tall boots |
