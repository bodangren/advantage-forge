Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green,
result re-bound to HEAD 61db4f13
Audited HEAD: 61db4f13740a523e00d10b085cd71bdbbc7199fb (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: 61db4f13740a523e00d10b085cd71bdbbc7199fb (no tracked file changed during the audit)
This round re-binds the standing PASS (r3 at 5a1da501, re-bound at 229323c5 and dda92e79) to
61db4f13740a523e00d10b085cd71bdbbc7199fb.

== Binding check ==
- `git diff --stat dda92e79 HEAD -- . ':!measure' ':!docs/chibi-sprouts'` prints nothing (0
  lines, exit 0). No code, test, or script file changed since the previous binding.
- `git log dda92e79..HEAD` lists only record commits: 17ee504a (round 3 late findings, TD-47),
  6b41e907 (new chibi_sprouts_redesign track), 61db4f13 (run records). All are measure/ records
  or docs/chibi-sprouts, permitted intervening files.

== Gate re-run (three-file command, heavy-run wrapper, no redirection) ==
`node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts
tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts`
-> Test Files 3 passed (3), Tests 19 passed (19), exit 0. Same result as the previous binding.

== Verdict ==
PASS, unchanged from the standing object: no blocking findings, no nonblocking findings; the four
contract limits remain documented in the copy.ts doc comment and enforced by the widened
state-type test, and the scanner test keeps its exact-call exclusion. A2 not applicable; A6 clean.
No late findings: nothing outside measure/ and docs/chibi-sprouts changed.
