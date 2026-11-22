Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 2: Green
Audited HEAD: 0d8fc7def7b180092fe23ba51cbbfa55a6004991 (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 3f6a19214994e7ac05a79a8fa7faeded684267b7
role_base_sha: 0d8fc7def7b180092fe23ba51cbbfa55a6004991 (no tracked file changed during the audit)
Scope: c8ddd883 (deepCopy, index-math helpers) and 1dcc1043 (44 replacements). The two audio-track
commits in range (5343710d, b2d87dbe) are out of scope per the brief; no finding reads them.

== Verdict: PASS. No blocking findings. ==

A2 (consent-blind publish gate): not applicable. The diff contains no draft-to-published status
flip and no named-subject publish path.

A6 (registry overstatement): no violation. `measure/tracks.md:199` links the track with no
"resolved" security claim. The plan and spec claims about the helper (WeakMap seen-set; TypeError
for function, symbol, WeakMap, WeakSet, promise) are verified green by the committed tests and by
probes P1/P2/P7/P15 below.

== Provenance ==
- `git log 3f6a192..0d8fc7d` shows the expected range; HEAD equals audited_head_sha at audit start
  and end; `git status --short` shows no tracked modification (only pre-existing untracked files
  from other sessions).
- security_applicability: applicable. The change replaces 35 `structuredClone` calls that copy live
  game simulation state on every move (snapshot paths), plus 9 index-math call sites. Data-handling
  behavior on hostile or odd input is in scope.

== Commands run (all through heavy-run.sh, no redirection) ==
1. `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts
   tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts`
   -> Test Files 3 passed (3), Tests 9 passed (9). Exit 0.
2. `node measure/runs/old_browser_builtins_20261122/probe-copy-run.mjs` (probe file imports
   esbuild-compiled copies of src/apk3d/sim/copy.ts and index-math.ts from the audited HEAD).
3. `node measure/runs/old_browser_builtins_20261122/probe-depth.mjs`.

== Probe results (measure/runs/old_browser_builtins_20261122/probe-copy-run.mjs) ==
- P1 self-cycle: `c.self === c` true, terminates. PASS.
- P2 Map/array mutual cycle: `c.get('arr')[0] === c` true. PASS.
- P3 depth 50000: RangeError — but P19 shows native `structuredClone` in this Node also throws
  RangeError at 50000. No divergence.
- P4 own `__proto__` data key (defineProperty): clone's prototype becomes the copied value; the
  own `__proto__` key is NOT kept. DIVERGENCE from structuredClone (which keeps an own data key).
- P5 JSON.parse save-shape `{"__proto__":{...}}`: source has the own key; clone loses the own key
  and its prototype is set to the copied object. DIVERGENCE.
- P6 getter: read exactly once per copy (1 read after copy 1, 2 after copy 2). Matches native.
- P7 getter returning the source itself (cycle through accessor): `c.loop === c` true. PASS.
- P8 class instance: `c instanceof Player` true, methods work; non-enumerable field dropped
  (native structuredClone also does not round-trip non-enumerables into a live class, but it does
  copy non-enumerable own values). Minor divergence.
- P9 sparse array: length 100 preserved, holes preserved, element 99 copied. PASS.
- P10 null-prototype object: prototype preserved. PASS.
- P11 symbol-keyed own property: silently dropped (clone has `undefined` at the symbol).
  Divergence; the spec contract (AC1 rule 3) covers "own string keys" only.
- P12 RegExp: clone `instanceof RegExp` true but the internal matcher slot is missing —
  `c.re.exec()` throws TypeError, and non-enumerable `lastIndex` is lost. Divergence; silent data
  loss plus a latent crash if any copied code path calls the clone.
- P13 two typed-array views over one ArrayBuffer: the copies share one new buffer, offsets and
  values correct, source untouched. PASS.
- P14 cross-realm Map (node:vm): `instanceof Map` false in this realm, so the value silently
  flattens to `{}`. Divergence (silent data loss). Single-realm codebase: not reachable.
- P15 promise: TypeError raised. PASS (matches AC1 rule 6; note this probe shared the host Promise
  constructor, so it is same-realm).
- P16 DataView: content, offsets, and own buffer all correct. PASS.
- P17 atIndex fuzz vs native `.at` over holes and indices -5..1e21, NaN, ±Infinity, -0, fractions:
  zero mismatches. PASS.
- P18 lastIndexWhere vs native findLastIndex over four shapes: all match. PASS.
- P20 frozen source: nested copy mutable, source unchanged. PASS.

== Depth characterization (probe-depth.mjs) ==
DEPTH 1000: native ok / deepCopy ok. 2000: native RangeError / deepCopy ok. 4000: native
RangeError / deepCopy ok. 8000: native RangeError / deepCopy ok. 16000 and 32000: both RangeError.
deepCopy is strictly more robust on deep nesting than the native builtin it replaces in this
runtime. No denial-of-service regression; cycles terminate cleanly (P1/P2/P7), so no infinite
recursion path exists.

== Call-site inspection (35 deepCopy + 8 atIndex + 1 lastIndexWhere) ==
All 44 replacements are one-for-one with unchanged expression shape (git show 1dcc1043). Sampled
rune-match/core/sim.ts:471, labyrinth/core/mazes.ts:232, host/reader.ts:197,
storytime/book-pictures.ts (3 sites), dragon-flight/dragon-rider/spellweavers-run view files: each
replaced call preserves receiver, arguments, and fallback (`??`) structure. `grep -rn
"structuredClone(" src/` returns no hit. No call site now copies differently in a way a player can
reach.

== Reachability of the divergent branches ==
- Every replaced deepCopy site copies an in-memory sim state. The T1 pin (committed test, green)
  fixes the 29 games' start-snapshot type sets to plain data with fixed code-owned keys; no state
  holds Map/Set/Date/typed arrays at start, and no sim state uses dynamic or user-controlled
  object keys.
- Snapshot copies flow outward only: src/apk3d/sim/simulation.ts:226-234 replays from the seed
  and never re-ingests a snapshot; src/host/persistence.ts:28-30 reads localStorage JSON directly
  (looks/unlocked string records) and never calls deepCopy; the module comment at
  src/host/persistence.ts:1-4 states games never persist. So a saved game cannot reach deepCopy.
- Player input enters sim state as validated content (strings, choices), not as object keys or
  exotic types. The `__proto__`, symbol-key, RegExp, class-instance, non-enumerable, and
  cross-realm divergences are therefore unreachable from gameplay or save/load today.

== Findings ==
Nonblocking:
1. deepCopy drops an own `__proto__` data key and sets the clone's prototype to the copied value
   (P4/P5). structuredClone keeps it as an own data key. Unreachable from any sim state or save
   path today; hardening fix is one `Object.defineProperty` branch for the `__proto__` key in
   src/apk3d/sim/copy.ts:73.
2. Symbol-keyed own properties are silently dropped (P11). Within the spec contract ("own string
   keys") but a divergence from structuredClone; document or handle with Reflect.ownKeys.
3. RegExp values copy into objects that pass `instanceof RegExp` but throw on `exec` (P12).
   Silent data loss plus a latent TypeError if copied code calls the clone. Unreachable in sim
   states.
4. Non-enumerable own properties are dropped (P8). Divergence; unreachable in sim states.
5. Cross-realm Map/Set/Date/Promise values silently flatten to `{}` because the `instanceof`
   guards (src/apk3d/sim/copy.ts:25-50) fail across realms (P14). Single-realm codebase today;
   becomes relevant only if a game ever runs inside an iframe.

No late findings: all probes ran against the audited HEAD, which did not move during the audit.
