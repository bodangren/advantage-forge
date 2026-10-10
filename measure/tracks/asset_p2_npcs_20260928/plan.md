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
| 4 | glassblower, gravedigger, jeweler, librarian, lumberjack, magistrate, mason, midwife | midwife accepted at 7.5 (review 1); glassblower and librarian accepted at 7.5 (review 2); lumberjack 8.0, magistrate 8.0, and gravedigger 7.5 accepted (review 3); jeweler and mason on the follow-up list |
| 5 | miller, miner, musician, orphan, peddler, performer, potter, refugee | performer and potter accepted at 7.5 (review 2); miller, orphan, and peddler accepted at 7.5 (review 3); miner, musician, and refugee on the follow-up list |
| 6 | beggar, scholar, scribe, shepherd, stablekeeper, storyteller, student, tailor | scholar accepted at 7.5 (review 1); scribe, storyteller, student, tailor, shepherd accepted at 7.5 (review 2); beggar accepted at 7.5 (review 3); stablekeeper on the follow-up list |
| 7 | tanner, tax-collector, teacher, traveler, undertaker, watch-captain, weaver | traveler and undertaker accepted at 7.5 (review 1); weaver accepted at 7.5 (review 2); tax-collector accepted at 7.5 (review 3); tanner and teacher on the follow-up list; watch-captain 7.0 (review 2) in the queue for a third pass |
| 8 | archaeologist, caravan-driver, cartographer, chieftain, dockworker, ferryman, hermit | archaeologist accepted at 7.5 (review 2, after a check fix); dockworker 8.0, ferryman 7.5, chieftain 7.5, caravan-driver 7.5 accepted (review 2); cartographer and hermit on the follow-up list |
| 9 | nomad, prospector, ranger-guide, riverboat-captain, ruin-keeper, shrine-keeper, trapper | prospector accepted at 7.5 (review 1); ranger-guide accepted at 7.5 (review 3); nomad on the follow-up list; riverboat-captain and ruin-keeper 7.0 (review 2) in the queue for a third pass; shrine-keeper and trapper not started |
| 10 | ambassador, commander, court-wizard, diplomat, general, guild-master, guild-member, inquisitor | briefs and mockups ready (court and faction) |
| 11 | king, queen, prince, princess, lady, lord, noble, leader | briefs and mockups ready (court and faction) |
| 12 | masked-agent, spy, rebel, regent, royal-guard, soldier, veteran | briefs and mockups ready (court and faction) |
| 13 | dwarf-citizen, elf-citizen, fae-citizen, gnome-citizen, halfling-citizen, goblin-citizen, orc-citizen, lizardfolk-citizen, merfolk-citizen | briefs and mockups ready (fantasy peoples) |

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
| jeweler | 6.0, 6.5, 6.5 | the open red mouth with white pointed teeth reads as a fanged grin (the mockup smile is closed); the tall ridged hair reads as a cap |
| mason | 6.5, 7.0, 7.0 | the smile is small and calm (the mockup smile is wide); the trowel is very small |
| miner | 6.5, 6.5, 7.0 | the helmet lamp does not glow; in the three-quarter view the mouth paint wraps onto the cheek and reads as a grimace |
| musician | 5.5, 6.0, 6.5 | the fiddle is flat across the chest, not under the chin (pose cap 6.5); the fiddle is small and reads as a stick at 128 px |
| refugee | 6.0, 6.5, 7.0 | the bundle stick points out at hip height and is not on the shoulder; the hair is long and lumpy, not a short wavy bob |
| stablekeeper | 7.0, 7.0, 7.0 | the beard covers the cheeks up to the eyes, so the lower face is a black mass (the mockup has a short jaw beard and a visible grin) |
| tanner | 7.0, 6.5, 7.0 | the kerchief reads as a knitted beanie with a hair tuft through the top (an acorn from the back at 128 px); the rolled hide is small and flat at the waist |
| teacher | 7.0, 7.0, 7.0 | the hair is a lumpy mass with dripping ridges (the mockup has a smooth wavy bob with side-swept bangs) |
| cartographer | 7.0, 7.0, 7.0 | the green coat flares to the knees like a robe (the mockup jacket stops at the hips and shows the belt and trousers) |
| nomad | 7.0, 7.0, 7.0 | the coat is short, closed, and flares like a skirt (the mockup coat is long and open); the bedroll reads as a gold disc |
| hermit | 7.0, 7.0, 7.0 | the white hair tuft sits on top of the hood and goes through the fabric (defect cap 7.0) |
