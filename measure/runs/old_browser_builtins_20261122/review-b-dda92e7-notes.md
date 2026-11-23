Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green,
result re-bound to HEAD dda92e79
Audited HEAD: dda92e79d80bcb6ad77881913b81a91a891495fc (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: dda92e79d80bcb6ad77881913b81a91a891495fc (no tracked file changed during the audit)
This round re-binds the standing PASS (r3 at 5a1da501, re-bound at 229323c5) to dda92e79.

== Binding check ==
- `git diff --stat 229323c5 dda92e79 -- src` prints nothing (0 lines): src/ is byte-identical
  since the previous binding.
- The only non-measure, non-audio change is tests/apk3d/no-unpolyfilled-builtins.test.ts
  (+69/-3, commit 72e74de0, plus measure record commits). Audio-track commits in the range are
  out of scope.

== Scanner test change: judgment ==
Commit 72e74de0 tightens the built-in scanner's exclusion check: `lineText.includes(exclusion.call)`
becomes a word-boundary regex (`exclusionMatchesLine`, `(?<![\w$])...(?![\w$])`), so a renamed
receiver such as `otherbox.union(b)` no longer counts as the excluded `box.union(b)` call, and it
adds three failing-first Red cases plus a real-line pin against src/render/page.ts:263. The change
is test-only: the scanner reads source files, uses no network, and writes nothing outside the test
process. Because the new match can only be stricter — a renamed receiver or a longer argument list
now stays reported, and the stale-exclusion rot check still fires — the scan can report more hits,
never fewer. It opens no security or data-handling gap.

== Gate re-run (three-file command, heavy-run wrapper, no redirection) ==
`node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts
tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts`
-> Test Files 3 passed (3), Tests 19 passed (19), exit 0 (16 tests at the previous binding; the
three new A7 exclusion cases are green).

== Verdict ==
PASS, unchanged from the standing object: no blocking findings, no nonblocking findings; the four
contract limits remain documented in the copy.ts doc comment and enforced by the widened
state-type test. A2 not applicable; A6 clean (the T3r4 plan record matches the committed
failing-first tests, all green). No late findings: src/ is byte-identical and the only test change
is the stricter scanner exclusion judged above.
