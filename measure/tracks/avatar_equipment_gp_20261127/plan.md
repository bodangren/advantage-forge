# Implementation plan: avatar equipment fit and GP prices

Track: `avatar_equipment_gp_20261127`. Lane: light. One phase.
The brief is open item 6 of the retired `QUEUE.md` of 2026-11-27.

The archived `avatar_system_20261001` built the base, the fit contract, the pack, and the
composer. This card holds the two results that remain.

## Phase 1: Fit and price

- [ ] Task: Close the 28 `later` rows of `docs/avatar-catalog.tsv`. Each row passes
  `./forge check <piece>` on `avatar-base` with `result ok`, or it moves to `excluded` with its
  reason in `docs/equipment-fit.md`.
- [b] Task: Replace the placeholder slot bases of the GP price with the measured median weekly GP
  per active Primary student. deferred:pm: the number comes from the Primary Advantage data, and
  no Task id is known.
- [ ] Task: Hand the PM the item list, the GP prices, and the equip sockets for the Primary
  Advantage shop. No price is public before Daniel approves it.
