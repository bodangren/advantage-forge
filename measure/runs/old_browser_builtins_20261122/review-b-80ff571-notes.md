Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green,
result re-bound to HEAD 80ff5717
Audited HEAD: 80ff5717ba3a9479bedbe3d9e5ef05d7dd7d1a39 (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: 80ff5717ba3a9479bedbe3d9e5ef05d7dd7d1a39 (no tracked file changed during the audit)
This round re-binds the standing PASS (r3 at 5a1da501, re-bound at 229323c5, dda92e79, 61db4f13)
to 80ff5717ba3a9479bedbe3d9e5ef05d7dd7d1a39.

== Binding check ==
- `git diff --stat 61db4f13 80ff5717 -- src` prints nothing (0 lines): src/ is byte-identical
  since the previous binding.
- The only non-measure, non-docs change is tests/apk3d/no-unpolyfilled-builtins.test.ts
  (+178/-36, commit 9459687d), plus measure record commits. The audio and chibi-sprouts commits
  in the range are out of scope.

== Scanner test change: judgment ==
Commit 9459687d tightens the built-in scanner once more: each exclusion now binds the file, the
line, the label, and the full trimmed source line text of the three real Box3.union calls in
src/render/page.ts (constants PAGE_263, PAGE_440, PAGE_447), replacing the word-boundary regex
call match. A hit is excluded only when the trimmed stripped line equals the entry text exactly;
any edit to those lines, a moved call, or an added same-label call keeps the hit reported, and the
stale-exclusion rot check still fires. The change is test-only: the scanner reads source files,
uses no network, and writes nothing outside the test process. Because exact-line equality can
only be stricter than the previous regex, the scan can report more hits, never fewer. It opens no
security or data-handling gap.

== Gate re-run (three-file command, heavy-run wrapper, no redirection) ==
`node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts
tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts`
-> Test Files 3 passed (3), Tests 23 passed (23), exit 0 (19 tests at the previous binding; the
new T3r5 exact-line exclusion cases are green).

== Verdict ==
PASS, unchanged from the standing object: no blocking findings, no nonblocking findings; the four
contract limits remain documented in the copy.ts doc comment and enforced by the widened
state-type test, and the scanner exclusion is now exact-line. A2 not applicable; A6 clean (the
T3r5 plan record matches the committed failing-first tests, all green). No late findings: src/ is
byte-identical and the only test change is the stricter scanner exclusion judged above.
