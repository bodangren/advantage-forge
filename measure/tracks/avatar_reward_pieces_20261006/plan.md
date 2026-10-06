# Reward pieces on the avatar

Status: in progress. The plan records execution state. The specification retains design detail.

## Phase 1: Pack version and reward mark

- [x] Task: F1. The avatar pack version follows its content (TD-24): one version file, the next patch or minor version in `scripts/rpg-skin.ts`, the old version folder removed, tests. cb7c2d10: `src/apk3d/avatar/pack-version.ts`, `scripts/avatar-version.ts` (`avatarPackVersion`, `stampAvatarPack`, `writeAvatarPackVersion`); rpg-skin rebuilds on a changed source revision (`avatar.forgeCommit` in skin.json; the version file is not avatar code, so a release does not make the next one stale); `apk-release.ts` copies the version file back. `tests/apk3d/avatar-version.test.ts` (5 tests).
- [x] Task: F2. `"source": "reward"` (no price) for reward rows of `docs/avatar-catalog.tsv` in `catalog.json`; `apprentice-wand` becomes a reward piece; tests. cb7c2d10: `reward` in the `override` column (price column `reward`, `scripts/avatar-price.ts --check` passes); `scripts/avatar-pack.ts` writes `"source": "reward"` and no price. `tests/apk3d/avatar-catalog.test.ts`: every price is a number or `reward`, and no starter set holds a reward piece. `tests/apk3d`: 24 files, 419 tests pass.

## Phase 2: The two staffs

- [ ] Task: Mockups for `graveyard-staff` and `echo-staff` (rated G).
- [ ] Task: Build both staffs as equipment parts with `equip` blocks; `forge check` on `avatar-base` ends with `result ok`.
- [ ] Task: Independent review (one reviewer agent, bar 7); fix and review again until both pass.
- [ ] Task: Add both rows to `docs/avatar-catalog.tsv` as reward pieces.

## Phase 3: Release

- [ ] Task: F4. `apk-release.ts --skin --commit` gives avatar pack 1.1.0 with the portrait layers; `monorepo-sync.ts --check`.
- [ ] Task: Send the release commands and the M1 to M4 request to the monorepo session; record its commit and tests.
- [ ] Task: Close: `docs/avatar-system.md`, `docs/apk-port.md`, the debt registry (TD-24), Measure, the generator, and the doctor.

## Fallback

- [ ] Task: On 2026-10-13, if Phase 3 is not done, ask the monorepo session to apply option B (hide the equip button) for the cutover.
