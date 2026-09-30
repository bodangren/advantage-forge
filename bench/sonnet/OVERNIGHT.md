# Overnight batch 1 (2026-09-29) — orchestrator notes

Goal: /goal statement in the session. State: state.tsv (one row per asset). Log: log.tsv (one row per pass).
Briefs: briefs/<asset>.md. Rules: bar 7 (7.5 for P0 / game-pack rows, 8 for characters); retry 1 = feedback
to the same agent after its completion notice ("Resuming agent" reply required); retry 2 = fresh agent one tier
up; then skip. Max 4 agents. Commit accepted sources with explicit paths. Stop: queue + enemies empty, 6 skips
in a row, or 4,000,000 subagent tokens.

Round 1: cloth-robe (low), mantle (low), greenhouse (medium), yurt (medium). Started 2026-09-29.
Tokens so far (batch 1 incl. probe): 325,020.

Round 1 status: cloth-robe pass 3 (same agent), yurt pass 2 (same agent), greenhouse pass 2 (same agent), mantle fresh medium agent. Low tier: both armor pieces failed at v1 (6.5); use medium for the remaining armor.
Tokens: probe 325,020 + round 1 so far 35568+8516+41196+43356+56088 = 509,744.

Round 1 closed 2026-09-29: cloth-robe 7.0 (43.6K), mantle 7.0 (80.3K incl. failed low), greenhouse 7.2 (68.4K), yurt 7.5 (52.9K). Commits 7af3a6c + greenhouse.
Round 2 running: pier, cave-mouth, city-wall, rampart (all medium). Round 3 briefs ready: greenhouse-dome, cliff-face, ancient-tree, roots.
Tokens: 325,020 probe + 245,153 round 1 = 570,173.

Round 2 closed: pier 7.0 (46.0K), cave-mouth 7.0 (43.5K), rampart 7.0 (59.9K); city-wall on pass 2.
Round 3 running: cliff-face, ancient-tree, roots; greenhouse-dome accepted 7.3 (38.9K).
Round 4 briefs ready: watermill, townhouse, longhouse, crypt-chapel. Round 5 briefs ready: scale-armor, studded-leather, plate-armor (medium), vines.
Preview page: out/preview/index.html (scripts/asset-preview.mjs --watch running, pid in scratchpad log).
Tokens: 570,173 + round 2 (46021+43525+59945+41098 so far) + greenhouse-dome 38863 = 799,625 (city-wall pass 2 pending).

Round 3/4 status: ancient-tree 7.0 (51.1K), watermill 7.3 (63.6K) accepted; cliff-face on pass 2 (v1 5.0, reduction fight); roots on pass 3 (y/z swap bug fix).
Running: townhouse, longhouse. Queue left: crypt-chapel, scale-armor, studded-leather, plate-armor, vines (briefs ready).
Accepted so far: 14 (incl. probe). Tokens: about 1,062,000 through watermill v2 (see log.tsv for exact per-pass figures).

Batch 1 queue closed 2026-09-29 ~21:50: 19 accepted + cliff-face skipped. Owner then set the equipment fit rule
(docs/equipment-fit.md) and asked for an audit; 10 reworks queued (state.tsv rows "armor-fit"). Fit rework round 1
running: belt, iron-helmet, steel-helmet, chainmail. Then round 2: leather-armor, horned-helmet, cloth-hood,
leather-cap; round 3: crown, circlet. After that: the P1 enemies (ghoul, minotaur-guard, mummy, vampire have mockups
in docs/enemy-mockups/), forge-sonnet-high, one per agent, bar 8.
Tokens through batch 1: 1,513,803 logged (plus 325,020 probe = 1.84M) (sum log.tsv col 6).

Fit reworks closed 2026-09-29 ~22:40: all 10 accepted (354K tokens). Equipment track task ticked.
Enemy phase (forge-sonnet-high, bar 8, one per agent): goblin-king (Labyrinth boss, game need), orc-archer, orc-shaman, ogre-brute running.
Mockups made with mmx (bench/overnight/make-denizen-mocks.sh style suffix) and committed. The four mockup enemies that
already existed (ghoul 8, vampire 8, mummy 7.5, minotaur-guard 7) need no build; mummy and minotaur-guard are below the
character bar and are rework candidates, as are wraith (7) and wood-golem (3.8, file untracked, owned by another session).
Review a character: render.png + sprites/preview.png + ./forge check output; then node scripts/set-review.mjs <name> <entry.json>
and node scripts/character-review.mjs. Tokens logged so far: see awk sum of log.tsv col 6 (about 1.87M + 325K probe).
Budget note (about 23:05): 2.36M logged + 325K probe = 2.69M of the 4.0M stop. Remaining plan: finish the four characters in flight (goblin-king p2, orc-archer p3, orc-shaman v1, ogre-brute p2), then wood-golem rework (owner request), then stop and write bench/sonnet/overnight-summary.md. No new enemy builds after wood-golem unless the total stays under 3.6M.

CLOSED 2026-09-30 00:45. Final: bench/sonnet/overnight-summary.md. Enemy phase: goblin-king 8.0, orc-archer 8.0,
orc-shaman 8.0, mummy rework 8.0 committed; ogre-brute 7.8 and wood-golem 7.5 (from 3.8) below the bar, sources
uncommitted, review entries on the page; minotaur-guard skipped (two agents stalled with empty logs after the
API drop around 23:20-23:35). Preview watcher (scripts/asset-preview.mjs --watch) left running.

REOPENED 2026-09-30 00:55 (stop hook: enemy list not empty, tokens 3.05M < 4M). Enemies round 2 running: minotaur-guard
rework retry 3, dark-knight (death-knight base), wight (vampire base), revenant (zombie-soldier base). Mockups made with mmx.
Stall guard: check each agent's task output size 10 min after launch (a 149-byte file means the agent never started).
Stop spawning when logged tokens pass 3.6M so the in-flight passes end under 4.0M.
Correction 01:00: the 149-byte task output file is normal while an agent runs; the two "stalled" minotaur agents had
edited the file. Judge progress by the target file mtime. Minotaur-guard accepted 8.0 on the third launch.
Round 2 agents confirmed working (dark-knight, wight, revenant sources written 00:57-00:58).

COUNTER RESET 2026-09-30 01:35 (owner): "start the token counter over again and stop after the next 4 million". Rows with
batch `run2` in log.tsv count toward the new 4.0M limit (sum: awk -F'\t' '$5=="run2"{s+=$6}END{print s}' bench/sonnet/log.tsv).
Dark-knight accepted 8.0 (53bbf0e) before the reset. Open P1 enemies (37) ordered by game need (the games use bandit, orc-warrior,
skeleton, zombie, goblin-warrior; dungeon denizens first): bandit-captain, orc-warlord, banshee, iron-golem, then gargoyle,
specter, poltergeist, plague-bearer, vampire-lord, clay-golem, crystal-golem, living-statue, animated-weapon, clockwork-sentry,
clockwork-soldier, gnoll-warrior, gnoll-hunter, troll-guard, kobold-sorcerer, kobold-trapper, brigand, highwayman, raider,
mercenary, deserter, assassin, smuggler, pirate, pirate-captain, hunter-rival, dark-mage, warlock, witch, cult-leader, evil-priest.
Run 2 status 2026-09-30 06:00: 3.16M of the new 4.0M limit. Accepted since the reset (16): wight, revenant, orc-warlord,
bandit-captain, iron-golem, gargoyle, specter, poltergeist, vampire-lord, troll-guard, clay-golem, gnoll-warrior,
kobold-sorcerer, crystal-golem, clockwork-sentry, plus dark-knight before the reset. Skipped (3): banshee 7.3,
plague-bearer 7.8, living-statue 7.8 (review entries on the page, sources uncommitted). In flight: gnoll-hunter and
kobold-trapper (feedback passes), clockwork-soldier, animated-weapon. These are the last launches: the four passes
end near 3.6M, and one more character would risk the limit. After they land: review, commit, regenerate the summary, stop.
Run 2 status 06:45: 3.65M of 4.0M. gnoll-hunter accepted 8.0 on the fresh rework (eaba455); animated-weapon 8.0 (3d8d79c);
clockwork-soldier 8.0 (72603b3). Summary regenerated (63 assets, 57 accepted, 6 skipped). One more character fits under
the limit with one feedback pass: brigand (bandit base) launches as the final build; a second retry would pass 4.0M and
counts as a budget skip.

## Status 07:02 (2026-09-30)

brigand v1 scored 7.7 (axe head a plain wedge, flat brow, hood side lobes, flat jerkin). One feedback pass is in progress. Run-2 counter: 3,774,609 of 4,000,000. The feedback pass is the last pass of the run; a second retry is a budget skip.

## Counter reset 2 (07:03, 2026-09-30)

The owner compacted and reset the token counter again. Rows with batch run3 in log.tsv count toward a new 4,000,000 limit. The brigand feedback pass in flight counts as the first run3 row. The run continues with the 14 open P1 enemies in game-need order: assassin, cult-leader, dark-mage, deserter, evil-priest, highwayman, hunter-rival, mercenary, pirate, pirate-captain, raider, smuggler, warlock, witch.

## Status 07:30 (2026-09-30)

brigand accepted 8.0 (71378a4). Run 3 in flight: highwayman, raider, mercenary (fresh builds) and banshee (rework 2). The owner noted that banshee, plague-bearer, and living-statue sit below the bar; under the reset budget each gets one fresh rework by a new high-tier agent ahead of the remaining enemies. Queue after them: deserter (brief and mockup ready), assassin, smuggler, pirate, pirate-captain, hunter-rival, dark-mage, warlock, witch, cult-leader, evil-priest.

## Status 08:35 (2026-09-30)

Run 3: 688,581 of 4,000,000 tokens. Accepted: brigand, raider, plague-bearer (rework 2), highwayman. In flight: mercenary and banshee (feedback passes), living-statue (rework 2), deserter. All 14 open enemies have committed briefs and mockups.

## Note 09:06 (2026-09-30)

The living-statue rework 2 agent and the deserter build agent stalled after their first two reads (no file writes, no forge processes, transcripts frozen at 08:27 for 37 minutes). Both were stopped with TaskStop and relaunched as fresh agents. Lesson: a transcript under ~/.claude/projects/<session>/subagents/agent-<id>.jsonl that stops growing for 30 minutes with no forge process is a stall; the 149-byte task output file is not a signal either way.
