# Reward pieces on the avatar

## Purpose

The app gives three reward emblems: Apprentice Wand, Graveyard Staff, and Echo Staff. A student
earns them at quest milestones (`packages/domain/src/rpg/definitions.ts` in the monorepo). A
student can equip one, but no page shows it. The owner rule says that rewards land on the
student's avatar. So each emblem becomes an avatar piece that the student owns and can wear.

The owner approved this plan on 2026-10-06: option A (avatar pieces), with option B (the app
hides the equip button) as the fallback when the pieces are not ready by 2026-10-13. The cutover
is 2026-10-14 to 2026-10-20. The monorepo session agreed the split of the work.

## Scope and ownership

| Part | Owner |
| --- | --- |
| F1. The avatar pack version changes with its content (debt TD-24) | Forge |
| F2. A reward-only mark in the catalog (`"source": "reward"`, no price) | Forge |
| F3. Two new mainhand pieces: `graveyard-staff` and `echo-staff` | Forge |
| F4. The release of pack 1.1.0 with the portrait layers | Forge, then the monorepo sync |
| M1. The app reads the pack version from the synced `catalog.json` | Monorepo |
| M2. The shop leaves out reward pieces | Monorepo |
| M3. A completion reward also grants the avatar piece (inventory source `reward`) | Monorepo |
| M4. The reward panel says that the piece is in the inventory | Monorepo |

## Requirements

1. **Pack version (F1).** The avatar pack gets the next patch version when its files change and the
   next minor version when items are added or removed (the rule of the skin and the model packs).
   One Forge file holds the version. `scripts/rpg-skin.ts` writes
   `demo/public/avatar-pack/<version>/` and removes the folder of the earlier version. A game keeps
   the `catalogVersion` of the launch avatar and falls back to the current version
   (`fromServedVersion`).
2. **Reward mark (F2).** A row of `docs/avatar-catalog.tsv` can mark a piece as a reward. In
   `catalog.json`, a reward piece has `"source": "reward"` and no price. The word `reward` is the
   app's inventory source for granted pieces. `apprentice-wand` becomes a reward piece. The shop
   keeps `wand` and `mage-wand`.
3. **Pieces (F3).** `graveyard-staff` is a friendly lantern-and-bone staff and `echo-staff` is a
   crystal staff with sound rings. Content is rated G. Both are mainhand, two-handed like the
   other staffs, with an `equip` block that passes `forge check` on `avatar-base`. Each has a
   reference mockup and an independent review at the bar of 7 (owner rule: no self-rating).
   The catalog ids are the same as the emblem ids.
4. **Release (F4).** The pack is 1.1.0 (two added items) and has the portrait layers of the new
   pieces. Forge runs `apk-release.ts --skin --commit` and the read-only sync check, then sends the
   commands to the monorepo session.

## Acceptance

- `catalog.json` of pack 1.1.0 lists the three reward pieces with `"source": "reward"` and no
  price, and every other piece with a price.
- A changed pack file gives a new version folder; an unchanged pack keeps its version (tests).
- Both staffs pass `forge check` with `result ok` and have a reviewer rating of 7 or more.
- The monorepo session confirms M1 to M4 in one commit after the sync, with passing tests.
