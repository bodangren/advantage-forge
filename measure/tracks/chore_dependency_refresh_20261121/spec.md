# Refresh dependencies after the vulnerability audit

## Purpose

Bring all direct packages to current safe versions. The audit of 2026-11-21 shows 0 critical, 4 high, 6 moderate, and 1 low finding. Daniel asked for current packages, not a provider migration.

## Acceptance criteria

- AC1: Every direct dependency in `package.json` moves to the latest version that passes the gates. The plan names each deferred breaking major with its reason.
- AC2: `pnpm audit` shows 0 critical and 0 high. The plan lists each remaining moderate or low finding with its reason.
- AC3: All gates run through the heavy runner: lint, typecheck, tests, and build (commands are in the plan). Pre-existing failures are known debt owned by other tracks, not a pass. The before sets are: prettier 3318 [warn] files plus the audit-invalid.json error block; tsc 38 errors in 13 files; vitest 9 failed tests in tests/storytime-book-pictures.test.ts. Each gate passes when the after set equals the before set or is a subset of it. Pass for vite build stays exit 0.
- AC4: Asset output stays unchanged in kind: `./forge build rogue` (textured) and `./forge build slime --fast` run in one heavy-run.sh call and pass. Pass means exit 0 and no `warning:` lines. The render check runs `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge render rogue --fast'` after `node_modules/.bin/playwright install chromium`. It passes when the call exits 0 and writes `out/rogue/render.png`. The build command is in the plan.
- AC5: The lockfile and `package.json` land in one commit, and the orchestrator pushes with safe-push.

## Audit baseline (2026-11-21, before the change)

- Critical: 0. High: 4. Moderate: 6. Low: 1.
- High: sharp <0.35.5 (GHSA-wq5f-xc86-pv6w), zod <4.6.6 (GHSA-mrhx-c7xc-m3w5), vite <=8.1.5 (GHSA-587h-7wmj-h5pm), source-map-js <1.2.2 via vite>postcss (GHSA-68fv-2mgg-jv7q).
- Moderate: vitest/@vitest/mocker <4.1.11 (GHSA-82fw-gwwq-j7x9, counted twice), @vitest/mocker <4.1.12 (GHSA-qxg6-89mg-rqv8), vite <=8.1.5 (GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-rq7h-c2jc-7f22).
- Low: vite <=8.1.5 (GHSA-9jrq-w75r-6gcw).
- `package.json` pins most packages exactly; `pnpm` is `11.8.0`.

## Sources

- [package.json](../../../package.json)
- [pnpm-lock.yaml](../../../pnpm-lock.yaml)
- [vite.config.ts](../../../vite.config.ts)
- [index.html](../../../index.html)

## Scope control

This track updates dependencies, the lockfile, and the Red check script plus its test. It makes no asset, game, or engine changes. It performs no provider migration.
