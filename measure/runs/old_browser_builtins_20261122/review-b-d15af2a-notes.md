Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green, re-review r2
Audited HEAD: d15af2a205c5e1e612b1dc4f59060466fdd28fc8 (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: d15af2a205c5e1e612b1dc4f59060466fdd28fc8 (no tracked file changed during the audit)
Remediation under review: 9440c572 (copy.ts rewrite: new Array(length), own indexes only,
Object.defineProperty for every own key; barrel import merges in 33 call sites) plus evidence
commit d15af2a2. Audio commits in range (31d5adae, fe90b0d0) are out of scope per the brief.

== Verdict: PASS. No blocking findings. One earlier finding withdrawn; four kept as nonblocking. ==

== Contest disposition of r1 findings ==
- F1 (own __proto__ data key became the clone prototype): WITHDRAWN. The rewrite copies every
  own key through Object.defineProperty (src/apk3d/sim/copy.ts:76-83), which never invokes the
  __proto__ setter. Probes R4/R5/R6/R9 confirm the key survives as an own data property, the
  clone prototype stays clean (Object.prototype or Array.prototype), and Object.prototype /
  Array.prototype are untouched. The committed tests at tests/old-browser/deep-copy.test.ts:255-264
  pin this and were added failing-first in the T3r Red round (64ddb5e9).
- F2 (symbol keys dropped): KEPT. Unchanged behavior (probe R15); the spec contract (AC1 rule 3)
  covers own string keys only; still unreachable in pinned plain-data states.
- F3 (RegExp copies into a broken object that throws on exec): KEPT. copy.ts:68-73 still sends
  RegExp through the generic object branch; no sim state holds a RegExp per the T1 pin.
- F4 (non-enumerable own properties dropped): KEPT. Unchanged; Object.keys at copy.ts:76 is
  enumerable-only.
- F5 (cross-realm values silently flatten to {}): KEPT. instanceof guards unchanged; single-realm
  codebase today.

== Provenance ==
- `git log 3f6a192..d15af2a` shows the expected range; HEAD equals audited_head_sha at audit start
  and end; `git status --short -- src/ tests/` is empty.
- security_applicability: applicable. The change alters the helper that copies live game state on
  every move and touches 33 call-site files (import merge only).

== Commands run (all through heavy-run.sh, no redirection) ==
1. `HEAVY_MIN_AVAIL_MB=1500 bash .../heavy-run.sh -c 'node
   measure/runs/old_browser_builtins_20261122/probe-copy-run-r2.mjs'` -> 17 probes, all ok except
   R3 (see below).
2. `HEAVY_MIN_AVAIL_MB=1500 bash .../heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run
   --maxWorkers=1 tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts
   tests/apk3d/no-unpolyfilled-builtins.test.ts'` -> Test Files 3 passed (3), Tests 13 passed
   (13), exit 0. (9 tests at r1; the T5r Red round added failing-first cases, now green.)

== Probe results (measure/runs/old_browser_builtins_20261122/probe-copy-run-r2.mjs, compiled from
   src/apk3d/sim/copy.ts and index-math.ts at d15af2a) ==
- R1 self-cycle: `c.self === c` true; terminates. PASS.
- R2 Map/array mutual cycle: `c.get('arr')[0] === c` true. PASS.
- R3 depth 50000: RangeError — identical to r1; the r1 depth table showed native structuredClone
  throwing at depth 2000 while deepCopy survives to 8000. No regression, no new DoS surface.
- R4 own `__proto__` key (defineProperty): own key kept; clone prototype is Object.prototype;
  copied value intact. FIXED.
- R5 JSON.parse save-shape `{"__proto__":{"polluted":true}}`: clone keeps own key, prototype
  clean, no leak to Object.prototype (before/after probe reads undefined/undefined). FIXED.
- R6 nested `__proto__` two levels deep: own key kept at the nested level; no pollution.
  FIXED.
- R7 getter: read exactly once per copy (1 after copy 1, 2 after copy 2). Unchanged, matches
  native.
- R8 sparse array: length 100 preserved; holes at 0 and 98 preserved; element 99 copied.
  PASS (new Array(length) + own indexes only).
- R9 array carrying an own `__proto__` key: elements copied; own key kept as data; clone
  prototype stays Array.prototype; Array.prototype unmodified. PASS.
- R10 trailing holes beyond the last element: length 5 kept. PASS.
- R11 null-prototype object: preserved. PASS.
- R12 frozen source: nested copy mutable; source unchanged. PASS.
- R13 two typed-array views over one buffer: copies share one new buffer; offsets and values
  correct. PASS.
- R14 uncopyables: TypeError for all five (function, symbol, WeakMap, WeakSet, promise). PASS.
- R15 symbol-keyed property: still dropped (kept finding F2; contract scope).
- R16 atIndex fuzz vs native `.at`: zero mismatches. PASS.
- R17 lastIndexWhere vs native findLastIndex: all match. PASS.

== Call-site inspection ==
git show 9440c572 --stat matches the brief (copy.ts, index-math.ts doc touch, 33 game/host files).
Sampled rune-match/core/sim.ts diff: the two barrel imports merged into one
`import { createRng, type Rng, type Simulation, deepCopy } from '../../../apk3d/sim/index.js'`.
The scan test still passes, so no new unpolyfilled built-in entered src/. The import merge is
pure style; module identity and export names are unchanged.

== A2 / A6 ==
- A2: not applicable; no draft-to-published path in this diff.
- A6: no overstatement. The plan's T5r record claims the sparse and __proto__ fixes; both are
  covered by committed failing-first tests (tests/old-browser/deep-copy.test.ts:240-264) that are
  green at d15af2a.

No late findings: all probes ran against the audited HEAD, which did not move during the audit.
