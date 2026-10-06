# Monorepo master CI is red

## Purpose

The workflow "CI" in `Reading-Advantage-Thailand/reading-advantage-monorepo` runs on each push
to `master`. Every master run since 2026-09-24 failed. This track makes master CI green before
the Primary Advantage cutover. A failure that has no fix before the cutover becomes known debt
with an owner. Then CI can show a new failure again.

## Why it matters

- The Primary Advantage cutover (planned for 2026-10-14 to 2026-10-20) moves many commits onto master.
- While CI is always red, a new real failure looks the same as the old failure. Nobody sees it.
- The www deploy workflow "CD — www-reading-advantage" does not wait for CI.
  On 2026-10-06, www deployed while CI failed: CD run 37427931556 succeeded.

## Evidence (2026-10-06, read-only `gh` commands)

Master runs of the workflow "CI", newest first:

```
37427931431 d535ae7fd failure 2026-10-06T07:09:30Z
37420008653 22deda65c failure 2026-10-06T05:44:07Z
36051599468 fe6aedc2b failure 2026-09-24T19:57:11Z
36050140717 36741ab12 failure 2026-09-24T19:44:07Z
36050098802 d361fe4d1 failure 2026-09-24T19:43:44Z
36050062011 93dd52326 failure 2026-09-24T19:43:25Z
```

| Run | Commit | Failing job | Failing step | First clear error line |
| --- | --- | --- | --- | --- |
| 37427931431 | d535ae7fd | Build, Lint, and Test (job 112151757993) | 9, "Config drift check" | `AssertionError: Unapproved console.error hit count: 626 (baseline 621)` |
| 36051599468 | fe6aedc2b | Build, Lint, and Test (job 107808239651) | 9, "Config drift check" | No log: `gh run view --log-failed` and `gh run view --job 107808239651 --log` return 0 lines. |

Run 37427931431 in detail:

- The step runs `pnpm config-drift`. This command runs `pnpm --filter @reading-advantage/config test` (vitest 4.1.8).
- One test of 11 failed: `packages/config/src/__tests__/wave2-observability-provider-guard.test.ts`, line 352.
- The test name is "regression-protects against new console.error in production paths and forbids direct Sentry capture outside the observability adapter".
- The scan counted 1010 production files. The log lists 25 hits and "(+601 more)", thus all 626 hits. The log does not show which 5 hits are new.
- The test text says: "The count must not exceed the Wave 2 baseline (621). Wave 6 owns the full `console.error` → structured-logger migration (medium-plus-coverage-matrix.md) and will lower this baseline as it migrates call sites."

Facts that limit the evidence:

- The 2026-09-24 run failed at the same step. The same step name does not prove the same cause.
- Step 9 stops the job. In run 37427931431, steps 10 to 19 did not run: architecture archive
  evidence compatibility, architecture boundary check, tenant and provider architecture guards,
  build, science verification, lint, type check, generator contract gate, codecamp cold-start
  tests, and test.
- Known debt can fail in those steps after step 9 passes: TD-15 (`pnpm architecture:check`),
  TD-16 (Primary Advantage type check), and TD-23 (an expired test fixture). Nobody ran these steps in CI since 2026-09-24.

## Ownership

- The monorepo session owns the fix commits, the pull requests, and the CI runs in the monorepo.
- This Forge track records the plan, the evidence, and the decisions only ("Connected repositories" in `AGENTS.md`).
- The owner answers the open questions.

## Acceptance criteria

- Each failing master step has a recorded cause, with the run ID, the commit, and the first clear error line.
- Each cause has a fix commit on master, or a debt row with an owner and an exit condition.
- One master run of "CI" finishes with `success`. Or each remaining failure is known debt with an owner.
- The track records that run, or the last failing run, with its run ID and commit.
- This state exists before the cutover starts (planned for 2026-10-14).
- The owner answers Q1, and the track records the answer and the date.
- TD-25 closes, or it links to the remaining debt rows.

## Open questions (owner decisions)

- Q1: Must the workflow "CD — www-reading-advantage" wait for a green "CI" run on the same commit?
  This track records the question. It does not decide it.
- Q2: Does a higher `console.error` baseline count as a fix? The test text says that the baseline goes down only.

## Out of scope

- Edits, commits, or workflow runs in the monorepo from a Forge session.
- The full Wave 6 migration from `console.error` to the structured logger.
- A change to the CD workflow before the owner answers Q1.

## Related records

- Debt: TD-15, TD-16, TD-23, and TD-25 in `measure/tech-debt.md`.
- Track `apk_pack_release_20261006`: the www deploy of 2026-10-06 and the link to this track.
- Track `game_platform_port_20260928`: the port branch `apk3d-port`.
