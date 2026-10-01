# Complete P1 enemies

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map.
- [x] Task: Record scale, palette, rig, clips, and game uses before generation.

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [~] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Batch 1: wood-golem

Catalog ID `enemies/construct/wood-golem`, P1, kind character.

Contract, before generation:

- Scale 1.14 m to the crown tips, standing on y = 0, facing +Z. The rig is the stone golem's
  chibi humanoid, so the three golems share a set.
- Silhouette: a split-plank crown and four curling vines break the outline; the head is the
  dominant mass at 0.72 to 0.98 m and is nearly as wide as the shoulders.
- Palette: driftwood `#5f4e3c` with pale worn faces `#c6b28c`; moss and vine greens `#54792f` and
  `#6f9c38`; amber `#ffa519` for two eye slits and one chest core. Rope `#c2a06a` from the
  blacksmith construction contract section 3.
- Clips: idle, walk, run, attack (a two-fist ground slam), attack2 (a charge and a backhand
  swipe), roar, hit, death.
- Idealization: a concept mockup was generated first, then the source. Neither existed at the
  migration baseline.

Evidence:

- Source: `assets/wood-golem.ts`, with a design note and `reference:` in the header.
- Mockup: `docs/enemy-mockups/wood-golem_001.jpg`, generated with the frozen chibi style suffix
  from `bench/overnight/make-denizen-mocks.sh`.
- Outputs: `out/wood-golem/` holds a textured GLB at 1024 atlas, `render.png` with the four
  views, `sprites/preview.png` for eight directions, `anim/<clip>.png` and `.gif` for all seven
  clips, and preset renders plus preset sprites for swamp, ember, and winter.
- Build: 59,940 triangles, no `warning:` lines.
- Clearance: `./forge check wood-golem` reports `result no held items to check` and
  `ground ok: no clip sinks more than 1.5 cm below the rest pose`.
- Review: `docs/character-reviews.json` holds the wood-golem scores, strengths, issues, and next
  steps. Overall 3.8; sprite and materials are the two criteria below 4.

Known limits, carried to the next batch:

- The eye slits read as two dark bars at 128 px.
- The moss and the bark sit close in value.
- The shins are smooth cones, not carved roots.

## Batch 1 enemy phase (Sonnet 5.5 high tier, 2026-09-29): orc-archer

- orc-archer (`enemies/humanoid/orc-archer`), P1, bar 8/10: `forge-sonnet-high` on the
  orc-warrior base, one build plus two feedback passes, 186,751 tokens. `assets/orc-archer.ts`,
  52,708 triangles, no warnings, `forge check` ok, eight clips, sprites for the default and
  three presets. Review 8.0 in `docs/character-reviews.json`. Mockup made with mmx:
  `docs/enemy-mockups/orc-archer_001.jpg`. Limits: skin renders saturated; static bowstring.
- In flight: goblin-king (Labyrinth boss), orc-shaman, ogre-brute (feedback passes), wood-golem
  rework (owner request).
- goblin-king (`enemies/humanoid/goblin-king`), P1, the Labyrinth boss (docs/game-labyrinth-3d.md),
  bar 8/10: `forge-sonnet-high` on the goblin-warrior base, one build plus one feedback pass,
  173,443 tokens. `assets/goblin-king.ts`, 52,610 triangles, no warnings, `forge check` ok, seven
  clips. Review 8.0. Mockup `docs/enemy-mockups/goblin-king_001.jpg` (mmx). Limits: 1.04 m tall,
  plain crown cones, smooth cape back.
- orc-shaman (`enemies/humanoid/orc-shaman`), P1, bar 8/10: `forge-sonnet-high` on the
  orc-warrior base, one build plus one feedback pass, 198,890 tokens. `assets/orc-shaman.ts`,
  67,146 triangles, no warnings, `forge check` ok, eight clips. Review 8.0. Mockup
  `docs/enemy-mockups/orc-shaman_001.jpg` (mmx). Limits: cap-like hood, faint face paint.
- Reworks in flight to reach the 8 bar: wood-golem (3.8), minotaur-guard (7.0), mummy (7.5).
- mummy (`enemies/undead/mummy`) rework 2026-09-30: `forge-sonnet-high`, one pass, 75,483 tokens;
  7.5 to 8.0. `assets/mummy.ts`, 27,216 triangles, no warnings, ground ok. Committed.
- wood-golem (`enemies/construct/wood-golem`) rework 2026-09-30: `forge-sonnet-high`, three
  passes, 120,760 tokens; 3.8 to 7.5. 70,148 triangles, no warnings. Below the bar: the eye slits
  read only as flecks in the front sprites. The source stays untracked (owned by the dungeon
  denizens session); the review entry is updated. Next: raise the eye slot and push the slits out.
- minotaur-guard (7.0) rework: two `forge-sonnet-high` agents stalled with empty logs (45 and
  19 minutes) and were stopped; skipped. Brief kept in `bench/sonnet/briefs/minotaur-guard-rework.md`.
- ogre-brute (`enemies/humanoid/ogre-brute`), P1: `forge-sonnet-high`, three passes, 241,959
  tokens; 7.8, below the bar. Source uncommitted; review entry added. Next: bend the hanging arm.
- minotaur-guard rework, third launch 2026-09-30: accepted 8.0 and committed (0430099). The two
  earlier launches were not stalled; the task output file stays small while an agent runs.
- dark-knight (`enemies/humanoid/dark-knight`), P1: `forge-sonnet-high` on the death-knight base,
  one build plus one feedback pass, 130,217 tokens. `assets/dark-knight.ts`, 43,730 triangles, no
  warnings, `forge check` ok. Review 8.0. Committed (53bbf0e).
- wight (`enemies/undead/wight`), P1: vampire base, one build, one feedback pass, one fresh
  rework agent, 244,384 tokens. `assets/wight.ts`, 48,380 triangles, no warnings, check ok.
  Review 8.0. Committed (73039b8).
- revenant (`enemies/undead/revenant`), P1: zombie-soldier base, one build plus one feedback
  pass, 192,527 tokens. `assets/revenant.ts`, 49,284 triangles, no warnings, check ok. Review
  8.0. Committed (710812e).
- orc-warlord (`enemies/humanoid/orc-warlord`), P1: orc-warrior base, one build plus one
  feedback pass, 197,402 tokens. `assets/orc-warlord.ts`, 68,024 triangles, no warnings, check
  and ground ok. Review 8.0. Committed (eb5e582).
- The owner reset the token counter on 2026-09-30 01:35; the run continues to a new 4,000,000
  limit. Open P1 enemies are ordered by game need in `bench/sonnet/OVERNIGHT.md`. In flight:
  bandit-captain (fresh rework after 7.4), banshee (feedback after 6.0), iron-golem (feedback
  after 7.2), gargoyle. Briefs and mockups ready: specter, troll-guard, gnoll-warrior.
- bandit-captain (`enemies/humanoid/bandit-captain`), P1: bandit base, one build, one feedback
  pass, one fresh rework, 248,432 tokens. 50,732 triangles, check ok. Review 8.0. Committed (504751f).
- iron-golem (`enemies/construct/iron-golem`), P1: stone-golem base, one build plus one feedback
  pass, 118,659 tokens. 24,562 triangles, ground ok. Review 8.0. Committed (11df229).
- gargoyle (`enemies/construct/gargoyle`), P1: imp base, one build plus one feedback pass,
  143,795 tokens. 40,678 triangles, ground ok. Review 8.0. Committed (4c4cdb8).
- banshee (`enemies/undead/banshee`), P1: ghost base, three passes (6.0, 6.5, 7.3), 190,773
  tokens; skipped below the bar. Source uncommitted; review entry added. Next: head to one third
  of the body, hair as 20 to 30 medium chains over a thin cap, ribbon wisps.
- In flight: specter (feedback after 7.3), troll-guard, gnoll-warrior, poltergeist. Briefs and
  mockups ready: plague-bearer, vampire-lord, clay-golem.
- specter (`enemies/undead/specter`), P1: wraith base, one build, one feedback pass, one fresh
  rework, 184,461 tokens. 45,884 triangles, check ok. Review 8.0. Committed (43a6660).
- poltergeist (`enemies/undead/poltergeist`), P1: ghost base with four orbiting objects on their
  own bones, one build plus one feedback pass, 105,054 tokens. 27,596 triangles, ground ok.
  Review 8.0. Committed (f70610b).
- vampire-lord (`enemies/undead/vampire-lord`), P1: vampire base, one build, 86,474 tokens.
  41,674 triangles, check ok. Review 8.0. Committed (8a2fc40).
- In flight: troll-guard, gnoll-warrior, plague-bearer (feedback passes), clay-golem. Briefs and
  mockups ready: crystal-golem, living-statue, kobold-sorcerer, gnoll-hunter.
- troll-guard (`enemies/humanoid/troll-guard`), P1: orc-warrior base, one build plus one
  feedback pass, 186,234 tokens. 64,732 triangles, check ok. Review 8.0. Committed (ee36ac3).
- clay-golem (`enemies/construct/clay-golem`), P1: stone-golem base, one build plus one feedback
  pass, 92,817 tokens. 21,908 triangles, ground ok. Review 8.0. Committed (41ef7f2).
- In flight: gnoll-warrior (feedback after 7.7), plague-bearer (fresh rework after 6.8 and 7.0),
  crystal-golem, living-statue. Briefs and mockups ready: kobold-sorcerer, gnoll-hunter.
- gnoll-warrior (`enemies/humanoid/gnoll-warrior`), P1: orc-warrior base, one build plus one
  feedback pass, 206,339 tokens. 68,876 triangles, check ok. Review 8.0. Committed (191a7ed).
- kobold-sorcerer (`enemies/humanoid/kobold-sorcerer`), P1: kobold-warrior base with the
  goblin-shaman staff pattern, one build, 132,483 tokens. 50,470 triangles, check ok. Review 8.0.
  Committed (15c15a9).
- crystal-golem (`enemies/construct/crystal-golem`), P1: stone-golem base, one build plus one
  feedback pass, 106,289 tokens. 41,798 triangles, ground ok. Review 8.0. Committed (80f00e6).
- plague-bearer (`enemies/undead/plague-bearer`), P1: zombie base, three passes (6.8, 7.0, 7.8),
  274,251 tokens; skipped just under the bar. Source uncommitted; review entry added. Next:
  lengthen the beak, wrinkle and darken the hood, add coat straps.
- In flight: living-statue (feedback after 7.3), gnoll-hunter, kobold-trapper, clockwork-sentry.
  Briefs and mockups ready: clockwork-soldier, animated-weapon.
- clockwork-sentry (`enemies/construct/clockwork-sentry`), P1: animated-armor base, one build
  plus one feedback pass, 140,021 tokens. 38,992 triangles, check ok. Review 8.0. Committed (2aac357).
- In flight: living-statue (fresh rework after 7.3 and 7.7), gnoll-hunter and kobold-trapper
  (feedback passes after 7.5), clockwork-soldier. Brief and mockup ready: animated-weapon.
- kobold-trapper (`enemies/humanoid/kobold-trapper`), P1: kobold-warrior base, one build plus one
  feedback pass, 142,089 tokens. 57,350 triangles, check ok. Review 8.0. Committed (729c01b).
- living-statue (`enemies/construct/living-statue`), P1: knight base, three passes (7.3, 7.7,
  7.8), 349,087 tokens; skipped just under the bar. Source uncommitted; review entry added. Next:
  a taller cap helm with a curled laurel, a darker marble base, sparse hand-placed cracks.
- In flight (the last launches of run 2): gnoll-hunter and clockwork-soldier (feedback passes),
  animated-weapon.
- clockwork-soldier (`enemies/construct/clockwork-soldier`), P1: animated-armor base, one build
  plus one feedback pass, 183,278 tokens. 56,394 triangles, check ok. Review 8.0. Committed (72603b3).
- animated-weapon (`enemies/construct/animated-weapon`), P1: animated-armor skeleton with no
  body, one build plus one feedback pass, 127,723 tokens. 19,244 triangles, check ok. Review 8.0.
  Committed (3d8d79c).
- In flight (the last agent of run 2): gnoll-hunter fresh rework after 7.5 and 7.7.
- gnoll-hunter (`enemies/humanoid/gnoll-hunter`), P1: orc-archer base, one build, one feedback
  pass, one fresh rework, 248,492 tokens. 63,698 triangles, check ok. Review 8.0. Committed (eaba455).
- Run 2 summary at 06:45: 20 of 23 enemies accepted at 8.0, 3 skipped near the bar (banshee 7.3,
  plague-bearer 7.8, living-statue 7.8), 3.65M of the 4.0M reset budget. brigand (bandit base) is
  the final build of the run. Open P1 enemies after it (14): assassin, cult-leader, dark-mage,
  deserter, evil-priest, highwayman, hunter-rival, mercenary, pirate, pirate-captain, raider,
  smuggler, warlock, witch.
- Run 3 (counter reset 2 at 07:03 on 2026-09-30; batch run3 in log.tsv, new 4.0M limit). The owner
  noted the three sub-bar characters; each gets one fresh rework under this budget.
- brigand (`enemies/humanoid/brigand`), P1: bandit base, one build plus one feedback pass,
  159,379 tokens (35,620 after the reset). 45,058 triangles, check ok. Review 8.0. Committed (71378a4).
- raider (`enemies/humanoid/raider`), P1: brigand base, one build plus one feedback pass,
  135,595 tokens. 55,594 triangles, check ok. Review 8.0. Committed (aa8cf4f).
- plague-bearer (`enemies/undead/plague-bearer`), P1: rework 2 by a fresh high agent, 90,334 tokens.
  55,272 triangles, check ok. Review 7.8 -> 8.0. Committed (fff0097).
- highwayman (`enemies/humanoid/highwayman`), P1: bandit base, one build plus one feedback pass,
  183,899 tokens. 40,968 triangles, check ok. Review 8.0. Committed (f7fcd51).
- In flight: mercenary (feedback after 7.5), banshee (rework 2 feedback after 7.6), living-statue
  (rework 2), deserter. Briefs and mockups ready: assassin, smuggler, pirate, pirate-captain,
  hunter-rival, dark-mage, warlock, witch, cult-leader, evil-priest.
- mercenary (`enemies/humanoid/mercenary`), P1: knight base, three passes (7.5, 7.7, 7.6), 259,469
  tokens; skipped just under the bar (the rework regressed the hair). Source uncommitted; review
  entry added. Next: restore the swept spiky fringe, enlarge the emblem, drop the beard 0.01 m.
- assassin (`enemies/humanoid/assassin`), P1: rogue base, one build, one feedback pass, one fresh
  rework for the sprite face, 200,763 tokens. 44,098 triangles, check ok. Review 8.0. Committed (283c013).
- deserter (`enemies/humanoid/deserter`), P1: guard base, one build (after a stalled first agent),
  135,533 tokens. 39,416 triangles, check ok. Review 8.0. Committed (6f17c5c).
- banshee (`enemies/undead/banshee`), P1: rework 2 by a fresh high agent plus one feedback pass,
  138,946 tokens. 55,154 triangles, ground ok. Review 7.3 -> 8.0. Committed (6f17c5c).
- Two agents stalled after their first reads (living-statue rework 2, deserter) and were stopped
  and relaunched; see bench/sonnet/OVERNIGHT.md 09:06.
- In flight: living-statue (rework 2 feedback after 7.6), smuggler, pirate, pirate-captain.
- living-statue (`enemies/construct/living-statue`), P1: rework 2 plus one feedback pass under run 3,
  130,291 tokens; five passes in all (7.3, 7.7, 7.8, 7.6, 7.6); skipped just under the bar (the helm
  shape never matched). Source uncommitted; review entry updated.
- pirate (`enemies/humanoid/pirate`), P1: bandit base, one build plus one feedback pass, 192,894
  tokens. 36,274 triangles, check ok. Review 8.0. Committed (8520a1f).
- smuggler (`enemies/humanoid/smuggler`), P1: bandit base, one build plus one feedback pass,
  169,932 tokens. 41,712 triangles, check ok. Review 8.0. Committed (0bfc1ac).
- In flight: hunter-rival (feedback after 7.7), dark-mage, warlock, pirate-captain (fresh rework
  after 7.6 and 7.5: the hat). Briefs and mockups ready: witch, cult-leader, evil-priest.
- hunter-rival (`enemies/humanoid/hunter-rival`), P1: ranger base, one build plus one feedback pass,
  171,071 tokens. 59,460 triangles, check ok. Review 8.0. Committed (7ba3d8d).
- pirate-captain (`enemies/humanoid/pirate-captain`), P1: bandit-captain base, one build, one
  feedback pass, one fresh rework (the tricorn copied from the highwayman), 254,083 tokens.
  58,048 triangles, check ok. Review 8.0. Committed (f8a814e).
- In flight: dark-mage and warlock (feedback passes after 7.7 and 7.6), witch, cult-leader.
  Brief and mockup ready: evil-priest (the last open P1 enemy).
- warlock (`enemies/humanoid/warlock`), P1: mage base, one build plus one feedback pass, 160,331
  tokens. 46,246 triangles, check ok. Review 8.0. Committed (19c86dd).
- dark-mage (`enemies/humanoid/dark-mage`), P1: necromancer base, one build plus one feedback pass,
  133,524 tokens. 51,436 triangles, check ok. Review 8.0. Committed (53eb0a8).
- cult-leader (`enemies/humanoid/cult-leader`), P1: cultist base, one build plus one feedback pass,
  149,634 tokens. 47,220 triangles, check ok. Review 8.0. Committed (be032e2).
- witch (`enemies/humanoid/witch`), P1: mage base, one build plus one feedback pass, 151,268 tokens.
  55,238 triangles, check ok. Review 8.0. Committed (4b4f760).
- Owner note 11:20: mercenary gets one more fresh pass and is accepted after it, even at 7.9.
- In flight: evil-priest (the last open P1 enemy), mercenary (rework 2 per the owner note).
- mercenary (`enemies/humanoid/mercenary`), P1: rework 2 per the owner note (11:20), 78,284 tokens;
  four passes in all (7.5, 7.7, 7.6, 7.9). Accepted at 7.9 on the owner's instruction. 45,876
  triangles, check ok. Committed (06ec0f0).
- evil-priest (`enemies/humanoid/evil-priest`), P1: priest base, one build plus one feedback pass,
  165,140 tokens. 52,926 triangles, check ok. Review 8.0. Committed (1f57452). This was the last
  open P1 enemy.
- In flight: living-statue rework 3 (owner note 11:50: one more high pass with a marble surface).
- living-statue (`enemies/construct/living-statue`), P1: rework 3 with a marble brief (owner note
  11:50), 75,897 tokens; seven passes in all. The marble now reads (off-white base, two-scale
  veins, polish, chipped rim). Review 7.8; check ok. The source stays uncommitted until the owner
  approves it (owner note: "rework living-statue in one high pass before asking me for approval").
- Run 3 summary (2026-09-30 07:03 to 12:00): 18 assets, 3,012,858 tokens; 17 accepted (14 new
  enemies at 8.0, banshee and plague-bearer reworked to 8.0, mercenary at 7.9 per the owner);
  living-statue at 7.8 pending the owner. No open P1 enemy rows remain. Uncommitted sources for
  the owner: living-statue, ogre-brute (7.8), wood-golem (7.5).

## Closeout (2026-10-02, track `asset_p0p1_closeout_20261002`)

The closeout brought the 5 rows of this family below their bar to it: stone-golem 7.5, wraith 7.5, wood-golem 7.5 (one more pass, owner decision); bone-golem 7.5 and bandit-archer 7.5 by the character rule. Scores and notes are in `bench/sonnet/log.tsv` (batch `closeout`) and in `docs/character-reviews.json`. Bars: P0 7.5, P1 7.0, characters 7.5 (owner decision of 2026-10-02).
