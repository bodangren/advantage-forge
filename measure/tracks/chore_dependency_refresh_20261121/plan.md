# Refresh dependencies after the vulnerability audit

Status: new. This plan owns execution status. Source documents retain design details.

Lane: light. One phase. Deadlines: critical and high by 2026-11-23, the rest by 2026-11-25.

## Phase 1: Refresh and verify

- [~] T1 Red: Add `scripts/audit-gate.mjs` and cover it with `tests/audit-gate.test.ts`. The script runs `pnpm audit --json` and exits 0 when critical=0 and high=0, 1 otherwise, and 2 when the audit cannot run. It prints `audit unavailable` on exit 2. Exit 2 is inconclusive and never satisfies AC2. The script accepts `--input <file>` so the tests use fixtures without the network. The three cases are: (a) a fixture with high>0 gives exit 1, (b) a fixture with 0 critical and 0 high gives exit 0, (c) a failed audit run gives exit 2. The live check (no `--input`) on the current tree must exit 1: that is the Red failure.
  - Red evidence (mid-red): `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1 tests/audit-gate.test.ts'` passes 4/4; `node scripts/audit-gate.mjs` exits 1 with `critical=0 high=4 moderate=6 low=1 info=0` (the expected Red failure); `node_modules/.bin/tsc --noEmit` reports only pre-existing errors in `assets/*`, `tests/games/castle-defense/rules.adversarial.test.ts`, and `tests/part.test.ts`, none in the new files. Log: `measure/runs/chore_dependency_refresh_20261121/mid-red-4a4212b.log`.
- [ ] T2 Green: Update the packages, regenerate the lockfile, and fix breakage. Run each gate through the heavy runner and record results:
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/prettier --check .'` (the existing `.prettierignore` applies; record the before failure count on the current tree; the gate is no new failures versus that count)
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/tsc --noEmit'`
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1'`
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vite build'` (`vite.config.ts` and `index.html` exist; if the build fails before the change, record that and use the pre-change behavior as the gate)
- [ ] T3 Record: Run the asset builds in one heavy-run.sh call: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'FORGE_GL=software ./forge build rogue && ./forge build slime --fast'`. Pass means exit 0 and no `warning:` lines. List each remaining moderate or low finding with its reason. Record the after counts.
