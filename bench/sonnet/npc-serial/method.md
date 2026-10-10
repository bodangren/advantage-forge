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
| b4 | A `--fast` command after `./forge all` overwrote the textured GLB, and the builder ran `./forge all` twice. | The prompt orders the check before `./forge all` and forbids forge commands after it. |
| r6 | Tanner fell from 7.0 to 6.5: the builder did not find how to hold the hide in both fists and used one fist. | When a fix needs a kind feature, the queue note names the method. |
| b8 | The fix list held a base limit (the still posed arm in walk), which no builder can fix. | `prompt.mjs` drops issues about the still arm from the fix list. |
| b11 | The nomad builder viewed one render, before a large pose change, and reported a shape it had not seen. | The prompt asks for one render after the last edit. |
| r7 | Two reviewers asked for opposite cartographer hair (s1: full hair crest; s4: bald crown with side hair). | When reviews disagree, the queue note tells the builder to match the mockup and to describe it in the report. |
| b13 | The ferryman builder replaced a cloth color option instead of adding one. | The prompt says to keep every variant option and put a new default first. |
| b13, b16 | The ferryman builder fixed a type error after `./forge all`, so the build was older than the source. | The typecheck and the check run before the final `./forge all`, and nothing is edited after it. |
| b25 | The base-limit filter missed a "stiff walk" issue, and the hermit builder wrapped `build` to add walk motion. | The filter drops every walk issue about still or stiff motion. |
| r10 | Third passes reached the bar in 3 of 10 cases. The reviewers moved between issues (teacher hair: helmet, then dripping ridges; nomad coat: too short, then flares like a skirt). | No change to the stop rule (owner rule). A third pass costs about 0.5M; the follow-up list keeps the open issues. |
| b28 | The textured render showed a paint defect (red mouth corners) that the fast render did not, and the no-edit rule blocked the fix. | One more fix and `./forge all` is allowed for a defect that only the textured render shows. |
| b30, b31 | New builds cost 1.15M (19 calls) and 2.17M (27 calls, five images and an animation strip, context up to 107K). | Keep the new-build budget at 35 calls but say that the budget is a limit, not a target; view no animation strip (the check covers clips). |
| r17 | The lady shoe goes through the skirt only in the walk; builders do not view strips, and the check does not test cloth. | For a clip defect, the queue note allows one look at that strip after the fix. |
| b62 | An interrupted pass left a build newer than the review, and `prompt.mjs` then dropped the fix list. | A builder prompt always uses the latest review. |
| r18 | Hair is the most common largest issue across reviews: rope coils, spikes, drips, slabs, and helmets. | Hair notes ask for one smooth hair shell over the skull with three or four broad waves, and no thin locks or coils. |
| owner | Owner rule 2026-10-10: NPCs are accepted at 7.0 unless the model has a critical error. | Reviewers add a `critical` flag; one critical-error check (no new rating) covers the 27 NPCs that already have 7.0. |
| b74 | The spy builder saw hair poke through the hood rim and did not fix it. | The prompt lists the critical errors and says to fix every one before the final build. |
