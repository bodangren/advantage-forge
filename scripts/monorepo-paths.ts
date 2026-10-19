/**
 * What the Forge-to-monorepo sync shares (track apk_monorepo_sync_workflow_20261020):
 * `monorepo-sync.ts` copies these paths, and `monorepo-handoff.ts` reports and records them.
 */
import { join, resolve } from 'node:path';

/** Forge paths that a sync carries (they must be committed). `port-game.mjs` copies `tests/games` too. */
export const FORGE_PATHS = ['src/apk3d', 'src/games', 'tests/games', 'demo/public/packs', 'demo/public/assets/apk', 'tests/apk3d/sprite-parity.test.ts'];

/** The monorepo branch that receives the syncs (docs/apk-port.md, "Branch plan"). */
export const PORT_BRANCH = 'apk3d-games-port';

/** The monorepo checkout of the port branch: $MONOREPO_WORKTREE, else ../reading-advantage-monorepo-3d. */
export const defaultMonorepo = (forge: string): string => resolve(process.env.MONOREPO_WORKTREE ?? join(forge, '..', 'reading-advantage-monorepo-3d'));

/** The pack folders, relative to each repository root. */
export const PACK_DIRS = {
  forge3d: 'demo/public/packs',
  mono3d: 'packages/game-cartridges-3d/assets/packs',
  forge2d: 'demo/public/assets/apk/primary-chibi-2d',
  mono2d: 'packages/game-cartridges-3d/assets/apk/primary-chibi-2d',
} as const;

/** The subject of a monorepo sync commit names the Forge commit that it carries. */
export const SYNC_SUBJECT = /\bsync from Forge ([0-9a-f]{7,40})\b/;
