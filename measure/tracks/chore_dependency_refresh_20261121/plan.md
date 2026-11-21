# Refresh dependencies after the vulnerability audit

Status: new. This plan owns execution status. Source documents retain design details.

Lane: light. One phase. Deadlines: critical and high by 2026-11-23, the rest by 2026-11-25.

## Phase 1: Refresh and verify

- [ ] T1 Red: Add a failing check that runs `pnpm audit --json` and asserts 0 critical and 0 high. Place the script under `scripts/` and cover it with a test. Run it and record the current 4 high failures.
- [ ] T2 Green: Update the packages, regenerate the lockfile, and fix breakage. Run each gate through the heavy runner and record results:
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/prettier --check <scope>'` (state the exact scope; if the repo is not prettier-clean before the change, record the before count and require no new failures)
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/tsc --noEmit'`
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run --maxWorkers=1'`
  - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vite build'` (`vite.config.ts` and `index.html` exist; if the build fails before the change, record that and use the pre-change behavior as the gate)
- [ ] T3 Record: Run `./forge build` on two sample assets (one textured, one `--fast`) and require exit 0 with no warning lines. List each remaining moderate or low finding with its reason. Record the after counts.
