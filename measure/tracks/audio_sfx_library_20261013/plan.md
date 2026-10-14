# Sound library: CC0 sound effects and music for the asset catalog and the games

Status: in progress. The plan records execution state. `docs/sound-library.md` retains design detail.

## Phase 1: List and tools

- [x] Task: Crawl the CC0 RPG search (750 entries) and all CC0 sound effects (896 entries) of OpenGameArt; build `audio/sources/oga-cc0.json` (1521 entries, CC0 checked on each page).
- [x] Task: Write `docs/sound-effects-list.tsv` from the asset catalog and the game sound events: 355 rows, 694 takes (P0 93, P1 146, P2 116).
- [x] Task: Write `scripts/sfx-library.mjs` (catalog, search, entry, fetch, files, probe, take, drop, miss, status, page) and test it on the RPG Sound Pack (take, loop take, duplicate guard, miss, drop, page).
- [x] Task: Write `docs/sound-library.md`.

## Phase 2: Acquisition by Haiku agents

- [x] Task: Run one Haiku agent for each slice: ui and answer, reward, battle, magic, hero and vehicle, npc, enemy, monster, wildlife, ambience, world, item, music. At most 4 agents at a time.
- [x] Task: Add guards after the first round: a span is a take of one row only, a manifest lock for agents that run at the same time, take numbers that skip rejected numbers, a 120 ms fade on cut ends, and `rebuild` and `renumber`.
- [x] Task: Full set (owner, 2026-10-13): run small slices of about 10 rows for every open row. A Haiku agent often stops after 10 to 15 tool calls; the orchestrator records the candidates that it reports.
- [x] Task: Check the manifest: every take has a source, author, CC0, and a length in its class; every P0 row has a take or a reason. Result 2026-10-14: 438 takes, 0 issues, every take approved, no orphan files; 5 P0 rows have no take and each has a reason (4 point to an approved take with the same sound, `ambience/library` has none).

## Phase 3: Review

- [x] Task: Build the review page as a local page: `node scripts/sfx-library.mjs review` serves `scripts/sfx-review.html` on 127.0.0.1:4178, and Submit writes the decisions to disk. (A claude.ai artifact was the wrong choice: the owner wants local pages only.)
- [x] Task: Review round 1 (2026-10-13): 268 takes approved, 21 rejected and removed, 5 notes (three ui rows sound like a computer; watermill is drops, not a waterfall; war-drum loop question).
- [x] Task: Review round 2 (2026-10-14): 157 takes approved, 16 rejected and removed (all four Kenney jingles: too short), 8 notes. The owner moved the sea track to `music/explore` (now explore#3, approved); `music/sea` needs a new track.
- [x] Task: Fill the rows again where the owner rejected takes or wrote notes, and the open rows; review the new takes. Round 3 agents: NPC voices, crafts and items, farm animals, monsters and wind ambience, music. The duplicate check now compares the file name without its extension, because one agent took the same span again through a second path of the same file (`npc/pour#3`, removed). Result: 12 takes for round 3 (8 new, 4 without a round 2 decision); every row has a take or a miss entry (full 171, some 95, missing 89, open 0). Farm animals and non-verbal voices are mostly missing from the CC0 catalog.
- [x] Task: Review round 3 (2026-10-14): 10 takes approved, 2 rejected (`battle/arrow-hit#2`, `music/victory-jingle#4`), no notes. Round 4 takes from the orchestrator: `battle/arrow-hit` #4 and #5, `music/victory-jingle` #5.
- [x] Task: Review round 4 (2026-10-14): 3 takes approved. No take waits for review.
- [x] Task: Make a review-page skill from the working sound review page. Owner decision 2026-10-14: add audio to the existing `live-review` skill instead of a new skill. `~/.claude/skills/live-review/` now has `"kind": "audio"` checks (players, Approve and Reject, no comment needed for a Reject), audio files with range requests under `/files/`, and `files_root`. The sound library keeps its own page (`scripts/sfx-review.html`) for the many takes of a round.
- [x] Task: Record the size of `audio/` and the owner's decision on music in git. Size 2026-10-14: 33 MB (music 21 MB, effects 11 MB, source catalog 1.2 MB). Owner decision 2026-10-14: commit all, music included.
- [x] Task: Owner note on `battle/war-drum` ("looping?" = the clip loops well): new row `battle/war-drum-loop` (loop, P1) with the full source loop; new take option `--seamless` keeps a source loop unfolded (manifest column `loop`).
- [x] Task: Record the follow-up track for game integration (event mapping, format, preload budget): `audio_game_integration_20261014` (new).
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`; close the track.
