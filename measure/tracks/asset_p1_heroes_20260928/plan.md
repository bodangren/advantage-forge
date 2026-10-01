# Complete P1 heroes

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map.
- [x] Task: Record scale, palette, rig, clips, and game uses before generation.

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [x] Task: Build missing sources and review existing sources in the batch.
- [x] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [x] Task: Record review evidence and export paths for every accepted asset.
- [x] Task: Update this plan and the scope records.
- [x] Task: Run measure/generate.sh and measure/doctor.sh.

## Batch 1 (Sonnet 5.5 probe, 2026-09-29): samurai

Catalog ID `heroes/martial/samurai`, P1, kind character, bar 8/10.

- Contract: the paladin base (knight body, rogue face, knee bones, eight clips), beardless, 0.95 m,
  red lacquer kabuto with a black bowl and gold crescent, red scale cuirass over indigo, katana
  rigid in the right hand, four variant slots with four lacquer presets.
- Agent: `forge-sonnet-high`, one build plus one feedback pass, 188,689 tokens, 40 tool uses.
- Evidence: `assets/samurai.ts`; `out/samurai/` (GLB, render, sprites, eight clips); `forge check`
  ends with `result ok`; no `warning:` lines; 49,672 triangles. Review 8.2 in
  `docs/character-reviews.json`. Run log `bench/sonnet/log.tsv`.
- Known limits: flat crest tips, plain neck guard from the back, small rivets at 128 px.

## Batch 2 (Sonnet 5.5 run 4, 2026-09-30): the 32 open P1 heroes

All P1, kind character, bar 8/10, one `forge-sonnet-high` agent per hero, beardless on an existing
hero base, mmx mockups in `docs/hero-mockups/`, briefs in `bench/sonnet/briefs/`. Order by game
need: alchemist (Alchemist's Synthesis), sorcerer (Sorcerer Ziggurat), dragoon (Dragon Rider),
beast-rider (Griffin Riders), then the magic, martial, and support groups. Run log
`bench/sonnet/log.tsv` (batch `run4`), state `bench/sonnet/state.tsv`.

- In flight: alchemist (adventurer base), sorcerer (mage base), dragoon (knight base).
- alchemist (`heroes/magic/alchemist`), P1: adventurer base, one build plus one feedback pass,
  175,793 tokens. 58,232 triangles, check ok. Review 8.0. Committed.
- In flight: sorcerer and dragoon (feedback passes after 7.5 and 7.0), beast-rider.
- sorcerer (`heroes/magic/sorcerer`), P1: mage base, one build plus one feedback pass, 175,081
  tokens. 52,400 triangles, check ok. Review 8.0. Committed.
- In flight: dragoon (feedback after 7.0), beast-rider, warrior. Briefs and mockups ready: healer,
  hunter, scout, fighter, berserker, summoner, elementalist.
- dragoon (`heroes/martial/dragoon`), P1: knight base, one build plus one feedback pass, 258,028
  tokens. 59,212 triangles, check ok. Review 8.0. Committed.
- In flight: beast-rider, warrior, healer.
- beast-rider (`heroes/martial/beast-rider`), P1: ranger base, one build plus one feedback pass,
  176,316 tokens. 54,526 triangles, check ok. Review 8.0. Committed.
- In flight: warrior, healer, hunter, scout.
- warrior (`heroes/martial/warrior`), P1: barbarian base, one build plus one feedback pass,
  158,393 tokens. 40,614 triangles, check ok. Review 8.0. Committed.
- In flight: healer (fresh high rework of the hood after 7.3 and 7.8), hunter, scout, fighter.
- healer (`heroes/magic/healer`), P1: priest base, one build, one feedback pass, and one fresh
  `forge-sonnet-high` hood rework, 238,501 tokens. 49,680 triangles, check ok. Review 8.0.
  Committed. Lesson: a hood needs a rolled rim and a clipped fringe in the brief; a smooth ball
  survives feedback passes.
- In flight: hunter, scout, fighter (feedback passes after 7.2, 7.0, 7.3), berserker.
- fighter (`heroes/martial/fighter`), P1: knight base, one build plus one feedback pass,
  154,205 tokens. 44,078 triangles, check ok. Review 8.0. Committed.
- berserker: the first `forge-sonnet-high` agent stalled after its base reads (73,084 tokens,
  no file); relaunched with a copy-first instruction.
- In flight: hunter, scout (feedback passes), berserker (relaunch).
- hunter (`heroes/martial/hunter`), P1: archer base, one build plus one feedback pass, 225,132 tokens. 49,742
  triangles, check ok. Review 8.0. Committed.
- In flight: scout (feedback pass), berserker (relaunch), summoner, elementalist.
- scout: the feedback pass fixed the props and the cloak but left the hair as a wreath of locks on
  a smooth dome (7.5); a fresh `forge-sonnet-high` hair rework runs from
  `bench/sonnet/briefs/scout-rework.md`.
- In flight: scout (hair rework), berserker (relaunch), summoner, elementalist.
- scout (`heroes/martial/scout`), P1: ranger base, one build, one feedback pass, and one fresh
  `forge-sonnet-high` hair rework, 227,098 tokens. 43,064 triangles, check ok. Review 8.0.
  Committed. Lesson: a mane brief must place locks over the whole skull (top, sides, nape) with
  jittered directions; "swept locks" alone yields one row on a smooth dome.
- In flight: berserker (relaunch), summoner, elementalist, duelist.
- elementalist (`heroes/magic/elementalist`), P1: mage base, one build plus one feedback pass,
  144,262 tokens. 52,036 triangles, check ok. Review 8.0. Committed. Limit: pale translucent
  flames.
- In flight: berserker, summoner (feedback passes), duelist, gladiator.
- summoner: the feedback pass fixed the coat, the spirit, and the belt but left the hair a smooth
  lumpy helmet (7.8); a fresh `forge-sonnet-high` hair rework runs from
  `bench/sonnet/briefs/summoner-rework.md`.
- In flight: summoner (hair rework), berserker, duelist (feedback passes), gladiator.
- berserker (`heroes/martial/berserker`), P1: barbarian base, one stalled agent (73,084 tokens)
  then one build plus one feedback pass (194,511 tokens). 47,782 triangles, check ok. Review 8.0.
  Committed.
- In flight: summoner (hair rework), duelist (feedback pass), gladiator, guardian.
- duelist (`heroes/martial/duelist`), P1: bard base, one build plus one feedback pass, 183,929 tokens. 50,470
  triangles, check ok. Review 8.0. Committed.
- In flight: summoner (hair rework), gladiator, guardian, shield-maiden.
- summoner (`heroes/magic/summoner`), P1: mage base, one build, one feedback pass, and one fresh
  high hair rework, 242,582 tokens in all. Closed at 7.8 (skipped after the second retry): the
  mane locks now cover the skull, but the side and back views read as crossing ropes. Source
  `assets/summoner.ts` left uncommitted for the owner.
- Direction change 2026-09-30 20:05 (owner): static assets first. Gladiator, guardian, and
  shield-maiden resume only to close; no new hero launches in run 4. The 16 open heroes
  (artificer, enchanter, oracle, rune-smith, shaman, spear-warden, swashbuckler, apprentice,
  captain, caravan-guard, explorer, monster-hunter, noble-champion, pilgrim, sailor,
  treasure-hunter) wait for a later run. Briefs and mockups are ready for all 16.
- gladiator (`heroes/martial/gladiator`), P1: barbarian base, one build plus one feedback pass,
  181,476 tokens. 52,242 triangles, check ok 4.5 cm. Review 8.0. Committed.
- guardian (`heroes/support/guardian`): first build 7.3 (122,509 tokens), feedback pass in flight
  (gold-edged armor, chunky hammer, shield rim, crown band). shield-maiden: first build in flight.
- shield-maiden (`heroes/martial/shield-maiden`), P1: knight base, one build plus one feedback pass,
  171,919 tokens. 58,182 triangles, check ok 4.1 cm. Review 8.0. Committed.
- guardian: feedback pass closed at 7.8 (149,287 tokens); a fresh high rework of the armor plates
  and the hammer is in flight from `bench/sonnet/briefs/guardian-rework.md`.
- guardian (`heroes/support/guardian`), P1: paladin base, one build, one feedback pass, and one
  fresh high armor rework, 230,677 tokens in all. 63,298 triangles, check ok 4.3 cm. Review 8.0.
  Committed. All three heroes that the session exit interrupted are now closed; no hero is in flight.

## Heroes resume (2026-10-01 00:10 onward)

Every static family closed at 00:00, so the 16 open heroes resumed one per forge-sonnet-high
agent, bar 8, from the run-4 briefs and mmx mockups. Accepted so far: rune-smith 8.0, enchanter
8.0, artificer 8.0, oracle 8.0, swashbuckler 8.0, spear-warden 8.0, shaman 8.0 (each one build
plus one feedback pass, 145K to 265K tokens). Three of them also took one small orchestrator edit
after the feedback pass instead of a second rework agent: the oracle hair (a lower pile base,
rolls blended at 0.006, valleys shaded by height), the shaman held feather (a wider vane gripped
low on the quill; the agent's feather was face-on but narrow and low) and the apprentice mantle
(a back cape with the front cut away; the agent's shell read as a band around the arms); the
apprentice reached 8.0 after that edit. Captain and explorer reached 8.0 on one feedback pass
each (dark steel with gold rims, tassets, a lion crest; a soft bucket hat, a caged orange lantern,
a rope collar). Caravan-guard reached 8.0 after its feedback pass plus an orchestrator hat edit
(the crown was nearly as wide as the brim, so the brim read as a rim; crown r 0.168, brim r 0.3).
Monster-hunter reached 8.0 on one feedback pass (value contrast: charcoal coat with leather trim,
brown boots and bandolier, visible fists, a cleaver and a spiked club). Noble-champion reached 8.0 on one
feedback pass (swept waves, separated gauntlets, bold gold). Sailor, pilgrim and treasure-hunter reached 8.0 on one feedback pass
each (a flat beret and a braided rope; a darker hooded cloak over a tan tunic and tight curls; a
bright-base orange flame, a gold totem idol and a whip coil). No hero is in flight.
Pattern: first builds land at 7.3 to 7.8; the feedback pass names hair locks, edge rims, held-item
size and clip clearance, and reaches 8.

## Close (2026-10-01 05:15)

Every P1 hero row in the catalog has an accepted source. Run 4 built the 32 open heroes in two
waves (12 before the static-first direction change, 3 closing the interrupted builds, then the 16
that resumed after the statics closed on 2026-10-01): 31 accepted at 8.0 and committed with review
entries on docs/character-reviews.json; summoner closed at 7.8 after the second retry, source
`assets/summoner.ts` left uncommitted for the owner's call. Cost pattern for the resumed 16: one
build (115K to 195K tokens) plus one feedback pass (23K to 55K) reached 8.0 for 13; three of them
(oracle, shaman, apprentice, caravan-guard) also took one small orchestrator edit after the feedback
pass instead of a second rework agent, each fixing one local geometry miss the agent's pass had
left (hair rolls merged into a dome, a held feather too narrow and low, a mantle that read as an
arm band, a hat crown as wide as its brim). Rules that held across the wave: hair as separate
chain locks; a hat brim at least 1.5 times its crown radius; mid-value steel with rims on every
plate; value contrast at 128 px (a light shirt or brown leather against dark cloth); a flame or
glow needs a full-brightness base under an emissive of 0.5 to 0.7; held items at least 0.03 m thick
and turned to face the camera. Evidence: out/<name>/render.png, sprites/preview.png, the check
line in bench/sonnet/log.tsv, and the review page. Deviation: the asset_quality_20260928
dependency is dropped from this track's metadata because a completed track must not depend on an
unfinished one; that track's silhouette and material rules were applied per asset in the reviews
instead. Phase tasks are checked on that basis: the batch contract and checks lived in the briefs
under bench/sonnet/briefs/ and the review rubric rather than in a separate scope record.
