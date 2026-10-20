# Monorepo syncs

Each row is one monorepo commit that carries a Forge commit (track
`apk_monorepo_sync_workflow_20261020`). `node --import tsx scripts/monorepo-handoff.ts --record
<monorepo sha>` adds a row; without a sha, it adds every sync commit of the port branch that the
ledger does not have. "Forge commits" counts the Forge commits in the synced paths since the sync
before. The monorepo keeps its own record.

| Date | Monorepo commit | Forge commit | Forge commits | Packs | Also on | Tracks |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-06 | `e31a4e349` | `c04b1100` | - | dungeon-monsters 1.0.1, folk 1.0.1, heroes 1.0.1, mounts 1.0.1, primary-chibi-2d 1.1.0 | master, primary-parity-integration, primary/lane-f-apk3d-merge | - |
| 2026-10-06 | `16d05f538` | `ba8b161f` | 2 | - | master, primary-parity-integration, primary/lane-f-reedy-preview | - |
| 2026-10-06 | `fa05f91d7` | `0ebaa497` | 9 | - | master, primary-parity-integration, primary/lane-g-new-game-host | `apk_pack_release_20261006`, `avatar_in_games_20261006`, `avatar_reward_pieces_20261006` |
| 2026-10-06 | `d292c1186` | `fc1d84ba` | 2 | - | master, primary-parity-integration, primary/lane-g-new-game-host | `legacy_games_removal_20261006` |
| 2026-10-07 | `a683e9d1d` | `58f06d5a` | 1 | - | master, primary-parity-integration, primary/lane-g-new-game-host | `legacy_games_removal_20261006` |
| 2026-10-07 | `6dd0ec837` | `24c0a24e` | 3 | - | master, primary-parity-integration, primary/lane-g-new-game-host | `legacy_games_removal_20261006` |
| 2026-10-07 | `0adca572e` | `52cab8be` | 2 | - | master, primary-parity-integration, primary/lane-g-new-game-host | - |
| 2026-10-14 | `36db6c8d7` | `23a0404b` | 2 | - | primary-parity-integration | `game_enchanted_library_20260928` |
| 2026-10-19 | `ce5a63131` | `84898702` | 1 | - | primary-parity-integration | `game_rune_match_20260928` |
| 2026-10-19 | `7d343fb95` | `d3624720` | 3 | dungeon-monsters 1.1.0, mounts 1.0.2, primary-chibi-2d 1.2.0 | primary-parity-integration | `game_enchanted_library_20260928` |
| 2026-10-20 | `0c220e663` | `afc8b890` | 2 | - | primary-parity-integration | `game_griffin_sky_joust_20260928`, `game_xp_end_card_20261020` |
