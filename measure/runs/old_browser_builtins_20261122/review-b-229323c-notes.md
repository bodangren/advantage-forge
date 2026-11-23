Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green,
result re-bound to HEAD 229323c5
Audited HEAD: 229323c5d822f1dcb480b8e5ccf767c98a6f0c75 (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: 229323c5d822f1dcb480b8e5ccf767c98a6f0c75 (no tracked file changed during the audit)
This round re-binds the r3 PASS (5a1da501) to the phase-acceptance HEAD. The r3 audit object stands;
only the prerequisite binding and the gate re-run are new.

== Binding check ==
- `git diff --stat 5a1da501 229323c5d822f1dcb480b8e5ccf767c98a6f0c75 -- . ':!measure'
  ':!docs/chibi-sprouts'` prints nothing (0 lines, exit 0). No code, test, or script file changed
  between the r3 audited HEAD and this HEAD.
- The un-excluded diff touches only `measure/` records (105 files, including
  measure/tracks/*/plan.md, measure/tech-debt.md TD-46 TD-47, and measure/runs/ artifacts) and
  `docs/chibi-sprouts/scrapped-base-users-2026-11-23.md`. All are record or docs files, which the
  phase-acceptance rule permits as intervening commits.
- `git log 5a1da501..229323c5` lists 03544592 (sprouts record), 2bec4ca1 (late-finding and
  debt records), 229323c5 (run records). None touches src/ or tests/.

== Gate re-run (three-file command, heavy-run wrapper, no redirection) ==
`node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts
tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts`
-> Test Files 3 passed (3), Tests 16 passed (16), exit 0. Same result as r3.

== Verdict ==
PASS, identical to r3: no blocking findings, no nonblocking findings; the four contract limits
are documented in the copy.ts doc comment and enforced by the widened state-type test. A2 not
applicable; A6 clean. No late findings: nothing outside measure/ and docs/chibi-sprouts changed,
so the r3 evidence remains valid at this HEAD.
