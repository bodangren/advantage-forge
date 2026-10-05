# Audit self-graded character ratings

Status: in progress (started 2026-10-05). This plan owns execution status.

## Phase 1: Spot check

- [x] Task: Compare the four flagged monsters with their mockups (2026-10-05).

| Asset | Old rating | New rating | Main differences |
| --- | ---: | ---: | --- |
| hydra | 7.5 | 6.4 | The mockup stands on four legs with a long body; the model sits upright and holds the side necks up like arms. The mockup has a closed smile; the model has an open mouth with fangs. |
| wyvern | 7.5 | 6.8 | The mockup is a slim upright baby dragon with a closed smile; the model is round and heavy with an open mouth and fangs. The ear fins are round disks on stalks. |
| sea-serpent | 7.5 | 7.1 | The side curve matches. The teeth show black gaps, and from the front the body is a thin white column. |
| cave-worm | 7.5 | 7.3 | A close match. The lip ring of the mouth sticks out too far from the body. |

## Phase 2: Records

- [x] Task: Record the new ratings in `docs/character-reviews.json`.
- [x] Task: Record the rating rule in the spec and the debt registry (TD-22).

## Phase 3: Rework

- [ ] Task: Rework the hydra to the mockup (four legs, a long body, a closed smile).
- [ ] Task: Rework the wyvern face and body (a closed smile, a slimmer body, real ear fins).
- [ ] Task: Rework the sea-serpent teeth and the front view.
- [ ] Task: Rework the cave-worm mouth ring.

## Phase 3b: Independent review (owner decision 2026-10-05)

- [x] Task: Write the reviewer brief and the review card script (`scripts/review-cards.py`).
- [ ] Task: Independent review of the committed wildlife batches 1 to 5 (26 assets).
- [ ] Task: Independent review of wildlife batches 6 to 10 before their commit.
- [ ] Task: Independent review of the four reworked monsters.
- [ ] Task: Independent review of the other P2 monsters (76 assets).
- [ ] Task: Rework each asset below 7.5 and review it again.

## Phase 4: Wider sample

- [ ] Task: Check the other P2 monster and wildlife ratings at 7.5 to 7.7 with the rule; record the results here.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.
