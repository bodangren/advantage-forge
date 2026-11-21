# Spec review

Author model: opencode-go/muse-spark-1.3-contributor#high

## Round 1

Date: 2026-11-21
Reviewer: measure spec-review subagent (opencode-go/hy4-flash-free)

### What this track proposes

This track refreshes the direct dependencies of advantage-forge to current safe versions after the audit of 2026-11-21. It adds a Red check that runs `pnpm audit --json`, asserts zero critical and zero high findings, and carries a test under `scripts/`. It updates `package.json` and the lockfile, then runs lint, typecheck, tests, and build through the heavy runner. It requires two sample asset builds to exit with no warning lines, and the orchestrator pushes the change with safe-push.

### How the current system works, per this spec

`package.json` pins most dependencies exactly and declares pnpm 11.8.0. The current versions of sharp (^0.35.4), zod (^4.6.5), vite (8.1.4), and vitest (4.1.10) produce 4 high, 6 moderate, and 1 low audit finding with no critical finding. No dependency-audit check or test exists in `scripts/` or `tests/` before this track. Heavy commands run through heavy-run.sh in the advantage-pr repository, and a textured forge build takes one of two machine-wide build slots.

### Findings

- F1 [Blocker] plan.md T2 (prettier gate): The lint command keeps the literal placeholder `prettier --check <scope>` and tells Green to state the exact scope, so the lint file scope stays an implementer choice. Default: use `node_modules/.bin/prettier --check .` with the existing `.prettierignore`, and keep the record-before-count rule if that check is not clean before the change. Rationale: The zero-decision check lists file location and CLI shape as choices the plan must fix; a placeholder defers the choice to the implementer.
- F2 [Blocker] plan.md T1 (Red check): The plan leaves the network-failure behavior of `pnpm audit --json` undecided, so the implementer chooses whether an unavailable audit passes, fails, or skips. Default: a network failure exits with code 2 and prints `audit unavailable`, counts as inconclusive, and never satisfies AC2; AC2 requires a parsed JSON with 0 critical and 0 high. Rationale: Network-failure handling is an edge-case behavior choice, and the zero-decision check forbids leaving edge-case behavior to the implementer.
- F3 [Blocker] spec.md AC4 / plan.md T3: AC4 requires two sample assets but names neither, and T3 repeats the unnamed pair, so Green chooses which assets prove the build gate. Default: use `./forge build rogue` (textured) and `./forge build slime --fast` (fast); both sources exist in `assets/`. Rationale: The sample assets are file locations, and a Blocker covers a file location that the plan leaves to the implementer.
- F4 [Major] plan.md T3 (asset build gates): The two `./forge build` commands in T3 bypass heavy-run.sh, while all four T2 gates use it and the repo convention wraps every forge command in one heavy-run.sh call. Default: run `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge build rogue'` and wrap the `--fast` call the same way. Rationale: A textured forge build takes one of two machine-wide build slots, and AC3 routes all gates through the heavy runner; the T3 gate sits in the wrong place.
- F5 [Major] plan.md T1 (Red test): T1 requires a test but names neither the script path nor the test path, and it names no normal or edge test cases. Default: create `scripts/audit-gate.mjs` and `tests/audit-gate.test.ts`, with cases for a JSON showing 4 high (fails), a JSON showing 0 high and 1 moderate (passes), and an unavailable audit (exits 2). Rationale: The zero-decision check requires each phase to name the files it changes and its normal and edge test cases.
