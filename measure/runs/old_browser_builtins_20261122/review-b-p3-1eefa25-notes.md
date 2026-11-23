Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 3: Browser
check, Round 3 (re-review after T7r2 remediation c9f6bba1 + e8312fc1)
Audited HEAD: 1eefa25d9d286a80d4f2a1576664f1894aeb755d (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 31af75444583c9236f342c908128c91da9f4f7e3
role_base_sha: 1eefa25d9d286a80d4f2a1576664f1894aeb755d (no tracked file changed during the audit)
Scope: c9f6bba1 added listener-owner verification for port 5199 (ss -ltnp parsing plus a /proc
descendant tree), assertOwned evidence boundaries, a negative control, and input causality
(__oldBrowserInputCount); e8312fc1 committed a unit pin for the harness-only false pass. All
probes under measure/runs/old_browser_builtins_20261122/, every server/browser run inside
`HEAVY_MIN_AVAIL_MB=1500 bash .../heavy-run.sh -c '<cmd>'`.

== Verdict: PASS. No findings; the new listener-owner code has no path or process handling gap. ==

== New code inspection (listener-owner verification) ==
- Command injection: impossible. listeningPids() calls execFileSync('ss', ['-ltnp']) with a fixed
  argv array (no shell), matches the constant string `127.0.0.1:5199` plus LISTEN, and extracts
  pid=(\d+). The port is the constant PORT; no user input reaches any of it. The pre-spawn
  portAnswering() check is unchanged.
- /proc handling: childTree() readdirSync('/proc') filtered to /^\d+$/ and readFileSync only
  `/proc/<digits>/stat` — no path traversal is possible; other users' entries fail open with a
  caught EPERM, which keeps those PIDs out of the parent map so a foreign listener can never be
  misclassified as owned. The stat parse uses lastIndexOf(')') before splitting, so a command
  name containing spaces or parentheses cannot desync the ppid field.
- PID reuse: a reused PID would need its parent chain to reach the vite child's PID to be counted
  as owned; combined with the pre-spawn gate, strictPort, and assertOwned at three boundaries
  (after readiness line 236, after the move loop line 422, in the finally line 431), a
  misattribution window is not reachable in practice and the check fails closed (any doubt about
  ownership throws 'owner mismatch' or times out after 60 s).
- Fail-closed edges: if ss is unavailable, listeningPids returns empty and the loop times out; a
  root-owned foreign listener hides its PID from non-root ss and also results in a timeout, never
  a pass.
- Input causality: the init script counts page-side keydown/pointerdown events (capture phase),
  and acceptedAction additionally requires eventsAfter > eventsBefore (lines 409-419), so a
  harness-only state write cannot count as a move; e8312fc1 pins this. The negative control
  (quiet window 1500 ms) must show no action change and throws otherwise (lines 387-391).

== r2 properties re-verified (probes re-run at this HEAD) ==
- Full run green (probe-p3-r2-full.mjs): exit 0, started=true, moves=3 with input causality
  (action_inputs ['ArrowRight','ArrowLeft','ArrowRight']), negative_control.changed=false,
  state_changed=true, errors=0, all four built-ins absent in page, port already free at parent
  exit (~0 ms), check.json grep-clean of '/home/' and the user name.
- Collision (probe-p3-r2-collision.mjs): decoy on 127.0.0.1:5199 inside one heavy-run call; the
  script failed in 277 ms with a scrubbed 'port 5199 already in use', no spawn, no orphan, port
  free, check.json and output grep-clean.
- --game handling (probe-p3-r2-args.mjs): all seven cases behave as expected (bad value, missing
  value, none, injection, unknown game, unknown flag -> exit 1 with usage; --help -> exit 0); no
  injection file created.
- Signals (probe-p3-signal.mjs, PID-set diffing): SIGTERM and SIGINT to the Node parent only;
  each vite child freed the port within ~2 s, no chromium orphan, no baseline process harmed;
  both exit 1 with cleanup complete (the r2 SIGINT exit-130 observation is gone).

== PM load rule compliance ==
Every decoy, signal, and full run went through heavy-run.sh with HEAVY_MIN_AVAIL_MB=1500. Final
ss/ps: the only listener on 5199 belongs to another session's own check run (parent PID verified
by ps); nothing of mine remains and nothing needed killing.

== A2 / A6 ==
A2 not applicable: no draft-to-published path. A6: the doc comment's new fields
(negative_control, action_inputs semantics) match the observed check.json output; no
overstatement found.
