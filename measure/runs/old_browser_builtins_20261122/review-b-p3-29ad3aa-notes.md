Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 3: Browser
check, task T7, Round 1
Audited HEAD: 29ad3aa3783be9f39411f14213e626280f278ab0 (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 31af75444583c9236f342c908128c91da9f4f7e3
role_base_sha: 29ad3aa3783be9f39411f14213e626280f278ab0 (no tracked file changed during the audit)
Scope: d1be84d2 added scripts/old-browser-check.mjs (234 lines). All probes live under
measure/runs/old_browser_builtins_20261122/ and every server/browser run went through
`HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.

== Verdict: PASS. No blocking findings. Three nonblocking findings. ==

== Verified clean ==
- Loopback only: vite.demo.config.ts:49 sets `server: { host: '127.0.0.1', ... }`; during runs
  `ss -ltn` showed `LISTEN 127.0.0.1:5199` and nothing else. The only fetch target is the BASE
  constant http://127.0.0.1:5199/demo/index.html (script lines 18, 103). Chromium launches with
  --remote-debugging-pipe (no TCP debug port) and --mute-audio (line 150-153).
- Writes confined: mkdirSync/writeFileSync/screenshot all target OUT_DIR = ROOT/out/old-browser
  (lines 16, 22-24, 34, 200, 222, 227). A successful run produced exactly check.json and two PNGs
  there; check.json holds game, deleted, started, moves, errors, absent_in_page, state_changed —
  no secret and no absolute home path (grep-verified).
- Init script confined to the page: context.addInitScript on a fresh context (lines 154-165);
  the four deletions apply only to that context's pages, confirmed at runtime by
  `absent_in_page` reporting all four as 'undefined'.
- Full run green: started=true, moves=6, state_changed=true, errors=[], exit 0.
- Argument handling: --game is validated by exact equality against the constant
  'spellweavers-run' before mkdir or spawn (lines 26-32). Probes: bad path value, missing value,
  no arguments, injection attempt ('spellweavers-run; touch /tmp/p3-owned'), and an unknown game
  all exit 1 with the usage line and spawn nothing; no injection file created. No path injection
  is possible: the accepted value is a constant used only in a CSS attribute selector.
- Orphans on signal: SIGTERM and SIGINT sent to the Node parent only (probes
  probe-p3-signal.mjs, PID-set diffing so other sessions' processes are never touched): parent
  exits 1, its vite child frees the port within ~2 s, no chromium process outlives the run, no
  baseline process harmed. Error path (collision probe) also left no vite or chromium orphan.
- Port 5199 shared-machine caveat: other audit sessions legitimately bind 5199 between my probes;
  each of my runs freed it afterwards (measured directly whenever the port was otherwise free).

== Findings (nonblocking) ==
1. Port-collision detection is bypassable by any listener on 5199 (script line 95-111).
   waitForServer returns as soon as fetch(BASE) answers OK, before checking whether the spawned
   vite child has exited. Probe (probe-p3-collision.mjs): with a decoy HTTP server on
   127.0.0.1:5199, the script did not fail fast; it drove a browser against the decoy for 90 s
   until waitForFunction timed out (exit 1, started=false). On this shared machine a stale or
   foreign listener on 5199 can make the check test the wrong server and can even produce a false
   pass if that server serves old code. Fix: after a successful fetch, re-check serverExit, or
   require a vite-specific response marker before leaving waitForServer.
2. check.json embeds absolute home paths on failure (script line 225). The catch branch appends
   error.stack, which contains paths such as /home/daniebo/Desktop/advantage-forge/...; the
   collision probe's check.json grep-confirmed '/home/daniebo/'. Successful runs leak nothing
   (errors=[]). Low impact: a local artifact, never published by this track. Fix: strip the
   process.cwd() prefix or log only error.message.
3. Teardown lags parent exit by seconds. After a natural successful exit, the vite child and the
   chromium tree were still alive when checked moments later and died shortly after (SIGKILL
   fallback in stopServer allows up to 5 s; playwright reaps chromium asynchronously). The signal
   path freed the port in ~2 s. Not an orphan leak, but on a shared port a fast follow-up run can
   hit the lingering listener before strictPort frees it.

== A2 / A6 ==
A2 not applicable: no draft-to-published path. A6: the script doc and plan claims match observed
behavior except the "fail fast on a port collision" claim, which finding 1 corrects.
