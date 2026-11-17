# Produce P2 items

Status: done (2026-09-30 23:55). This plan owns execution status. Source documents retain design details.

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

- [x] Task: Record review evidence and export paths for every accepted asset (bench/sonnet/log.tsv, bench/sonnet/state.tsv, out/<name>/).
- [x] Task: Update this plan and the scope records.
- [x] Task: Run measure/generate.sh and measure/doctor.sh.

## Batch 1 (Sonnet 5.5 run 4, 2026-09-30): 18 items on cheap bases

All P2, kind model, bar 7/10, `forge-sonnet-low` with three items per agent. Static assets take
priority over the open heroes per the owner (2026-09-30). Briefs come from
`bench/sonnet/make-p2-item-briefs.mjs` (into `bench/sonnet/briefs/`), mockups from mmx into
`docs/item-mockups/`. Each item copies a base file and changes color, fill, stopper, emblem, or
teeth: nine potions on `assets/health-potion.ts` (mana, stamina, strength, speed, antidote,
resistance, invisibility, elixir, poison-bottle), four keys on `assets/key-iron.ts` (gold,
bronze, skeleton, ancient), two coins on `assets/gold-coin.ts` (silver, copper), bread-ration
on `assets/loaf.ts`, waterskin on `assets/canteen.ts`, coin-purse on `assets/belt-pouch.ts`.
Size, palette, and triangle cap (3,000 to 4,000) are in each brief. No rig, no clips. Run log
`bench/sonnet/log.tsv` (batch `run4`), state `bench/sonnet/state.tsv`.
- health-potion base (P0, `items/consumables/health-potion`): rebuilt as a ball flask by a medium
  agent (two passes, 50,231 tokens) plus an orchestrator material pass. Review 7.5. Committed
  (195fda4). Lessons: a solid glass body (a shell shows its inner surface as cracks); glass opacity
  0.5 or more, because the sprite renderer drops surfaces below 0.5 (TD-13); the liquid base is the
  glow color at full brightness with emissiveIntensity 0.6.
- key-gold (7.0, one feedback pass) and key-bronze (7.0, feedback pass plus a fresh high bow
  rework) committed (00bad6e). key-skeleton skipped at 6.8 after the second retry: the skull face
  reads only from the east sprites. Source left uncommitted.
- In flight: mana, stamina, strength potions (feedback pass: full glow color as the base); speed,
  antidote, resistance potions; silver-coin, copper-coin, ancient-key.
- Accepted and committed: mana-potion, stamina-potion, strength-potion, antidote (7.0), speed-potion,
  resistance-potion (7.3), copper-coin (7.2). Lesson: the glass tint follows the liquid hue at about
  45 percent brightness; the cool grey base tint turned warm liquids to salmon.
- Accepted and committed: invisibility-potion, elixir, poison-bottle (7.1, 8dd1d06); silver-coin,
  ancient-key (7.0 after one feedback pass, 07796be); coin-purse (7.3, 3538a70); bread-ration,
  waterskin (7.0 after one feedback pass, 419ce19).
- Batch 1 result (2026-09-30 21:12): 18 of 19 items accepted at 7.0 to 7.5; key-skeleton skipped.
  Low tier failed the first potion batch (5.5): it viewed one render for three items. Medium tier
  with three items per agent held the bar. Next: wave 2 (scrolls, gems, ores, crafting materials)
  needs briefs and mockups from the generator before launch.

## Batch 2 (Sonnet 5.5 run 4, 2026-09-30 22:30): crafting materials, gems, scrolls, maps, wood

Thirteen of the 36 missing P2 item ids, chosen where a tested base exists: copper-ore, gold-ore,
silver-ore on `assets/iron-ore.ts`; ancient-scroll, magic-scroll on `assets/scroll.ts`;
treasure-map, map-fragment on `assets/map.ts`; wood-log, plank on `assets/log.ts`; gem-ruby,
gem-emerald, gem-sapphire, crystal-shard from a faceted-solid recipe (opaque, full-brightness
color, emissive 0.35, `flat: true`; a see-through gem loses its color in sprites, TD-13). The
generator `bench/sonnet/make-p2-item-briefs.mjs` holds the ORE, GEM, SCROLL, MAP and LOG kinds;
mockups come from mmx into `docs/item-mockups/`. Medium tier, three to four items per agent.
- Result (23:05): all 13 accepted at 7.0 to 7.3 and committed (c063352, d96a03e, d3469db, plus
  the ores and map-fragment). Ores needed one feedback pass (a wide squat rock with a large
  bevelled metal face, not a small nodule). Maps needed one feedback pass (propped at 70 degrees on
  a wedge, a raised red X) and one orchestrator edit on map-fragment (a full X, a soft sea wash).
  Sapphire and crystal-shard needed one feedback pass (medium blue with twelve crisp facets; a
  slender crystal cluster with a glowing core). About 300K subagent tokens for 13 items.
- Batch 2B (23:05): 17 more items on four medium agents from generator briefs (HERB, PART,
  TEXTILE, QUEST kinds): healing-herb, herb-root, flower-petal, mushroom-cap; monster-bone,
  monster-claw, monster-fang, dragon-scale; shell, feather, cloth, thread, wool; letter-sealed,
  quest-document, royal-seal, rune-tablet. mmx refused seven mockup prompts (map-fragment,
  herb-root, monster-bone, monster-claw, monster-fang, leather, hide); those items build from
  the brief text without a `reference`. map-fragment points at map-mock.jpg until a mockup exists.
- Batch 2B result (23:50): all 17 accepted at 7.0 to 7.2. Five needed one feedback pass
  (monster-claw, dragon-scale, rune-tablet, wool, flower-petal); monster-bone's `bump: 0.3` broke the
  textured build (bump must be a function) and was fixed by the orchestrator.
- Batch 2C (23:30 to 23:50): the last six (leather, hide, bandage, relic-orb, artifact-idol, ration)
  accepted at 7.0 to 7.2 on the first pass.

## Close (2026-09-30 23:55)

All 56 P2 items have an accepted source at 7.0 or above (bar 7): 18 in batch 1, 13 in batch 2A,
17 in 2B, 6 in 2C, plus the two that existed before. About 1.28M subagent tokens for 54 items in
run 4 (about 24K per item). Lessons: a construction brief with sizes and colors on the medium tier
lands at 7 on the first pass about three times in four; flat items must stand or prop at 70 degrees;
`bump` is a function; glass is a solid body at opacity 0.5; emissive bodies use a full-brightness
base at 0.35 to 0.7. Follow-ups: the mockups' faceted looks (relic-orb, sapphire) are simplified;
the mmx network failures (eight prompts) resolved on retry.

## Closeout (2026-10-02, track `asset_p0p1_closeout_20261002`)

The closeout gave key-skeleton one more pass (owner decision): 7.2, at the P2 bar (19f193e). Scores and notes are in `bench/sonnet/log.tsv` (batch `closeout`) and in `docs/character-reviews.json`. Bars: P0 7.5, P1 7.0, characters 7.5 (owner decision of 2026-10-02).
