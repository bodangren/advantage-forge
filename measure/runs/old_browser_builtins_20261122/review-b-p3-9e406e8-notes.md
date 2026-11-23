Measure Review B (security and data handling) — old_browser_builtins_20261122, Phase 3: Browser
check, result re-bound to HEAD 9e406e8c
Audited HEAD: 9e406e8ccf2c531b8a24fb18abe3f1398fc25fc4 (immutable, matches `git rev-parse HEAD`)
phase_base_sha: 31af75444583c9236f342c908128c91da9f4f7e3
role_base_sha: 9e406e8ccf2c531b8a24fb18abe3f1398fc25fc4 (no tracked file changed during the audit)
This round re-binds the Round 3 PASS (1eefa25d) to the phase-acceptance HEAD.

== Binding check ==
- `git diff --stat 1eefa25d 9e406e8ccf2c531b8a24fb18abe3f1398fc25fc4 -- src scripts` prints
  nothing (0 lines): src/ and scripts/ are byte-identical to the Round 3 audited HEAD.
- Commits since: 387a7032 and 437bcb2d (test-only, old-browser causality pins), f9cacede
  (plan.md and tech-debt.md TD-49 records), 9e406e8c (run records). No code or script change.

== Green command (once, through the heavy-run wrapper) ==
`node scripts/old-browser-check.mjs --game spellweavers-run` wrapped in
`HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c`:
exit 0; started=true, moves=3 (action_inputs ['ArrowRight','1','ArrowRight']),
negative_control.changed=false, state_changed=true, errors=[], all four built-ins absent in page.

== Cleanup confirmation ==
Immediately after the run a listener row on 5199 and chromium rows still showed (teardown lag,
the known non-blocking behavior; the socket itself frees at parent exit as measured in Round 2).
Within 20 s the row was gone; `ss -ltn | grep 5199` prints nothing and
`ps -eo pid,args | grep -E 'vite.js|chrome-headless'` shows no process of mine (or anyone's).
Nothing needed killing.

== Verdict ==
PASS, unchanged from Round 3: no findings. The standing audit object (review-b-p3-1eefa25.json)
holds: listener-owner verification is safe and fails closed, input causality and the negative
control work, and all properties (loopback only, signal cleanup, --game handling, writes confined
to out/old-browser/, scrubbed report) are verified. A2 not applicable; A6 clean (the test-only
commits match their plan record, and the Green output matches the doc comment fields).

== PM load rule compliance ==
The Green command ran once inside heavy-run.sh with HEAVY_MIN_AVAIL_MB=1500; no bare server or
browser command was used in this round; nothing of mine listens on 5199.
