# Reward pieces on the avatar

Status: in progress. The plan records execution state. The specification retains design detail.

## Phase 1: Pack version and reward mark

- [x] Task: F1. The avatar pack version follows its content (TD-24): one version file, the next patch or minor version in `scripts/rpg-skin.ts`, the old version folder removed, tests. cb7c2d10: `src/apk3d/avatar/pack-version.ts`, `scripts/avatar-version.ts` (`avatarPackVersion`, `stampAvatarPack`, `writeAvatarPackVersion`); rpg-skin rebuilds on a changed source revision (`avatar.forgeCommit` in skin.json; the version file is not avatar code, so a release does not make the next one stale); `apk-release.ts` copies the version file back. `tests/apk3d/avatar-version.test.ts` (5 tests).
- [x] Task: F2. `"source": "reward"` (no price) for reward rows of `docs/avatar-catalog.tsv` in `catalog.json`; `apprentice-wand` becomes a reward piece; tests. cb7c2d10: `reward` in the `override` column (price column `reward`, `scripts/avatar-price.ts --check` passes); `scripts/avatar-pack.ts` writes `"source": "reward"` and no price. `tests/apk3d/avatar-catalog.test.ts`: every price is a number or `reward`, and no starter set holds a reward piece. `tests/apk3d`: 24 files, 419 tests pass.

## Phase 2: The two staffs

- [x] Task: Mockups for `graveyard-staff` and `echo-staff` (rated G). `docs/item-mockups/graveyard-staff-mock.jpg` (a driftwood crook with a mint lantern, a bone charm, and moon charms) and `docs/item-mockups/echo-staff-mock.jpg` (a tuning fork that holds a lilac crystal, with teal rings).
- [x] Task: Build both staffs as equipment parts with `equip` blocks; `forge check` on `avatar-base` ends with `result ok`. `assets/graveyard-staff.ts` and `assets/echo-staff.ts`: mainhand, `HAND_FIT`, grip at y = 0.47, two-handed, like `staff`. `forge all` has no warnings; `forge check` gives `result ok` and `fit ok` for both. The cast and attack clips put the staff into the shirt and the pants by up to 5 cm, the same as the accepted `staff`.
- [x] Task: Independent review (one reviewer agent, bar 7); fix and review again until both pass. Round 1 (2026-10-06): both 6.5 (`out/review-cards/reward-staffs/reviews-r1.json`). Graveyard staff: the straight grip let the bent shaft show through, a coach lantern instead of a round globe, thin smooth wood. Echo staff: the head was 15% of the height instead of 40%, thin straight prongs, a small crystal, extra shaft detail, dark metal. Rework: the grip is a shell of the shaft, a round globe in an iron bail, thicker wood with a twisted grain and a scroll curl, a longer grip with ribbon tails and a white moon, a gold bone, a wrapped knot; a fork on a Bezier curve that holds a tall prism crystal, a plain pale steel shaft, a larger ball foot, tilted rings. Round 2 (a new reviewer, `out/review-cards/reward-staffs-r2/reviews.json`): both 7.5, recorded in `docs/character-reviews.json` (group Equipment). Remaining small differences: the graveyard crook tip is a heavy lump, the ribbon is a short cuff, and the worn lantern does not hang down (a rigid piece); the echo prongs show faint ridges and the rings glow less than in the mockup.
- [x] Task: Add both rows to `docs/avatar-catalog.tsv` as reward pieces. Tier 2, two-handed, `reward` in `override`; `scripts/avatar-price.ts --check` passes. `tests/apk3d/avatar-catalog.test.ts` checks all three reward pieces; `tests/apk3d`: 421 tests pass.

## Phase 3: Release

- [ ] Task: F4. `apk-release.ts --skin --commit` gives avatar pack 1.1.0 with the portrait layers; `monorepo-sync.ts --check`.
- [ ] Task: Send the release commands and the M1 to M4 request to the monorepo session; record its commit and tests.
- [ ] Task: Close: `docs/avatar-system.md`, `docs/apk-port.md`, the debt registry (TD-24), Measure, the generator, and the doctor.

## Fallback

- [ ] Task: On 2026-10-13, if Phase 3 is not done, ask the monorepo session to apply option B (hide the equip button) for the cutover.
