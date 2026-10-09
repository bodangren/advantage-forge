# P2 NPC Haiku trial (baker)

Status: complete. This plan owns execution status. Evidence: bench/haiku/results.md.

## Phase 1: Setup
- [x] Task: Make the mockup (docs/npc-mockups/baker_001.jpg) and the brief.
## Phase 2: Parallel arms
- [x] Task: Run h1 to h6 (Haiku, general agent) and s1 (Sonnet, `forge-sonnet-high`) at the same time.
- [x] Task: One independent reviewer ranks the arms (bench/haiku/review-r1.json): s1 6.5, best Haiku 5.5.
- [x] Task: Round 2, a fair model test: f1 to f6 (Haiku in the `forge-sonnet-high` setup); review-r2.json: s1 6.5, best Haiku 6.3.
## Phase 3: Finish
- [x] Task: Add the `hold` option to assets/parts/humanoid-kind.ts (the avatar base stays the same: A/B build, 0 vertex movement).
- [x] Task: Improve s1 into assets/baker.ts; forge check result ok; forge all with 0 warnings.
- [x] Task: Independent reviews: 6.8, then 7.2 (review-final2.json); docs/character-reviews.json entry. Correction: the trial brief used a 7.0 bar, but the character bar is 7.5, so the baker is below it after two reviews; its third pass belongs to the P2 NPC track.
- [x] Task: Record the comparison in bench/haiku/results.md and the lessons.
- [x] Task: Run measure/generate.sh and measure/doctor.sh.

## Result
Six parallel Haiku arms did not beat one Sonnet arm, and they used about 7 to 10 times more input
tokens. Wall time was the same (about 23 minutes for each round). Keep one `forge-sonnet-high` arm
per NPC. Fix base defects first: the missing two-hand hold capped every arm.
