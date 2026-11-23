Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 3: Browser
check, Round 2 (re-review after T7r remediation c3f48a52)
Audited HEAD: ad56865ba45daf5cf9d9c2557497a49f20c733ba (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 31af75444583c9236f342c908128c91da9f4f7e3
role_base_sha: ad56865ba45daf5cf9d9c2557497a49f20c733ba (no tracked file changed during the audit)
Scope: c3f48a52 rewrote scripts/old-browser-check.mjs (167 insertions, 57 deletions): accepted-move
rule, cleanup-safe report write, owned-server readiness with a fast collision failure, home-path
scrub, stricter CLI. All probes under measure/runs/old_browser_builtins_20261122/, every
server/browser run inside `HEAVY_MIN_AVAIL_MB=1500 bash .../heavy-run.sh -c '<cmd>'`.

== Verdict: PASS. All three r1 nonblocking findings are withdrawn; no new findings. ==

== Contest disposition of r1 findings ==
- F1 (collision bypass): WITHDRAWN. The script now refuses to start when anything answers on
  5199 (portAnswering pre-spawn check, line 240) and, after spawn, requires the owned child to be
  alive and the response to carry the Vite marker `/@vite/client` (lines 145-169). Probe
  probe-p3-r2-collision.mjs: with a decoy HTTP server on 127.0.0.1:5199 (started and stopped
  inside one heavy-run call), the script failed in 267 ms with 'port 5199 already in use', exit 1,
  no vite or chromium spawned, port free afterwards.
- F2 (absolute home path in check.json on failure): WITHDRAWN. scrub() (lines 52-58) replaces
  the repo root with `<repo>` and $HOME with `<home>`, flattens, and truncates; describe()
  (lines 60-65) feeds scrubbed messages and trimmed stacks into errors. The same collision probe
  grep-verified: check.json and the script's stdout/stderr contain no '/home/' and no user name;
  the failure stack reads `at file://<repo>scripts/old-browser-check.mjs:240:36`. The full run's
  check.json is likewise clean.
- F3 (teardown lag): WITHDRAWN. stopServer now re-awaits the child's exit after the SIGTERM
  window (lines 120-122), so the parent cannot exit while the port is still bound. Probe
  probe-p3-r2-full.mjs: at parent exit the port was already free (freed after ~0 ms); the r1
  behavior (listener still bound moments after exit) is gone.

== r1 properties re-confirmed ==
- Loopback only: config host 127.0.0.1; portAnswering connects to 127.0.0.1:5199 only; the only
  fetch target is the BASE constant; chromium still uses --remote-debugging-pipe.
- Signals: SIGTERM and SIGINT sent to the Node parent only (probe-p3-signal.mjs, PID-set
  diffing): each vite child freed the port within ~2 s, no chromium outlived the run, no baseline
  process harmed. Observation: the SIGINT path now exits 130 instead of 1 (cleanup identical and
  complete); cosmetic, not a finding.
- --game handling: probe-p3-r2-args.mjs — bad path value, missing value, no arguments, injection
  attempt, unknown game, and unknown extra flag all exit 1 with the usage line; --help exits 0;
  no injection file created; validation still precedes any mkdir or spawn (lines 36-50).
- Writes only under out/old-browser/: unchanged fs surface (lines 24, 31-33, 241, 294, 327,
  334-338); the report write is now wrapped so a failed write becomes reportError on stderr
  instead of an exception.
- Full run green: exit 0, started=true, moves=2 (accepted-move rule counts only accepted
  transitions; action_inputs ['ArrowRight','1']), state_changed=true, errors=0, all four built-ins
  absent in page.

== PM load rule compliance ==
Every decoy, mutant-equivalent, signal, and full run went through heavy-run.sh with
HEAVY_MIN_AVAIL_MB=1500. Final check: `ss -ltn | grep 5199` prints nothing and
`ps -eo pid,args | grep -E 'vite.js|chrome-headless'` shows no process of mine (or anyone's);
nothing needed killing.

== A2 / A6 ==
A2 not applicable: no draft-to-published path. A6: the script doc comment now matches the
observed behavior, including the accepted-move semantics and the scrubbed report; no overstatement
found.
