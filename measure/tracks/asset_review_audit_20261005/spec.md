# Audit self-graded character ratings

## Purpose

The agent that builds a P2 monster or animal also rates it. A side review on 2026-10-05 found that
every new rating fell between 7.5 and 7.7, just at the character bar, and that some passed with
clear differences from the mockup. This track checks the ratings against the mockups again with a
stricter rule, records the true ratings, and reworks each asset that falls below the bar.

## Rating rule (from 2026-10-05)

- Compare silhouette, pose, and face with the mockup first. Write down each difference.
- A different body plan or pose (for example, upright on two legs against four legs) caps the
  rating at 6.5.
- A different face expression (an open mouth with fangs against a closed smile) caps it at 7.0.
- Use the full scale. A rating of 7.5 means "matches the mockup with small differences only".

## Acceptance criteria

- The four flagged monsters (hydra, sea-serpent, wyvern, cave-worm) have true ratings in
  `docs/character-reviews.json`, and each one below 7.5 is reworked to the bar or recorded as open.
- A sample of the other P2 monster and wildlife ratings is checked with the same rule, with the
  result in the plan.
- Owner decision (2026-10-05): "This needs to be independently evaluated. Self-evaluation is not
  acceptable." A separate reviewer agent that did not build the assets rates each batch, from the
  review cards (`scripts/review-cards.py`) and the [reviewer brief](./reviewer-brief.md). The
  reviewer does not see the builder's ratings. Its ratings are the recorded ratings; the builder
  does not rate its own work.

## Sources

- [docs/character-reviews.json](../../../docs/character-reviews.json)
- [asset_p2_monsters_20260928](../asset_p2_monsters_20260928/plan.md)
- [asset_p2_wildlife_20260928](../asset_p2_wildlife_20260928/plan.md)

## Open decisions (2026-10-05)

1. **Audit scope.** The independent reviews of wildlife batches 1 to 5 and 7 to 8 rated 34 of 34
   assets below the bar (4.5 to 7.0; the self-ratings were 7.5 to 7.7). The P2 monsters and the
   P0 and P1 characters were also self-rated. Proposal: review all 80 P2 monsters now; review a
   sample of 20 P0 and P1 characters to measure the gap, and review the rest only if the sample
   shows the same gap. Each review of 10 to 15 assets costs about 80,000 to 100,000 tokens.
2. **Mockup pose against the game rest pose.** Four mockups show a sitting animal (dog, fox, cat,
   familiar-cat). A rigged animal needs a standing rest pose for its walk. Proposal: keep the
   standing rest pose, add a `sit` clip that matches the mockup, and show the sit pose on the
   review card, so the reviewer compares like with like.
   **Decided 2026-10-05 (owner): "Yes, add a sit animation."** The four assets keep the standing
   rest pose, get a `sit` clip, and the review card shows the sit strip for them.
