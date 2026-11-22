Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green,
re-review r3 (round 3)
Audited HEAD: 5a1da5011f31008102f8563b1f03f2891c23f99b (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: 5a1da5011f31008102f8563b1f03f2891c23f99b (no tracked file changed during the audit)
Round 3 scope per the brief: PM decision 2026-11-23 accepted the four escalate_human items as
written contract limits. Since r2 (d15af2a2) only the copy.ts doc comment (7d5c7129), the
state-type test walk (1c6f3831), and plan/status records changed. The audio-track files in the
range diff are out of scope.

== Verdict: PASS. The PM decision closes all four kept items; no findings remain. ==

== Checks ==
1. copy.ts code byte-identical apart from the comment: `git diff
   d15af2a2..5a1da50 -- src/apk3d/sim/copy.ts` shows a single hunk (@@ -1,10 +1,16 @@) that
   replaces only the `/** ... */` doc block. Every line of code from the `export function
   deepCopy` line onward is unchanged. No code change in 7d5c7129.
2. Doc lists the four limits: the new doc comment states the helper does not copy own
   Symbol-keyed properties; does not copy non-enumerable own properties; copies a RegExp or
   another class instance as a plain object with no class behavior (a copied RegExp throws on
   `exec`); and does not recognize Map/Set/Date/typed-array values from another realm (such as
   an iframe), which copy as plain objects. It also keeps the existing current-realm statement.
3. Test flags a Symbol key: tests/old-browser/deep-copy.test.ts now walks Reflect.ownKeys
   (lines 122, 132) and records `symbol-key`, `non-enumerable`, and `accessor` kinds without
   invoking accessors (lines 94-100), with fixture assertions at lines 167-184
   (withSymbol -> ['plain-object','string','symbol-key'], withHidden -> includes
   'non-enumerable', withGetter -> includes 'accessor'). None of these kinds is in the allowed
   set, so any future sim state that gains one fails the state-types case.
4. Three-file gate through heavy-run.sh: `node node_modules/vitest/vitest.mjs run --maxWorkers=1
   tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts
   tests/apk3d/no-unpolyfilled-builtins.test.ts` -> Test Files 3 passed (3), Tests 16 passed
   (16), exit 0 (13 tests at r2; the widened walk added cases, now green).

== Contest disposition ==
All four r2 kept items (F2 symbol keys, F3 RegExp clones, F4 non-enumerables, F5 cross-realm
flattening) are closed by the PM decision 2026-11-23: accepted as written contract limits and
documented in the copy.ts doc comment, with the state-type test now enforcing that no sim state
reaches the divergent branches. They leave this round's findings list.

== A2 / A6 ==
- A2: not applicable; no draft-to-published path in this diff.
- A6: no overstatement. The documented limits match the implementation exactly (the r2 probes
  R12/R15 and the kept-finding text); the widened state-type test is green.

No late findings: the diff since r2 contains no production code change, and every claim above is
backed by a command result at the audited HEAD, which did not move during the audit.
