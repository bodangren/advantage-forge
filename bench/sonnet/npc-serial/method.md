# Serial method for the P2 NPCs

Owner rule of 2026-10-10: one Sonnet builder at a time, in serial. The work continues at a lower
speed. Improve this method with the lessons of each agent run.

## The loop

1. Run one agent at a time: one builder (`forge-sonnet-high`, Sonnet) or one reviewer (Opus).
2. Write the prompt with `node bench/sonnet/npc-serial/prompt.mjs`. The agent prompt only names
   the prompt file, so the orchestrator context stays small.
3. When the agent finishes, add one row to `log.tsv` (run, phase, role, model, agent ID, NPCs,
   result, lesson). The report script reads the token use from the agent transcript.
4. After every five NPCs, run `python3 bench/sonnet/npc-serial/report.py`. Chrome shows
   `out/npc-report.html` and reloads it every 60 s.
5. After each review: record the ratings, commit the accepted NPCs with explicit paths, and put
   an NPC with three reviews below 7.5 on the follow-up list in the plan.
6. Add each new lesson to the list below, and change the prompt script to use it.

## Order of work

1. Round 3 reviews of the built NPCs (batches 4 and 5).
2. Batch 7 and the wilderness NPCs: finish each stopped source, then review in groups of five.
3. Batch 6 second passes, then the new batches (8 to 13).

## Lessons

| Run | Lesson | Change |
| --- | --- | --- |
| overnight | 20 to 28 builders waited for one build lock. The waits were longer than the cache lifetime, so each turn wrote the full context again. One Sonnet run used about 4.8M tokens. | One agent at a time. |
| own passes | My own passes re-read a 360K orchestrator context on each call: 4.2M tokens for each NPC. | Agents do the work; the orchestrator only writes prompts, logs, and commits. |
| t1, t2 | A numbered fix list with start values (pose coordinates, sizes) and a "render first" step kept Opus builders at 18 to 23 calls and 1.0M to 1.4M tokens. | The prompt script copies the review issues as a numbered list. |
| batch 6 review | The reviewer opened each front view and cropped images with PIL: 34 calls and 3.0M tokens for eight NPCs. | The reviewer reads all cards in one parallel step and opens at most two extra images. |
| r1, r2 | With that change, each reviewer used 6 calls and 0.37M tokens for five or six NPCs. | Review first every NPC with a fresh build; send a builder only with a review fix list or for a stale build. |
| t2, r2 | The refugee builder followed its own reading of the mockup for the stick, not the fix list, and the reviewer marked it down again. | The builder does every numbered fix and names any conflict in its report. |
| setup | The orchestrator setup used 2.35M tokens (about 20 calls at 100K context). | Use three orchestrator calls for each run: one Bash for record, commit, log, and next prompt; one Agent call; one short message. |
| b1 | The Sonnet builder for the stale teacher source made no edits and only rebuilt it. | Rebuild stale sources with `rebuild.sh` (no agent); the reviewer then writes the fix list for the builder. |
| rebuilds | A fresh GLB is not a finished build: two wilderness sources had a fast build and no sprites, and eight sources fail `./forge check`. | Before review cards, require fresh sprites and a check result; review the failing ones too, so one builder pass fixes the review issues and the check. |
| orchestrator | After the setup, the orchestrator still uses about 0.15M tokens for each call (its context is about 130K). The orchestrator now costs more than the agents. | Keep orchestrator calls to the minimum. A new session with a small context costs less for each call. |
